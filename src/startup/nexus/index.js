const fs = require('fs');
const convert = require('xml-js');
const unzip = require('unzip2');
const fstream = require('fstream');
const arg = require('minimist')(process.argv.slice(2));
const helper = require('./downloader.helper.js');
const constants = require('./constants');
const configs = require('../../configs');
const fsHelper = require('../../fs/fileSystemLib');
const pjson = require('../../../package.json');

let processStatus = {
  ready: false,
  errors: 0,
  warnings: 0
};

module.exports = { 
    startNexusDownloads: () => {
      downloadMetaXML();
      setTimeout(createMappingFile, configs.downloadTimeout); // Wait for downloads 10 seconds. 
    },
    processStatus: processStatus
}

const downloadMetaXML = () => {
  const branch = arg.branch || pjson.branch;
  const version = branch.replace(/\./g, '');
  const nexus = pjson.nexus;
  constants.files.forEach((item, i) => {
    const nexusPath = helper.replaceTokens(constants.nexusPath.src, constants.nexusPath.tokens, [nexus, item.name, version, branch]); 
    const src = helper.replaceTokens(nexusPath, constants.file, constants.meta.src); 
    const trg = helper.replaceTokens(constants.downloadPath + constants.meta.trg, constants.artifact, item.name);
    helper.downloadFromNexus(src, trg, (metaPath) => {
      readMetaAndPrepareZipDownloadLink(metaPath, item, nexusPath, i);
    });
  });
};

const readMetaAndPrepareZipDownloadLink = (metaPath, item, nexusPath, index) => {
  fs.readFile(metaPath, constants.UTF8, function(err, data) {
    if (err) { 
      console.error(`[ERROR] Failed to META file! under: ${metaPath}`);
      processStatus.errors += 1; 
      return {}; 
    }
    const result2 = JSON.parse(convert.xml2json(data, {compact: false, spaces: 4}));
    const xVersion = result2.elements[0].elements[3].elements[2].elements[4].elements[2].elements[0].text;
    downloadZips(item, xVersion, nexusPath, index);
  });
};

const downloadZips = (item, xVersion, nexusPath, index) => {
  const fileName = helper.replaceTokens(item.src, constants.snapshotVersion, xVersion); 
  const src = helper.replaceTokens(nexusPath, constants.file, fileName); 
  const trg = constants.downloadPath + item.trg;
  helper.downloadFromNexus(src, trg, (zipPath) => {
    unzipJsonArchive(zipPath, item, index);
  });
}

const unzipJsonArchive = (zipPath, item, index) => {
  const readStream = fs.createReadStream(zipPath);
  const writeStream = fstream.Writer(constants.downloadPath);
  readStream.pipe(unzip.Parse()).pipe(writeStream);  
  cleanDownloads(zipPath, item);
  constants.files[index].completed = true; 
}

const cleanDownloads = (zipPath, item) => {  
  const xmlPath = helper.replaceTokens(constants.downloadPath + constants.meta.trg, constants.artifact, item.name);
  fsHelper.deleteFsFile(zipPath);
  fsHelper.deleteFsFile(xmlPath);
}

const createMappingFile = () => {
  console.log('[INFO] Creating Mapping File');
  const filePath = constants.downloadPath + constants.mappingFile;
  if (fsHelper.isFileExists(filePath)) {
    fsHelper.deleteFsFile(filePath);
  }
  fsHelper.readFsDir(constants.downloadPath, prepareJSONList);
}

const prepareJSONList = (files) => {
  const filesList = files.filter((file) => {
    if (typeof file === 'string') {
      return file.toLowerCase().endsWith('.json');
    }
    return false; 
  });
  console.info(`[INFO] Preparing Mapping for ${filesList.length} DataPower JSONs`);
  const mappingFileConent = {
    basePath: constants.downloadPath,
    rests: []
  }; 
  filesList.forEach((file) => {
    if (typeof file === 'string') {
      const fileConent = fsHelper.readFsFile(constants.downloadPath + file);
      writeToMappingFie(fileConent, mappingFileConent, file)
    }
  });
  const filePath = constants.downloadPath + constants.mappingFile;
  console.info(`[INFO] Registering ${mappingFileConent.rests.length} REST to mapping file`);
  fsHelper.createFsFileSync(filePath, JSON.stringify(mappingFileConent));
  console.info(`[INFO] Server up and Running with status <READY> - ${processStatus.errors} Errors and ${processStatus.warnings} Warnings`); 
  processStatus.ready = true;
}

const writeToMappingFie = (srcConent, trgConent, file) => {
  if (typeof srcConent.paths !== 'object') {
    console.error(`[ERROR] Failed to write mapping file to ${file}! `);
    processStatus.errors += 1; 
    return 0; 
  }
  Object.keys(srcConent.paths).forEach((key) => {
    Object.keys(srcConent.paths[key]).forEach((key2) => {
      trgConent.rests.push({
        path: srcConent.basePath + key.replace(/\{.*?\}\s?/g, '{param}'),
        methodType: key2, 
        jsonFile: file
      });
    });
  });
}