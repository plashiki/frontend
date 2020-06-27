import { AnyKV } from '@/types'
import * as shikimori from './shikimori'
import { configStore } from '@/store'

export type DataProvider =
    | 'shikimori'
// more TBA

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isFeatureAvailable (provider: DataProvider, featureName: string, options?: AnyKV): boolean {
    return true
}

export function isFeatureAvailableNow (featureName: string, options?: AnyKV): boolean {
    return isFeatureAvailable(configStore.dataProvider, featureName, options)
}

export function getFeatureVar (provider: DataProvider, varName: string, options?: AnyKV): any {
    if (provider === 'shikimori') {
        return shikimori.getFeatureVar(varName, options)
    }
    return null
}

export function getFeatureVarNow (varName: string, options?: AnyKV): any {
    return getFeatureVar(configStore.dataProvider, varName, options)
}
