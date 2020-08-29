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

export interface Parser {
    uid: string
    storage: string[]
    provide: string[]
    disabled: boolean
    public: string
    cri: boolean
}

export interface ParsersKindState {
    running: boolean
    states: {
        // value:
        // 'waiting' - not yet running, queued
        // 'preparing' - loading code and basic stuff
        // 'running|N' - running, yielded N items so far
        // 'finished|N' - finished, yielded N items
        // 'error\nStack...' - finished with error, stack is in lines 1 and after
        [key: string]: string
    }
}
export type ParsersState = Record<'mappers' | 'importers' | 'cleaners', ParsersKindState>

export interface KeyValue<T = any> {
    key: string
    value: T
}
