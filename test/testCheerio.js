const cheerio = require('cheerio');
const fs = require('fs');
const request = require('request');

function dearDom(domStr) {
    const $ = cheerio.load(domStr);

    const trs = $('tr');
    const objs = [];

    for (let i = 0;i < trs.length;i++) {
        let info = [];
        cheerio.load(trs[i])('li').map(function(ind,el) {
            info.push($(el).text().replace(/[\n| ]/g,''));
        });
        objs.push({
            img: cheerio.load(trs[i])('img').attr('src'),
            id: cheerio.load(trs[i])('tr').attr('id'),
            info: info.filter(_ => _)
        });
    }

    fs.writeFileSync('info.json', JSON.stringify(objs, '', '\t'));
}

request.post('https://earthexplorer.usgs.gov/result/index',{
    form: {
        collectionId: 10880,
        pageNum: 2
    }
}, function(err,httpResponse,body) {
    if (err) {
        console.log(err);
    } else {
        body = body.substring(body.indexOf('<tbody>') + '<tbody>'.length);
        body = body.substring(0,body.indexOf('</tbody>'));
        body = `<table><tbody>${body}</tbody></table>`;
        fs.writeFileSync('test.html',body);
        dearDom(body);
    }
});

