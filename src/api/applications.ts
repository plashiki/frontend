import { OauthApp } from '@/types/misc'
import { makeApiRequest } from './internal/request'

export function getAuthedApplications (): Promise<OauthApp[]> {
    return makeApiRequest({
        path: '/v2/applications/authed'
    })
}

export function getMyApplications (): Promise<OauthApp[]> {
    return makeApiRequest({
        path: '/v2/applications'
    })
}

export function getAllApplications (): Promise<OauthApp[]> {
    return makeApiRequest({
        path: '/v2/applications/all'
    })
}

export function revokeApplicationAuthorization (appId: number): Promise<void> {
    return makeApiRequest({
        path: `/v2/applications/${appId}/revoke/auth`
    })
}

export function revokeApplicationToken (appId: number, field: 'secret' | 'id' | 'both'): Promise<OauthApp> {
    return makeApiRequest({
        path: `/v2/applications/${appId}/revoke/${field}`
    })
}

export function deleteApplication (appId: number): Promise<void> {
    return makeApiRequest({
        path: `/v2/applications/${appId}`,
        method: 'DELETE'
    })
}

export function getApplication (appId: number): Promise<OauthApp> {
    return makeApiRequest({
        path: `/v2/applications/${appId}`
    })
}

export function createApplication (params: Partial<OauthApp>): Promise<OauthApp> {
    return makeApiRequest({
        path: '/v2/applications',
        body: params
    })
}

export function editApplication (appId: number, params: Partial<OauthApp>): Promise<OauthApp> {
    return makeApiRequest({
        path: `/v2/applications/${appId}`,
        method: 'PATCH',
        body: params
    })
}
