const nexusJsons = require('./nexus');
const fs = require('../fs/fileSystemLib'); 
const constants = require('./nexus/constants');
const processStatus = {
    ready: false, 
    error: 0,
    warnings: 0
};

module.exports = {
    startupCallback: () => {
        startNexusDownloads(); 
    }
}

const startNexusDownloads = () => {
    console.info('[INFO] Starting Nexus JSONs downloads');
    nexusJsons.startNexusDownloads(processStatus);
}
