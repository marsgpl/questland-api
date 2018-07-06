//

const uglifier = require("./uglifier")

;(async () => {
    await uglifier(`./public`, `./prod`)
})()
