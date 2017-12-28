const Crawl = require('./crawler');

const source = new Crawl({
    interval: 10000,
});

const info$ = source.subscribe(info => {
    console.log(info);
});

// info$.unsubscribe();
// source.stop();