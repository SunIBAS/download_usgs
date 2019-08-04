const insertFileToMysql = require('./insertFileToMysql');
const fs = require('fs');
const projectConfig = require('./config.json');
const emitEventName = 'change';
const limit = 1000;

let counter = new (class {
    constructor(event, limit) {
        this.event = event;
        this.count = 0;
        this.limit = limit;
        this.time = (new Date()).getTime();
        this.dur = 0;
    }

    add() {
        this.count++;
        if (this.count >= this.limit) {
            let curTime = (new Date()).getTime();
            this.dur = curTime - this.time;
            this.count = 0;
            this.event();
            this.time = curTime;
        }
        return `#${this.dur ? this.dur : 'unkonw'} ms# ~~ ${this.count}`;
    }

})(insertFileToMysql,limit);

fs.watch(projectConfig.targetPath,function(e, f) {
    let fl = f.split('.');
    if (e === emitEventName && fl.length === 2 && fl[1] === 'txt') {
        console.log(`[${counter.add()} / ${limit}] ${e} ${f}`);
    }
})
counter.event();
