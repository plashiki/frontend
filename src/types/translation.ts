import { Media, MediaType } from '@/types/media'
import { User } from '@/types/user'

export enum TranslationKind {
    // for media
    Subtitles = 'sub',
    Dubbed = 'dub',

    // for manga/ranobe
    Scanlation = 'scan',
    Official = 'off',

    // common
    Original = 'raw'
}

export enum TranslationLanguage {
    Russian = 'ru',
    English = 'en',
    Japanese = 'jp',
    Korean = 'ko',
    Chinese = 'cn',
    Belorussian = 'by',
    Ukrainian = 'ua',
    French = 'fr',
    German = 'de',

    Other = 'other'
}

export enum TranslationStatus {
    Pending = 'pending',
    Added = 'added',
    Declined = 'declined'
}

export interface Translation {
    id: number
    target_id: number
    target_type: 'anime' | 'manga'
    part: number
    kind: TranslationKind
    lang: TranslationLanguage
    hq: boolean
    author: string
    uploader_id: number
    uploader?: User | number
    status?: TranslationStatus
    url: string
    groups?: string[]
    created_at: string
    updated_at: string
}

export type TranslationData = Record<number, SinglePartTranslations>

export interface SinglePartTranslations {
    players: string[]
    authors: TranslationAuthor[]
}

export interface SingleTranslationData {
    id: number
    name: string
    url: string
    rawUrl?: string
    hq: boolean
    uploader: User | number | null
}

export type ExtendedSingleTranslationData = SingleTranslationData & { author: TranslationAuthor }

export interface TranslationAuthor {
    kind: TranslationKind
    name: string
    lang: TranslationLanguage
    translations: SingleTranslationData[]

    hqCount: number
    metaTag: string
    key: string
}

export interface TranslationUpdate {
    target_id: number
    target_type: MediaType
    part: number

    media: Media
}
