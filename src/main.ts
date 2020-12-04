import 'core-js/modules/es.promise.finally'
import Vue, { CreateElement } from 'vue'
import App from './App.vue'
import './register-sw'
import './plugins/firebase'
import './plugins/responsiveness'
import { changeLanguage } from '@/plugins/vue-i18n'
import router from './router'
import store, { appStore, configStore, onceStoreReady } from './store'
import vuetify from './plugins/vuetify'
import VTooltip from 'v-tooltip'
import './plugins/izitoast'
import * as Sentry from '@sentry/browser'
import { Vue as VueIntegration } from '@sentry/integrations'

Sentry.init({
    dsn: 'https://2e3b1eb46ef44c88ad89b14aa7e0ae0a@o250330.ingest.sentry.io/5270119',
    integrations: [new VueIntegration({ Vue, attachProps: true })]
})


Vue.config.productionTip = false

Vue.use(VTooltip)

window.addEventListener('beforeunload', () => {
    return appStore.unsavedData
})

new Vue({
    router,
    store,
    vuetify,
    render: (h: CreateElement) => h(App)
}).$mount('#app')


onceStoreReady(() => {
    changeLanguage(configStore.language)

    // using deprecated methods because safari stinks
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addListener(e => {
            if (!configStore.followSystemDark) return
            configStore.merge({ dark: e.matches })
        })
    }
})
