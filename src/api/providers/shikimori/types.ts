import { MediaType } from '@/types/media'

export interface ShikimoriBriefUser {
    id: number
    nickname: string
    avatar: string
    image: ShikimoriImage
    last_online_at: string
    name: string | null
    sex: 'male' | 'female'
    website: string | null
    birth_on: string | null
    locale: string | null
}

export interface ShikimoriUser extends ShikimoriBriefUser {
    /* great api thx morr */
    birth_on: null
    locale: null
    full_years: number

    location: string | null
    banned: boolean
    about: string
    about_html: string
    common_info: string[]
    show_comments: boolean
    /* stats: ... idk tbh */
    style_id: number
}


export interface ShikimoriImage {
    original: string
    preview: string
    x96?: string
    x48?: string
}

// looking forward to graphql api, what we have now is basically shit
export interface ShikimoriGenre {
    id: number
    name: string
    russian: string
    kind: MediaType
}

export interface ShikimoriStudio {
    id: number
    name: string
    filtered_name?: string
    real?: boolean
    image?: ShikimoriImage | null
}

export interface ShikimoriBriefMedia {
    id: number
    name: string
    russian: string
    image: ShikimoriImage
    url: string
    kind: string
    score: string
    status: string
    aired_on: string | null
    released_on: string | null
}

export interface ShikimoriBriefManga extends ShikimoriBriefMedia {
    volumes?: number
    chapters?: number
}

export interface ShikimoriBriefAnime extends ShikimoriBriefMedia {
    episodes?: number
    episodes_aired: number
}

export interface ShikimoriMedia extends ShikimoriBriefMedia {
    // shikimori api is weird
    english: (string | null)[]
    japanese: (string | null)[]
    synonyms: (string | null)[]
    license_name_ru: string
    description: string
    description_html: string
    franchise: string
    favoured: boolean
    anons: boolean
    ongoing: boolean
    thread_id: number
    topic_id: number
    myanimelist_id: number
    rates_scores_stats: {
        name: number
        value: number
    }[]
    rates_statuses_stats: {
        name: string
        value: number
    }[]
    updated_at?: string
    next_episode_at?: string
    genres: any
    user_rate: any
}

export interface ShikimoriManga extends ShikimoriMedia, ShikimoriBriefManga {
    publishers: ShikimoriStudio[]
}

export interface ShikimoriAnime extends ShikimoriMedia, ShikimoriBriefAnime {
    studios: ShikimoriStudio[]
}

export interface ShikimoriCalendarEntry {
    next_episode: number
    next_episode_at: string
    duration: number | null
    anime: ShikimoriBriefAnime
}

export interface ShikimoriPerson {
    id: number
    name: string
    russian: string
    image: ShikimoriImage
    url: string
}

export interface ShikimoriRelation {
    relation: string // english
    relation_russian: string
    anime: ShikimoriBriefAnime | null
    manga: ShikimoriBriefManga | null
}

export interface ShikimoriVideo {
    id: number
    url: string
    image_url: string
    player_url: string
    name: string
    kind: string
    hosting: string
}

export interface ShikimoriRole {
    roles: string[]
    roles_russian: string[]
    character: ShikimoriPerson | null
    person: ShikimoriPerson | null
}
