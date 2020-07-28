import { apiEndpoint, experimentalWSApi, isProduction } from '@/config'
import Vue from 'vue'
import { DEBUG } from '@/utils/debug'
import axios, { AxiosResponse } from 'axios'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'
import { createIndex, merge } from '@/utils/object-utils'
import { authStore, configStore, notificationsStore, onceStoreReady } from '@/store'
import { getCurrentUser, setUserLanguage } from '@/api/user'
import { getMissedNotifications, registerFirebaseToken, unregisterFirebaseToken } from '@/api/notifications'
import {
    ApiEnvelope,
    ApiException,
    ExtractIpcData,
    IPCEvent,
    MakeApiRequestOptions,
    SessionTab,
    WebSocketRPCIn,
    WebSocketRPCOut,
    WebSocketStatus,
    WebSocketStatusState
} from '@/types/api'
import { ApiNotification } from '@/types/notification'
import { iziToastError } from '@/plugins/izitoast'
import { firebaseMessaging } from '@/plugins/firebase'
import { prepareNotification } from '@/utils/notification-utils'
import { configureScope } from '@sentry/browser'
import { changeLanguage } from '@/plugins/vue-i18n'

let thisTab: SessionTab = {
    id: -1,
    master: false
}
// i call it ipc here and there because strictly speaking each tab
// is a process in modern browsers (and also ipc sounds nicer).
const channel = new BroadcastChannel('plashiki-ipc')
const election = createLeaderElection(channel)

function emitIpc<T extends IPCEvent['act']> (name: T, data: ExtractIpcData<IPCEvent, T>): void {
    const obj = {
        act: name,
        ...data
    }
    DEBUG.api('>>> (IPC)', obj)
    channel.postMessage(obj).catch(DEBUG.error)
}

export let webSocket: WebSocket | null = null

export let webSocketStatus: WebSocketStatus = Vue.observable({
    state: WebSocketStatusState.CONNECTING,
    attemptIn: NaN,
    get isOnline (): boolean {
        return webSocketStatus.state === WebSocketStatusState.CONNECTED
    }
})
export const webSocketEventBus = new Vue()

function emitWebSocketStatusUpdate (): void {
    emitIpc('WS_STATUS', {
        master: thisTab.id,
        status: webSocketStatus
    })
}

const webSocketRequestMap: Record<number, [Function, Function, number, number]> = {}
let nextWebSocketRequestId = 0
let nextWebSocketBackOff = 1

let lastKeepAlive = -1
let keepAliveTimerId: number | null

export function makeApiRequestForEnvelope<T = any> (options: MakeApiRequestOptions): Promise<ApiEnvelope<T>> {
    if (options.body !== undefined && options.method === undefined) {
        options.method = 'POST'
    }

    if (options.via === 'websocket'
        // fallback to http in case ws is not ready
        || (experimentalWSApi
            && options.via !== 'http'
            && webSocketStatus.state === WebSocketStatusState.CONNECTED
            && webSocket?.readyState === WebSocket.OPEN
        )
    ) {
        DEBUG.api('>>> (WS)', options)
        return new Promise<ApiEnvelope<T>>((resolve, reject) => {
            if (webSocket
                && webSocketStatus.state === WebSocketStatusState.CONNECTED
                && webSocket?.readyState === WebSocket.OPEN
                || !thisTab.master
            ) {
                const requestId = nextWebSocketRequestId++
                if (!thisTab.master) {
                    const request: ExtractIpcData<IPCEvent, 'API_REQUEST'> = {
                        options: {
                            id: requestId,
                            tabId: thisTab.id,
                            ...options
                        }
                    }
                    emitIpc('API_REQUEST', request)
                } else if (webSocket && webSocketStatus.state === WebSocketStatusState.CONNECTED && webSocket?.readyState === WebSocket.OPEN) {
                    const request: WebSocketRPCOut = {
                        ...options,
                        id: requestId,
                        act: 'api'
                    }
                    webSocket.send(JSON.stringify(request))
                } else {
                    throw Error('this should not happen')
                }
                const timeout = options.timeout === -1 ? null :
                    setTimeout(() => reject(new ApiException('TIMEOUT')), options.timeout ?? configStore.apiTimeout) as any
                const now = performance.now()
                webSocketRequestMap[requestId] = [resolve, reject, timeout, now]
            } else {
                // in case we absolutely need to send req via websocket, but its not ready
                webSocketEventBus.$once('ready', () =>
                    makeApiRequestForEnvelope<T>(options)
                        .then(resolve)
                        .catch(reject)
                )
            }
        })
    } else {
        const now = performance.now()

        DEBUG.api('>>>', options)
        return axios({
            baseURL: apiEndpoint,
            url: options.path,
            params: options.query,
            method: options.method,
            data: options.body,
            responseType: 'json',
            timeout: options.timeout === -1 ? undefined : (options.timeout ?? configStore.apiTimeout),
            withCredentials: true
        }).then((rsp: AxiosResponse<ApiEnvelope<T>>) => {
            if (rsp.status !== 200) {
                DEBUG.api(`<<< API returned non-200 code ${rsp.status}:`, rsp.data)
                throw new ApiException('UNKNOWN_API_ERROR', `${rsp.status} ${rsp.statusText}`)
            }
            const i = rsp.data
            DEBUG.api('<<<', i)
            return i
        }).catch((err: any) => {
            if (err instanceof ApiException) {
                throw err
            } else {
                throw new ApiException(err.code === 'ECONNABORTED' ? 'TIMEOUT' : 'BAD_CONNECTION', err.message)
            }
        }).finally(() => {
            ga('send', 'timing', 'API', 'http_request', performance.now() - now, options.path)
        })
    }

}

