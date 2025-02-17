//

const express = require("express")
const mongoose = require("mongoose")

const Base = require("./Base")
const StatRowModel = require("./model/StatRow")
const UserModel = require("./model/User")

const MAX_DAYS_OFFSET = 7
const EVENT_START_WEEKDAY_UTC = 4 // Thursday
const EVENT_START_HOUR_UTC = 16

const AVAIL_STEPS = [
    1000,
    2000,
    2500,
    5000,
    10000,
    20000,
    25000,
    50000,
    100000,
    200000,
    250000,
    500000,
    1000000,
    2000000,
    2500000,
    5000000,
    10000000,
    20000000,
    25000000,
    50000000,
    100000000,
    200000000,
    250000000,
    500000000,
    1000000000,
    2000000000,
    2500000000,
    5000000000,
    10000000000,
    20000000000,
    25000000000,
    50000000000,
]

const TEAMS = [
    [
        52631, // Dehvi
        559839, // Hakanbalta
        48429, // Elmot
        21, // Elmor
        313655, // Salvyron
        1417261, // Yeww
        263781, // Weaknnd
        419039, // Schlotti
        1504171, // Misoli
    ],
    [
        1196833, // Lemix
        226847, // Rubis
        1388059, // Jansenignatz
        414943, // Summerset
        407343, // Serr
        237805, // Khaleesi89
        90403, // Zecamaleca
        1545287, // Archinoob
        1023067, // Dxyoung
    ],
    [
        228013, // Beyoung
        1811623, // Jabon
        1704065, // Nerii
        300563, // Chailatte
        272011, // Nigatello
        670605, // Waylo
        246473, // Deg
        178873, // Jurski
    ],
    [
        200751, // Astharoth
        636507, // Dalova
        1617499, // Kiriama01
        216151, // Arondor
        651219, // Naila
        1596077, // Drangleik
        1189447, // Alaskaaa
        1211643, // Egdwine
    ]
]

const TEAMS_COLORS = [
    "rgb(255, 199, 0)", // orange
    "rgb(158, 44, 198)", // purple
    "rgb(11, 165, 186)", // cyan
    "rgb(18, 168, 17)", // green
    "rgb(230, 45, 45)", // red
];

const BONUSES = {
    // "670605": 11334600-3551150, // Waylo
}

