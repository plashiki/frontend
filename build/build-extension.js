const background = require('../src/userscript/background')
const UglifyJS = require('uglify-js')
const babel = require('@babel/core')
const babelConfig = require('../babel.config')
const fs = require('fs-extra')
const path = require('path')
const buildUserscript = require('./build-userscript')

const patterns = [
    '*://shikimori.one/*',
    '*://shikimori.org/*',
    '*://plashiki.online/*',
    '*://plashiki.tk/*',
    '*://plashiki.su/*',
    '*://shikimori.online/*',
    '*://127.0.0.1/*',
    '*://localhost/*',
]

const manifest = {
    manifest_version: 2,
    name: 'PlaShiki',

    description: 'Companion extension for PlaShiki',

    icons: {
        32: 'icons/favicon-32x32.png',
    },

    background: {
        scripts: [
            'background.js',
        ],
        persistent: true,
    },
    permissions: [
        'storage',
        'cookies',
        'webRequest',
        'webRequestBlocking',
        'webNavigation',
        'tabs',
        'http://*/*',
        'https://*/*',
    ],
    externally_connectable: {
        matches: patterns,
    },
    content_scripts: [{
        matches: patterns,
        js: [
            'content.js',
        ],
        run_at: 'document_start',
        all_frames: true,
    }],
}

function buildExtension (target) {
    const dir = path.join(__dirname, '../dist/extension/', target)
    try {
        fs.rmdirSync(dir, {
            recursive: true,
        })
    } catch (e) {
        if (e.code !== 'ENOTFOUND') {
            throw e
        }
    }

    fs.mkdirSync(dir, {
        recursive: true,
    })

    if (target === 'firefox') {
        delete manifest.externally_connectable
    }

    const ctx = {
        isExtension: true,
        isUserscript: false,
        target,
    }

    let { text: contentScript, version, debug } = buildUserscript(ctx)
    manifest.version = version

    if (ctx.target === 'chrome') {
        contentScript = 'const unsafeWindow = window;' + contentScript
        fs.writeFileSync(path.join(dir, 'content.js'), `
let scr = document.createElement('script')
const eid = chrome.runtime.id;
scr.text = '(function(){const extensionId = ' + JSON.stringify(eid) + ';' + ${JSON.stringify(contentScript)} + '})()'
document.documentElement.appendChild(scr)
scr.onload = function () {
    scr.remove()
}
`.trim())
    } else if (ctx.target === 'firefox') {
        fs.writeFileSync(
            path.join(dir, 'content.js'),
            'const extensionId = browser.runtime.id;' +
            'const unsafeWindow = window.wrappedJSObject;' +
            contentScript,
        )
    } else {
        console.error('Unknown target: ' + ctx.target)
    }

    const ctxs = '(' + JSON.stringify(ctx) + ')'

    let bgCode =
        '('
        + background.entry.toString()
            .replace('process.env.NODE_ENV', debug ? '"development"' : '"production"')
            .replace(/process.ctx/g, ctxs)
        + ')()'

    bgCode = babel.transformSync(bgCode, {
        ...babelConfig,
        filename: 'background.js',
    })
    if (bgCode.error) {
        throw bgCode.error
    }

    if (!debug) {
        bgCode = UglifyJS.minify(bgCode.code)

        if (bgCode.error) {
            throw bgCode.error
        }
    }

    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest))
    fs.writeFileSync(path.join(dir, 'background.js'), bgCode.code)
    fs.copy(path.join(__dirname, '../public/img/icons'), path.join(dir, 'icons'))
}

module.exports = buildExtension

if (require.main === module) {
    let target = process.argv[2] || 'chrome'
    console.log(`Building ${target} extension...`)
    buildExtension(target)
}
