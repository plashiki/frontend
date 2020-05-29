import Vue, { CreateElement } from 'vue'
import App from './App.vue'
import './register-sw'
import './plugins/firebase'
import './plugins/responsiveness'
import './plugins/vue-i18n'
import router from './router'
import store, { appStore } from './store'
import vuetify from './plugins/vuetify'
import { initApi } from '@/api'
import VTooltip from 'v-tooltip'
import './plugins/izitoast'

Vue.config.productionTip = false

initApi()

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
