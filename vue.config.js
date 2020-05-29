const fs = require('fs')
const webpack = require('webpack')
const { join } = require('path')
const { InjectManifest } = require('workbox-webpack-plugin')
const { execSync } = require('child_process')

function currentCommit () {
    return execSync('git rev-parse --short HEAD')
        .toString('utf8')
        .trim()
}

function today () {
    let _ = new Date()
    let d = _.getDate() + ''
    let m = _.getMonth() + 1 + ''
    let y = _.getFullYear() % 100 + ''
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y.padStart(2, '0')}`
}

const env = {
    'process.env': {
        AVAILABLE_LOCALES: JSON.stringify(fs.readdirSync(
            join(__dirname, 'src/locale'),
        ).map(i => i.split('.yml')[0])),
        VERSION: JSON.stringify(require('./package.json').version),
        COMMIT: JSON.stringify(currentCommit()),
        BUILD_DATE: JSON.stringify(today()),
    },
}

module.exports = {
    transpileDependencies: [
        'vuetify',
    ],
    configureWebpack: {
        plugins: [
            new webpack.DefinePlugin(env),
        ],
        externals: {
            moment: 'moment',
        },
    },
    chainWebpack (config) {
        config.module
            .rule('yml-locale')
            .test(/\.ya?ml$/)
            .use('yml-loader')
            .loader(join(__dirname, 'build/yml-locale-loader'))
            .end()

        const svgRule = config.module.rule('svg')

        svgRule.uses.clear()

        svgRule
            .use('babel-loader')
            .loader('babel-loader')
            .end()
            .use('vue-svg-loader')
            .loader('vue-svg-loader')

        const workBoxConfig = {
            exclude: [
                'sw.js',
            ],
            swDest: 'sw.js',
            swSrc: join(__dirname, 'src/service-worker.ts'),
        }

        config
            .plugin('bundle-service-worker')
            .use(InjectManifest, [workBoxConfig])
        config.plugins.delete('workbox')
    },
    devServer: {
        port: 8123,
        disableHostCheck: true,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:7281',
            },
        },
    },
    pluginOptions: {
        sw: {
            dest: 'sw.js',
            src: 'src/service-worker.ts',
            plugins: [
                // ... webpack plugins that will be applied only to SW ...
            ],
        },
        webpackBundleAnalyzer: {
            openAnalyzer: false,
        },
    },
}
