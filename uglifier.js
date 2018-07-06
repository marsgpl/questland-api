//

"use strict"

const cp = require("mz/child_process")
const fs = require("mz/fs")
const path = require("path")

const UGLIFY_BIN = `${__dirname}/node_modules/uglify-es/bin/uglifyjs`

const EXT_JS = {
    ".js": true,
}

const IGNORE = {
    ".min.js": true,
}

let scan = async function(baseFrom, baseTo, current, cache) {
    let from = baseFrom + current
    let to = baseTo + current

    let ext = path.extname(from)
    let ext2 = path.extname(path.basename(from, ext))

    if ( !ext ) { // dir
        cache.dirs.push(to)

        let entries = await fs.readdir(from)

        let promises = []

        entries.forEach(entry => {
            promises.push(scan(baseFrom, baseTo, current+"/"+entry, cache))
        })

        await Promise.all(promises)
    } else if ( !EXT_JS[ext] || IGNORE[ext2+ext] ) { // static file
        cache.staticFiles.push(current)
    } else { // js
        cache.jsFiles.push(current)
    }
}

module.exports = async function(from, to) {
    let cache = {
        dirs: [],
        staticFiles: [],
        jsFiles: [],
    }

    await scan(from, to, "", cache)

    //~ console.log(cache)

    if ( cache.dirs.length ) {
        await cp.exec("mkdir -p " + cache.dirs.join(" "))
    }

    let promises = []

    cache.staticFiles.forEach(file => {
        promises.push(fs.copyFile(from+file, to+file))
    })

    cache.jsFiles.forEach(file => {
        promises.push(cp.exec([
            UGLIFY_BIN,
            "--warn",
            "--toplevel",
            "--compress",
            "--mangle",
            "--output", to+file,
            "--", from+file,
        ].join(" ")))
    })

    return Promise.all(promises)
}
