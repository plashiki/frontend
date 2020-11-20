import { isProduction } from '@/config'
import { DEBUG } from '@/utils/debug'
import { createIndex, } from '@/utils/object-utils'
import { authStore, configStore, notificationsStore, onceStoreReady } from '@/store'
import { getCurrentUser, setUserLanguage } from '@/api/user'
import { getMissedNotifications, registerFirebaseToken, unregisterFirebaseToken } from '@/api/notifications'
import { ApiException, } from '@/types/api'
import { iziToastError } from '@/plugins/izitoast'
import { firebaseMessaging } from '@/plugins/firebase'
import { prepareNotification } from '@/utils/notification-utils'
import { configureScope } from '@sentry/browser'
import { changeLanguage } from '@/plugins/vue-i18n'
import { makeApiRequest } from '@/api/internal/request'
import { createWebSocket, webSocket } from '@/api/internal/websocket'
import { emitIpc, ipcElection, setupIpc, thisTab } from '@/api/internal/ipc'

// update some data
export function updateInitData (retry = false): void {
    getCurrentUser().then(user => {
        authStore.setUser(user)
        ga('set', 'userId', user.id)
        configureScope(scope => scope.setUser({
            id: user.id + ''
        }))
        if (user.language) {
            if (user.language !== configStore.language) {
                configStore.merge({ language: user.language })
                changeLanguage(user.language)
            }
        } else {
            setUserLanguage(configStore.language).catch(DEBUG.error)
        }

        getMissedNotifications(notificationsStore.lastSyncTime).then((items) => {
            let storedNotifications = createIndex(notificationsStore.items, i => i.id)

            let deletedNotifications = items.filter(i => i.deleted)
            let updatedNotifications = items.filter(i => !i.deleted && i.id in storedNotifications)
            let createdNotifications = items.filter(i => !i.deleted && !(i.id in storedNotifications))

            Promise.all([
                Promise.all(createdNotifications.map(i => prepareNotification(i))).then((items) => {
                    notificationsStore.addNotifications(items.map(it => {
                        it.background = true
                        return it
                    }))
                }),
                Promise.all(updatedNotifications.map(i => prepareNotification(i))).then((items) => {
                    items.forEach((it) => {
                        notificationsStore.updateNotification({
                            $id: it.id,
                            ...it
                        })
                    })
                })
            ]).catch(iziToastError)

            notificationsStore.removeNotification(deletedNotifications.map(i => i.id))
            notificationsStore.updateLastSyncTime(Date.now())
        })
    }).catch((err: ApiException) => {
        if (err.code === 'UNKNOWN_USER') authStore.setUser(null)
        // if i ignore it maybe it will go away....
        else if (!retry) setTimeout(() => updateInitData(true), 1000)
    })

    firebaseMessaging?.onTokenRefresh(async () => {
        DEBUG.api('token refresh')
        const oldToken = authStore.firebaseToken
        if (oldToken) {
            await unregisterFirebaseToken(oldToken).catch(iziToastError)
        }

        return firebaseMessaging!.getToken()
            .then((token) => registerFirebaseToken(token))
            .catch(iziToastError)
    })
}

export let apiInitialized = false

export function initApi (): void {
    if (apiInitialized || window !== window.parent) return
    apiInitialized = true

    if (!isProduction) {
        (window as any).$api = {
            makeApiRequest,
            get ws (): WebSocket | null {
                return webSocket
            }
        }
    }

    setupIpc()
    onceStoreReady(updateInitData)

    ipcElection.awaitLeadership().then(() => {
        thisTab.master = true
        DEBUG.api('became WS master')
        emitIpc('MASTER_CHANGED', {})
        createWebSocket()
    })
}
