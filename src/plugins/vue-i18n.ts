import Vue from 'vue'
import VueI18n from 'vue-i18n'
import axios from 'axios'
import { AnyKV } from '@/types'
import { configStore } from '@/store'
import { languageChanged } from '@/api/internal/ipc'

export const availableLocales: string[] = process.env.AVAILABLE_LOCALES as any

export let i18n: VueI18n

Object.defineProperty(Vue.prototype, '$i18n', {
    get () {
        return i18n
    }
})

Vue.use(VueI18n)

i18n = new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        ru: require('@/locale/ru.yml'),
        en: require('@/locale/en.yml')
    }
})

const dateFnsLocales: AnyKV = {
    en: require('date-fns/locale/en-US'),
    ru: require('date-fns/locale/ru')
}

export function dateFnLocale (): any {
    return dateFnsLocales[i18n.locale].default
}

// datefns has no way (afaik) to get distance in days. so we get formatRelative and remove time part
// (which will apparently be smth like "at 00:00")
export function dateFnsDropTime (s: string): string {
    if (i18n.locale === 'ru') {
        return s.replace(/ в 0+:0+$/i, '')
    }
    if (i18n.locale === 'en') {
        return s.replace(/ at 12:0+ [AP]M$/i, '')
    }
    return s
}

function setI18nLanguage (lang: string, local = false): string {
    i18n.locale = lang
    axios.defaults.headers.common['Accept-Language'] = lang
    document.documentElement.setAttribute('lang', lang)
    if (configStore.language !== lang) {
        configStore.merge({ language: lang })
    }

    if (!local) {
        languageChanged(lang)
    }

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
    },
    /*
    * Requires input like:
    * - (1) item
    * - (2) items
    * -- or --
    * - (1)st item
    * - (2)nd item
    * - (3)rd item
    * - (4)th item
    * (for ordinals)
    */
    English (choice: number, choicesLength: number) {
        if (choicesLength === 1 || choice % 10 === 1) return 0
        if (choicesLength === 4) {
            let last = choice % 10
            if (last === 2) return 1
            if (last === 3) return 2
            return 3
        }
        return 1
    }
}

export function changeLanguage (lang: string, local = false): void {
    setI18nLanguage(lang, local)
}


i18n.pluralizationRules['en'] = PluralizationStrategies.English
i18n.pluralizationRules['ru'] = PluralizationStrategies.Slavic
