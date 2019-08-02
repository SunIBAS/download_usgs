const insertFileToMysql = require('./insertFileToMysql');
const fs = require('fs');
const projectConfig = require('./config.json');
const emitEventName = 'change';

let counter = new (class {
    constructor(event, limit) {
        this.event = event;
        this.count = 0;
        this.limit = limit;
    }

    add() {
        this.count++;
        if (this.count >= this.limit) {
            this.count = 0;
            this.event();
        }
    }

})(insertFileToMysql,1000);

fs.watch(projectConfig.targetPath,function(e, f) {
    let fl = f.split('.');
    if (e === emitEventName && fl.length === 2 && fl[1] === 'txt') {
        console.log(e,f);
        counter.add();
    }
})
