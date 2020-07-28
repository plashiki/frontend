import { AnyKV } from '@/types'
import { UserRateStatus } from '@/types/user-rate'

export const shikimoriGenres: readonly any[] = Object.freeze([
    { group: 'Pages.Search.GenreGroup.Main' },
    { text: 'Genres.Comedy', value: 4 },
    { text: 'Genres.Slice of Life', value: 36 },
    { text: 'Genres.Romance', value: 22 },
    { text: 'Genres.Shoujo', value: 25 },
    { text: 'Genres.Shounen', value: 27 },
    { group: 'Pages.Search.GenreGroup.All' },
    { text: 'Genres.Dementia', value: 5 },
    { text: 'Genres.Martial Arts', value: 17 },
    { text: 'Genres.Vampire', value: 32 },
    { text: 'Genres.Military', value: 38 },
    { text: 'Genres.Harem', value: 35 },
    { text: 'Genres.Demons', value: 6 },
    { text: 'Genres.Mystery', value: 7 },
    { text: 'Genres.Kids', value: 15 },
    { text: 'Genres.Josei', value: 43 },
    { text: 'Genres.Drama', value: 8 },
    { text: 'Genres.Game', value: 11 },
    { text: 'Genres.Historical', value: 13 },
    { text: 'Genres.Comedy', value: 4 },
    { text: 'Genres.Space', value: 29 },
    { text: 'Genres.Magic', value: 16 },
    { text: 'Genres.Cars', value: 3 },
    { text: 'Genres.Mecha', value: 18 },
    { text: 'Genres.Music', value: 19 },
    { text: 'Genres.Parody', value: 20 },
    { text: 'Genres.Slice of Life', value: 36 },
    { text: 'Genres.Police', value: 39 },
    { text: 'Genres.Adventure', value: 2 },
    { text: 'Genres.Psychological', value: 40 },
    { text: 'Genres.Romance', value: 22 },
    { text: 'Genres.Samurai', value: 21 },
    { text: 'Genres.Supernatural', value: 37 },
    { text: 'Genres.Seinen', value: 42 },
    { text: 'Genres.Sports', value: 30 },
    { text: 'Genres.Super Power', value: 31 },
    { text: 'Genres.Shoujo', value: 25 },
    { text: 'Genres.Shoujo Ai', value: 26 },
    { text: 'Genres.Shounen', value: 27 },
    { text: 'Genres.Shounen Ai', value: 28 },
    { text: 'Genres.Thriller', value: 41 },
    { text: 'Genres.Horror', value: 14 },
    { text: 'Genres.Sci-Fi', value: 24 },
    { text: 'Genres.Fantasy', value: 10 },
    { text: 'Genres.Hentai', value: 12 },
    { text: 'Genres.School', value: 23 },
    { text: 'Genres.Action', value: 1 },
    { text: 'Genres.Ecchi', value: 9 },
    { text: 'Genres.Yuri', value: 34 },
    { text: 'Genres.Yaoi', value: 33 }
])
export const shikimoriKinds: readonly any[] = Object.freeze([
    'tv',
    'movie',
    'ova',
    'ona',
    'special',
    'music',
    'tv_13',
    'tv_24',
    'tv_48'
].map(i => ({
    text: 'Items.Media.ReleaseType.' + i,
    value: i
})))
export const shikimoriStatuses: readonly any[] = Object.freeze([
    {
        text: 'Items.Media.Status.announced',
        value: 'anons'
    },
    {
        text: 'Items.Media.Status.ongoing',
        value: 'ongoing'
    },
    {
        text: 'Items.Media.Status.released',
        value: 'released'
    },
    {
        text: 'Items.Media.Status.recent',
        value: 'latest'
    }
])
export const shikimoriDurations: readonly any[] = Object.freeze([
    'S',
    'D',
    'F'
].map(i => ({
    text: 'Items.Media.Duration.' + i,
    value: i
})))
export const shikimoriRatings: readonly any[] = Object.freeze([
    'g',
    'pg',
    'pg_13',
    'r',
    'r_plus'
].map(i => ({
    text: 'Items.Media.AgeRating.' + i,
    value: i
})))
export const shikimoriLists: readonly any[] = Object.freeze([
    {
        text: 'Items.UserRate.StatusText.in_progress',
        value: 'watching'
    },
    {
        text: 'Items.UserRate.StatusText.rewatching',
        value: 'rewatching'
    },
    {
        text: 'Items.UserRate.StatusText.planned',
        value: 'planned'
    },
    {
        text: 'Items.UserRate.StatusText.completed',
        value: 'completed'
    },
    {
        text: 'Items.UserRate.StatusText.on_hold',
        value: 'on_hold'
    },
    {
        text: 'Items.UserRate.StatusText.dropped',
        value: 'dropped'
    }

])

