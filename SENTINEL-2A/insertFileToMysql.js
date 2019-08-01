const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const projectConfig = require('./config.json');
const mysqlClass = require('./../utils/mysql');
const mysqlInstance = new mysqlClass(require('./../utils/mysql.config.json'));
const task = [];

function txtToMysql(file) {
    console.log(file + ' dear start ..................');
    const ind = + path.basename(file).split('.txt')[0];
    let html = fs.readFileSync(file, 'utf-8');
    if (html.length < 3000) {
        fs.renameSync(file, 
            path.join(file.substring(0, file.indexOf(`${ind}.txt`)),'strange',`${ind}.txt`)
        );
        console.log(`${file} is strange ....... `);
        if (task.length) {
            task.pop()();
        } else {
            console.log('over');
            process.exit();
        }
        return ;
    }

    html = html.substring(html.indexOf('<div'));

    const $ = cheerio.load(html);

    const timeField = ['Acquisition_Start_Date', 'Acquisition_End_Date', 'Production_Date'];
    const obj = [];
    const o_obj = {};

    $('td').map((ind, el) => {
        obj.push($(el).text().trim());
    });

    for (let i = 0;i < obj.length; i += 2) {
        o_obj[obj[i].replace(/ /g,'_')] = obj[i + 1];
    }
    timeField.forEach(_ => o_obj[_] = o_obj[_].replace(/[T|Z]/g,' '));
    o_obj.img = $('img').attr('src');
    o_obj.tif_url = `https://earthexplorer.usgs.gov/download/10880/${ind}/FRB/EE`;
    o_obj.jp2_url = `https://earthexplorer.usgs.gov/download/10880/${ind}/STANDARD/EE`;
    let fields = [];
    let values = [];

    for (let i in o_obj) {
        fields.push(i);
        values.push(o_obj[i].replace(/"/g,'\\\"'));
    }

    sql = `insert into s2a1(\`${fields.join('`,`')}\`) values("${values.join('","')}")`;


    mysqlInstance.query({
        sql
    },function (err) {
        if (err) {
        } else {
            fs.renameSync(file, file + '.over');
            console.log(file + ' dear over');
            if (task.length) {
                task.pop()();
            } else {
                console.log('over');
                process.exit();
            }
        }
    });
}

glob(`${projectConfig.targetPath}\\*.txt`,(err, files) => {
    files.map(f => {
        task.push(txtToMysql.bind(null, f));
    });
    task.pop()();
});
