/* eslint-env serviceworker */
import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute'
import { firebaseMessaging } from './plugins/firebase'
import IndexedDBClient from '@/utils/indexed-db-client'
import { PushNotification } from '@/types/notification'

declare const self: ServiceWorkerGlobalScope
declare const clients: Clients

if (process.env.NODE_ENV === 'production') {
    precacheAndRoute((self as any).__WB_MANIFEST)
} else {
    // we dont want caching but since we build it with
    // workbox it requires this string to be present
    /* self.__WB_MANIFEST */
}


const idb = new IndexedDBClient()
firebaseMessaging.setBackgroundMessageHandler((obj) => {
    const data = obj.data
    if (data.type === 'push') {
        const payload = data as PushNotification
        return idb.get('browserPush')
            .then((bp) => {
                if (!bp) return

                const opts: NotificationOptions = {
                    icon: payload.image,
                    body: payload.body,
                    data: {
                        url: payload.url?.replace(/^\$domain/, `${self.location.protocol}//${self.location.host}`)
                    }
                }

                return self.registration.showNotification(payload.title, opts)
            })
    }
})

self.addEventListener('install', (e) => {
    e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (e) => {
    const data = e.notification.data
    let handler = () => {
        clients.openWindow(data.url)
            .then(() => e.notification.close())
    }
    e.waitUntil(handler())
})
