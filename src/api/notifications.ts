import { makeApiRequest } from '@/api/index'
import { ApiNotification } from '@/types/notification'


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
