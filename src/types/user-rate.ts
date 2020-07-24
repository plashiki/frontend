import { MediaType } from '@/types/media'

export enum UserRateStatus {
    Planned = 'planned',
    InProgress = 'in_progress',
    Completed = 'completed',
    OnHold = 'on_hold',
    Dropped = 'dropped'
}

export interface UserRate {
    id: number | string
    target_id: number
    target_type: MediaType
    score: number | null
    status: UserRateStatus
    parts: number
    partsVolumes?: number
    repeats: number
    created_at: string
    updated_at: string

    // a context item which server may (or may not) return
    // and which should be passed in update requests
    // (eg it may contain secret token of a user rate which is needed to edit it)
    // client is free to modify it, but really shouldnt
    ctx?: any
}
