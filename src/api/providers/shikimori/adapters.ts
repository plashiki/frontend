import {
    ShikimoriAnime,
    ShikimoriBriefAnime,
    ShikimoriBriefManga,
    ShikimoriCalendarEntry,
    ShikimoriGenre,
    ShikimoriImage,
    ShikimoriManga,
    ShikimoriMedia,
    ShikimoriPerson,
    ShikimoriVideo
} from './types'
import { CalendarEntry, ImageMeta, Media, MediaCharacter, MediaGenre, MediaStatus, VideoMeta } from '@/types/media'
import { UserRateStatus } from '@/types/user-rate'
import { fixRelativeUrl } from '@/utils/helpers'

export function shikimoriVideoAdapter (video: ShikimoriVideo): VideoMeta {
    return {
        name: video.name,
        poster: {
            large: video.image_url
        },
        url: video.url
    }
}

export function shikimoriImageAdapter (image: ShikimoriImage): ImageMeta | undefined {
    if (image.original.match(/missing_original\.jpg/)) return undefined

    return {
        large: fixRelativeUrl(image.original, 'https://shikimori.one'),
        small: fixRelativeUrl(image.preview, 'https://shikimori.one')
    }
}

export function shikimoriPersonAdapter (character: ShikimoriPerson): MediaCharacter {
    return {
        name: {
            russian: character.russian,
            romaji: character.name
        },
        image: shikimoriImageAdapter(character.image),
        url: 'https://shikimori.one' + character.url
    }
}

export function shikimoriMediaAdapter (input: ShikimoriBriefAnime | ShikimoriBriefManga | ShikimoriAnime | ShikimoriManga): Media {
    let ret: Partial<Media> = {}
    let brief = input as ShikimoriBriefManga | ShikimoriBriefAnime
    ret.id = ret.malId = brief.id
    ret.poster = shikimoriImageAdapter(brief.image)
    ret.url = 'https://shikimori.one' + brief.url
    ret.name = {
        russian: brief.russian,
        romaji: brief.name
    }
    if (brief.aired_on) {
        ret.airedOn = new Date(brief.aired_on)
    }
    if (brief.released_on) {
        ret.releasedOn = new Date(brief.released_on)
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
    if ((brief as any).description_html !== undefined) {
        let media = input as ShikimoriMedia
        ret.description = media.description_html
        if (media.english[0]) {
            ret.name.english = media.english[0]
        }
        if (media.japanese[0]) {
            ret.name.japanese = media.japanese[0]
        }
        if (media.next_episode_at) {
            ret.nextPartAt = new Date(media.next_episode_at)
        }

        if ((media as any).studios !== undefined) {
            let anime = input as ShikimoriAnime
            if (anime.studios.length) {
                ret.studio = anime.studios[0].name
            }
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

export function shikimoriCalendarAdapter (item: ShikimoriCalendarEntry): CalendarEntry {
    return {
        ts: new Date(item.next_episode_at),
        part: item.next_episode,
        media: shikimoriMediaAdapter(item.anime)
    }
}

export function shikimoriUserRateStatusAdapter (status: UserRateStatus): string {
    if (status === UserRateStatus.InProgress) return 'watching,rewatching'
    return status
}
