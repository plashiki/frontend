const UglifyJS = require('uglify-js')
const babel = require('@babel/core')
const babelConfig = require('../babel.config')
const fs = require('fs')
const path = require('path')
const { config } = require('dotenv')
const sass = require('sass')
const vm = require('vm')

config({
    path: path.join(__dirname, '../.env.local'),
})

const header = `
// ==UserScript==
// @name            PlaShiki
// @namespace       https://shikimori.online
// @version         %VERSION%
// @description     Скрипт-компаньон для PlaShiki
// @description:en  Companion script for PlaShiki
// @author          teidesu
%INCLUDES%
// @updateURL       https://plashiki.su/assets/plashiki.user.js
// @run-at          document-body
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @connect         self
// @connect         plashiki.su
// @connect         shikimori.one
// @connect         anime365.ru
// @connect         hentai365.ru
// @connect         smotret-anime-365.ru
// @connect         smotretanime.ru
// @connect         *
// ==/UserScript==
`.trimStart()

function buildUserscript () {
    let source = fs.readFileSync(path.join(__dirname, '../src/userscript/entry.js')).toString('utf-8')
    let sandbox = {
        process,
        document: {
            querySelector () {},
            querySelectorAll () {},
        },
    }
    vm.runInNewContext(source + '\n\n__RESULT__ = us', sandbox)
    if (!sandbox.__RESULT__) {
        console.error('Failed to parse entry.js')
        return
    }
    const us = sandbox.__RESULT__

    let text = header
        .replace('%VERSION%', us.__version)
        .replace(
            '%INCLUDES%',
            us.__matchers
                .map(({ matcher }) => '// @include ' + matcher)
                .join('\n'),
        )

    const assetsNames = []
    source.replace(/us\.asset\((['"])(.+?)\1\)/, (_, $1, $2) => {
        assetsNames.push($2)
        return _
    })

    const assets = {}

    for (let filename of assetsNames) {
        if (filename.endsWith('.scss')) {
            assets[filename] = sass.renderSync({
                file: path.join(__dirname, '../src/userscript/', filename),
                outputStyle: 'compressed',
            }).css.toString()
        } else {
            console.log('Unknown asset type: ', filename)
        }
    }

    let code = source
            .replace(/process\.env\.ASSETS/g, JSON.stringify(assets))
            .replace(/process\.env\.([A-Z_]+)/g, (_, $1) => JSON.stringify(process.env[$1]))
        + '\n\nus.execute(location.href)'

    code = babel.transformSync(code, {
        ...babelConfig,
        filename: 'plashiki.user.js',
    })
    if (code.error) {
        throw code.error
    }

    if (!us.__debug) {
        code = UglifyJS.minify(code.code)

        if (code.error) {
            throw code.error
        }
    }

    text += code.code

    return text
}

if (require.main === module) {
    console.log('Building userscript...')
    const text = buildUserscript()
    fs.writeFileSync(path.join(__dirname, '../public/static/plashiki.user.js'), text)
}
