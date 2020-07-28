export let defaultLanguage = 'en'
const browserLanguage = navigator.language.split('-')[0]
if (browserLanguage === 'ru') {
    defaultLanguage = 'ru'
}
