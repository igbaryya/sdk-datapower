const helper = require('./http_helper');
const _ = require('lodash'); 
const constants = require('./http_constants');
const swaggerConsts = require('./swagger_constants');
const jsonConsts = require('../startup/nexus/constants');
const fsLib = require('../fs/fileSystemLib');
const errorUtil = require('./error'); 

module.exports = {
    /**
     * @param {Object} req Incoming message request
     * @param {boolean} continueWithInvalidJson If true, Request will be rejected if the JSON is invalid, otherwise Request will proceed. 
     */
    validateRequest: (req, continueWithInvalidJson) => {
        console.info(`[INFO] Validating payload request for paht: ${req.url}`);
        const path = req.url.split(constants.querySympol)[0].split(constants.restBasePath)[1]; 
        const methodType = req.method;
        const restInfo = helper.findRest(path, methodType);
        if (restInfo.err) {
            throw errorUtil.generateError(restInfo.des, undefined, undefined, restInfo.stack); 
        }
        const schema = fsLib.readFsFile(jsonConsts.downloadPath + restInfo.jsonFile);
        if (!schema || _.isEmpty(schema)) {
            throw errorUtil.generateError(`Failed to read JSON file: ${restInfo.jsonFile}`); 
        }
        validateJSON(schema, restInfo.jsonFile, continueWithInvalidJson);
        validateQueryParams(schema, restInfo, req.url);
        applyWorkAround(restInfo.jsonFile, schema); 
        if (helper.isPayloadlessReq(req)) {
            console.info(`[INFO] Validatiion passed for ${req.url}`);
            return 1; 
        }
        const bodyRefSchema = getRestSchemaObject(restInfo.path, methodType, schema); 
        const validation = executeValidation(req.body, bodyRefSchema, restInfo.jsonFile);
        if (!validation) {
            throw errorUtil.generateError(`Validation did not executed for ${req.url}`); 
        }
        if (validation.validated) {
            console.info(`[INFO] Validatiion passed for ${req.url}`);
            return 1; 
        }
        return 0; 
    }
}

const getRestSchemaObject  = (path, methodType, schema) => {
    const restPath = path.replace(schema.basePath, "");
    console.info(restPath);
    const paths = schema.paths; 
    let pathObj;
    Object.keys(paths).forEach((key) => {
        const restObj = paths[key]; 
        const keyWithParam = key.replace(/\{.*?\}\s?/g, '{param}'); 
        if (keyWithParam === restPath && (restObj[methodType.toUpperCase()] || restObj[methodType.toLowerCase()] )) {
            pathObj = restObj[methodType.toUpperCase()] || restObj[methodType.toLowerCase()] 
        }
    });
    if (!pathObj || _.isEmpty(pathObj)) {
        throw errorUtil.generateError(`Failed to find REST (${path}) in schema`); 
    }
    let bodyRefSchema;
    Object.keys(pathObj.parameters).forEach((key) => {
        const obj = pathObj.parameters[key]; 
        if (obj.in === swaggerConsts.inBody && obj.schema) {
            bodyRefSchema = _.get(schema, _getPath(obj.schema), {});
        }
    });
    if (bodyRefSchema && !_.isEmpty(bodyRefSchema)) { 
        bodyRefSchema = readBodyRefRecursively(bodyRefSchema, schema);
    }
    if (bodyRefSchema && !_.isEmpty(bodyRefSchema)) { 
        bodyRefSchema.id = path;
     }
    return bodyRefSchema;
}


const readBodyRefRecursively = (ref, schema) => { 
    if (Array.isArray(ref.allOf)) {
        const cloned = clone(ref.allOf); 
        cloned.forEach((item, index) => {
            if (typeof item[swaggerConsts.schemaRef] === 'string') { 
                const newRef = clone(_.get(schema, _getPath(item), {}));
                ref.allOf[index] = readBodyRefRecursively(newRef, schema);
            } 
            if (item.properties) {
                ref.allOf[index] = readBodyRefRecursively(item, schema);
            }
        })
    }
    if (ref.properties) {
        Object.keys(ref.properties).forEach((key) => {
            const property = clone(ref.properties[key]); 
            if (typeof property[swaggerConsts.schemaRef] === 'string') {
                const newRef = clone(_.get(schema, _getPath(property), {}));
                ref.properties[key] = readBodyRefRecursively(newRef, schema);
            }
            
            if (property.items && typeof property.items[swaggerConsts.schemaRef] === 'string') {
                const newRef = clone(_.get(schema, _getPath(property.items), {}));
                ref.properties[key].items = readBodyRefRecursively(newRef, schema);
            }
        });
    }
    if (typeof ref[swaggerConsts.schemaRef] === 'string') { 
        const property = clone(ref); 
        const newRef = clone(_.get(schema, _getPath(property), {}));
        ref = readBodyRefRecursively(newRef, schema);
    }
    return ref; 
}

const clone = (obj) => {
    try {
        return JSON.parse(JSON.stringify(obj)); 
    } catch(e) {
        return obj;
    }
    
}
 
const _getPath = (obj) => {
    let schemaPath = obj[swaggerConsts.schemaRef].replace('#/', '');
    schemaPath = schemaPath.split('/');
    return schemaPath; 
}

