import {
    ApiEnvelope, ApiException,
    ExtractIpcData,
    IPCEvent, MakeApiRequestOptions,
    WebSocketRPCIn, WebSocketRPCOut,
    WebSocketStatus,
    WebSocketStatusState
} from '@/types/api'
import Vue from 'vue'
import { DEBUG } from '@/utils/debug'
import { emitIpc, thisTab } from '@/api/internal/ipc'
import { ApiNotification } from '@/types/notification'
import { prepareNotification } from '@/utils/notification-utils'
import { configStore, notificationsStore } from '@/store'
import { apiEndpoint, isProduction } from '@/config'
import { makeApiRequestForEnvelope } from '@/api/internal/request'

export let webSocket: WebSocket | null = null

export let webSocketStatus: WebSocketStatus = Vue.observable({
    state: WebSocketStatusState.CONNECTING,
    attemptIn: NaN,
    get isOnline (): boolean {
        return webSocketStatus.state === WebSocketStatusState.CONNECTED
    }
})
export const isWebsocketReady =
    () => webSocket && webSocketStatus.state === WebSocketStatusState.CONNECTED && webSocket?.readyState === WebSocket.OPEN
export const webSocketEventBus = new Vue()

export function emitWebSocketStatusUpdate (): void {
    emitIpc('WS_STATUS', {
        master: thisTab.id,
        status: webSocketStatus
    })
}

const webSocketRequestMap: Record<number, [Function, Function, number, number]> = {}
let nextWebSocketBackOff = 1
let nextWebSocketRequestId = 0

let lastKeepAlive = -1
let keepAliveTimerId: number | null

const webSocketEndpoint = apiEndpoint
    .replace(/^http:\/\//, 'ws://')
    .replace(/^https:\/\//, 'wss://') + '/ws'

export function makeWebsocketApiRequest<T> (options: MakeApiRequestOptions): Promise<ApiEnvelope<T>> {
    return new Promise<ApiEnvelope<T>>((resolve, reject) => {
        if (isWebsocketReady() || !thisTab.master
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
}

export function handleWebsocketResponse (data: ApiEnvelope<any>): void {
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

export async function handleWebsocketMessage (data: WebSocketRPCIn): Promise<void> {
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
                seen: false
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
