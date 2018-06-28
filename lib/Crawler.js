//

const fetch = require("node-fetch")
const { URLSearchParams } = require("url")
const mongoose = require("mongoose")

const Base = require("./Base")

const RANDOM_STRING_POSSIBLE_CHARS = "abcdefghijklmnopqrstuvwxyz"

module.exports = class extends Base {
    constructor(confPath) {
        super(confPath)
        this.initEvents()
        this.player = process.argv[2]
    }

    async start() {
        await this.initMongoose()

        let json
        let player = this.player

        json = await this.crawl({
            url: "/guild/getguildstats/",
        }, player)

        console.log("json:", json)

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
        conf.body.req_id = Math.floor(Date.now() / 1000)
        conf.body.time_spent_in_game = this.rand(1,2)

        let url = "http://" + conf.host + conf.url + "?rand=" + this.randomString(8)

        const params = new URLSearchParams()

        for ( let k in conf.body ) {
            params.append(k, conf.body[k])
        }

        let r = await fetch(url, {
            method: "POST",
            headers: {
                //"Content-Type": "application/x-www-form-urlencoded",
                "questlanddc": conf.questlanddc,
                "Accept": "application/json",
            },
            body: params,
            //~ body: querystring.stringify(conf.body),
        })

        let json = await r.json()

        return json
    }
}

    // /guild/getguildstats/

    // {"status":"ok","data":{"server_time":1530142600,"chat":{"last_uts":"_1530142594.222532","next_refresh":5},"guild_stats":{"1820427":[[1,"trophies",0,0,0,17150],[1,"guildexp",0,0,0,0],[1,"donate",0,0,0,0],[1,"tribute",0,0,0,0],[1,"gifts",0,0,0,0],[1,"caravan",0,0,0,0],[1,"ships",0,1,1,12],[2,"level",21,21],[2,"famelevel",1,1],[2,"heropower",65640,65640],[2,"challengeboss",0,0],[2,"daysguild",0,0]]},"heroes_avatars":{"1820427":{"h":["REFORGE",21,"m",65640],"b":[95,234,214,null,94,96,null,149,3,1],"l":1530142580,"g":["","owner"]}},"static_data_crc":"dbd596a01506409c09676a11b92ac61d 0","static_details_crc":"4299b367c8da879fa31ff2f228ce5a8d","assets_crc":"e375faada8aeae425efbebed91c4c0e4","hero2":{"id":1820427,"is_event":1,"secret_codes_byothers":0,"unread_messages":0,"req_id":378,"gold":81777,"premium":439,"guild_id":10883}}}
