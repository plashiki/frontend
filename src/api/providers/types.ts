import { CalendarEntry, ExtendedMedia, Media, MediaGenre, MediaId, MediaType, MediaUpdate } from '@/types/media'
import { PaginatedData, Pagination } from '@/types/api'
import { UserRateStatus } from '@/types/user-rate'

/**
 * Interface which must be implemented by Data Provider.
 *
 * ## Pagination
 * All paginated methods should return { items: T[], next?: any },
 * where `items` are actual items and `next` is an anchor for the next page,
 * which is implementation-vary and is passed as-is to the next paginated call.
 * Example:
 * - user opened page
 * - called searchByName('konosuba', 'anime') -> { items: [...], next: 15 }
 *          (here `next` is offset for next call, but may be page number or whatever)
 * - user reached end
 * - called searchByName('konosuba', 'anime', 15) -> { items: [...] } (here `next` is missing because no more items left)
 */
export interface IDataProvider {
    // constants //

    // search params to expand "Recently updated" section of main page. will be appended to /search?p=
    recentlyUpdatedSearchParams: string
    // search params to expand "Top Ongoings" section of main page. will be appended to /search?p=
    topOngoingsSearchParams: string
    // search params to expand "Top Released" section of main page. will be appended to /search?p=
    topReleasedSearchParams: string
    // whether provider uses MAL IDs for its content. Non-MAL IDs support is WIP
    isMalId: boolean
    // whether this service provides global recommendations
    hasRecommendations: boolean

    // variables //

    // prefix for MediaById field
    getMediaUrlPrefix (mediaType: MediaType): string
    // get media page on service only using id and type
    getUrlByMediaId (mediaType: MediaType, mediaId: MediaId): string
    // get search params to open search by genre. will be appended to /search?p=
    getGenreSearchParams (genre: MediaGenre): string

    // api related methods //

    // get medias by ids in the same order as requested
    getMediasByIds (ids: MediaId[], type: MediaType): Promise<Media[]>
    // get single media (or null if not found)
    getSingleMedia (id: MediaId, type: MediaType): Promise<Media | null>
    // get single media with additional fields (or null if not found)
    getSingleExtendedMedia (id: MediaId, type: MediaType): Promise<ExtendedMedia | null>
    // search `type` by name
    searchByName (input: string, type: MediaType, from?: any): Promise<PaginatedData<Media>>
    // get ongoing medias
    getOngoings (type: MediaType, from?: any): Promise<PaginatedData<Media>>
    // get popular released medias
    getPopularReleased (type: MediaType, from?: any): Promise<PaginatedData<Media>>
    // get mal id by provider's id. todo: fall back to plashiki mappings api
    getMalId (id: MediaId, type: MediaType): Promise<number>
    // get calendar
    getCalendar (type: MediaType, from?: any): Promise<PaginatedData<CalendarEntry>>
    // get recommendations
    getRecommendations (type: MediaType, from?: any): Promise<PaginatedData<Media>>
    // get media in user list
    getMediaInList (status: UserRateStatus, type: MediaType, from?: any): Promise<PaginatedData<Media>>
    // get media updates
    getMediaUpdates (type: MediaType, from?: any): Promise<PaginatedData<MediaUpdate>>
}

