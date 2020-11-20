import { Vue, VueConstructor } from 'vue/types/vue'
import { PaginatedData } from '@/types/api'
import { Media, MediaType } from '@/types/media'
import { ShikimoriSearchProvider } from '@/api/search/shikimori'
import { configStore } from '@/store'
import { AnyKV } from '@/types'
import { Route } from 'vue-router'
import { DataProviderName } from '@/api/providers'

export interface ISearchProvider {
    filterComponent (): VueConstructor | null

    /** should return items and control pagination just like {@link IDataProvider} */
    execute (text: string, mediaType: MediaType, vue: Vue, sort: string, from?: any): Promise<PaginatedData<Media>>

    /**
     * should return list of sorting options. text will be $t()-ed, value will be passed as `sort` param.
     * icon is optional but when some have and some dont it looks weird.
     */
    sorters (): {
        text: string
        value: string
        icon?: string
    }[]

    getDefaultPresets ($route: Route): (AnyKV & { sortMode: string, name: string })[]

    getCurrentFilters (vue: Vue): AnyKV

    applyPreset (preset: AnyKV, vue: Vue): { sortMode: string }
}

let providersCache: Partial<Record<DataProviderName, ISearchProvider>> = {}

export function getSearchProvider (dataProvider: DataProviderName): ISearchProvider {
    if (providersCache[dataProvider]) return providersCache[dataProvider]!

    if (dataProvider === 'shikimori') providersCache[dataProvider] = new ShikimoriSearchProvider()

    if (providersCache[dataProvider]) return providersCache[dataProvider]!

    throw new Error('UNKNOWN_PROVIDER')
}

export function getSearchProviderNow (): ISearchProvider {
    return getSearchProvider(configStore.dataProvider)
}
