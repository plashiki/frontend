import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import AppModule from '@/store/app'
import ConfigModule from '@/store/config'
import AuthModule from '@/store/auth'
import CacheModule from '@/store/cache'
import NotificationsModule from '@/store/notifications'
import { getModule } from 'vuex-module-decorators'
import createMutationsSharer, {
    BroadcastChannelStrategy,
    LocalStorageStratery,
    SharedMutationStrategy
} from 'vuex-shared-mutations'
import { localModules, localMutations, sharedMutations } from '@/utils/vuex-sugar'
import VuexPersistence from 'vuex-persist'
import { isLocalStorageSupported } from '@/utils/helpers'

Vue.use(Vuex)

export let appStore: AppModule
export let configStore: ConfigModule
export let authStore: AuthModule
export let cacheStore: CacheModule
export let notificationsStore: NotificationsModule

let registerListeners: Function[] = []
let storeReady = false

function initializeModules (store: Store<any>): void {
    appStore = getModule(AppModule, store)
    configStore = getModule(ConfigModule, store)
    authStore = getModule(AuthModule, store)
    cacheStore = getModule(CacheModule, store)
    notificationsStore = getModule(NotificationsModule, store)

    registerListeners.forEach(it => it())
    registerListeners = []
    storeReady = true
}

export function onceStoreReady (listener: Function): void {
    if (storeReady) listener()
    else registerListeners.push(listener)
}

const sharingIsCaring = (store: Store<any>): void => {
    let strategy: SharedMutationStrategy
    if (BroadcastChannelStrategy.available()) {
        strategy = new BroadcastChannelStrategy({
            key: 'plashiki-mutations'
        })
    } else if (isLocalStorageSupported()) {
        strategy = new LocalStorageStratery({
            key: 'plashiki-mutations'
        })
    } else {
        return
    }

    createMutationsSharer({
        strategy,
        predicate (mut): boolean {
            return sharedMutations.indexOf(mut.type) > -1
        }
    })(store)
}
const storage = (store: Store<any>): void => {
    if (!isLocalStorageSupported()) return

    const vuexLocal = new VuexPersistence<any>({
        storage: window.localStorage,
        key: 'plashiki-local',
        reducer: (state: any): any => {
            let ret: any = {}
            localModules.forEach(i => ret[i] = state[i])
            return ret
        },
        filter: (mutation): any => localMutations.indexOf(mutation.type) > -1
    })

    vuexLocal.plugin(store)
}

export default new Vuex.Store({
    plugins: [initializeModules, sharingIsCaring, storage],
    modules: {
        AppModule,
        ConfigModule,
        AuthModule,
        CacheModule,
        NotificationsModule
    }
})
