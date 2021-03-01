module.exports = {
    generateError: (message, obj, name, stack, logger = true) => {

        const err = new Error(message);
        err.stack = stack;
        err.name = name || '[REQUEST VALIDATOR]';
        if (obj) {
            err.obj = getErrors(obj, name);
            err.isValidator = obj.isValidator;
        }
        logger && !obj && logError(message, stack);
        return err;
    },
    logError: (msg, stack) => {
        logError(msg, stack);
    }
}

const getErrors = (obj, name) => {
    const result = {
        type: name || 'DATATYPE_FAILURE',
        jsonFile: obj.json,
        isValidator: obj.isValidator,
        errors: []
    }
    if (Array.isArray(obj.errors)) {
        obj.errors.forEach((error) => {
            const msg = new Error(error).message; 
            result.errors.push(msg);
            logError(msg);
        });
    }
    return result;
}
const logError = (msg, stack) => {
    const date = new Date();
    const logMsg = `[ERROR] ${date.toLocaleString()} : ${msg}`;
    if (stack) {
        console.error(logMsg, stack);
    } else {
        console.error(logMsg);
    }
}