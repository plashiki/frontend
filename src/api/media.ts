import { cacheStore, configStore } from '@/store'
// i realized it could be done with OOP only after ive done a lot of stuff..
// idk this should be refactored, but leaving as is for now..
import {
    shikimoriCalendarAdapter,
    shikimoriGetCalendar,
    shikimoriGetMediaInList,
    shikimoriGetMedias,
    shikimoriGetMediaUpdates,
    shikimoriGetOngoings,
    shikimoriGetPopularReleased,
    shikimoriGetRecommendations,
    shikimoriGetSingleMedia,
    shikimoriMediaAdapter,
    shikimoriSearchByName
} from '@/api/providers/shikimori'
import { makeApiRequest } from '@/api/index'
import { isFeatureAvailable } from '@/api/providers'
import { createIndex, uniqueBy } from '@/utils/object-utils'
import { ApiException, Pagination } from '@/types/api'
import { CalendarEntry, Media, MediaId, MediaStatus, MediaType, MediaUpdate } from '@/types/media'
import { TranslationUpdate } from '@/types/translation'
import { UserRateStatus } from '@/types/user-rate'

export function getMediaFromCache (id: MediaId, type: MediaType): Media | null {
    const data = cacheStore.media[`${type}:${id}`]
    if (!data) return null
    const [item, expires] = data
    if (expires < Date.now()) {
        cacheStore.deleteMediaFromCache(item.id, item.type)
        return null
    }
    return item
}

export function getMediaNamesFromCache (id: MediaId, type: MediaType): Media['name'] | null {
    const data = cacheStore.mediaNames[`${type}:${id}`]
    if (!data) return null
    const [item, expires] = data
    if (expires < Date.now()) {
        cacheStore.deleteMediaFromCache(id, type)
        return null
    }
    return item
}

/**
 * Should provide AT LEAST basic info (name(s), poster, id)
 *
 * @param ids
 * @param type
 */
export async function getMedias (ids: MediaId[], type: 'anime' | 'manga'): Promise<Media[]> {
    if (!ids.length) return []

    const provider = configStore.dataProvider

    let ret: Media[] = []

    let uncachedIds: MediaId[] = []
    let uncachedIdsIndex: Record<MediaId, number> = {}

    ids.forEach((id, i) => {
        let item = getMediaFromCache(id, type)
        if (item !== null) {
            ret[i] = item
        } else {
            uncachedIds.push(id)
            uncachedIdsIndex[id] = i
        }
    })

    if (uncachedIds.length) {
        let items: Media[] = []
        if (provider === 'shikimori') {
            items = await shikimoriGetMedias(uncachedIds, type).then(i => i.map(shikimoriMediaAdapter))

        }

        items.forEach((it: Media) => {
            if (!it.moreData) {
                cacheStore.putMediaInCache(it)
            }

            cacheStore.putMediaNamesInCache(it)

            ret[uncachedIdsIndex[it.id]] = it
        })
    }

    return ret
}

export async function getMediaNames (ids: MediaId[], type: MediaType): Promise<Record<MediaId, Media['name']>> {
    if (!ids.length) return {}

    const provider = configStore.dataProvider

    let ret: Record<MediaId, Media['name']> = {}
    let uncached: MediaId[] = []

    ids.forEach((id) => {
        let cached = getMediaNamesFromCache(id, type)
        if (cached) {
            ret[id] = cached
        } else {
            uncached.push(id)
        }
    })

    if (uncached.length) {
        let medias: Media[] = []

        if (provider === 'shikimori') {
            medias = await shikimoriGetMedias(uncached, type).then(i => i.map(shikimoriMediaAdapter))
        }

        medias.forEach((media) => {
            ret[media.id] = media.name

            cacheStore.putMediaNamesInCache(media)
        })

    }

    return ret
}

export async function getSingleMedia (id: MediaId, type: MediaType): Promise<Media | null> {
    const provider = configStore.dataProvider

    let cached = getMediaFromCache(id, type)
    if (cached) {
        return cached
    }

    let media: Media | null = null

    if (provider === 'shikimori') {
        media = await shikimoriGetSingleMedia(id, type).then(i => i ? shikimoriMediaAdapter(i) : i)
    }

    if (media) {
        if (!media.moreData) {
            cacheStore.putMediaInCache(media)
        }
        cacheStore.putMediaNamesInCache(media)
    }

    return media
}

export async function searchMediaByName (input: string, type: MediaType, pagination?: Pagination): Promise<Media[]> {
    const provider = configStore.dataProvider

    if (provider === 'shikimori') {
        return shikimoriSearchByName(input, type, pagination).then(i => i.map(shikimoriMediaAdapter))
    }

    return []
}

/**
 * Returns list of mal anime ids which translations were recently updated
 * and filters ongoings from those if possible/wanted.
 */
export async function getRecentUpdates (type: MediaType): Promise<TranslationUpdate[]> {
    let updates = await makeApiRequest<TranslationUpdate[]>({
        path: `/v2/translations/${type}/recent`
    })

    const provider = configStore.dataProvider
    const medias = await getMedias(uniqueBy(updates.map(i => i.target_id)), type)
    const index = createIndex(medias, 'id')
    updates = updates.map(it => {
        it.media = index[it.target_id]
        return it
    }).filter(i => !!i.media)

    if (configStore.onlyOngoingsInRecent && isFeatureAvailable(provider, 'MediaStatusInBatch', { type })) {
        updates = updates.filter(i => index[i.target_id].status === MediaStatus.Ongoing)
    }

    return updates
}

export async function getOngoings (type: MediaType, pagination?: Pagination): Promise<Media[]> {
    const provider = configStore.dataProvider
    if (provider === 'shikimori') {
        return shikimoriGetOngoings(type, pagination).then(i => i.map(shikimoriMediaAdapter))
    }

    return []
}

export async function getPopularReleased (type: MediaType, pagination?: Pagination): Promise<Media[]> {
    const provider = configStore.dataProvider
    if (provider === 'shikimori') {
        return shikimoriGetPopularReleased(type, pagination).then(i => i.map(shikimoriMediaAdapter))
    }

    return []
}

export async function lookupMalId (providerId: MediaId, mediaType: MediaType): Promise<number> {
    const provider = configStore.dataProvider
    if (provider === 'shikimori') {
        return providerId as number
    }
    throw new ApiException('NO_MAL_ID')
}

export async function getCalendar (): Promise<CalendarEntry[]> {
    const provider = configStore.dataProvider

    if (provider === 'shikimori') {
        return shikimoriGetCalendar().then(i => i.map(shikimoriCalendarAdapter))
    }

    return []
}

export async function getRecommendations (type: MediaType, pagination: Pagination): Promise<Media[]> {
    const provider = configStore.dataProvider

    if (provider === 'shikimori') {
        return shikimoriGetRecommendations(type, pagination).then(i => i.map(shikimoriMediaAdapter))
    }

    return []
}

export async function getMediaInList (status: UserRateStatus, type: MediaType, pagination: Pagination): Promise<Media[]> {
    const provider = configStore.dataProvider

    if (provider === 'shikimori') {
        return shikimoriGetMediaInList(status, type, pagination).then(i => i.map(shikimoriMediaAdapter))
    }

    return []
}

export async function getMediaUpdates (type: MediaType): Promise<MediaUpdate[]> {
    const provider = configStore.dataProvider

    if (provider === 'shikimori') {
        return shikimoriGetMediaUpdates(type)
    }

    return []
}

