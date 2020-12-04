import { VuexModule } from 'vuex-module-decorators'
import { LocalSharedMutation, VLocalModule } from '@/utils/vuex-sugar'
import { merge } from '@/utils/object-utils'
import { DataProviderName } from '@/api/providers'
import { TranslationPreferenceProperty } from '@/utils/user-preferences-utils'
import { Vue } from 'vue-property-decorator'
import { MediaType, NameMeta } from '@/types/media'
import { AnyKV } from '@/types'
import IndexedDBClient from '@/utils/indexed-db-client'
import { isLocalStorageSupported, nop } from '@/utils/helpers'
import { defaultProvider, shikimori } from '@/config'
import { defaultLanguage } from '@/utils/i18n'

const idb = new IndexedDBClient()

let defaultPlayersFilters: Record<string, true> = {}

if (!isLocalStorageSupported() || !('plashiki-local' in localStorage)) {
    defaultPlayersFilters['smotret-anime.online'] = true
}

let defaultLanguageFilters: Record<string, true> = {}

// if ((!isLocalStorageSupported() || !('plashiki-local' in localStorage)) && defaultLanguage !== 'ru') {
//     defaultLanguageFilters['ru'] = true
//     defaultLanguageFilters['by'] = true
//     defaultLanguageFilters['ua'] = true
// }

export type ListViewMode = 'cards' | 'items'
export type DrawerStyle = 'slim' | 'slim-no-hover' | 'normal'

@VLocalModule('ConfigModule')
export default class ConfigModule extends VuexModule {
    language = defaultLanguage

    // ui
    dark = false
    followSystemDark = true
    listViewMode: ListViewMode = 'cards'
    drawerStyle: DrawerStyle = 'slim'
    expandAllViewer = true
    hideSamePlayers = true
    highlightUnknownAuthor = false
    viewerTheaterMode = false
    sidebarVisible = true
    lightColors = {
        primary: '#1976D2',
        accent: '#82B1FF'
    }
    darkColors = {
        primary: '#2196F3',
        accent: '#FF4081'
    }
    reverseSortParts = false

    // data & api
    dataProvider: DataProviderName = defaultProvider
    apiTimeout = 10000
    shikimoriApiEndpoint = shikimori.endpoint
    connectionIndicator = false

    // logic
    preferredNameLanguage: Exclude<keyof NameMeta, 'other'> = defaultLanguage === 'ru' ? 'russian' : 'romaji'
    onlyOngoingsInRecent = true
    oneColumnInMediaList = false
    searchPresets: Record<string, AnyKV[]> = {}
    recentMedias = {
        anime: [] as number[],
        manga: [] as number[]
    }
    useSmartSorting = true

    // user preferences
    translationPreferenceOrder: TranslationPreferenceProperty[] = ['lang', 'kind', 'author', 'player']
    langPreferences: Record<string, number> = {}
    kindPreferences: Record<string, number> = {}
    authorPreferences: Record<string, number> = {}
    playerPreferences: Record<string, number> = {}

    lastAuthor: string | null = null
    lastKind = ''
    lastPlayer = ''

    // filtering in viewer. they do not interfere things above and do not affect sorting.
    languageFilters: Record<string, true | undefined> = defaultLanguageFilters
    playersFilters: Record<string, true | undefined> = defaultPlayersFilters

    // idk how to call it. basically key-value stuff
    components: Record<string, any> = {}

    @LocalSharedMutation()
    merge (data: Partial<ConfigModule>): void {
        merge(this, data)

        if (data.dataProvider) {
            idb.set('provider', data.dataProvider).catch(nop)
        }
    }

    @LocalSharedMutation()
    addRecentMedia (params: { type: MediaType, id: number }): void {
        let idx = this.recentMedias[params.type].indexOf(params.id)
        if (idx !== -1) {
            this.recentMedias[params.type].splice(idx, 1)
        }
        this.recentMedias[params.type].unshift(params.id)

        while (this.recentMedias[params.type].length > 50) {
            this.recentMedias[params.type].pop()
        }
    }

    @LocalSharedMutation()
    deleteRecentMedia (params: { type: MediaType, id: number }): void {
        let idx = this.recentMedias[params.type].indexOf(params.id)
        if (idx !== -1) {
            this.recentMedias[params.type].splice(idx, 1)
        }
    }

    @LocalSharedMutation()
    addSearchPreset (params: { provider: string, preset: AnyKV }): void {
        if (!this.searchPresets[params.provider]) {
            Vue.set(this.searchPresets, params.provider, [])
        }
        this.searchPresets[params.provider].push(params.preset)
    }

    @LocalSharedMutation()
    removeSearchPreset (params: { provider: string, uid: number }): void {
        if (!this.searchPresets[params.provider]) return
        this.searchPresets[params.provider] = this.searchPresets[params.provider].filter(i => i.uid !== params.uid)
    }

    @LocalSharedMutation()
    set<T extends keyof ConfigModule> (params: { key: T, value: ConfigModule[T] }): void {
        (this as ConfigModule)[params.key] = params.value
    }

    @LocalSharedMutation()
    setFilter (params: { type: 'language' | 'player', value: string, active: boolean }): void {
        let { type, value, active } = params

        let target = type === 'player' ? this.playersFilters : this.languageFilters
        if (active) {
            Vue.set(target, value, true)
        } else {
            Vue.delete(target, value)
        }
    }

    @LocalSharedMutation()
    clearFilters (): void {
        this.playersFilters = {}
        this.languageFilters = {}
    }
}
