const fs = require('fs');
const constants = require('./constants');

module.exports = {
    deleteFsFile: (path) => { return deleteFsFile(path); },
    createFsFile: (path, content, callback = () => {}) => { return createFsFile(path, content, callback); },
    createFsFileSync: (path, content) => { return createFsFileSync(path, content); },
    readFsFile: (path) => { return readFsFile(path); },
    readFsDir: (dirPath, callback) => { return readFsDir(dirPath, callback); },
    isFileExists: (path) => { return isFileExists(path); },
    readFsFileSync: (path) => { return readFsFileSync(path); },
    writeFsFileSync: (path, content) => { return writeFsFileSync(path, content); }
}
const deleteFsFile = (path) => {
    if (!fs.existsSync(path)) {
      console.error(`[ERROR] File doesn't exists under ${path}`);
    }
    try {
      fs.unlinkSync(path);
      console.log(`[INFO] File: ${path} deleted`);
    } catch (err) { 
      console.error(`[ERROR] Failed to delete ${path}`, err);
    }
  }
  
const createFsFile = (path, content, callback) => {
  fs.writeFile(path, content, (err) => {
    if(err) {
      console.error(`[ERROR] Failed to create ${path}`, err);
      return 0;
    }
    console.log(`[INFO] File ${path} created.`);
    callback();
  }); 
}

const readFsFile = (path) => {
    let data;
    try {
      data = fs.readFileSync(path, constants.UTF8)
      data = JSON.parse(JSON.stringify(JSON.parse(data), null, "\t"));
    } catch (e) {
      console.error(`[ERROR] Failed to read ${path}`, e);
      return {}; 
    }
    return data; 
}

const readFsDir = (dirPath, callback) => {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(`[ERROR] Failed to read dir: ${dirPath}`, err); 
      return 0; 
    }
    callback(files); 
  });
}

const isFileExists = (path) => {
  return fs.existsSync(path); 
}

const readFsFileSync = (path) => {
  return fs.readFileSync(path, constants.UTF8, (err, data) => {
    if (err) {
      console.error(`[ERROR] Failed to read ${path}`, err);
      return 0;
    }
    let input;
    try {
      input = JSON.parse(JSON.stringify(JSON.parse(data), null, "\t"));
    } catch (e) {
        input = {};
    }
    return input;
  });
}

const createFsFileSync = (path, content) => {
  try {
    fs.writeFileSync(path, content); 
    console.log(`[INFO] File ${path} created.`);
  } catch (err) {
    console.error(`[ERROR] Failed to create ${path}`, err);
  }
}


const writeFsFileSync = (path, content) => {
  try {
    if (isFileExists(path)) {
      fs.appendFileSync(path, content);
    } else {
      createFsFileSync(path, content)
    }
  } catch (err) { 
    console.error(`[ERROR] Failed to write ${path}`, err);
  }
} 