module.exports = class extends Base {
    constructor(confPath) {
        super(confPath)
        this.initEvents()
        this.initExpress()
    }

    getDateIntervals(offsetDays, client) {
        let dateFrom = new Date
        let dateTo = new Date

        dateFrom.setHours(0, 0, 0, 1)

        let weekday = dateFrom.getDay()
        let delta = 0

        if ( weekday < EVENT_START_WEEKDAY_UTC-1 ) {
            delta = EVENT_START_WEEKDAY_UTC - weekday - 7
        } else if ( weekday > EVENT_START_WEEKDAY_UTC ) {
            delta = EVENT_START_WEEKDAY_UTC - weekday
        }

        dateFrom.setHours(dateFrom.getHours() + 24 * delta)

        dateFrom.setMinutes(dateFrom.getMinutes() + (Number(client.tz) || 0))

        return [ dateFrom, dateTo ]
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

    getTeamIndexByUserId(userId) {
        userId = Number(userId) || 0

        if ( !userId ) { return -1 }

        for ( let teamIndex=0; teamIndex<TEAMS.length; ++teamIndex ) {
            let teamIds = TEAMS[teamIndex]

            for ( let idIndex=0; idIndex<teamIds.length; ++idIndex ) {
                let id = teamIds[idIndex]

                if ( id === userId ) {
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

    calcTicks(yMax) {
        let ticks = {
            yMax: 0,
            stepSize: 0,
            maxTicksLimit: 0,
        }

        if ( yMax > 0 ) {
            let stepIndex = 0

            while ( Math.ceil(yMax / AVAIL_STEPS[stepIndex]) > 9 && stepIndex < AVAIL_STEPS.length-1 ) {
                stepIndex++
            }

            ticks.yMax = yMax
            ticks.stepSize = AVAIL_STEPS[stepIndex]
            ticks.maxTicksLimit = Math.floor(yMax / AVAIL_STEPS[stepIndex])

            ticks.yMax = ticks.yMax - ticks.yMax % ticks.stepSize + ticks.stepSize
        }

        if ( !ticks.yMax ) {
            ticks.yMax = AVAIL_STEPS[0]
        }

        return ticks
    }

    initExpress() {
        this.express = express()

        Object.keys(this.conf.express.params).forEach(key => {
            this.express.set(key, this.conf.express.params[key])
        })

        this.express.use("/", express.static("/api/public"))

        this.express.use((req, res, next) => {
            let path = req._parsedUrl.pathname.replace(/\/+$/g, "")

            if ( path.match(/^\/[a-z0-9]+$/i) ) {
                res.sendFile(`/api/public${path}.html`)
            } else {
                next()
            }
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
            let ms = req.query.ms
            let tz = req.query.tz

            let [ dateFrom, dateTo ] = this.getDateIntervals(offsetDays, { ms, tz })

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
            let usersScoreMax = {}

            let minPointDate = null
            let maxPointDate = null

            rows.forEach(row => {
                let trophies = Number(row.value[0][2]) || 0

                if ( BONUSES[row.userId] ) { trophies += BONUSES[row.userId] }

                usersIds[row.userId] = true
                usersScore[row.userId] = trophies
                usersScoreMax[row.userId] = Math.max(trophies, usersScoreMax[row.userId] || 0)

                userEvents[row.userId] = userEvents[row.userId] || {}

                userEvents[row.userId][Math.round(row.date.getTime()/1000)] = trophies

                if ( !minPointDate || row.date < minPointDate ) {
                    minPointDate = row.date
                }

                if ( !maxPointDate || row.date > maxPointDate ) {
                    maxPointDate = row.date
                }

                userDaysCount[row.userId] = (userDaysCount[row.userId] || 0) + 1
                userLastDate[row.userId] = row.date
                userLastDateMax = row.date
            })

            if ( !minPointDate ) {
                minPointDate = dateFrom
            }

            if ( !maxPointDate ) {
                maxPointDate = dateTo
            }

            for ( let userId in userDaysCount ) {
                userDaysNeed = Math.max(userDaysNeed, userDaysCount[userId])
            }

            let ids = Object.keys(usersIds)

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

            for ( let i=0; i<=offsetDays; ++i ) {
                let d = new Date(dateFrom)

                d.setDate(d.getDate() + i)

                if ( d.getTime()-maxPointDate.getTime() >= 1000*86400*2 && i >= 2 ) { break }

                labels.push(Math.round(d.getTime()/1000))
            }

            let datasets = []

            TEAMS.forEach((teamIds, index) => {
                datasets.push({
                    label: `${usersIds[teamIds[0]]}'s team`,
                    score: 0,
                    scoreMax: 0,
                    personal: {},
                    persons: 0,
                    color: TEAMS_COLORS[index],
                })
            })

            let yMax = 0

            for ( let userId in usersIds ) {
                let userName = usersIds[userId]

                if ( userName === true ) { continue }

                let score = Number(usersScore[userId]) || 0
                let scoreMax = Number(usersScoreMax[userId]) || 0

                let scoreFormatted = this.formatScore(score)

                if ( userDaysCount[userId] !== userDaysNeed ) {
                    if ( userLastDate[userId] < userLastDateMax ) {
                        continue // expelled
                    } else {
                        // joined later
                    }
                }

                let teamIndex = this.getTeamIndexByUserId(userId)

                if ( teamIndex < 0 ) { continue }

                let userData = userEvents[userId]

                let dataset = datasets[teamIndex]

                dataset.score += score
                dataset.scoreMax += scoreMax

                if ( !dataset.data ) {
                    dataset.data = Object.assign({}, userData)
                } else {
                    for ( let pk in dataset.data ) {
                        dataset.data[pk] += Number(userData[pk]) || 0
                    }
                }

                dataset.personal[userName] = userData
                dataset.persons++

                yMax = Math.max(yMax, dataset.scoreMax)
            }

            datasets.forEach(dataset => {
                dataset.label += "  " + this.formatScore(dataset.score)
            })

            datasets.sort((a,b) => {
                if ( !a.score && !b.score ) {
                    if ( a.scoreMax > b.scoreMax ) {
                        return -1
                    } else if ( a.scoreMax < b.scoreMax ) {
                        return +1
                    } else {
                        return 0
                    }
                } else {
                    if ( a.score > b.score ) {
                        return -1
                    } else if ( a.score < b.score ) {
                        return +1
                    } else {
                        return 0
                    }
                }
            })

            let ticks = this.calcTicks(yMax)

            res.json({
                labels,
                datasets,
                yMax: ticks.yMax,
                stepSize: ticks.stepSize,
                maxTicksLimit: ticks.maxTicksLimit,
            })
        })

        this.express.all("/reforge/api/event", async (req, res) => {
            let source = "lemix" // req.query.source
            let offsetDays = MAX_DAYS_OFFSET
            let ms = req.query.ms
            let tz = req.query.tz

            let [ dateFrom, dateTo ] = this.getDateIntervals(offsetDays, { ms, tz })

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
            let usersScoreMax = {}

            let minPointDate = null
            let maxPointDate = null

            rows.forEach(row => {
                let trophies = Number(row.value[0][2]) || 0

                if ( BONUSES[row.userId] ) { trophies += BONUSES[row.userId] }

                usersIds[row.userId] = true
                usersScore[row.userId] = trophies
                usersScoreMax[row.userId] = Math.max(trophies, usersScoreMax[row.userId] || 0)

                userEvents[row.userId] = userEvents[row.userId] || {}

                userEvents[row.userId][Math.round(row.date.getTime()/1000)] = trophies

                if ( !minPointDate || row.date < minPointDate ) {
                    minPointDate = row.date
                }

                if ( !maxPointDate || row.date > maxPointDate ) {
                    maxPointDate = row.date
                }

                userDaysCount[row.userId] = (userDaysCount[row.userId] || 0) + 1
                userLastDate[row.userId] = row.date
                userLastDateMax = row.date
            })

            if ( !minPointDate ) {
                minPointDate = dateFrom
            }

            if ( !maxPointDate ) {
                maxPointDate = dateTo
            }

            for ( let userId in userDaysCount ) {
                userDaysNeed = Math.max(userDaysNeed, userDaysCount[userId])
            }

            let ids = Object.keys(usersIds)

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

            for ( let i=0; i<=offsetDays; ++i ) {
                let d = new Date(dateFrom)

                d.setDate(d.getDate() + i)

                if ( d.getTime()-maxPointDate.getTime() >= 1000*86400*2 && i >= 2 ) { break }

                labels.push(Math.round(d.getTime()/1000))
            }

            let datasets = []
            let members = {}

            let yMax = 0

            for ( let userId in usersIds ) {
                let userName = usersIds[userId]

                if ( userName === true ) { continue }

                let score = Number(usersScore[userId]) || 0
                let scoreMax = Number(usersScoreMax[userId]) || 0

                let scoreFormatted = this.formatScore(score)

                if ( userDaysCount[userId] !== userDaysNeed ) {
                    if ( userLastDate[userId] < userLastDateMax ) {
                        continue // expelled
                    } else {
                        // joined later
                    }
                }

                members[userId] = userName

                datasets.push({
                    userId,
                    label: `${userName}  ${scoreFormatted}`,
                    score,
                    scoreMax,
                    data: userEvents[userId],
                })

                yMax = Math.max(yMax, scoreMax)
            }

            datasets.sort((a,b) => {
                if ( !a.score && !b.score ) {
                    if ( a.scoreMax > b.scoreMax ) {
                        return -1
                    } else if ( a.scoreMax < b.scoreMax ) {
                        return +1
                    } else {
                        return 0
                    }
                } else {
                    if ( a.score > b.score ) {
                        return -1
                    } else if ( a.score < b.score ) {
                        return +1
                    } else {
                        return 0
                    }
                }
            })

            let ticks = this.calcTicks(yMax)

            res.json({
                labels,
                datasets,
                members,
                yMax: ticks.yMax,
                stepSize: ticks.stepSize,
                maxTicksLimit: ticks.maxTicksLimit,
            })
        })

        // 404
        //~ this.express.use((req, res) => {
            //~ res.writeHead(302, {
                //~ "Location": "/",
            //~ })

            //~ res.end()
        //~ })
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
