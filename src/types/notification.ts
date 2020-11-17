import { AnyKV } from '@/types/index'

export interface ApiNotification<T = AnyKV> {
    id: number
    time: string
    progress: number
    for_users?: number[]
    topics: string[]
    payload: T
    deleted: boolean
    seen: boolean

    // was this boi received from background?
    background?: boolean
}

// below are notification types

export interface PushNotification {
    // these 2 are very similar but `silent-push` is not sent via fcm
    // and should not be displayed as a heads-up (lower priority basically)
    type: 'push' | 'silent-push'
    title: string
    body: string
    icon?: string
    badge?: string
    image?: string
    smallImage?: string
    data?: any

    url?: string
    format?: AnyKV
}
