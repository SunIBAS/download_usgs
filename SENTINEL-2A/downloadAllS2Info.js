const request = require('request');
const fs = require('fs');
const path = require('path');
const oldConfig = require('./config.json');
const projectInfoPath = oldConfig.projectInfoPath;
let projectInfo = {};
if (!fs.existsSync(projectInfoPath)) {
    projectInfo = {
        lastId: oldConfig.lastId,
        errorLogPath: oldConfig.errorLogPath,
        targetPath: oldConfig.targetPath
    };
} else {
    projectInfo = JSON.parse(fs.readFileSync(projectInfoPath));
}
let go = false;
let nextTime = 3;

let makeErrorInfo = (err) => {
    if ('message' in err) {
        err = err.message;
    }
    return `---------------------------${(new Date()).toLocaleString()}-----------------------------
    ${err}
    ##############################################################################################`
};

function toDownload() {
    go = true;
    request(`https://earthexplorer.usgs.gov/form/metadatalookup/?collection_id=10880&entity_id=${projectInfo.lastId}`,function (err,resp,body) {
        console.log(`download ${projectInfo.lastId} success`);
        go = false;
        if (err) {
            fs.appendFileSync(projectInfo.errorLogPath,makeErrorInfo(err));
            nextTime = 60;
            go = true;
            setTimeout(() => {
                go = false;
            }, 10)
        }
        if (body.length < 2400) {
            nextTime = 60 * 30;
            go = true;
            setTimeout(() => {
                go = false;
            }, 10)
        }
        projectInfo.lastId++;
        fs.writeFileSync(projectInfoPath,JSON.stringify(projectInfo,'','\t'));
        fs.writeFileSync(path.join(projectInfo.targetPath, `${projectInfo.lastId - 1}.txt`), body);
    });
};

function doing() {
    if (go) {} else {
        nextTime = 3;
        toDownload();
    }
    setTimeout(doing, nextTime * 1000);
}

doing();
