// just provides http access to mongo data
// express json api

const Api = require("./lib/Api")

const api = new Api(`${__dirname}/conf.json`)

api.start().catch(err => {
    console.log("PANIC:", err)
    process.exit(1)
})