/**
 * 
 * @param {Object} payload The request payload
 * @param {Object} schema The Schema JSON (Swagger YAML) 
 * @param {string} json JSON file name in case of error; 
 * @description Validation based on: 
 * If the Payload is empty and the schema body is has no reference, Pass 
 * If Payload or Schema empty, Fail
 * execute jsonschema->Validator utils, If the has errors, Fail 
 * Otherwise, Pass. 
 * 
 */
const executeValidation = (payload = {}, schema = {}, json = '') => {
    if (_.isEmpty(payload) && _.isEmpty(schema)) {
        return {
            validated: true
        }
    }
    if (_.isEmpty(schema)) { 
        throw errorUtil.generateError('Failed to start validation, schema is empty.'); 
    }
    const Validator = require('jsonschema').Validator;
    const v = new Validator();
    const result = v.validate(payload, schema); 
    if (result.errors.length) {
        throw errorUtil.generateError(result.errors, {errors: result.errors, json, isValidator: true});  
    }
    return {
        validated: true
    }
}


const readPayloadRecursively = (o, basePath = '') => {
    Object.keys(o).forEach((k) => {
        if (o[k] !== null && typeof o[k] === 'object') {
            readPayloadRecursively(o[k], basePath + k + '.');
            return;
        }
        if (typeof o[k] === 'string' || typeof o[k] === 'number' || typeof o[k] === 'boolean') {
           console.info(`${basePath}${k} ${o[k]}`, typeof o[k]);
        }
    });
}

/**
 * @param {Object} schema JSON Schema to be validated. 
 * @description To validate the JSON, Meanwhile we can validate the request parameters which had non-string type.
 * @returns -1 not validated 1 valid 0 not valid 
 * @throws Error with description for the not valid parameter. 
 */
const validateJSON = (schema, jsonName, continueWithInvalidJson) => {
    if (!schema.parameters) {
        return; 
    }
    const {parameters} = schema; 
    const errors = []; 
    const blacklist = ['']; // If any query param needs to be ignored add it here. 
    Object.keys(parameters).forEach((key) => {
        if (blacklist.indexOf(key) === -1 && parameters[key].type !== 'string') {
                errors.push(new Error(`${key} is with type ${parameters[key].type} but expected String for parameter in ${parameters[key].in} `));
        }
    }); 
    if (errors.length) {
        const error = errorUtil.generateError(errors, {errors, jsonName, isValidator: true}, 'INVALID_JSON');   
        if (continueWithInvalidJson) {
            return 0; 
        }
        throw error; 
    } 
    return 1; 
}

/**
 * @param {Object} schema JSON Schema to be validated. 
 * @description Validate REQ query params where missing mandatory parameters should be passed. 
 * @returns -1 not validated 1 valid 0 not valid 
 * @throws Error with description for the not valid parameter. 
 */
const validateQueryParams = (schema, {jsonFile, methodType, path}, fullReqUri) => {
    if (!schema.parameters) {
        return; 
    }
    const errors = []; 
    const blacklist = []; // Core. 
    let splittedREQ = fullReqUri.split('?') || [fullReqUri, ""];
    splittedREQ = splittedREQ.length === 2 ? splittedREQ : [fullReqUri, ""];
    const requestParams = parseQuery(splittedREQ[1]) || {};
    let requesUrl = path.replace(`/${schema.basePath}`, '');
    if (schema.basePath.startsWith('/')) {
        requesUrl = path.replace(`${schema.basePath}`, '');
    }
    const {paths} = schema; 
    let relevantSchema = {}; 
    Object.keys(paths).forEach((key) => {
        const restObj = paths[key]; 
        const keyWithParam = key.replace(/\{.*?\}\s?/g, '{param}'); 
        if (keyWithParam === requesUrl && (restObj[methodType.toUpperCase()] || restObj[methodType.toLowerCase()] )) {
            relevantSchema = restObj[methodType.toUpperCase()] || restObj[methodType.toLowerCase()] 
        }
    });
    const {parameters} = relevantSchema; 
    const isPopulatedQuery = (query) => {
        return query === "" || query; 
    };
    parameters.forEach((param) => {
        const parameter = param[swaggerConsts.schemaRef] ? _.get(schema, _getPath(param), {}) : param;
        if (blacklist.indexOf(param.name) === -1 && parameter.in === 'query' && parameter.required && !isPopulatedQuery(requestParams[parameter.name])) {
            errors.push(new Error(`${parameter.name} is Mandatory and missing in ${parameter.in} `));
        }
    }); 
    if (errors.length) {
        throw errorUtil.generateError(errors, {errors, jsonName, isValidator: true}, 'MANDATORY_QUERY_MISSING');  
    } 
    return 1; 
}


const parseQuery = (search = "") => {
    const args = search.substring(1).split('&');
    const argsParsed = {};
    let i, arg, kvp, key, value;
    for (i=0; i < args.length; i++) {
        arg = args[i];
        if (-1 === arg.indexOf('=')) {
            argsParsed[decodeURIComponent(arg).trim()] = true;
        }
        else {
            kvp = arg.split('=');
            key = decodeURIComponent(kvp[0]).trim();
            value = decodeURIComponent(kvp[1]).trim();
            argsParsed[key] = value;
        }
    }

    return argsParsed;
}