let cfg = {
    presets: [
        [
            '@vue/cli-plugin-babel/preset',
            {
                useBuiltIns: 'entry',
                exclude: process.env.NODE_ENV !== 'production' ? [
                    '@babel/transform-async-to-generator',
                    '@babel/plugin-transform-regenerator',
                ] : undefined,
            },
        ],
    ],
}

module.exports = cfg
