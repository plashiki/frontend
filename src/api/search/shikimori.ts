import { ISearchProvider } from '@/api/search/index'
import { Media, MediaType } from '@/types/media'
import { Vue, VueConstructor } from 'vue/types/vue'
import { PaginatedData } from '@/types/api'
import ShikimoriFilters from '@/components/search/ShikimoriFilters.vue'
import { AnyKV } from '@/types'
import { mergeClone, shallowCloneAndTransform } from '@/utils/object-utils'
import { shikimoriGetMediasWithParams } from '@/api/providers/shikimori/methods'
import { shikimoriMediaAdapter } from '@/api/providers/shikimori/adapters'

export interface ShikimoriFiltering {
    kind: string[]
    status: string[]
    season: string[]
    score: number
    duration: string[]
    rating: string[]
    genre: string[]
    mylist: string[]

    /* injected by provider */
    order?: string
    search?: string
}

export const emptyShikimoriFilters: ShikimoriFiltering = {
    kind: [],
    status: [],
    season: [],
    score: 0,
    duration: [],
    rating: [],
    genre: [],
    mylist: []
}

export class ShikimoriSearchProvider implements ISearchProvider {
    filterComponent (): VueConstructor | null {
        return ShikimoriFilters
    }

    sorters (): { text: string, value: string, icon?: string }[] {
        return [
            {
                text: 'Pages.Search.Sort.ByScore',
                value: 'ranked',
                icon: 'mdi-star-circle-outline'
            },
            {
                text: 'Pages.Search.Sort.ByPopularity',
                value: 'popularity',
                icon: 'mdi-podium'
            },
            {
                text: 'Pages.Search.Sort.ByPartCount',
                value: 'episodes',
                icon: 'mdi-folder-clock-outline'
            },
            {
                text: 'Pages.Search.Sort.ByReleaseDate',
                value: 'aired_on',
                icon: 'mdi-calendar'
            },
            {
                text: 'Pages.Search.Sort.ByName',
                value: 'name',
                icon: 'mdi-sort-alphabetical-ascending-variant'
            },
            {
                text: 'Pages.Search.Sort.Random',
                value: 'random',
                icon: 'mdi-dice-multiple-outline'
            }
        ]
    }

    getDefaultPresets (): (AnyKV & { sortMode: string, name: string })[] {
        return [
            {
                sortMode: 'ranked',
                name: 'Pages.Search.Popular',
                $t: true
            },
            {
                sortMode: 'ranked',
                name: 'Pages.Search.Ongoings',
                $t: true,
                status: ['ongoing']
            },
            {
                sortMode: 'ranked',
                name: 'Pages.Search.Latest',
                $t: true,
                status: ['latest']
            }
        ]
    }

    execute (text: string, mediaType: MediaType, vue: Vue, sort: string, from?: any): Promise<PaginatedData<Media>> {
        let params: Partial<ShikimoriFiltering> = {}

        if (vue) {
            // much wow
            params = shallowCloneAndTransform((vue as any).filters, {
                condition: (k, v) => {
                    if (!v) return false
                    if (Array.isArray(v) && v.length === 0) return false

                    return true
                },
                transformer: (k, v) => {
                    if (k === 'score') return v * 2
                    if (Array.isArray(v)) return v.join(',')

                    return v
                }
            })
        }

        if (text) {
            params.search = text
        }

        params.order = sort

        return shikimoriGetMediasWithParams({
            ...params,
            page: from ?? 1,
            limit: 30
        }, mediaType, (params.mylist?.length ?? 0) > 0)
            .then(i => ({
                items: i.map(shikimoriMediaAdapter),
                next: i.length > 0 ? (from ?? 1) + 1 : null
            }))
    }

    getCurrentFilters (vue: Vue): AnyKV {
        return shallowCloneAndTransform((vue as any).filters, {
            condition: (k, v) => {
                if (!v) return false
                if (Array.isArray(v) && v.length === 0) return false

                return true
            }
        })
    }

    applyPreset (preset: AnyKV, vue: Vue): { sortMode: string } {
        (vue as any).filters = mergeClone(emptyShikimoriFilters, preset)

        return { sortMode: preset.sort ?? 'ranked' }
    }
}
