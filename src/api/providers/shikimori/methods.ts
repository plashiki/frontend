import { AnyKV } from '@/types'
import { MediaId, MediaType, MediaUpdate } from '@/types/media'
import {
    ShikimoriAnime,
    ShikimoriBriefAnime,
    ShikimoriBriefManga,
    ShikimoriBriefMedia,
    ShikimoriCalendarEntry, ShikimoriImage,
    ShikimoriManga, ShikimoriRelation, ShikimoriRole,
    ShikimoriUser, ShikimoriVideo
} from './types'
import { ApiException, Pagination } from '@/types/api'
import { UserRateStatus } from '@/types/user-rate'
import { getUserRates } from '@/api/user-rates'
import { createIndex } from '@/utils/object-utils'
import { shikimoriApi } from './network'
import { shikimoriMediaAdapter, shikimoriUserRateStatusAdapter } from './adapters'

export function shikimoriGetMediasWithParams (params: AnyKV, type: MediaType, needAuth = false): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriApi({
        endpoint: `/${type}s`,
        query: params,
        needAuth
    })
}

export function shikimoriGetMedias (ids: MediaId[], type: MediaType): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        ids: ids.join(','),
        limit: ids.length
    }, type)
}

export function shikimoriSearchByName (input: string, type: MediaType, page = 1): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        search: input,
        page,
        limit: 35
    }, type)
}

export function shikimoriGetSingleMedia (id: MediaId, type: MediaType): Promise<ShikimoriAnime | ShikimoriManga | null> {
    return shikimoriApi<any>({
        endpoint: `/${type}s/${id}`
    }).catch(() => null)
}

export function shikimoriGetRelatedMedia (id: MediaId, type: MediaType): Promise<ShikimoriRelation[]> {
    return shikimoriApi<any>({
        endpoint: `/${type}s/${id}/related`
    }).catch(() => null)
}

export function shikimoriGetSimilarMedia (id: MediaId, type: MediaType): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriApi<any>({
        endpoint: `/${type}s/${id}/similar`
    }).catch(() => null)
}

export function shikimoriGetVideos (id: MediaId, type: MediaType): Promise<ShikimoriVideo[]> {
    return shikimoriApi<any>({
        endpoint: `/${type}s/${id}/videos`
    }).catch(() => null)
}

export function shikimoriGetScreenshots (id: MediaId, type: MediaType): Promise<ShikimoriImage[]> {
    return shikimoriApi<any>({
        endpoint: `/${type}s/${id}/screenshots`
    }).catch(() => null)
}

export function shikimoriGetRoles (id: MediaId, type: MediaType): Promise<ShikimoriRole[]> {
    return shikimoriApi<any>({
        endpoint: `/${type}s/${id}/roles`
    }).catch(() => null)
}

export function shikimoriGetOngoings (type: MediaType, page = 1): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        status: 'ongoing',
        order: 'popularity',
        page,
        limit: 20
    }, type)
}

export function shikimoriGetPopularReleased (type: MediaType, page = 1): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        status: 'released',
        order: 'popularity',
        page,
        limit: 20
    }, type)
}

export function shikimoriGetCalendar (): Promise<ShikimoriCalendarEntry[]> {
    return shikimoriApi({
        endpoint: '/calendar'
    })
}

export function shikimoriGetMediaInList (status: UserRateStatus, type: MediaType, page = 1): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        mylist: shikimoriUserRateStatusAdapter(status),
        page,
        limit: 25
    }, type, true)
}

export function shikimoriGetMediaUpdates (type: MediaType): Promise<MediaUpdate[]> {
    return Promise.all([
        shikimoriGetMediasWithParams({
            mylist: 'watching',
            status: 'ongoing',
            limit: 9999
        }, type, true),
        getUserRates({
            target_type: type,
            status: UserRateStatus.InProgress
        })
    ]).then(([medias, rates]) => {
        let index = createIndex(medias, 'id')
        return rates.filter((it) => {
            let m = index[it.target_id]
            return m && (m as ShikimoriBriefAnime).episodes_aired > it.parts
        }).map((it) => ({
            media: shikimoriMediaAdapter(index[it.target_id]),
            part: (index[it.target_id] as ShikimoriBriefAnime).episodes_aired - it.parts
        }))
    })
}

export function shikimoriGetRecommendations (mediaType: MediaType, page = 1): Promise<ShikimoriBriefAnime[]> {
    let pageString = ''
    if (page != 1) {
        pageString = '/page/' + page
    }

    return shikimoriApi({
        endpoint: `/recommendations/${mediaType}/pearson_z/20000${pageString}`,
        api: false,
        needAuth: true
    }).then((obj: any) => {
        if (obj.page > obj.pages_count) return []

        const parser = new DOMParser()
        const doc = parser.parseFromString(obj.content, 'application/xml')

        if (doc.querySelector('.b-nothing_here')) return []
        if (!doc.querySelector('.b-catalog_entry')) {
            throw new ApiException('RECOMMENDATIONS_NOT_READY')
        }

        const getPath = (u: string | undefined) => {
            if (!u) return ''

            let a = new URL(u)
            return a.pathname + a.search
        }

        let medias = Array.from(doc.querySelectorAll('.b-catalog_entry')).map(n => {
            let ret = {} as ShikimoriBriefMedia

            ret.id = parseInt(n.attributes.getNamedItem('id')?.value ?? '')
            if (isNaN(ret.id)) {
                throw new ApiException('HTML_PARSE_FAILED')
            }

            ret.url = getPath(n.querySelector('.anime-tooltip')?.attributes.getNamedItem('href')?.value)
            if (!ret.url) {
                throw new ApiException('HTML_PARSE_FAILED')
            }

            let img = n.querySelector('img')
            let srcset: string | undefined =
                // help
                img?.attributes.getNamedItem('srcset')?.value?.split(', ').pop()?.split(' ').shift()
            ret.image = {
                preview: getPath(img?.attributes.getNamedItem('src')?.value),
                original: srcset ? getPath(srcset) : ''
            }
            if (!ret.image.original) {
                ret.image.original = ret.image.preview
            }

            let nameEl = n.querySelector('.name-ru')
            if (nameEl) {
                let ru = nameEl.innerHTML || nameEl.attributes.getNamedItem('data-text')?.value
                if (!ru) {
                    throw new ApiException('HTML_PARSE_FAILED')
                }
                ret.russian = ru
            }
            nameEl = n.querySelector('.name-en')
            if (nameEl) {
                let en = nameEl.innerHTML || nameEl.attributes.getNamedItem('data-text')?.value
                if (!en) {
                    throw new ApiException('HTML_PARSE_FAILED')
                }
                ret.name = en
            }

            // forcing media type
            if (mediaType === 'anime') (ret as ShikimoriBriefAnime).episodes = 0
            else (ret as ShikimoriBriefManga).volumes = 0

            return ret
        })

        return medias as any
    })
}


export function shikimoriGetUser (id: number): Promise<ShikimoriUser> {
    return shikimoriApi({
        endpoint: '/users/' + id
    })
}
