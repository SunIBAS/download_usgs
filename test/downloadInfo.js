const request = require('request');
const fs = require('fs');

request('https://earthexplorer.usgs.gov/form/metadatalookup/?collection_id=10880&entity_id=8400000',function (err,resp,body) {
    fs.writeFileSync('test.html',body);
});