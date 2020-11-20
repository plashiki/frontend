import { makeApiRequest } from './internal/request'
import { ApiNotification } from '@/types/notification'
import { iziToastError } from '@/plugins/izitoast'


export async function getMissedNotifications (since: number): Promise<ApiNotification[]> {
    return makeApiRequest({
        path: '/v2/notifications/missed',
        query: {
            since
        }
    })
}

export function registerFirebaseToken (token: string): Promise<void> {
    return makeApiRequest({
        path: '/v2/notifications/addFirebaseToken',
        query: { token }
    })
}

export function unregisterFirebaseToken (token: string): Promise<void> {
    return makeApiRequest({
        path: '/v2/notifications/removeFirebaseToken',
        query: { token }
    })
}


export function subscribeToTopics (topics: string[]): Promise<string[]> {
    return makeApiRequest({
        path: '/v2/notifications/subscribe',
        query: {
            topics: topics.join(',')
        }
    })
}

export function unsubscribeFromTopics (topics: string[]): Promise<string[]> {
    return makeApiRequest({
        path: '/v2/notifications/unsubscribe',
        query: {
            topics: topics.join(',')
        }
    })
}

export function getUserTopics (): Promise<string[]> {
    return makeApiRequest({
        path: '/v2/notifications/mytopics'
    })
}

let markAsSeenBuffer: number[] = []
let markAsSeenTimeout: number | null = null
export function markAsSeen (id: number) {
    if (markAsSeenTimeout != null) clearTimeout(markAsSeenTimeout)
    if (markAsSeenBuffer.indexOf(id) === -1) markAsSeenBuffer.push(id)

    markAsSeenTimeout = setTimeout(() => {
        let ids = markAsSeenBuffer.join(',')
        markAsSeenTimeout = null
        markAsSeenBuffer = []

        makeApiRequest({
            path: '/v2/notifications/markAsSeen',
            query: { ids }
        }).catch(iziToastError)
    }, 1000)
}
