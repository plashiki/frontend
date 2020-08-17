import { IDataProvider } from '@/api/providers/types'
import {
    CalendarEntry,
    ExtendedMedia,
    Media,
    MediaGenre,
    MediaId,
    MediaType,
    MediaUpdate
} from '@/types/media'
import { PaginatedData } from '@/types/api'
import { UserRateStatus } from '@/types/user-rate'
import {
    shikimoriGetCalendar,
    shikimoriGetMediaInList,
    shikimoriGetMedias,
    shikimoriGetMediaUpdates,
    shikimoriGetOngoings,
    shikimoriGetPopularReleased,
    shikimoriGetRecommendations,
    shikimoriGetRelatedMedia,
    shikimoriGetSimilarMedia,
    shikimoriGetSingleMedia,
    shikimoriSearchByName
} from './methods'
import {
    shikimoriCalendarAdapter,
    shikimoriMediaAdapter,
} from './adapters'
import { isRussian } from '@/utils/i18n'
import { configStore } from '@/store'

export class ShikimoriDataProvider implements IDataProvider {
    recentlyUpdatedSearchParams = '%7B%22sortMode%22%3A%22aired_on%22%2C%22status%22%3A%5B%22ongoing%22%5D%7D'
    topOngoingsSearchParams = '%7B%22sortMode%22%3A%22ranked%22%2C%22status%22%3A%5B%22ongoing%22%5D%7D'
    topReleasedSearchParams = '%7B%22sortMode%22%3A%22ranked%22%2C%22status%22%3A%5B%22released%22%5D%7D'
    isMalId = true
    hasRecommendations = true

    getUrlByMediaId (mediaType: MediaType, mediaId: MediaId): string {
        return `https://shikimori.one/${mediaType}s/${mediaId}?ignore302=1`
    }

    getMediaUrlPrefix (mediaType: MediaType): string {
        return `https://shikimori.one/${mediaType}s/`
    }

    getGenreSearchParams (genre: MediaGenre): string {
        return `%7B%22genre%22%3A%5B${genre.id}%5D%7D`
    }

    getMalId (id: MediaId, type: MediaType): Promise<number> {
        return Promise.resolve(id as number)
    }

    async getCalendar (type: MediaType, from?: any): Promise<PaginatedData<CalendarEntry>> {
        if (type !== 'anime') return { items: [] }
        return {
            items: await shikimoriGetCalendar().then(res => res.map(it => shikimoriCalendarAdapter(it)))
        }
    }

    async getMediaInList (status: UserRateStatus, type: MediaType, from = 1): Promise<PaginatedData<Media>> {
        const items = await shikimoriGetMediaInList(status, type, from)
        return {
            items: items.map(it => shikimoriMediaAdapter(it)),
            next: items.length ? from + 1 : null
        }
    }

    getMediaUpdates (type: MediaType, from?: any): Promise<PaginatedData<MediaUpdate>> {
        return shikimoriGetMediaUpdates(type).then(res => ({ items: res }))
    }

    getMediasByIds (ids: MediaId[], type: MediaType): Promise<Media[]> {
        return shikimoriGetMedias(ids, type).then(res => res.map(it => shikimoriMediaAdapter(it)))
    }

    async getOngoings (type: MediaType, from = 1): Promise<PaginatedData<Media>> {
        const items = await shikimoriGetOngoings(type, from)
        return {
            items: items.map(it => shikimoriMediaAdapter(it)),
            next: items.length ? from + 1 : null
        }
    }

    async getPopularReleased (type: MediaType, from = 1): Promise<PaginatedData<Media>> {
        const items = await shikimoriGetPopularReleased(type, from)
        return {
            items: items.map(it => shikimoriMediaAdapter(it)),
            next: items.length ? from + 1 : null
        }
    }

    async getRecommendations (type: MediaType, from = 1): Promise<PaginatedData<Media>> {
        const items = await shikimoriGetRecommendations(type, from)
        return {
            items: items.map(it => shikimoriMediaAdapter(it)),
            next: items.length ? from + 1 : null
        }
    }

    getSingleMedia (id: MediaId, type: MediaType): Promise<Media | null> {
        return shikimoriGetSingleMedia(id, type).then(it => it ? shikimoriMediaAdapter(it) : null)
    }

    getSingleExtendedMedia (id: MediaId, type: MediaType): Promise<ExtendedMedia | null> {
        return Promise.all([
            // damm, i wish shiki had graphql api
            shikimoriGetSingleMedia(id, type),
            shikimoriGetRelatedMedia(id, type),
            shikimoriGetSimilarMedia(id, type),
            // shikimoriGetVideos(id, type),
            // shikimoriGetScreenshots(id, type),
            // shikimoriGetRoles(id, type)
        ]).then(([media, related, similar, /* videos, screenshots, roles */]) => {
            if (media === null) return null
            let ret: ExtendedMedia = shikimoriMediaAdapter(media)

            ret.related = related?.map((it) => {
                let ret = shikimoriMediaAdapter(it.anime || it.manga!)
                ret.statusText = isRussian(configStore.language) ? it.relation_russian : it.relation
                return ret
            })
            ret.similar = similar?.map(it => shikimoriMediaAdapter(it))
            // ret.videos = videos?.map(it => shikimoriVideoAdapter(it))
            // ret.screenshots = screenshots?.map(it => shikimoriImageAdapter(it)).filter(i => i !== undefined) as ImageMeta[]
            // ret.characters = roles?.filter(it => it.character && it.roles.indexOf('Main') > -1).map(it => shikimoriPersonAdapter(it.character!))

            return ret
        })
    }

    async searchByName (input: string, type: MediaType, from = 1): Promise<PaginatedData<Media>> {
        const items = await shikimoriSearchByName(input, type, from)
        return {
            items: items.map(it => shikimoriMediaAdapter(it)),
            next: items.length ? from + 1 : null
        }
    }
}
