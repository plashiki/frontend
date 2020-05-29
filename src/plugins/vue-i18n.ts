import Vue from 'vue'
import VueI18n from 'vue-i18n'
import * as ruLocale from '@/locale/ru.yml'
import { ru } from 'date-fns/locale'
import axios from 'axios'
import { AnyKV } from '@/types'

export const availableLocales: string[] = process.env.AVAILABLE_LOCALES as any

export let i18n: VueI18n

Object.defineProperty(Vue.prototype, '$i18n', {
    get () {
        return i18n
    }
})

Vue.use(VueI18n)

i18n = new VueI18n({
    locale: 'ru',
    fallbackLocale: 'ru',
    messages: { ru: ruLocale as any }
})

const loadedLanguages = ['ru']

const dateFnsLocales: AnyKV = { ru }

export function dateFnLocale (): any {
    return dateFnsLocales[i18n.locale]
}

// datefns has no way (afaik) to get distance in days. so we get formatRelative and remove time part
// (which will apparently be smth like "at 00:00")
export function dateFnsDropTime (s: string): string {
    if (i18n.locale === 'ru') {
        return s.replace(/в 0+:0+$/i, '')
    }
    return s
}

function setI18nLanguage (lang: string): string {
    i18n.locale = lang
    axios.defaults.headers.common['Accept-Language'] = lang
    document.documentElement.setAttribute('lang', lang)
    return lang
}

type PluralizationStrategy = (choice: number, choicesLength: number) => number

const PluralizationStrategies: Record<string, PluralizationStrategy> = {
    /*
     * Requires input like:
     * - нет стола
     * - (1) стол
     * - (2) стола
     * - (5) столов
     */
    Slavic (choice: number, choicesLength: number) {
        if (choice === 0 || choicesLength === 1) {
            return 0
        }

        const teen = choice > 10 && choice < 20
        const endsWithOne = choice % 10 === 1

        if (!teen && endsWithOne) {
            return 1
        }

        if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
            return 2
        }

        return (choicesLength < 4) ? 2 : 3
    }
}

export function changeLanguage (lang: string): Promise<any> {
    if (i18n.locale === lang) {
        setI18nLanguage(lang)
        return Promise.resolve()
    }

    if (loadedLanguages.includes(lang)) {
        setI18nLanguage(lang)
        return Promise.resolve()
    }

    return Promise.all([
        import(/* webpackChunkName: "lang-[request]" */ `@/locale/${lang}.yml`)
            .then(messages => {
                if (messages.Meta?.PluralStrategy) {
                    i18n.pluralizationRules[lang] = PluralizationStrategies[messages.Meta.PluralStrategy]
                    if (!i18n.pluralizationRules[lang]) {
                        throw Error('Unknown pluralization strategy: ' + messages.Meta.PluralStrategy)
                    }
                }
                i18n.setLocaleMessage(lang, messages)
                loadedLanguages.push(lang)
                setI18nLanguage(lang)
            }),
        Promise.resolve()
            .then(() => {
                // idk maybe some codegen?...
                if (lang === 'ru') return import(/* webpackChunkName: "lang-ru-datefns" */ 'date-fns/locale/ru')
                // ...
            })
            .then((locale) => {
                dateFnsLocales[lang] = locale
            })

    ])
}


i18n.pluralizationRules['ru'] = PluralizationStrategies.Slavic
