import { appStore, configStore } from '@/store'
import { merge, sum } from '@/utils/object-utils'
import { i18n } from '@/plugins/vue-i18n'
import { SingleTranslationData, TranslationAuthor, TranslationData, TranslationKind } from '@/types/translation'
import { AuthorsTab, TabToKind } from '@/types/media'

export type TranslationPreferenceProperty = 'kind' | 'lang' | 'author' | 'player'

function getPropertiesWeights (): Record<TranslationPreferenceProperty, number> {
    let ret: Partial<Record<TranslationPreferenceProperty, number>> = {}

    for (let i = 0; i < configStore.translationPreferenceOrder.length; i++) {
        ret[configStore.translationPreferenceOrder[i]] = 5 - i
    }

    return ret as Record<TranslationPreferenceProperty, number>
}

function getMapWeights (map: Record<string, number>, add: Record<string, number> | null = null): Record<string, number> {
    let ret: Record<string, number> = {}
    let total = sum(Object.values(map))

    for (let [key, value] of Object.entries(map)) {
        if (add && key in add) {
            value += add[key]
            total += add[key]
        }
        ret[key] = value / total
    }

    if (add) {
        merge(ret, add, [], true)
    }

    return ret
}

export function processAuthorName (name: string): {
    studio: string
    names: string[]
} {
    let match = name.toLowerCase()
        .replace(/[.,?:\-!%^&*@#+=`~\\/[\]<>;'"_—–]/gi, '') // remove trash
        .match(/^(.+?)(?:\s+[[(](.+)[\])]|\s+на\s+.+)?$/) // holy fuck

    if (!match) return {
        studio: name,
        names: []
    }

    let [, studio, names] = match

    if (studio.match(/[,;]|\s[и&]\s/)) {
        names = studio
        studio = ''
    }

    return {
        studio,
        names: names?.split(/[,;]|\s[и&]\s/gi).map(i => i.trim()) ?? []
    }
}

/**
 * Sorts translations based on user preferences. IN PLACE!
 *
 * @param data  TranslationData object
 */
export function sortTranslations (data: TranslationData): TranslationData {
    // get final factors of all properties
    const factors = getPropertiesWeights()

    // get basic map factors
    const langWeights = getMapWeights(configStore.langPreferences, {
        [i18n.locale]: 15 // enforcing current locale to be more dominant, at least in early use time
    })
    const kindWeights = getMapWeights(configStore.kindPreferences)
    const playerWeights = getMapWeights(configStore.playerPreferences)
    const authorWeights = getMapWeights(configStore.authorPreferences)

    for (const { authors } of Object.values(data)) {
        // resulting map for current part: author meta-tag --> final weight
        const totalAuthorWeights: Record<string, number> = {}

        // initial hq + link-count + alphabetical sort
        authors.sort((a, b) => {
            if (b.hqCount !== a.hqCount) return (b.hqCount - a.hqCount)
            if (a.name === '') return 1
            if (b.name === '') return -1
            return (b.translations.length - a.translations.length) || (b.name < a.name ? 1 : -1)
        })

        for (let author of authors) {
            const langWeight = langWeights[author.lang] ?? 0
            const kindWeight = kindWeights[author.kind] ?? 0
            let totalPlayerWeight = 0

            for (let translation of author.translations) {
                totalPlayerWeight += playerWeights[translation.name] ?? 0
                if (translation.hq) {
                    totalPlayerWeight += (playerWeights[translation.name] ?? 0.5) * 3
                }
            }

            author.translations.sort((a, b) => {
                return ((playerWeights[b.name] ?? 0) - (playerWeights[a.name] ?? 0)) || b.name > a.name ? 1 : -1
            })

            // determine author weight (by name)
            let { studio, names } = processAuthorName(author.name)
            let authorWeight = authorWeights[studio.trim()] ?? 0

            if (names.length) {
                let totalNamesWeight = 0
                names.forEach((name) => {
                    totalNamesWeight += authorWeights[name.trim()] ?? 0
                })
                if (author.kind === TranslationKind.Dubbed) {
                    // dubbed translations rating should rely on names more that subbed/raw, so using avg
                    authorWeight = (authorWeight + totalNamesWeight * 0.5) / 2
                } else {
                    authorWeight += totalNamesWeight * 0.25
                }
            }

            totalAuthorWeights[author.metaTag] =
                langWeight * factors.lang +
                kindWeight * factors.kind +
                totalPlayerWeight * factors.player +
                authorWeight * factors.author
        }
        authors.sort((a, b) => {
            return (totalAuthorWeights[b.metaTag] - totalAuthorWeights[a.metaTag])
        })
    }

    return data
}

export function filterVisibleTranslations (translations: SingleTranslationData[], current = -1): SingleTranslationData[] {
    const playerWeights = getMapWeights(configStore.playerPreferences)
    let ret: SingleTranslationData[] = []
    let maxTimes: Record<string, number> = {}
    let times: Record<string, number> = {}

    for (let tr of translations) {
        if (!(tr.name in maxTimes)) {
            let factor = playerWeights[tr.name] ?? 0

            let times
            if (factor >= 0.75) times = 4
            else if (factor >= 0.5) times = 3
            else if (factor >= 0.3) times = 2
            else times = 1

            maxTimes[tr.name] = times
        }

        if (!(tr.name in times)) {
            times[tr.name] = 0
        }
        if ((times[tr.name]++) < maxTimes[tr.name] || tr.id === current) {
            ret.push(tr)
        }
    }

    return ret
}

// not sure if its really called telemetry but it sounds cool, lmao
export function collectTelemetry (translation: SingleTranslationData & { author: TranslationAuthor }) {
    let authorPreferences: Record<string, number> = {}
    let { studio, names } = processAuthorName(translation.author.name)
    for (let it of [studio, ...names]) {
        authorPreferences[it] = (configStore.authorPreferences[it] ?? 0) + 1
    }

    configStore.merge({
        langPreferences: {
            [translation.author.lang]: (configStore.langPreferences[translation.author.lang] ?? 0) + 1
        },
        kindPreferences: {
            [translation.author.kind]: (configStore.kindPreferences[translation.author.kind] ?? 0) + 1
        },
        authorPreferences,
        playerPreferences: {
            [translation.name]: (configStore.playerPreferences[translation.name] ?? 0) + 1
        }
    })

}

export function getDefaultTranslation (
    translations: TranslationData | null,
    partNumber: number,
    tab: AuthorsTab = AuthorsTab.All,
    ignoreAuthor = false
): {
    translation: SingleTranslationData | null
    allTab?: true
} {
    // this.data?.[val]?.authors?.[0]?.translations?.[0]?.id ?? null
    let { playersFilters, languageFilters } = configStore
    let authors = translations?.[partNumber]?.authors
    let lastAuthor = appStore.lastAuthor
    let lastKind = appStore.lastKind
    if (!authors) return { translation: null }

    for (let i = 0; i < authors.length; i++) {
        if (tab !== AuthorsTab.All && authors[i].kind !== TabToKind[tab]) continue
        if (languageFilters[authors[i].lang] === true) continue
        if (!ignoreAuthor && lastAuthor) {
            if (authors[i].kind !== lastKind) continue
            let { studio } = processAuthorName(authors[i].name)
            if (studio !== lastAuthor) continue
        }

        for (let j = 0; j < authors[i].translations.length; j++) {
            if (playersFilters[authors[i].translations[j].name]) continue

            return { translation: authors[i].translations[j] }
        }
    }

    if (!ignoreAuthor) {
        return getDefaultTranslation(translations, partNumber, tab, true)
    }

    if (tab !== AuthorsTab.All) {
        let { translation } = getDefaultTranslation(translations, partNumber, AuthorsTab.All, ignoreAuthor)
        return {
            translation,
            allTab: true
        }
    }

    return {
        translation: null,
        allTab: true
    }
}
