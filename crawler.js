// started by crontab
// once every hour crawls data from reforge guild of questland eu2 server
// puts data in mongodb

const Crawler = require("./lib/Crawler")

const crawler = new Crawler(`${__dirname}/conf.json`)

crawler.start().catch(err => {
    console.log("PANIC:", err)
    process.exit(1)
})
