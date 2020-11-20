import { makeApiRequest } from './internal/request'
import { Galo4ka, User } from '@/types/user'

export function isAuthDataAvailable (type: 'nickname', value: string): Promise<boolean> {
    return makeApiRequest({
        path: '/v2/auth/isAvailable',
        query: {
            [type]: value
        }
    }).then((i: any) => i.available)
}

export function getCurrentUser (): Promise<User> {
    return makeApiRequest({
        path: '/v2/users/@me'
    })
}

export function getUser (id: number): Promise<User> {
    return makeApiRequest({
        path: `/v2/users/${id}`
    })
}

export function getUserBy (field: string, value: string): Promise<User> {
    return makeApiRequest({
        path: '/v2/users',
        query: {
            [field]: value
        }
    })
}

export function getUserGalo4ki (user: User): Galo4ka[] {
    let ret: Galo4ka[] = []

    if (user.banned) {
        return [
            {
                color: 'error',
                icon: 'mdi-block-helper',
                info: 'Items.User.Banned'
            }
        ]
    }

    if ((user.donated ?? 0) >= 300) {
        ret.push({
            color: 'primary',
            icon: 'mdi-star-circle',
            info: 'Items.User.Donator'
        })
    }

    if (user.moderator) {
        ret.push({
            icon: 'mdi-fingerprint',
            info: 'Items.User.Moderator'
        })
    }

    if (user.admin) {
        ret.push({
            icon: 'mdi-wrench',
            info: 'Items.User.Admin'
        })
    }

    return ret
}

export function patchUser (data: Partial<User>, id = 0): Promise<User> {
    return makeApiRequest({
        path: `/v2/users/${id || '@me'}`,
        method: 'PATCH',
        body: data
    })
}

export function disconnectService (service: string): Promise<User> {
    return makeApiRequest({
        path: '/v2/users/@me/disconnect',
        query: { service }
    })
}

export function setUserLanguage (language: string): Promise<void> {
    return makeApiRequest({
        path: '/v2/users/@me/lang',
        query: {
            new: language
        }
    })
}