export function makeApiRequest<T> (options: MakeApiRequestOptions): Promise<T> {
    return makeApiRequestForEnvelope<T>(options).then((envelope) => {
        if (envelope.ok) {
            return envelope.result
        } else {
            throw new ApiException(envelope.reason, envelope.description)
        }
    })
}

function handleWebsocketResponse (data: ApiEnvelope<any>): void {
    if (webSocketRequestMap[data.id!] !== undefined) {
        const [resolve, , timeout, start] = webSocketRequestMap[data.id!]
        clearTimeout(timeout)
        resolve(data)
        webSocketRequestMap[data.id!] = undefined as any

        ga('send', 'timing', 'API', 'ws_request', performance.now() - start)
    } else {
        DEBUG.error('orphaned websocket message: ', data)
    }
}

async function handleWebsocketMessage (data: WebSocketRPCIn): Promise<void> {
    if (data.act === 'push') {
        let notif!: ApiNotification

        if (data.type === 'C') {
            notif = await prepareNotification({
                id: data.id as number,
                topics: data.topics!,
                progress: data.progress!,
                payload: data.data!,
                deleted: false,
                time: new Date().toISOString(),
                new: true
            })
            webSocketEventBus.$emit('push', notif)
        }

        if (thisTab.master) {
            if (data.type === 'C') {
                notificationsStore.addNotifications(notif)
            } else if (data.type === 'D') {
                notificationsStore.removeNotification(data.id)
            } else if (data.type === 'U') {
                notificationsStore.updateNotification({
                    $id: data.id,
                    progress: data.progress,
                    payload: data.data
                })
            }
            notificationsStore.updateLastSyncTime(Date.now())
        }
    }
}

webSocketEventBus.$on('message', (data: ApiEnvelope<any> | WebSocketRPCIn) => {
    DEBUG.api('<<< (WS)', data)
    if (!('act' in data)) {
        handleWebsocketResponse(data as ApiEnvelope<any>)
    } else {
        handleWebsocketMessage(data)
        emitIpc('WS_RPC', { data })
    }
})

