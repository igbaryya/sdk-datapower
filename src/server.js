const axios = require('axios');
const _ = require('lodash'); 
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const arg = require('minimist')(process.argv.slice(2));
const config = require('./configs');
const httpHelper = require('./validator/http_helper');
const validator = require('./validator/validator');
const startup = require('./startup');
/**
 * @param {Object} request HTTP Request
 * @param {Object} response HTTP Response
 * @description Once validation passed, Pipe user request to DEX target Env 
 */
function pipeRequest(req, res, next) {
    const endpoint = arg.endpoint || `${config.endpoint.host}`;
    axios({
        method: req.method,
        url: `http://${endpoint}:${config.endpoint.port}${req.url}`,
        responseType: 'stream',
        data: req.body,
        headers: req.headers
    }).then(function(response) {
        response.data.pipe(res);
        res.writeHead(response.status, response.headers)
        next();
    }).catch((err) => {
        console.info("[ERROR]: ", new Error(err).message);
        if (err.response) {
            err.response.data.pipe(res, {
                end: true
            });
            res.writeHead(err.response.status, err.response.headers)
            next();
        } else {
            console.error(`[ERROR] FAILED TO EXECUTE DEX REST http://${endpoint}${req.url}`);
            next();
        }
    });

}
/**
 * @param {Object} req HTTP Request
 * @param {Object} res HTTP Response
 * @description Validate or bypass requests based on swagger datatypes.
 * @throws 500 Internal Server Error if validations are failing. 
 */
const validateRequest = (req, res, next) => {
    if (httpHelper.byPassedAPI(req)) {
        next();
        return -1;
    }    
    try {
        validator.validateRequest(req, config.continueWithInvalidJson);
    } catch(err) {
        const error = new Error(err);
        if (config.passAPIOnFailure || !err.isValidator) {
            err.isValidator && httpHelper.writeToErrorLog(req, error.message);
            next();
            return -1; 
        }
        httpHelper.rejectAPI(res, error.message, err.obj, req);
        res.end();
        return 0;
    }
    next();
    return 1; 
}
app.use(bodyParser.json());
app.use(validateRequest);
app.use((req, res, next) => {
    pipeRequest(req, res, next);
}); 
app.listen(config.server.port);

startup.startupCallback();