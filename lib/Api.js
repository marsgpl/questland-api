//

const fs = require("fs")
const express = require("express")
const mongoose = require("mongoose")

module.exports = class {
    constructor(confPath) {
        this.initEvents()
        this.initConf(confPath)
        this.initExpress()
    }

    async start() {
        await this.initMongoose()
        await this.expressListen()
    }

    initConf(confPath) {
        this.conf = JSON.parse(fs.readFileSync(confPath))
    }

    initEvents() {
        process.on("uncaughtException", this.onUncaughtException.bind(this))
        process.on("unhandledRejection", this.onUnhandledRejection.bind(this))
        process.on("SIGTERM", this.onContainerStop.bind(this))
    }

    onUncaughtException(err) {
        console.log("UncaughtException:", err)

        process.exit(1)
    }

    onUnhandledRejection(err, promise) {
        console.log("UnhandledRejection:", err)
    }

    onContainerStop(name, value) {
        console.log("Terminator request by signal:", name, value)

        console.log("TODO: Stopping listening ports")
        console.log("TODO: Commit all transactions")
        console.log("TODO: Waiting for all api calls complete")

        process.exit(1)
    }

    async initMongoose() {
        mongoose.Promise = global.Promise

        await mongoose.connect(this.conf.mongoose.url, this.conf.mongoose.options)
    }

    initExpress() {
        this.express = express()

        Object.keys(this.conf.express.params).forEach(key => {
            this.express.set(key, this.conf.express.params[key])
        })

        this.express.use("/", express.static("/api/public"))

        this.express.use((req, res, next) => {
            res.set({
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
            })

            if ( req.method === "OPTIONS" ) {
                return res.json({})
            }

            next()
        })

        this.express.all("/api/event", (req, res) => {
            res.json({
                stat: {},
            })
        })
    }

    expressListen() {
        return new Promise((resolve, reject) => {
            let conf = this.conf.express.listen

            this.express.listen(conf.port, conf.interface, () => {
                console.log("listen on " + conf.interface + ":" + conf.port)
                resolve(true)
            })
        })
    }
}
