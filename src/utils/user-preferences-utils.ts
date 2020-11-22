import { appStore, configStore } from '@/store'
import { merge, sum } from '@/utils/object-utils'
import { i18n } from '@/plugins/vue-i18n'
import {
    SingleTranslationData,
    TranslationDataAuthor,
    TranslationData,
    TranslationKind,
    SinglePartTranslations
} from '@/types/translation'
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

/**
 * Sorts translations based on user preferences. IN PLACE!
 *
 * @param data  TranslationData object
 */
export function sortTranslations (data: TranslationData): TranslationData {
    if (!configStore.useSmartSorting) return data

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

        // initial link-count + alphabetical sort
        authors.sort((a, b) => {
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
            }

            author.translations.sort((a, b) => {
                return ((playerWeights[b.name] ?? 0) - (playerWeights[a.name] ?? 0)) || b.name > a.name ? 1 : -1
            })

            // determine author weight (by name)
            let { name, people } = author
            let authorWeight = authorWeights[name.toLowerCase().trim()] ?? 0

            if (people?.length) {
                let totalNamesWeight = 0
                people.forEach((name) => {
                    totalNamesWeight += authorWeights[name.toLowerCase().trim()] ?? 0
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
export function collectTelemetry (translation: SingleTranslationData & { author: TranslationDataAuthor }) {
    let authorPreferences: Record<string, number> = {}
    let { name, people } = translation.author
    for (let it of [name, ...(people ?? [])]) {
        if (it) {
            let itl = it.toLowerCase()
            authorPreferences[itl] = (configStore.authorPreferences[itl] ?? 0) + 1
        }
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
    translations: SinglePartTranslations | null,
    tab: AuthorsTab = AuthorsTab.All,
    ignoreAuthor = false
): {
    translation: SingleTranslationData | null
    allTab?: true
} {
    // this.data?.[val]?.authors?.[0]?.translations?.[0]?.id ?? null
    let { playersFilters, languageFilters, lastAuthor, lastKind, lastPlayer } = configStore
    let authors = translations?.authors
    if (!authors) return { translation: null }

    for (let i = 0; i < authors.length; i++) {
        if (tab !== AuthorsTab.All && authors[i].kind !== TabToKind[tab]) continue
        if (languageFilters[authors[i].lang] === true) continue
        if (!ignoreAuthor && lastAuthor !== null) {
            if (lastAuthor === '' && authors[i].name !== '') continue
            if (authors[i].kind !== lastKind) continue
            let group = authors[i].name
            if (group !== lastAuthor) continue
        }

        for (let k = 0; k <= 1; k++) {
            let ignorePlayer = k === 1
            for (let j = 0; j < authors[i].translations.length; j++) {
                if (playersFilters[authors[i].translations[j].name]) continue
                if (!ignorePlayer && lastPlayer && authors[i].translations[j].name !== lastPlayer) continue

                return { translation: authors[i].translations[j] }
            }
        }
    }

    if (!ignoreAuthor) {
        return getDefaultTranslation(translations, tab, true)
    }

    if (tab !== AuthorsTab.All) {
        let { translation } = getDefaultTranslation(translations, AuthorsTab.All, ignoreAuthor)
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
