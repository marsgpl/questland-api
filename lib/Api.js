//

const express = require("express")
const mongoose = require("mongoose")

const Base = require("./Base")
const StatRowModel = require("./model/StatRow")
const UserModel = require("./model/User")

const MAX_DAYS_OFFSET = 7

const TEAMS = [
    [
        "Vithia",
        "Hakanbalta",
        "Misoli",
        "Archinoob",
        "Khaleesi89",
        "Deg",
        "Darko666",
        //~ "Takatsuki",
    ],
    [
        "Astharoth",
        "Salvyron",
        "3xorc1st",
        "Thymos",
        "Chailatte",
        "Jurski",
        "Haroldir",
        "Arondor",
        "Alaskaaa",
    ],
    [
        "Beyoung",
        "Elmot",
        "Rubis",
        "Hairybeast",
        "Weaknnd",
        "Zecamaleca",
        "Naila",
        "Nigatello",
        "Lemix",
    ],
    [
        "Dehvi",
        "Elmor",
        "Dxyoung",
        "Serr",
        "Dalova",
        "Amaliel",
        "Schlotti",
        "Microguagu",
        "Jabon",
    ]
]

const TEAMS_COLORS = [
    "#6733BB", // deep purple
    "#3E4CB7", // indigo
    "#009788", // teal
    "#FF5505", // deep orange
];

