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
let commonNextTime = 0.2;
let nextTime = commonNextTime;

let objToString = (err) => {
    let ret = [];
    for (let i in err) {
        ret.push(`[${i}]#${err[i]}`);
    }
    return ret.join('\n');
};

let makeErrorInfo = (err) => {
    err = err ? err : '';
    if (typeof err === 'object') {
        if ('message' in err) {
            err = err.message;
        } else {
            err = objToString(err);
        }
    }
    return `
    ---------------------------${(new Date()).toLocaleString()}-----------------------------
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
        try {
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
        } catch(e) {
            console.log(e);
            console.log(err, resp, body);
            fs.appendFileSync(projectInfo.errorLogPath,makeErrorInfo(err));
            fs.appendFileSync(projectInfo.errorLogPath,makeErrorInfo('body' + body));
            fs.appendFileSync(projectInfo.errorLogPath,makeErrorInfo('resp' + resp));
        } finally {
            nextTime = 60;
            go = false;
        }
    });
};

function doing() {
    if (go) {} else {
        nextTime = commonNextTime;
        toDownload();
    }
    setTimeout(doing, nextTime * 1000);
}

doing();
