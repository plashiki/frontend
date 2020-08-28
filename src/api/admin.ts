import { Parser, ParsersState, StatisticsDay } from '@/types/misc'
import { makeApiRequest } from '@/api/index'
import { PaginatedResponse, PaginationSort } from '@/types/api'
import { User } from '@/types/user'

export function getRawStatistics (dateFrom: string, dateTo: string): Promise<StatisticsDay[]> {
    return makeApiRequest({
        path: '/v2/admin/statistics',
        query: {
            from: dateFrom,
            to: dateTo
        }
    })
}

export function getUsersList (pagination: PaginationSort): Promise<PaginatedResponse<User>> {
    return makeApiRequest({
        path: '/v2/admin/users/list',
        query: pagination
    })
}

export interface UpdateBudgetParams {
    type: 'donation' | 'expense'
    amount: number
    comment: string
    date: string
}

export function updateBudget (params: UpdateBudgetParams): Promise<void> {
    return makeApiRequest({
        path: '/v2/admin/budget',
        body: params
    })
}

export function getParsers (pagination: PaginationSort, search = ''): Promise<PaginatedResponse<Parser>> {
    return makeApiRequest({
        path: '/v2/parsers/list',
        query: {
            ...pagination,
            search
        }
    })
}

export function toggleParsers (uids: string[], action: 'enable' | 'disable'): Promise<void> {
    return makeApiRequest({
        path: `/v2/parsers/${action}`,
        query: { uids: uids.join(',') }
    })
}

export function getParsersState (): Promise<ParsersState | null> {
    return makeApiRequest({
        path: '/v2/parsers/state'
    })
}

export function startParsers (kind: string, only: string[] = []): Promise<void> {
    return makeApiRequest({
        path: '/v2/parsers/start',
        query: { kind, only: only.length ? only.join(',') : undefined }
    })
}
