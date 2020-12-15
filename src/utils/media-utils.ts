import { configStore } from '@/store'
import { i18n } from '@/plugins/vue-i18n'
import { fallbackImage } from '@/config'
import { Translation, TranslationDataAuthor, TranslationData, TranslationAuthor } from '@/types/translation'
import { ImageMeta, NameMeta } from '@/types/media'
import { isRussian } from '@/utils/i18n'

export function getPreferredName (name?: NameMeta): string {
    if (!name) return ''
    if (name[configStore.preferredNameLanguage]) {
        return name[configStore.preferredNameLanguage]!
    }
    if (configStore.preferredNameLanguage === 'japanese' && name.romaji) {
        return name.romaji
    }
    if (isRussian(i18n.locale) && name.russian) {
        return name.russian
    }
    return name.english ?? name.romaji ?? name.japanese ?? ''
}

export function getSecondaryName (name?: NameMeta): string | undefined {
    if (!name) return undefined
    if (configStore.preferredNameLanguage === 'romaji') {
        if (isRussian(i18n.locale) && name.russian) {
            return name.russian
        }
        return name.english ?? name.japanese
    }
    if (configStore.preferredNameLanguage === 'japanese') {
        if (name.romaji) {
            return name.romaji
        } else {
            return name.english ?? name.russian
        }
    }
    if (!name[configStore.preferredNameLanguage] && i18n.locale === 'ru' && name.russian) {
        return name.romaji
    }
    return name.romaji ?? name.japanese
}

export function getFullImage (image?: ImageMeta): string {
    return image?.large ?? image?.small ?? fallbackImage
}

export function getSmallImage (image?: ImageMeta): string | undefined {
    return image?.small
}


function getPlayerHost (url: string): string {
    try {
        return new URL(url).hostname
    } catch (e) {
        throw Error('Invalid URL: ' + url)
    }
}

export function authorToString (author: TranslationAuthor, short = false): string {
    let ret = ''
    if (author.group) {
        ret = author.group
        if (author.people?.length) {
            ret += ` (${author.people.join(', ')})`
        }
    } else if (author.people?.length) {
        ret = author.people.join(', ')
    } else return ''

    if (author.ripper && !short) {
        ret += ` [${author.ripper}]`
    }

    return ret || i18n.t('Items.Translation.UnknownAuthor')
}

// basically copy-pasted from backend
// reason is pretty simple -- slightly decrease server load
export function processTranslations (translations: Translation[]): TranslationData {
    const ret: TranslationData = {}

    const peopleCombiner: Record<number, Record<string, string[]>> = {}
    const authorsIndex: Record<number, Record<string, TranslationDataAuthor>> = {}

    translations.forEach((tr) => {
        // normalize external urls
        let rawUrl = tr.url
        let url = tr.url
        if (url[0] === 'e') {
            rawUrl = tr.url.substr(1)
            url = '/static/redirect.html?url=' + encodeURIComponent(rawUrl)
        }

        const playerHost = getPlayerHost(rawUrl)

        const groupLowercase = tr.author.group?.toLowerCase() ?? ''
        const hasGroup = !!tr.author.group
        let people: string[] = tr.author.people || []
        if (hasGroup) {
            if (!(tr.part in peopleCombiner)) peopleCombiner[tr.part] = {}
            if (!(tr.author.group! in peopleCombiner[tr.part])) peopleCombiner[tr.part][groupLowercase] = []
            tr.author.people?.forEach((it) => {
                if (peopleCombiner[tr.part][groupLowercase].indexOf(it) === -1) {
                    peopleCombiner[tr.part][groupLowercase].push(it)
                }
            })

            people = peopleCombiner[tr.part][groupLowercase]
        }

        const authorName = tr.author.group || tr.author.people?.join(', ') || ''
        const metaTag = `${tr.kind}:${tr.lang}:${authorName.toLowerCase()}`

        // add part to ret if needed
        if (!(tr.part in ret)) {
            ret[tr.part] = {
                players: [],
                authors: []
            }
        }

        // ref to current part
        const part = ret[tr.part]
        if (!part.players.includes(playerHost)) {
            part.players.push(playerHost)
        }

        if (!(tr.part in authorsIndex)) authorsIndex[tr.part] = {}
        if (!(metaTag in authorsIndex[tr.part])) {
            const author: TranslationDataAuthor = {
                kind: tr.kind,
                lang: tr.lang,
                translations: [],
                name: tr.author.group || '',
                metaTag,
                key: metaTag // idk where it is used, leaving to ensure nothing breaks D:
            }
            if (tr.author.people) author.people = people

            // adding in index
            authorsIndex[tr.part][metaTag] = author
            // adding in ret
            part.authors.push(author)
        }

        // adding translation in ret.
        let item: any = {
            id: tr.id,
            name: playerHost,
            url,
            rawUrl,
            uploader: tr.uploader
        }
        if (tr.author.ripper) {
            item.ripper = tr.author.ripper
        }
        authorsIndex[tr.part][metaTag].translations.push(item)
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
