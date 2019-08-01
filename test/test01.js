const fs = require('fs');
const cheerio = require('cheerio');

const ind = 11;

let html = fs.readFileSync('11.html','utf-8');

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
obj.img = $('img').attr('src');
obj.tif_url = `https://earthexplorer.usgs.gov/download/10880/${ind}/FRB/EE`;
obj.jp2_url = `https://earthexplorer.usgs.gov/download/10880/${ind}/STANDARD/EE`;

fs.writeFileSync('info.json', JSON.stringify(o_obj, '', '\t'));