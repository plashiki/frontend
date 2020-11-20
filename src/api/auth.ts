import { makeApiRequest } from './internal/request'
import { isProduction, shikimori } from '@/config'
import { User } from '@/types/user'
import { authStore } from '@/store'
import { registerFirebaseToken, unregisterFirebaseToken } from '@/api/notifications'
import { createWebSocket } from '@/api/internal/websocket'

export interface ShikimoriAuthParams {
    code: string
    nickname?: string
}

export type ShikimoriAuthResponse = {
    state: 'OK'
    user: User
} | {
    state: 'NEED_NICKNAME'
    default: string
}

export function logout (): Promise<any> {
    const prom = makeApiRequest({
        path: '/v2/auth/logout'
    })
    if (authStore.firebaseToken) {
        return Promise.all([
            prom,
            unregisterFirebaseToken(authStore.firebaseToken)
        ])
    }
    return prom
}

export function sendCaptcha (token: string): Promise<void> {
    return makeApiRequest({
        path: '/internal/captcha',
        body: {
            token
        }
    })
}

export function getOauthDialogLink (service: string, then?: string | null): string {
    if (!isProduction) {
        // 2000 iq meme
        return `javascript:(function(){var t=prompt("GET params (without ?)");location.href="${location.protocol}//${location.host}/oauth/${service}?"+t})()`
    }
    if (service === 'shikimori') {
        let url = `${shikimori.authUrl}?client_id=${shikimori.clientId}&redirect_uri=https%3A%2F%2Fplashiki.su%2Foauth%2Fshikimori&response_type=code`
        if (then) {
            url += '&state=then%3D' + encodeURIComponent(then)
        }
        return url
    }
    return '/err404'
}

export function loginVia (service: string): void {
    window.open(getOauthDialogLink(service), '_blank', 'toolbar=0,location=0,menubar=0,height=600,width=450')
}

function _wrapLoginMethod<T> (prom: Promise<T>): Promise<T> {
    return prom.then((user) => {
        // websocket connection must use newly set cookie
        createWebSocket()

        // actually this is only needed first time when we dont yet have sid saved, but its much simpler
        // to sync session each login attempt. anyway logging in is not that thing that you do every so often

        if (authStore.firebaseToken) {
            return registerFirebaseToken(authStore.firebaseToken).then(() => user)
        }

        return user
    })
}

export function doShikimoriAuth (params: ShikimoriAuthParams): Promise<ShikimoriAuthResponse> {
    return _wrapLoginMethod(makeApiRequest<ShikimoriAuthResponse>({
        path: '/v2/auth/login/shikimori',
        body: params,
        timeout: 15000,
        via: 'http' // we need to set http-only cookie
    }))
}