module.exports = class extends Base {
    constructor(confPath) {
        super(confPath)
        this.initEvents()
        this.initExpress()
    }

    async start() {
        await this.initMongoose()
        await this.expressListen()
    }

    async initMongoose() {
        mongoose.Promise = global.Promise

        await mongoose.connect(this.conf.mongoose.url, this.conf.mongoose.options)
    }

    getTeamIndexByUserName(userName) {
        if ( !userName ) { return -1 }

        for ( let teamIndex=0; teamIndex<TEAMS.length; ++teamIndex ) {
            let teamNames = TEAMS[teamIndex]

            for ( let nameIndex=0; nameIndex<teamNames.length; ++nameIndex ) {
                let name = teamNames[nameIndex]

                if ( name.toLowerCase() === userName.toLowerCase() ) {
                    return teamIndex
                }
            }
        }

        return -1
    }

    getDayName(date) {
        let day = date.getDate()
        let month = date.getMonth()

        return day + " " + MONTHS[month]
    }

    addz(n, digits = 2) {
        n = String(n)
        return n.length >= digits ? n : "0".repeat(digits - n.length) + n
    }

    initExpress() {
        this.express = express()

        Object.keys(this.conf.express.params).forEach(key => {
            this.express.set(key, this.conf.express.params[key])
        })

        this.express.use("/reforge", express.static("/api/public"))

        this.express.get("/reforge/teams", (req, res) => {
            res.sendFile("/api/public/teams.html")
        })

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

        this.express.all("/reforge/api/eventTeams", async (req, res) => {
            let source = "lemix" // req.query.source
            let offsetDays = MAX_DAYS_OFFSET
            // let userTsMs = req.query.ts

            let dateFrom = new Date
            let dateTo = new Date(dateFrom)

            dateFrom.setHours(0, 0, 0, 1)
            dateFrom.setDate(dateFrom.getDate() - offsetDays)

            let rows = await StatRowModel.find({
                date: {
                    $gte: dateFrom,
                },
            }).sort({ date:1 })

            if ( !rows ) {
                return res.json({error:{code:0}})
            }

            let userDaysCount = {}
            let userDaysNeed = 0

            let userLastDate = {}
            let userLastDateMax = null

            let usersIds = {}
            let userEvents = {}
            let usersScore = {}

            let minPointDate = dateTo

            rows.forEach(row => {
                let trophies = row.value[0][2]

                usersIds[row.userId] = true
                usersScore[row.userId] = Math.max(usersScore[row.userId] || 0, trophies)

                userEvents[row.userId] = userEvents[row.userId] || {}

                userEvents[row.userId][Math.round(row.date.getTime()/1000)] = trophies

                if ( row.date < minPointDate ) {
                    minPointDate = row.date
                }

                userDaysCount[row.userId] = (userDaysCount[row.userId] || 0) + 1
                userLastDate[row.userId] = row.date
                userLastDateMax = row.date
            })

            for ( let userId in userDaysCount ) {
                userDaysNeed = Math.max(userDaysNeed, userDaysCount[userId])
            }

            let ids = Object.keys(usersIds)

            if ( !ids.length ) {
                return res.json({error:{code:1}})
            }

            let users = await UserModel.find({
                userId: {
                    $in: ids,
                }
            }).select({ userId:1, "value.name":1 })

            users.forEach(user => {
                let name = user.value.name
                usersIds[user.userId] = name.charAt(0) + name.slice(1).toLowerCase()
            })

            let labels = []

            let d

            let absenceDiffMs = minPointDate.getTime() - dateFrom.getTime()
            let absenceDiffDays = Math.max(0, Math.floor(absenceDiffMs / 86400000) - 1)

            for ( let i=absenceDiffDays; i<=offsetDays; ++i ) {
                d = new Date(dateFrom)

                d.setDate(d.getDate() + i)

                labels.push(Math.round(d.getTime()/1000))
            }

            let datasets = []

            TEAMS.forEach((teamNames, index) => {
                datasets.push({
                    label: `${teamNames[0]}'s team`,
                    score: 0,
                    personal: {},
                    persons: 0,
                    color: TEAMS_COLORS[index],
                })
            })

            for ( let userId in usersIds ) {
                let userName = usersIds[userId]

                if ( userName === true ) { continue }

                let score = Number(usersScore[userId]) || 0
                let scoreFormatted = this.formatScore(score)

                if ( userDaysCount[userId] !== userDaysNeed ) {
                    if ( userLastDate[userId] < userLastDateMax ) {
                        continue // expelled
                    } else {
                        // joined later
                    }
                }

                let teamIndex = this.getTeamIndexByUserName(userName)

                if ( teamIndex < 0 ) { continue }

                let userData = userEvents[userId]

                let dataset = datasets[teamIndex]

                dataset.score += score

                if ( !dataset.data ) {
                    dataset.data = Object.assign({}, userData)
                } else {
                    for ( let pk in dataset.data ) {
                        dataset.data[pk] += Number(userData[pk]) || 0
                    }
                }

                dataset.personal[userName] = userData
                dataset.persons++
            }

            datasets.forEach(dataset => {
                dataset.label += "  " + this.formatScore(dataset.score)
            })

            datasets.sort((a,b) => {
                if ( a.score > b.score ) {
                    return -1
                } else if ( a.score < b.score ) {
                    return +1
                } else {
                    return 0
                }
            })

            res.json({
                labels,
                datasets,
            })
        })

        this.express.all("/reforge/api/event", async (req, res) => {
            let source = "lemix" // req.query.source
            let offsetDays = MAX_DAYS_OFFSET
            // let userTsMs = req.query.ts

            let dateFrom = new Date
            let dateTo = new Date(dateFrom)

            dateFrom.setHours(0, 0, 0, 1)
            dateFrom.setDate(dateFrom.getDate() - offsetDays)

            let rows = await StatRowModel.find({
                date: {
                    $gte: dateFrom,
                },
            }).sort({ date:1 })

            if ( !rows ) {
                return res.json({error:{code:0}})
            }

            let userDaysCount = {}
            let userDaysNeed = 0

            let userLastDate = {}
            let userLastDateMax = null

            let usersIds = {}
            let userEvents = {}
            let usersScore = {}

            let minPointDate = dateTo

            rows.forEach(row => {
                let trophies = row.value[0][2]

                usersIds[row.userId] = true
                usersScore[row.userId] = Math.max(usersScore[row.userId] || 0, trophies)

                userEvents[row.userId] = userEvents[row.userId] || {}

                userEvents[row.userId][Math.round(row.date.getTime()/1000)] = trophies

                if ( row.date < minPointDate ) {
                    minPointDate = row.date
                }

                userDaysCount[row.userId] = (userDaysCount[row.userId] || 0) + 1
                userLastDate[row.userId] = row.date
                userLastDateMax = row.date
            })

            for ( let userId in userDaysCount ) {
                userDaysNeed = Math.max(userDaysNeed, userDaysCount[userId])
            }

            let ids = Object.keys(usersIds)

            if ( !ids.length ) {
                return res.json({error:{code:1}})
            }

            let users = await UserModel.find({
                userId: {
                    $in: ids,
                }
            }).select({ userId:1, "value.name":1 })

            users.forEach(user => {
                let name = user.value.name
                usersIds[user.userId] = name.charAt(0) + name.slice(1).toLowerCase()
            })

            let labels = []

            let d

            let absenceDiffMs = minPointDate.getTime() - dateFrom.getTime()
            let absenceDiffDays = Math.max(0, Math.floor(absenceDiffMs / 86400000) - 1)

            for ( let i=absenceDiffDays; i<=offsetDays; ++i ) {
                d = new Date(dateFrom)

                d.setDate(d.getDate() + i)

                labels.push(Math.round(d.getTime()/1000))
            }

            let datasets = []

            for ( let userId in usersIds ) {
                let userName = usersIds[userId]

                if ( userName === true ) { continue }

                let score = Number(usersScore[userId]) || 0
                let scoreFormatted = this.formatScore(score)

                if ( userDaysCount[userId] !== userDaysNeed ) {
                    if ( userLastDate[userId] < userLastDateMax ) {
                        continue // expelled
                    } else {
                        // joined later
                    }
                }

                datasets.push({
                    label: `${userName}  ${scoreFormatted}`,
                    score,
                    data: userEvents[userId],
                })
            }

            datasets.sort((a,b) => {
                if ( a.score > b.score ) {
                    return -1
                } else if ( a.score < b.score ) {
                    return +1
                } else {
                    return 0
                }
            })

            res.json({
                labels,
                datasets,
            })
        })
    }

    formatScore(score) {
        score = Number(score) || 0

        if ( score < 1000 ) {
            return score
        } else if ( score < 1000000 ) {
            return Math.floor(score / 100) / 10 + "k"
        } else {
            return Math.floor(score / 100000) / 10 + "M"
        }

        return score
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
