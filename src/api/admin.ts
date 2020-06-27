import { StatisticsDay } from '@/types/misc'
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
