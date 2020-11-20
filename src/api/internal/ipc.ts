import { ApiEnvelope, ExtractIpcData, IPCEvent, SessionTab } from '@/types/api'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'
import { DEBUG } from '@/utils/debug'
import { merge } from '@/utils/object-utils'
import { changeLanguage } from '@/plugins/vue-i18n'
import { makeApiRequestForEnvelope } from './request'
import {
    createWebSocket,
    emitWebSocketStatusUpdate,
    handleWebsocketMessage,
    handleWebsocketResponse,
    webSocketStatus
} from '@/api/internal/websocket'

export let thisTab: SessionTab = {
    id: -1,
    master: false
}

// i call it ipc here and there because strictly speaking each tab
// is a process in modern browsers (and also ipc sounds nicer).
export const ipcChannel = new BroadcastChannel('plashiki-ipc')
export const ipcElection = createLeaderElection(ipcChannel)

export function emitIpc<T extends IPCEvent['act']> (name: T, data: ExtractIpcData<IPCEvent, T>): void {
    const obj = {
        act: name,
        ...data
    }
    DEBUG.api('>>> (IPC)', obj)
    ipcChannel.postMessage(obj).catch(DEBUG.error)
}

ipcChannel.addEventListener('message', (msg: IPCEvent) => {
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

export function requestAppRestart (): void {
    emitIpc('RELOAD', {})
    location.reload()
}

export function languageChanged (lang: string): void {
    emitIpc('LANGUAGE', { lang })
}

export function setupIpc () {
    if (thisTab.id === -1) {
        thisTab.id = Date.now()
        emitIpc('TAB_OPEN', {
            id: thisTab.id
        })
    }
}
