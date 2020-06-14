import { isLocalStorageSupported } from '../helpers'

export default function determineSource (videos) {
    const preferred = isLocalStorageSupported() && localStorage['vuedio-quality'] ? parseInt(localStorage['vuedio-quality'], 10) : null
    if (!preferred) return videos.sort((a, b) => a.height > b.height ? -1 : 1)[0]
    for (const it of videos) {
        if (!it.height || it.height === preferred) {
            return it
        }
    }
    return videos[0]
}
