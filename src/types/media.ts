import { TranslationKind } from '@/types/translation'

export interface ImageMeta {
    large?: string
    small?: string
}

export interface VideoMeta {
    name?: string
    poster: ImageMeta
    url: string
}

export interface NameMeta {
    russian?: string
    english?: string
    romaji?: string
    japanese?: string
    other?: string[]
}

export interface MediaGenre {
    id: number | string
    name: string
}

export interface MediaCharacter {
    name: NameMeta
    image?: ImageMeta
    url?: string
}

export enum MediaStatus {
    Ongoing,
    Released,
    Announced
}

export type MediaId = string | number
export type MediaType = 'anime' | 'manga'

/**
 * Abstract Media interface, which is used by components
 * and is expected to return by adapters.
 */
export interface Media {
    id: MediaId
    malId?: number
    type: MediaType
    name: NameMeta
    status?: MediaStatus
    description?: string
    partsCount?: number
    partsAired?: number

    airedOn?: Date
    releasedOn?: Date
    nextPartAt?: Date

    poster?: ImageMeta
    genres?: MediaGenre[]
    // 0-10
    score?: number
    studio?: string
    releaseType?:
    // im too lazy to make this type-safe
        | 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music' // type=anime
        | 'manga' | 'manhwa' | 'manhua' | 'novel' | 'one_shot' | 'doujin' // type=manga
    year?: number
    url?: string

    // true means that there's more data but it is returned
    // only when requested as a single media
    moreData?: true

    // text that will be displayed additionally
    // (in corner of card or as subtitle in list)
    statusText?: string

    // text that wiill override `releaseType` in card.
    // and yes im rly bad at naming
    statusText2?: string
}

/**
 * Extended {@see Media} interface containing more detailed information
 * for display in MediaInfoDrawer.
 *
 * Currently `videos`, `screenshots` and `characters` are not used in UI
 */
export interface ExtendedMedia extends Media {
    related?: Media[]
    similar?: Media[]
    videos?: VideoMeta[]
    screenshots?: ImageMeta[]
    characters?: MediaCharacter[]
}

export enum AuthorsTab {
    All,
    Subtitles,
    Dubbed,
    Original
}

export const TabToKind = {
    [AuthorsTab.All]: TranslationKind.Original, // otherwise TS goes wild
    [AuthorsTab.Dubbed]: TranslationKind.Dubbed,
    [AuthorsTab.Subtitles]: TranslationKind.Subtitles,
    [AuthorsTab.Original]: TranslationKind.Original
}


export interface MediaUpdate {
    part: number
    media: Media
}

export interface CalendarEntry extends MediaUpdate {
    ts: Date
}
