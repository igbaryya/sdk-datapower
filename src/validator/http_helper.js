const config = require('../configs');
const constant = require('./http_constants');
const fs = require('../fs/fileSystemLib');
const startupConst = require('../startup/nexus/constants');
const byPassedApis = require('../configs').whitelistApis

module.exports = {
    byPassedAPI: (req) => {
        let res = false; 
        const url = req.url.split('?')[0]; 
        byPassedApis.forEach((item) => {
            if (item.api === '*' && item.methods === "*") {
                res = true; 
            }
            if (url === item.api && item.methods.split(',').findIndex(method => method.toLowerCase() === req.method.toLowerCase()) !== -1) {
                res = true; 
            }
        });
        return res; 
    },
    isPayloadlessReq: (req) => {
        const {method} = req; 
        const {httpMethods} = config;
        let bypassed = true; 
        Object.keys(httpMethods).forEach((k) => {
            if (httpMethods[k].name === method) {
                bypassed = httpMethods[k].payloadless;
            }
        });
        return bypassed; 
    },
    rejectAPI: (res, reason, body, req) => {
        const uuid = uuidv4();
        res.writeHead(500, { 'Content-type': 'application/json', 'Error-Source': 'DP_Validation', 'Error-Type': reason, 'Error-UUID': uuid});
        if (body) {
            res.write(JSON.stringify({reason: body}));
        }
        writeToErrorLog(req, reason, uuid); 
        console.error(`[ERROR] [${uuid}] Call has been rejected`, reason);

    },
    findRest: (path, methodType) => { 
        try {
            return findRest(path.replace(`/${constant.restBasePath}`, ''), methodType); 
        } catch (stack) {
            return {    
                err: true, 
                des: `Couldn't find JSON for REST path: [${path}]`,
                stack
            }; 
        }
        
    },
    writeToErrorLog: (reqInfo, msg, uuid) => {writeToErrorLog(reqInfo, msg, uuid)}
}

const writeToErrorLog = (reqInfo, msg, uuid = uuidv4()) => {
    const errorFilePath = 'error.log';
    if (!fs.isFileExists(errorFilePath)) {
        fs.createFsFileSync(errorFilePath, '');
    }
    const date = new Date();
    const logMsg = `[ERROR] ${uuid} ${date.toLocaleString()} REQ_URL: ${reqInfo.url} REQ_METHOD: ${reqInfo.method} | REASON: ${msg}`;
    fs.writeFsFileSync(errorFilePath, logMsg + '\n');
}

const uuidv4 = () => {
    return constant.uuid.key.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == constant.uuid.value ? r : (r & 0x3 | 0x8);
      return v.toString(constant.uuid.length);
    });
};

const findRest = (path, methodType) => {
    const dpMapper = fs.readFsFile(startupConst.downloadPath + startupConst.mappingFile);
    const rest = dpMapper.rests.find((r) => {
        return r.path === path && r.methodType.toUpperCase() === methodType.toUpperCase();
    });
    if (rest) {
        return rest; 
    }
    const mapParam = (a, b) => {
        const src = b.split(constant.backslash);
        const trg = a.split(constant.backslash);
        var r = '';
        trg.forEach((o, i) => {
            let v = o; 
            if (o === constant.param) {
                v = src[i];
            }
            r += v;
            r += (i === trg.length -1) ? '' : constant.backslash;
        });
        return r; 
    };

    const restWithParam = dpMapper.rests.find((r) => {
        if (r.path.includes(constant.param)) {
            const mappedParams = mapParam(r.path, path); 
            return mappedParams === path && r.methodType.toUpperCase() === methodType.toUpperCase();
        }
    });

    if (restWithParam) {
        return restWithParam; 
    }
    return {    
        err: true, 
        des: `Couldn't find JSON for REST path: [${path}]`
    }; 
};
