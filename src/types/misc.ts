import { User } from '@/types/user'
import { RawStatistics } from '@/utils/stats-utils'

export interface Donation {
    date: string
    sign: '+' | '-'
    value: number
    comment: string
}

export interface OauthApp {
    id: number
    owner_id: number
    // only id, nickname and avatar.
    owner?: Partial<User>

    name: string
    icon: string | null
    description: string

    client_id?: string
    client_secret?: string
    redirect_uri?: string
    server_scope?: string[]
}

export interface StatisticsDay {
    day: string
    data: RawStatistics
}

export interface DeleteResult {
    affected: number
}
