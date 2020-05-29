import * as qs from 'querystring'
import { isProduction } from '@/config'
import { DEBUG } from '@/utils/debug'
import axios from 'axios'
import { configStore } from '@/store'
import { createIndex, isPojo } from '@/utils/object-utils'
import { AnyKV } from '@/types'
import { CalendarEntry, Media, MediaGenre, MediaId, MediaStatus, MediaType, MediaUpdate } from '@/types/media'
import { ApiException, Pagination } from '@/types/api'
import { makeApiRequest } from '@/api'
import { UserRateStatus } from '@/types/user-rate'
import { UserRateToShikimoriStatusAdapter } from '@/constants/shikimori'
import { getUserRates } from '@/api/user-rates'
import {
    ShikimoriAnime,
    ShikimoriBriefAnime,
    ShikimoriBriefManga,
    ShikimoriBriefMedia,
    ShikimoriCalendarEntry,
    ShikimoriGenre,
    ShikimoriManga,
    ShikimoriMedia,
    ShikimoriUser
} from '@/types/shikimori'

const VARS: Record<string, any> = {
    RecentlyUpdatedSearchParams: '%7B%22sortMode%22%3A%22aired_on%22%2C%22status%22%3A%5B%22ongoing%22%5D%7D',
    TopOngoingsSearchParams: '%7B%22sortMode%22%3A%22ranked%22%2C%22status%22%3A%5B%22ongoing%22%5D%7D',
    TopReleasedSearchParams: '%7B%22sortMode%22%3A%22ranked%22%2C%22status%22%3A%5B%22released%22%5D%7D',
    IsMALId: true
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getFeatureVar (varName: string, options?: AnyKV): any {
    if (varName in VARS) {
        return VARS[varName]
    }
    if (varName === 'MediaByIdPrefix') {
        return 'https://shikimori.one/' + options?.mediaType + 's/'
    }
    if (varName === 'UrlByMediaId') {
        return `https://shikimori.one/${options?.mediaType}s/${options?.mediaId}?ignore302=1`
    }
    if (varName === 'GenreSearchParams') {
        return `%7B%22genre%22%3A%5B${options!.genre.id}%5D%7D`
    }
    return null
}

export interface ShikimoriApiCallParams {
    endpoint: string
    httpMethod?: string
    params?: AnyKV
    query?: AnyKV
    body?: AnyKV | string
    api?: false

    needAuth?: boolean
}

export class ShikimoriApiError extends ApiException {
    constructor (code: number | string, message?: string) {
        super('SHIKIMORI_ERROR', `${code}:${message ?? ''}`)
    }
}

export async function shikimoriApi<T> (
    params: ShikimoriApiCallParams
): Promise<T> {
    if (params.needAuth) {
        return makeApiRequest({
            path: '/v2/auth/proxy/shikimori',
            body: params
        })
    }

    let url = configStore.shikimoriApiEndpoint

    url += params.endpoint

    // __=/autocomplete is a ratelimit bypass xdd
    // https://github.com/shikimori/shikimori/blob/master/config/initializers/rack-attack.rb#L31
    // morr plz leave this as a feature, lol


    if (params.query) {
        url += '?' + qs.stringify(params.query) + '&__=/autocomplete'
    } else {
        url += '?__=/autocomplete'
    }

    let headers: AnyKV = {}

    if (!isProduction) {
        DEBUG.prov(`>>> (SHIKI): ${params.httpMethod ?? 'GET'} ${url}`, params.body)
    }

    if (params.body && params.body !== 'string') {
        headers['Content-Type'] = 'application/json'
        params.body = JSON.stringify(params.body)

    }

    const r = await axios({
        url,
        method: params.httpMethod ?? 'GET' as any,
        timeout: configStore.apiTimeout,
        data: params.body,
        responseType: 'text',
        validateStatus: null as any
    })

    // very uniform api, much handle
    if (r.status >= 400) {
        throw new ShikimoriApiError(r.status, r.data)
    }

    if (!isPojo(r.data) && !Array.isArray(r.data)) {
        try {
            r.data = JSON.parse(r.data)
        } catch (e) {
            throw new ShikimoriApiError(500, 'Invalid JSON response')
        }
    }

    if (!isProduction) {
        DEBUG.prov(`<<< (SHIKI): ${params.httpMethod ?? 'GET'} ${url}`, r.data)
    }

    if (isPojo(r.data)) {
        if ('code' in r.data && 'message' in r.data) {
            throw new ShikimoriApiError(r.data.code, r.data.message)
        }

        if ('error' in r.data) {
            throw new ShikimoriApiError(r.data.error, r.data.error_description)
        }
    }

    return r.data
}

export function shikimoriMediaAdapter (input: ShikimoriBriefAnime | ShikimoriBriefManga | ShikimoriAnime | ShikimoriManga): Media {
    let ret: Partial<Media> = {}
    let brief = input as ShikimoriBriefManga | ShikimoriBriefAnime
    ret.id = ret.malId = brief.id
    if (!brief.image.original.match(/missing_original\.jpg/)) {
        ret.poster = {
            small: 'https://shikimori.one' + brief.image.preview,
            large: 'https://shikimori.one' + brief.image.original
        }
    }
    ret.url = 'https://shikimori.one' + brief.url
    ret.name = {
        russian: brief.russian,
        romaji: brief.name
    }
    ret.releaseType = brief.kind as any
    ret.score = parseFloat(brief.score)

    if (brief.status === 'ongoing') ret.status = MediaStatus.Ongoing
    if (brief.status === 'released') ret.status = MediaStatus.Released
    if (brief.status === 'anons') ret.status = MediaStatus.Announced

    try {
        ret.year = new Date(brief.released_on ?? brief.aired_on as any).getFullYear()
    } catch (e) {
        //
    }

    if ((brief as any).volumes !== undefined) {
        let manga = brief as ShikimoriBriefManga
        ret.type = 'manga'
        ret.partsCount = manga.chapters
    }
    if ((brief as any).episodes !== undefined) {
        let anime = brief as ShikimoriBriefAnime
        ret.type = 'anime'
        ret.partsCount = anime.episodes
        ret.partsAired = anime.episodes_aired
    }
    if ((brief as any).description !== undefined) {
        let media = input as ShikimoriMedia
        ret.description = media.description
        ret.name.english = media.english[0]
        ret.name.japanese = media.japanese[0]

        if ((media as any).studios !== undefined) {
            let anime = input as ShikimoriAnime
            ret.studio = anime.studios[0]?.name
        }
        if ((media as any).publishers !== undefined) {
            let manga = input as ShikimoriManga
            ret.studio = manga.publishers[0]?.name
        }

        ret.genres = media.genres.map((it: ShikimoriGenre): MediaGenre => ({
            id: it.id,
            name: 'Genres.' + it.name
        }))
    } else {
        ret.moreData = true
    }

    return ret as Media
}

export function shikimoriPaginationAdapter (pagination?: Pagination): any {
    if (!pagination) return {}
    return {
        page: (pagination.offset ?? 0) / (pagination.limit ?? 1) + 1,
        limit: pagination.limit
    }
}

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

export function shikimoriSearchByName (input: string, type: MediaType, pagination?: Pagination): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        search: input,
        ...shikimoriPaginationAdapter(pagination)
    }, type)
}

