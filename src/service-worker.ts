/* eslint-env serviceworker */
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { firebaseMessaging } from './plugins/firebase'
import IndexedDBClient from '@/utils/indexed-db-client'
import { PushNotification } from '@/types/notification'

declare const self: ServiceWorkerGlobalScope
declare const clients: Clients

// we dont need auto caching, we handle it manually
let manifest = (self as any).__WB_MANIFEST

if (process.env.NODE_ENV === 'production') {
    registerRoute(
        ({ request }) => request.destination === 'image',
        new CacheFirst({
            cacheName: 'images',
            plugins: [
                new ExpirationPlugin({
                    maxEntries: 60,
                    maxAgeSeconds: 30 * 24 * 60 * 60
                })
            ]
        })
    )

    registerRoute(
        ({ request, url }) => (request.destination === 'script' || request.destination === 'style') && !url.pathname.endsWith('.user.js'),
        new StaleWhileRevalidate({
            cacheName: 'static-resources'
        })
    )
}


const idb = new IndexedDBClient()
firebaseMessaging?.setBackgroundMessageHandler((obj) => {
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