// not rly constants but idk where to put them

export function shikimoriGetSeasonText (season: string): [string, AnyKV] {
    if (season[0] === '!') season = season.substr(1)
    if (season === 'ancient') return ['Items.Media.Season.older', {}]
    let m = season.match(/^(winter|spring|summer|fall)_(\d{4})$/)
    if (m) {
        return ['Items.Media.Season.' + m[1] + 'N', { n: m[2] }]
    }
    m = season.match(/^(\d{4})_(\d{4})$/)
    if (m) {
        return ['Items.Media.Season.yearRange', { a: m[1], b: m[2] }]
    }
    m = season.match(/^(\d{3})x$/)
    if (m) {
        return ['Items.Media.Season.decade', { n: m[1] }]
    }

    return ['Items.Media.Season.year', { n: season }]
}

export function shikimoriGetSeasons (rel: Date): string[] {
    const seasons = ['winter', 'spring', 'summer', 'fall']
    let ret = []

    // quite interesting code, wondering if it may be somehow simplified...
    let currentYear = rel.getFullYear()
    let currentMonth = rel.getMonth()
    let currentCSeason = ~~((currentMonth + 1) / 3) % 4
    let nextCSeason = (currentCSeason + 1) % 4
    ret.push(`${seasons[nextCSeason]}_${nextCSeason === 0 ? currentYear + 1 : currentYear}`)
    ret.push(`${seasons[currentCSeason]}_${currentYear}`)
    nextCSeason = currentCSeason === 0 ? 3 : currentCSeason - 1
    ret.push(`${seasons[nextCSeason]}_${nextCSeason === 3 && currentMonth !== 11 ? currentYear - 1 : currentYear}`)
    nextCSeason = nextCSeason === 0 ? 3 : nextCSeason - 1
    ret.push(`${seasons[nextCSeason]}_${nextCSeason === 3 && currentMonth !== 11 ? currentYear - 1 : currentYear}`)
    ret.push(currentYear + '')
    ret.push((currentYear - 1) + '')
    ret.push((currentYear - 3) + '_' + (currentYear - 2))
    ret.push((currentYear - 8) + '_' + (currentYear - 4))
    ret.push((currentYear - 20) + '_' + (currentYear - 9))
    ret.push((~~((currentYear - 30) / 10) + '').substr(0, 3) + 'x')
    ret.push((~~((currentYear - 40) / 10) + '').substr(0, 3) + 'x')
    ret.push('ancient')
    return ret
}

export const shikimoriSeasons = Object.freeze(shikimoriGetSeasons(new Date()).map(it => ({
    text: shikimoriGetSeasonText(it),
    value: it
})))

export const UserRateToShikimoriStatusAdapter: Record<UserRateStatus, string> = {
    [UserRateStatus.Planned]: 'planned',
    [UserRateStatus.Completed]: 'completed',
    [UserRateStatus.OnHold]: 'on_hold',
    [UserRateStatus.InProgress]: 'watching,rewatching',
    [UserRateStatus.Dropped]: 'dropped'
}
