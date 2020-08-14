import { configStore } from '@/store'
import { IDataProvider } from '@/api/providers/types'
import { ShikimoriDataProvider } from './shikimori'
import { Constructor } from 'vue/types/options'

export type DataProviderName =
    | 'shikimori'
// more TBA

const providersRegistry: Record<DataProviderName, IDataProvider | Constructor> = {
    shikimori: ShikimoriDataProvider
}

export function getProvider (providerName: DataProviderName): IDataProvider {
    if (typeof providersRegistry[providerName] === 'function') {
        providersRegistry[providerName] = new (providersRegistry[providerName] as Constructor)()
    }
    return providersRegistry[providerName] as IDataProvider
}

export function getProviderNow () {
    return getProvider(configStore.dataProvider)
}
