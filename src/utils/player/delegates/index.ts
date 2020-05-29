export default function getPlayer (mime: string) {
    if (mime === 'application/dash+xml') {
        return import(/* webpackChunkName: "pl-mpeg-dash" */ './mpeg-dash')
    }
    if (mime === 'application/vnd.apple.mpegurl'
        || mime === 'application/x-mpegURL'
        || mime === 'video/mpegurl'
    ) {
        return import(/* webpackChunkName: "pl-hls" */ './hls')
    }
    return import(/* webpackChunkName: "pl-html5" */ './html5')
}
