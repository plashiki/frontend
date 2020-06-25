const authorsLoader = function (source) {
    let data = source.toString()
    data = data.split('\n')
        .map(i => i.trim())
        .filter(i => i.length && i[0] !== '#')

    return 'module.exports = { authors: JSON.parse(' + JSON.stringify(JSON.stringify(data)) + ') }'
}

module.exports = authorsLoader