export function shikimoriGetSingleMedia (id: MediaId, type: MediaType): Promise<ShikimoriAnime | ShikimoriManga | null> {
    return shikimoriApi<any>({
        endpoint: `/${type}s/${id}`
    }).catch(() => null)
}

export function shikimoriGetOngoings (type: MediaType, pagination?: Pagination): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        status: 'ongoing',
        order: 'popularity',
        ...shikimoriPaginationAdapter(pagination)
    }, type)
}

export function shikimoriGetPopularReleased (type: MediaType, pagination?: Pagination): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        status: 'released',
        order: 'popularity',
        ...shikimoriPaginationAdapter(pagination)
    }, type)
}

export function shikimoriCalendarAdapter (item: ShikimoriCalendarEntry): CalendarEntry {
    return {
        ts: new Date(item.next_episode_at),
        part: item.next_episode,
        media: shikimoriMediaAdapter(item.anime)
    }
}

export function shikimoriGetCalendar (): Promise<ShikimoriCalendarEntry[]> {
    return shikimoriApi({
        endpoint: '/calendar'
    })
}

export function shikimoriGetMediaInList (status: UserRateStatus, type: MediaType, pagination: Pagination): Promise<(ShikimoriBriefAnime | ShikimoriBriefManga)[]> {
    return shikimoriGetMediasWithParams({
        mylist: UserRateToShikimoriStatusAdapter[status],
        ...(shikimoriPaginationAdapter(pagination))
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

export function shikimoriGetRecommendations (mediaType: MediaType, pagination: Pagination): Promise<ShikimoriBriefAnime[]> {
    let page = ''
    if (pagination.limit && pagination.offset) {
        let n = ~~(pagination.offset / pagination.limit)
        if (n > 0) {
            page = '/page/' + n
        }
    }

    return shikimoriApi({
        endpoint: `/recommendations/${mediaType}/pearson_z/20000${page}`,
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
