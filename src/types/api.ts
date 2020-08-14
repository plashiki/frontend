import { AnyKV } from '@/types'

export interface PrettyStacktrace {
    message?: string
    name?: string

    stack: {
        at: string
        pos: string
        file: string | null
    }[]
}

export type ApiEnvelope<T> = {
    id?: number // in websocket only.
} & ({
    ok: true
    result: T
} | {
    ok: false
    reason: string
    description?: string
    stack?: PrettyStacktrace // in debug mode only.
})


export interface MakeApiRequestOptions {
    path: string
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    query?: AnyKV
    body?: AnyKV | AnyKV[]
    via?: 'websocket' | 'http'
    timeout?: number
}

export interface WebSocketStatus {
    state: WebSocketStatusState
    attemptIn: number
    isOnline: boolean
}

export enum WebSocketStatusState {
    CONNECTING,
    CONNECTED,
    WAITING
}

export class ApiException extends Error {
    code: string
    description?: string
    errorUuid = '00000000-0000-0000-00000000'

    constructor (code: string, description?: string) {
        super('API Error: ' + code)

        this.code = code
        this.description = description
    }
}

export type WebSocketRPCOut = {
    id?: number
} & (({ act: 'api' } & MakeApiRequestOptions))

export interface WebSocketRPCIn {
    act: 'push'
    id: number | number[]
    type: 'C' | 'U' | 'D'
    topics?: string[]
    progress?: number
    data?: any
}

export type IPCEvent = {
    act: 'TAB_OPEN'
    id: number
} | {
    act: 'WS_RPC'
    data: WebSocketRPCIn
} | {
    act: 'WS_STATUS'
    master: number
    status: WebSocketStatus
} | {
    act: 'API_REQUEST'
    options: MakeApiRequestOptions & { id: number, tabId: number }
} | {
    act: 'API_RESPONSE'
    data: ApiEnvelope<any>
    tabId: number
    id: number
} | {
    act: 'WS_RECONNECT'
} | {
    act: 'RELOAD'
} | {
    act: 'MASTER_CHANGED'
} | {
    act: 'TAB_VISIBILITY'
    id: number
    visible: boolean
} | {
    act: 'LANGUAGE'
    lang: string
}

export type ExtractIpcData<A, T> = A extends { act: T } ? { [K in Exclude<keyof A, 'act'>]: A[K] } : never

export interface SessionTab {
    id: number
    master: boolean
}

export type DataAdapter<F, T> = (input: F) => T

export type PaginatedData<T> = {
    items: T[]
    // when nullish EOS is inferred
    next?: any
}

export interface Pagination {
    offset?: number
    limit?: number
}

export interface PaginationSort extends Pagination {
    sort?: string
}

export interface PaginatedResponse<T> {
    count: number
    items: T[]
}
