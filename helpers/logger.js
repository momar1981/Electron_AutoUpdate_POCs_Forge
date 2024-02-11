const moment = require('moment');
const fs = require('fs');
const path = require('path');

const logsPath = path.join(__dirname, '..', 'logs');

function createFolderIfNotExists(path){
    if(fs.existsSync(path))
        return;

    fs.mkdirSync(path);
}

function createFileIfNotExists(path){
    if(fs.existsSync(path))
        return;

    fs.writeFileSync(path, '', 'utf-8');
}

function log(...args){
    const now = moment();

    const filename = `${now.format('YYYY-MM-DD')}.txt`;
    const filePath = path.join(logsPath, filename);

    createFolderIfNotExists(logsPath);
    createFileIfNotExists(filePath);

    const logs = args.map(x => {
        if(Array.isArray(x) || typeof x === 'object')
            return JSON.stringify(x);
        return x;
    }).join(', ');
    const logMessage = `[${now.format('HH:mm:ss')}] ${logs}\n`;
    console.log(logMessage);

    fs.appendFile(filePath, logMessage, 'utf-8', error => {});
}

module.exports = log;