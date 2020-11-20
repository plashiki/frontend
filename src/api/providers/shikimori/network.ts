import { AnyKV } from '@/types'
import { ApiException } from '@/types/api'
import { makeApiRequest } from '@/api/internal/request'
import { configStore } from '@/store'
import qs from "querystring"
import { isProduction } from '@/config'
import { DEBUG } from '@/utils/debug'
import axios from 'axios'
import { isPojo } from '@/utils/object-utils'

export interface ShikimoriApiCallParams {
    endpoint: string
    httpMethod?: string
    params?: AnyKV
    query?: AnyKV
    body?: AnyKV | string
    api?: false

    needAuth?: boolean
}

export class ShikimoriApiError extends ApiException {
    constructor (code: number | string, message?: string) {
        super('SHIKIMORI_ERROR', `${code}:${message ?? ''}`)
    }
}

export async function shikimoriApi<T> (
    params: ShikimoriApiCallParams
): Promise<T> {
    if (params.needAuth) {
        return makeApiRequest({
            path: '/v2/auth/proxy/shikimori',
            body: params
        })
    }

    let url = configStore.shikimoriApiEndpoint

    url += params.endpoint

    // ?/autocomplete is a ratelimit bypass xdd
    // https://github.com/shikimori/shikimori/blob/master/config/initializers/rack-attack.rb#L31
    // morr plz leave this as a feature, lol


    if (params.query) {
        url += `?${qs.stringify(params.query)}&${Date.now()}/autocomplete`
    } else {
        url += `?${Date.now()}/autocomplete`
    }

    let headers: AnyKV = {}

    if (!isProduction) {
        DEBUG.prov(`>>> (SHIKI): ${params.httpMethod ?? 'GET'} ${url}`, params.body)
    }

    if (params.body && params.body !== 'string') {
        headers['Content-Type'] = 'application/json'
        params.body = JSON.stringify(params.body)

    }

    const r = await axios({
        url,
        method: params.httpMethod ?? 'GET' as any,
        timeout: configStore.apiTimeout,
        data: params.body,
        responseType: 'text',
        validateStatus: null as any
    })

    // very uniform api, much handle
    if (r.status >= 400) {
        throw new ShikimoriApiError(r.status, r.data)
    }

    if (!isPojo(r.data) && !Array.isArray(r.data)) {
        try {
            r.data = JSON.parse(r.data)
        } catch (e) {
            throw new ShikimoriApiError(500, 'Invalid JSON response')
        }
    }

    if (!isProduction) {
        DEBUG.prov(`<<< (SHIKI): ${params.httpMethod ?? 'GET'} ${url}`, r.data)
    }

    if (isPojo(r.data)) {
        if ('code' in r.data && 'message' in r.data) {
            throw new ShikimoriApiError(r.data.code, r.data.message)
        }

        if ('error' in r.data) {
            throw new ShikimoriApiError(r.data.error, r.data.error_description)
        }
    }

    return r.data
}
