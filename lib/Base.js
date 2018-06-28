//

const fs = require("fs")

module.exports = class {
    constructor(confPath) {
        this.initConf(confPath)
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

    rand(min, max) {
        return min
            ? Math.floor(Math.random() * (max - min + 1)) + min
            : Math.floor((Math.random() * max) + 0)
    }

    extern(base, data) {
        for ( let k in data ) {
            if ( typeof data[k] === "object" ) {
                return this.extern(base[k], data[k])
            } else {
                base[k] = data[k]
            }
        }
    }
}
