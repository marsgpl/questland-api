//

const mongoose = require("mongoose")

let schema = mongoose.Schema({
    source: String, // crawler player credentials: lemix, reforge
    type: String, // guild
    date: Date,
    userId: String, // 1820427
    value: mongoose.Schema.Types.Mixed,
})

module.exports = mongoose.model("StatRow", schema)
