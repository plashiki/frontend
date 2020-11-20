import {
    ApiEnvelope,
    ApiException,
    MakeApiRequestOptions,
} from '@/types/api'
import { apiEndpoint, experimentalWSApi } from '@/config'
import { DEBUG } from '@/utils/debug'
import { configStore } from '@/store'
import axios, { AxiosResponse } from 'axios'
import { isWebsocketReady, makeWebsocketApiRequest } from '@/api/internal/websocket'


export function makeApiRequestForEnvelope<T = any> (options: MakeApiRequestOptions): Promise<ApiEnvelope<T>> {
    if (options.body !== undefined && options.method === undefined) {
        options.method = 'POST'
    }

    if (options.via === 'websocket'
        // fallback to http in case ws is not ready
        || (experimentalWSApi && options.via !== 'http' && isWebsocketReady())
    ) {
        DEBUG.api('>>> (WS)', options)
        return makeWebsocketApiRequest(options)
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
