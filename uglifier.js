//

"use strict"

const cp = require("mz/child_process")
const fs = require("mz/fs")
const path = require("path")

const UGLIFY_BIN = `${__dirname}/node_modules/uglify-es/bin/uglifyjs`
const UGLIFYCSS_BIN = `${__dirname}/node_modules/uglifycss/uglifycss`
const UGLIFYHTML_BIN = `node ${__dirname}/node_modules/html-minifier/cli.js`

const EXT_JS = {
    ".js": true,
}

const EXT_CSS = {
    ".css": true,
}

const EXT_HTML = {
    ".html": true,
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
    } else if ( EXT_JS[ext] && !IGNORE[ext2+ext] ) {
        cache.jsFiles.push(current)
    } else if ( EXT_CSS[ext] && !IGNORE[ext2+ext] ) {
        cache.cssFiles.push(current)
    } else if ( EXT_HTML[ext] && !IGNORE[ext2+ext] ) {
        cache.htmlFiles.push(current)
    } else { // static file
        cache.staticFiles.push(current)
    }
}

module.exports = async function(from, to) {
    let cache = {
        dirs: [],
        staticFiles: [],
        jsFiles: [],
        cssFiles: [],
        htmlFiles: [],
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

    cache.cssFiles.forEach(file => {
        promises.push(cp.exec([
            UGLIFYCSS_BIN,
            "--max-line-len", 1024,
            "--ugly-comments",
            "--output", to+file,
            from+file,
        ].join(" ")))
    })

    cache.htmlFiles.forEach(file => {
        promises.push(cp.exec([
            UGLIFYHTML_BIN,
            "--max-line-length", 1024,
            "--collapse-whitespace",
            "--collapse-inline-tag-whitespace",
            "--remove-comments",
            "--output", to+file,
            from+file,
        ].join(" ")))
    })

    return Promise.all(promises)
}
