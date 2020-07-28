const { load } = require('js-yaml')

function processNode (node) {
    if (node instanceof Array) {
        return node.map(processNode).join(' | ')
    }
    if (typeof node === 'string') {
        return node.replace(/(?<!\\)\$([a-zA-Z0-9]+)\$?/g, (_, $1) => `{${$1}}`)
    }
    if (!node || typeof node !== 'object') return node

    for (let [k, v] of Object.entries(node)) {
        node[k] = processNode(v)
    }
    return node
}

const ymlLoader = function (source) {
    let data = load(source.toString())
    data = processNode(data)

    return 'module.exports = JSON.parse(' + JSON.stringify(JSON.stringify(data)) + ')'
}

module.exports = ymlLoader
