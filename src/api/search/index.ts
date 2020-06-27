import { Vue, VueConstructor } from 'vue/types/vue'
import { Pagination } from '@/types/api'
import { Media, MediaType } from '@/types/media'
import { DataProvider } from '@/api/providers'
import { ShikimoriSearchProvider } from '@/api/search/shikimori'
import { configStore } from '@/store'
import { AnyKV } from '@/types'
import { Route } from 'vue-router'

export interface ISearchProvider {
    filterComponent (): VueConstructor | null

    // should return items for given pagination and whether there are more items available
    execute (text: string, mediaType: MediaType, pagination: Pagination, vue: Vue, sort: string): Promise<[Media[], boolean]>

    // should return list of sorting options. text will be $t()-ed, value will be passed as `sort` param.
    // icon is optional but when some have and some dont it looks weird.
    sorters (): {
        text: string
        value: string
        icon?: string
    }[]

    getDefaultPresets ($route: Route): (AnyKV & { sortMode: string, name: string })[]

    getCurrentFilters (vue: Vue): AnyKV

    applyPreset (preset: AnyKV & { sortMode: string }, vue: Vue): void
}

let providersCache: Partial<Record<DataProvider, ISearchProvider>> = {}

export function getSearchProvider (dataProvider: DataProvider): ISearchProvider {
    if (providersCache[dataProvider]) return providersCache[dataProvider]!

    if (dataProvider === 'shikimori') providersCache[dataProvider] = new ShikimoriSearchProvider()

    if (providersCache[dataProvider]) return providersCache[dataProvider]!

    throw new Error('UNKNOWN_PROVIDER')
}

export function getSearchProviderNow (): ISearchProvider {
    return getSearchProvider(configStore.dataProvider)
}
