export interface User {
    id: number
    nickname: string
    avatar: string | null
    admin: boolean
    moderator: boolean
    trusted: boolean
    banned: boolean
    donated: number
    first_login_at: string
    external_ids: Record<string, string | number>

    service: string
    sub: string[]
    language?: string | null
}

// idk how to call it lmao
export interface Galo4ka {
    color?: string
    icon?: string
    info?: string
}
