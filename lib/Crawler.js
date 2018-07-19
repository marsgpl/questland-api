//

const fetch = require("node-fetch")
const { URLSearchParams } = require("url")
const mongoose = require("mongoose")

const Base = require("./Base")
const StatRowModel = require("./model/StatRow")
const UserModel = require("./model/User")

const RANDOM_STRING_POSSIBLE_CHARS = "abcdefghijklmnopqrstuvwxyz"

module.exports = class extends Base {
    constructor(confPath) {
        super(confPath)
        this.initEvents()
        this.player = process.argv[2]
    }

    async start() {
        await this.initMongoose()

        let date = new Date

        let json = await this.crawl({
            url: "/guild/getguildstats/",
        }, this.player)

        let stats = json && json.data && json.data.guild_stats

        if ( !stats ) {
            console.log("json:", json)
            process.exit(1)
        }

        let usersIds = {}

        for ( let userId in stats ) {
            let stat = stats[userId]

            usersIds[userId] = true

            let s = new StatRowModel({
                source: this.player,
                type: "guild",
                date,
                userId,
                value: stat,
            })

            await s.save()

            //~ console.log(`g:${userId}: OK`)
        }

        let ids = Object.keys(usersIds)

        if ( !ids.length ) {
            console.log("wtf: !ids.length")
            process.exit(1)
        }

        let users = await UserModel.find({
            userId: {
                $in: ids,
            },
        })

        users.forEach(user => {
            usersIds[user.userId] = user
        })

        let nowHour = (new Date).getHours()

        let profile

        for ( let userId in usersIds ) {
            let user = usersIds[userId]

            if ( user === true || nowHour===0 ) { // not found in our db
                json = await this.crawl({
                    url: "/user/getprofile/",
                    body: {
                        hero_id: userId,
                    },
                }, this.player)

                profile = json && json.data && json.data.profile

                if ( !profile ) {
                    continue
                }

                profile.power_rank = json.data.profile_heropower_rank && json.data.profile_heropower_rank.rank
                profile.items_list = json.data.profile_items_list

                if ( nowHour===0 ) {
                    await UserModel.findOneAndRemove({ userId })
                }

                let u = new UserModel({
                    userId,
                    date: new Date,
                    value: profile,
                })

                await u.save()

                console.log(`+ user ${userId}`)
            }
        }

        process.exit(1)
    }

    async initMongoose() {
        mongoose.Promise = global.Promise

        await mongoose.connect(this.conf.mongooseCrawler.url, this.conf.mongooseCrawler.options)
    }

    randomString(len) {
        let str = []

        for ( let i=0; i<len; ++i ) {
            str.push(RANDOM_STRING_POSSIBLE_CHARS[this.rand(0, RANDOM_STRING_POSSIBLE_CHARS.length - 1)])
        }

        return str.join("")
    }

    // conf = { url:"/user/watchadviewed/", body:{ bank_extra_gold:1 } }
    async crawl(conf, player) {
        if ( !this.conf.crawler[player] ) throw {
            code: 0,
            reason: `player not found: ${player}`,
        }

        conf.body = conf.body || {}

        this.extern(conf, this.conf.crawler[player])

        conf.body.chat_last_uts = String(Date.now() / 1000) + String(this.rand(100,999))
        conf.body.req_id = String(Date.now()).substr(3).replace(/^0+/, "")
        conf.body.time_spent_in_game = this.rand(1,20)

        let url = "http://" + conf.host + conf.url + "?rand=" + this.randomString(8)

        const params = new URLSearchParams()

        for ( let k in conf.body ) {
            params.append(k, conf.body[k])
        }

        let r = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "questlanddc": conf.questlanddc,
                "Accept": "application/json",
                "User-Agent": "",
                "Accept-Encoding": "identity",
            },
            body: params,
            //~ body: querystring.stringify(conf.body),
        })

        let json = await r.json()

        return json
    }
}
