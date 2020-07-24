import { configStore } from '@/store'
import { i18n } from '@/plugins/vue-i18n'
import { fallbackImage } from '@/config'
import SortedArray from '@/utils/sorted-array'
import { Translation, TranslationAuthor, TranslationData } from '@/types/translation'
import { Media } from '@/types/media'

export function getMediaPreferredName (media?: { name: Media['name'] }): string {
    if (!media) return ''
    if (media.name[configStore.preferredNameLanguage]) {
        return media.name[configStore.preferredNameLanguage]!
    }
    if (configStore.preferredNameLanguage === 'japanese' && media.name.romaji) {
        return media.name.romaji
    }
    if (i18n.locale === 'ru' && media.name.russian) {
        return media.name.russian
    }
    return media.name.english ?? media.name.romaji ?? media.name.japanese ?? ''
}

export function getMediaSecondaryName (media?: { name: Media['name'] }): string | undefined {
    if (!media) return undefined
    if (configStore.preferredNameLanguage === 'romaji') {
        if (i18n.locale === 'ru' && media.name.russian) {
            return media.name.russian
        }
        return media.name.english ?? media.name.japanese
    }
    if (configStore.preferredNameLanguage === 'japanese') {
        if (media.name.romaji) {
            return media.name.romaji
        } else {
            return media.name.english ?? media.name.russian
        }
    }
    if (!media.name[configStore.preferredNameLanguage] && i18n.locale === 'ru' && media.name.russian) {
        return media.name.romaji
    }
    return media.name.romaji ?? media.name.japanese
}

export function getMediaFullImage (media: Media): string {
    return media.poster?.large ?? media.poster?.small ?? fallbackImage
}

export function getMediaSmallImage (media: Media): string | undefined {
    return media.poster?.small
}


function getPlayerHost (url: string): string {
    try {
        return new URL(url).hostname
    } catch (e) {
        throw Error('Invalid URL: ' + url)
    }
}

function optimizeName (name: string): string {
    if (name === '') {
        return 'unknown'
    }
    name = name.toLowerCase()
        .match(/^(.+?)(?:\s+[[(].+[\])]|\s+на\s+.+)?$/)![1]  // magic, dont touch
    if (name.indexOf(', ') !== -1 || name.indexOf(' & ') !== -1) {
        name = name.split(/(?:, | & )/)
            .sort()
            .join(', ')
        // if name is multiple names divided by comma or ampersand we sort them so the order does not matter
        // i.e. FooSub (Eva & Bob) is same as FooSub (Bob & Eva)
    }
    return name
}

// basically copy-pasted from backend
// reason is pretty simple -- slightly decrease server load
export function processTranslations (translations: Translation[]): TranslationData {
    const ret: TranslationData = {}
    const index: Record<string, TranslationAuthor> = {}

    // tags registry is a place where all tags are stored as a SortedArray for faster lookup
    // strings are compared by first N chars of in-array item, where N is length of requested item
    const tagsRegistry = new SortedArray<string>([], (a, b) => {
        if (a === b) return 0
        if (a.length === b.length) return a > b ? 1 : -1
        const substr = b.substr(0, a.length)
        if (a === substr) return 0
        return a > substr ? 1 : -1
    })

    translations.forEach((tr) => {
        // normalize external urls
        let rawUrl = tr.url
        let url = tr.url
        if (url[0] === 'e') {
            rawUrl = tr.url.substr(1)
            url = '/static/redirect.html?url=' + encodeURIComponent(rawUrl)
        }

        const playerHost = getPlayerHost(rawUrl)
        const optName = optimizeName(tr.author)


        // creating internal meta tag. user-submitted info is always
        // at the end, others params are sure not to have :,
        // so collisions of any kind aren't possible
        const key = `${tr.kind}:${tr.lang}:${optName}`
        const metaTag = `${tr.part}:${key}`

        // adding tag to registry if needed
        let tagIndex = tagsRegistry.index(metaTag)
        if (tagIndex === -1) {
            tagIndex = tagsRegistry.insert(metaTag)
        }

        // ensure current metaTag is longest
        if (metaTag.length > tagsRegistry.raw[tagIndex].length) {
            // first create a ref in index
            index[metaTag] = index[tagsRegistry.raw[tagIndex]]

            // then replace shorter boi with longer one.
            // sort order should not change since our tag
            // starts exactly as tag in sorted array
            tagsRegistry.raw[tagIndex] = metaTag
        }
        const fullTag = tagsRegistry.raw[tagIndex]

        // add part to ret if needed
        if (!(tr.part in ret)) {
            ret[tr.part] = {
                players: [],
                authors: []
            }
        }

        // ref to current episode
        const ep = ret[tr.part]
        if (!ep.players.includes(playerHost)) {
            ep.players.push(playerHost)
        }

        // adding author if needed
        if (!(fullTag in index)) {
            const author: TranslationAuthor = {
                kind: tr.kind,
                lang: tr.lang,
                name: tr.author,
                translations: [],
                hqCount: 0,
                metaTag,
                key
            }

            // adding in index
            index[fullTag] = author
            // adding in ret
            ep.authors.push(author)
        }

        // adding translation in ret.
        index[fullTag].translations.push({
            id: tr.id,
            name: playerHost,
            url,
            rawUrl,
            hq: tr.hq,
            uploader: tr.uploader ?? null
        })
        if (tr.hq) {
            index[fullTag].hqCount++
        }
    })

    return ret
}

export function getLinkToTranslation (tr: Translation): string {
    return '/'
        + tr.target_type + '/'
        + tr.target_id + '/'
        + (tr.target_type === 'anime' ? 'episodes' : 'chapters') + '/'
        + tr.part + '/translations/'
        + tr.id
}


export function deleteTranslationsFromData (data: TranslationData, ids: number[]): TranslationData {
    let delParts: string[] = []

    for (let [k, v] of Object.entries(data)) {
        let players: Record<string, true> = {}

        let i = 0
        while (i < v.authors.length) {
            let ar = v.authors[i].translations

            let j = 0
            while (j < ar.length) {
                let tr = ar[j]
                let idx = ids.indexOf(tr.id)
                if (idx !== -1) {
                    ar.splice(j, 1)
                    ids.splice(idx, 1)
                } else {
                    players[tr.name] = true
                    j++
                }
            }
            if (v.authors[i].translations.length === 0) {
                v.authors.splice(i)
            } else {
                i++
            }
        }

        v.players = v.players.filter(i => players[i])
        if (v.authors.length === 0) delParts.push(k)
    }

    delParts.forEach(k => delete data[k as any])

    return data
}
