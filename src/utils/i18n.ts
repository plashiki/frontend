export let defaultLanguage = 'en'

const browserLanguage = navigator.language.split('-')[0]
if (browserLanguage === 'ru') {
    defaultLanguage = 'ru'
}


export const languages = Object.freeze([
    {
        text: 'English',
        value: 'en'
    },
    {
        text: 'Русский',
        value: 'ru'
    }
].sort((a, b) => {
    return a.value === defaultLanguage
        ? -1 : b.value === defaultLanguage
            ? 1 : a.value > b.value ? 1 : -1
}))


export function isRussian (locale: string): boolean {
    return locale === 'ru'
}
