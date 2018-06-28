//

const mongoose = require("mongoose")

let schema = mongoose.Schema({
    userId: String, // 1820427
    date: Date, // when was crawled
    value: mongoose.Schema.Types.Mixed,
})

module.exports = mongoose.model("User", schema)
