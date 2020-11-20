import { cacheStore, configStore } from '@/store'
import { makeApiRequest } from './internal/request'
import { getProviderNow } from '@/api/providers'
import { createIndex, uniqueBy } from '@/utils/object-utils'
import { PaginatedData } from '@/types/api'
import {
    CalendarEntry,
    ExtendedMedia,
    Media,
    MediaId,
    MediaStatus,
    MediaType,
    MediaUpdate,
    NameMeta
} from '@/types/media'
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

export function getMediaNamesFromCache (id: MediaId, type: MediaType): NameMeta | null {
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

    const provider = getProviderNow()

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
        let items = await provider.getMediasByIds(uncachedIds, type)

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

export async function getMediaNames (ids: MediaId[], type: MediaType): Promise<Record<MediaId, NameMeta>> {
    if (!ids.length) return {}

    const provider = getProviderNow()

    let ret: Record<MediaId, NameMeta> = {}
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
        let medias = await provider.getMediasByIds(uncached, type)

        medias.forEach((media) => {
            ret[media.id] = media.name

            cacheStore.putMediaNamesInCache(media)
        })

    }

    return ret
}

export async function getSingleMedia (id: MediaId, type: MediaType): Promise<Media | null> {
    const provider = getProviderNow()

    let cached = getMediaFromCache(id, type)
    if (cached) {
        return cached
    }

    let media = await provider.getSingleMedia(id, type)

    if (media) {
        if (!media.moreData) {
            cacheStore.putMediaInCache(media)
        }
        cacheStore.putMediaNamesInCache(media)
    }

    return media
}

export async function getSingleExtendedMedia (id: MediaId, type: MediaType): Promise<ExtendedMedia | null> {
    return getProviderNow().getSingleExtendedMedia(id, type)
}

export async function searchMediaByName (input: string, type: MediaType, next?: any): Promise<PaginatedData<Media>> {
    return getProviderNow().searchByName(input, type, next)
}

export async function getOngoings (type: MediaType, from?: any): Promise<PaginatedData<Media>> {
    return getProviderNow().getOngoings(type, from)
}

export async function getPopularReleased (type: MediaType, from?: any): Promise<PaginatedData<Media>> {
    return getProviderNow().getPopularReleased(type, from)
}

export async function lookupMalId (providerId: MediaId, mediaType: MediaType): Promise<number> {
    return getProviderNow().getMalId(providerId, mediaType)
}

export async function getCalendar (type: MediaType, from?: any): Promise<PaginatedData<CalendarEntry>> {
    return getProviderNow().getCalendar(type, from)
}

export async function getRecommendations (type: MediaType, from?: any): Promise<PaginatedData<Media>> {
    return getProviderNow().getRecommendations(type, from)
}

export async function getMediaInList (status: UserRateStatus, type: MediaType, from?: any): Promise<PaginatedData<Media>> {
    return getProviderNow().getMediaInList(status, type, from)
}

export async function getMediaUpdates (type: MediaType, from?: any): Promise<PaginatedData<MediaUpdate>> {
    return getProviderNow().getMediaUpdates(type, from)
}

/**
 * Returns list of mal anime ids which translations were recently updated
 * and filters ongoings from those if possible/wanted.
 */
export async function getRecentUpdates (type: MediaType): Promise<TranslationUpdate[]> {
    let updates = await makeApiRequest<TranslationUpdate[]>({
        path: `/v2/translations/${type}/recent`
    })

    const medias = await getMedias(uniqueBy(updates.map(i => i.target_id)), type)
    const index = createIndex(medias, 'id')
    updates = updates.map(it => {
        it.media = index[it.target_id]
        return it
    }).filter(i => !!i.media)

    if (configStore.onlyOngoingsInRecent && medias[0]?.status) {
        updates = updates.filter(i => index[i.target_id].status === MediaStatus.Ongoing)
    }

    return updates
}
