//

const express = require("express")
const mongoose = require("mongoose")

const Base = require("./Base")
const StatRowModel = require("./model/StatRow")
const UserModel = require("./model/User")

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
            let offsetDays = 7
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

            rows.forEach(row => {
                usersIds[row.userId] = true
                userEvents[row.userId] = userEvents[row.userId] || []

                userEvents[row.userId].push({
                    x: row.date,
                    y: row.value[0][5],
                })
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
                usersIds[user.userId] = user.value.name
            })

            let labels = []

            let d

            for ( let i=0; i<=offsetDays; ++i ) {
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

                datasets.push({
                    label: userName,
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
                })
            }

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