const webSocketEndpoint = apiEndpoint
    .replace(/^http:\/\//, 'ws://')
    .replace(/^https:\/\//, 'wss://') + '/ws'

let webSocketReconnectionTimerId: number | null = null

function webSocketReconnectionTimer (): void {
    webSocketReconnectionTimerId = null
    if (webSocketStatus.attemptIn === 0) {
        webSocketStatus.attemptIn = NaN
        webSocketStatus.state = WebSocketStatusState.CONNECTING
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createWebSocket()
    } else {
        webSocketStatus.attemptIn--
        webSocketReconnectionTimerId = setTimeout(webSocketReconnectionTimer, 1000) as any
    }
    emitWebSocketStatusUpdate()
}

function onWebSocketClose (evt: CloseEvent): void {
    DEBUG.api(`WS closed: ${evt.code} (${evt.reason || 'UNKNOWN'}), reconnection in ${nextWebSocketBackOff}s`)
    webSocketStatus.state = WebSocketStatusState.WAITING
    webSocketStatus.attemptIn = nextWebSocketBackOff
    nextWebSocketBackOff *= 2
    emitWebSocketStatusUpdate()

    webSocketReconnectionTimer()
    if (keepAliveTimerId) {
        clearTimeout(keepAliveTimerId)
    }
}

function websocketKeepAlive (): void {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return
    lastKeepAlive = performance.now()
    webSocket.send('KA')

    // random wait between 45-55 secs
    keepAliveTimerId = setTimeout(websocketKeepAlive, 45000 + Math.random() * 10000)
}

export function createWebSocket (resetBackoff = false): void {
    if (!thisTab.master) return emitIpc('WS_RECONNECT', {})
    if (webSocket && webSocket.readyState !== webSocket.CLOSING && webSocket.readyState !== webSocket.CLOSED) {
        webSocket.removeEventListener('close', onWebSocketClose)
        webSocket.close()
    }
    if (webSocketReconnectionTimerId !== null) {
        clearTimeout(webSocketReconnectionTimerId)
    }

    webSocketStatus.state = WebSocketStatusState.CONNECTING

    if (resetBackoff) {
        nextWebSocketBackOff = 1
    }
    emitWebSocketStatusUpdate()

    webSocket = new WebSocket(webSocketEndpoint)
    DEBUG.api('Connecting to WS')
    webSocket.addEventListener('open', () => {
        DEBUG.api('WS connected')
        webSocketStatus.state = WebSocketStatusState.CONNECTED
        webSocketEventBus.$emit('ready')
        nextWebSocketBackOff = 1

        if (isProduction) {
            keepAliveTimerId = setTimeout(websocketKeepAlive, 45000 + Math.random() * 10000)
        }

        emitWebSocketStatusUpdate()
    })
    webSocket.addEventListener('message', (evt) => {
        if (evt.data === 'KAACK') {
            if (lastKeepAlive !== -1) {
                ga('send', 'timing', 'API', 'ws_ka_roundtrip', performance.now() - lastKeepAlive)
                lastKeepAlive = -1
            }
            return
        }

        webSocketEventBus.$emit('message', JSON.parse(evt.data))
    })
    webSocket.addEventListener('close', onWebSocketClose)
}

export function requestAppRestart (): void {
    emitIpc('RELOAD', {})
    location.reload()
}

export function languageChanged (lang: string): void {
    emitIpc('LANGUAGE', { lang })
}

channel.addEventListener('message', (msg: IPCEvent) => {
    DEBUG.api('<<< (IPC)', msg)
    if (msg.act === 'API_REQUEST' && thisTab.master) {
        makeApiRequestForEnvelope(msg.options).then((envelope: ApiEnvelope<any>) => {
            emitIpc('API_RESPONSE', {
                data: envelope,
                id: msg.options.id,
                tabId: msg.options.tabId
            })
        })
    }
    if (msg.act === 'API_RESPONSE' && msg.tabId === thisTab.id) {
        msg.data.id = msg.id
        handleWebsocketResponse(msg.data)
    }

    if (msg.act === 'WS_RPC') {
        handleWebsocketMessage(msg.data)
    }

    if (msg.act === 'TAB_OPEN' && thisTab.master) {
        emitWebSocketStatusUpdate()
    }

    if (msg.act === 'WS_STATUS' && !thisTab.master) {
        merge(webSocketStatus, msg.status)
    }

    if (msg.act === 'WS_RECONNECT') {
        createWebSocket()
    }

    if (msg.act === 'RELOAD') {
        location.reload()
    }

    if (msg.act === 'LANGUAGE') {
        changeLanguage(msg.lang, true)
    }
})

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
            setUserLanguage(configStore.language).catch(console.error)
        }

        getMissedNotifications(notificationsStore.lastSyncTime).then((items) => {
            let storedNotifications = createIndex(notificationsStore.items, i => i.id)

            let deletedNotifications = items.filter(i => i.deleted)
            let updatedNotifications = items.filter(i => !i.deleted && i.id in storedNotifications)
            let createdNotifications = items.filter(i => !i.deleted && !(i.id in storedNotifications))

            Promise.all([
                Promise.all(createdNotifications.map(i => prepareNotification(i))).then((items) => {
                    notificationsStore.addNotifications(items.map(it => {
                        it.new = true
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

    // inter-tab communication
    thisTab.id = Date.now()
    emitIpc('TAB_OPEN', {
        id: thisTab.id
    })

    onceStoreReady(updateInitData)

    election.awaitLeadership().then(() => {
        thisTab.master = true
        DEBUG.api('became WS master')
        emitIpc('MASTER_CHANGED', {})
        createWebSocket()
    })
}
