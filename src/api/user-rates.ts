import { makeApiRequest } from './internal/request'
import { Leave } from '@/types'
import { UserRate } from '@/types/user-rate'
import { Pagination } from '@/types/api'

export function getUserRates (params: Partial<Leave<UserRate, 'status' | 'target_type' | 'target_id'>> & Pagination): Promise<UserRate[]> {
    return makeApiRequest({
        path: '/v2/user_rates',
        query: params
    })
}

export function getUserRate (id: number | string): Promise<UserRate | null> {
    return makeApiRequest({
        path: '/v2/user_rates/' + id
    })
}

export function updateUserRate (id: number | string, params: Partial<UserRate>): Promise<UserRate> {
    return makeApiRequest({
        path: '/v2/user_rates/' + id,
        body: params
    })
}

export function createUserRate (params: Partial<UserRate>): Promise<UserRate> {
    return makeApiRequest({
        path: '/v2/user_rates',
        body: params
    })
}

export function deleteUserRate (id: number | string): Promise<void> {
    return makeApiRequest({
        path: '/v2/user_rates/' + id,
        method: 'DELETE'
    })
}
