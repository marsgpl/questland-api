//

const express = require("express")
const mongoose = require("mongoose")

const Base = require("./Base")
const StatRowModel = require("./model/StatRow")
const UserModel = require("./model/User")

const MAX_DAYS_OFFSET = 7

const COLORS = [
    "#A8201A",
    "#EC9A29",
    "#0F8B8D",
    "#143642",
    "#DAD2D8",

    "#A9FFCB",
    "#B6EEA6",
    "#C0B298",
    "#A4778B",
    "#AA4586",

    "#FCB07E",
    "#3581B8",
    "#44AF69",
    "#F8333C",
    "#FCAB10",

    "#2B9EB3",
    "#3E78B2",
    "#004BA8",
    "#4A525A",
    "#24272B",
]

const TOOLTIP_DATE_FORMAT = "DD MMMM  HH:mm"

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

            let usersIds = {}
            let userEvents = {}
            let usersScore = {}

            let minPointDate = dateTo

            rows.forEach(row => {
                let trophies = row.value[0][2]
                usersIds[row.userId] = true
                userEvents[row.userId] = userEvents[row.userId] || []
                usersScore[row.userId] = Math.max(usersScore[row.userId] || 0, trophies)

                userEvents[row.userId].push({
                    x: row.date,
                    y: trophies,
                })

                if ( row.date < minPointDate ) {
                    minPointDate = row.date
                }
            })

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

                labels.push(d)
            }

            let datasets = []

            let colorN = 0
            let color

            for ( let userId in usersIds ) {
                let userName = usersIds[userId]

                if ( userName === true ) { continue }

                color = COLORS[colorN]

                colorN++

                if ( colorN >= COLORS.length ) {
                    colorN = 0
                }

                let score = Number(usersScore[userId]) || 0
                let scoreFormatted = this.formatScore(score)

                datasets.push({
                    label: `${userName}  ${score}`,
                    score,
                    fill: false,
                    borderColor: color,
                    backgroundColor: color,
                    pointBorderColor: color,
                    pointBackgroundColor: color,
                    pointRadius: 0,
                    pointHitRadius: 30,
                    borderWeight: 0,
                    data: userEvents[userId],
                    cubicInterpolationMode: "monotone",
                    borderWidth: 1,
                    tooltip: usersScore[userId],
                })
            }

            datasets.sort((a,b) => {
                if ( a.score > b.score ) {
                    return 1
                } else if ( a.score < b.score ) {
                    return -1
                } else {
                    return 0
                }
            })

            res.json({
                type: "line",
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: "Trophies progress",
                    },
                    animation: {
                        duration: 0, // general animation time
                    },
                    hover: {
                        animationDuration: 0, // duration of animations when hovering an item
                    },
                    responsiveAnimationDuration: 0, // animation duration after a resize
                    layout: {
                        padding: {
                            left: 5,
                            right: 5,
                            top: 5,
                            bottom: 5,
                        }
                    },
                    scales: {
                        xAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: "Date",
                            },
                            type: "time",
                            time: {
                                unit: "day",
                                tooltipFormat: TOOLTIP_DATE_FORMAT,
                            },
                        }],
                        yAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: "Trophies",
                            },
							ticks: {
								min: 0,
                            },
                        }],
                    },
                },
                data: {
                    labels,
                    datasets,
                },
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
