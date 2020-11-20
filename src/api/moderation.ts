import { makeApiRequest } from './internal/request'
import { ModerationStatistics, PlayerMeta, Report } from '@/types/moderation'
import { Translation } from '@/types/translation'
import { PaginatedResponse, Pagination, PaginationSort } from '@/types/api'
import { DeleteResult } from '@/types/misc'

export function submitTranslation (translation: Partial<Translation>): Promise<Translation> {
    return makeApiRequest({
        path: '/v2/submit/new',
        body: translation,
        timeout: 10000 // because looking up duplicates can be a bit slow, xd
    })
}

export function submitReport (report: Partial<Report>): Promise<Report> {
    return makeApiRequest({
        path: '/v2/submit/report',
        body: report
    })
}

export function reopenReport (id: number): Promise<void> {
    return makeApiRequest({
        path: `/v2/reports/${id}/reopen`
    })
}

export function getSubmittedTranslations (pagination?: PaginationSort): Promise<PaginatedResponse<Translation>> {
    return makeApiRequest({
        path: '/v2/submissions',
        query: pagination
    })
}

export function getSubmittedReports (pagination?: Pagination): Promise<PaginatedResponse<Report>> {
    return makeApiRequest({
        path: '/v2/reports',
        query: pagination
    })
}

// im like reaally bad at naming. these <Recently> are for moderators
export function getRecentlySubmittedTranslations (pagination?: Pagination, all = false): Promise<PaginatedResponse<Translation>> {
    return makeApiRequest({
        path: '/v2/submissions/recent',
        query: { ...pagination, all },
        timeout: 15000 // slow yep
    })
}

export function getRecentlySubmittedReports (complex: boolean | undefined, pagination?: Pagination): Promise<PaginatedResponse<Report>> {
    return makeApiRequest({
        path: '/v2/reports/recent',
        query: { complex, ...pagination },
        timeout: 15000 // slow yep
    })
}

export function getTranslationsInGroup (group: string, pagination?: Pagination): Promise<PaginatedResponse<Translation>> {
    return makeApiRequest({
        path: `/v2/translations/inGroup/${group}`,
        query: {
            group,
            ...(pagination || {})
        },
        timeout: 15000 // slow yep
    })
}

export function deleteTranslationsInGroup (group: string): Promise<DeleteResult> {
    return makeApiRequest({
        path: '/v2/translations',
        method: 'DELETE',
        query: {
            groups: group
        }
    })
}

export function updateTranslation (id: number, params: Partial<Translation>): Promise<Translation> {
    return makeApiRequest({
        path: `/v2/translations/${id}`,
        body: params
    })
}

export function deleteTranslation (id: number): Promise<void> {
    return makeApiRequest({
        path: `/v2/translations/${id}`,
        method: 'DELETE'
    })
}

export function deleteMultipleTranslations (ids: number[]): Promise<void> {
    return makeApiRequest({
        path: '/v2/translations',
        method: 'DELETE',
        query: {
            ids: ids.join(',')
        }
    })
}

export function updateMultipleTranslations (ids: number[], data: Partial<Translation>): Promise<void> {
    return makeApiRequest({
        path: '/v2/translations',
        method: 'PATCH',
        query: {
            ids: ids.join(',')
        },
        body: data
    })
}

export function deleteReport (id: number): Promise<void> {
    return makeApiRequest({
        path: `/v2/reports/${id}`,
        method: 'DELETE'
    })
}

export function makeReportComplex (id: number): Promise<void> {
    return makeApiRequest({
        path: `/v2/reports/${id}/makeComplex`
    })
}

// actually it does not return translation, teehee
export function resolveReport (id: number, edit?: Partial<Translation>): Promise<Translation> {
    return makeApiRequest({
        path: `/v2/reports/${id}/resolve`,
        body: edit,
        method: 'POST'
    })
}

export function resolveReportDelete (id: number): Promise<void> {
    return makeApiRequest({
        path: `/v2/reports/${id}/delete`,
        method: 'POST'
    })
}

export function discardReport (id: number): Promise<Report> {
    return makeApiRequest({
        path: `/v2/reports/${id}/discard`,
        method: 'POST'
    })
}

export function declineTranslation (id: number, reason = ''): Promise<Translation> {
    return makeApiRequest({
        path: `/v2/submissions/${id}/decline`,
        method: 'POST',
        query: { reason }
    })
}

export function acceptTranslation (id: number, edit?: Partial<Translation>): Promise<Translation> {
    return makeApiRequest({
        path: `/v2/submissions/${id}/accept`,
        body: edit
    })
}

export function getDeclineReason (id: number): Promise<string | null> {
    return makeApiRequest({
        path: `/v2/translations/${id}/declineReason`
    })
}

export function getModerationStatistics (): Promise<ModerationStatistics> {
    return makeApiRequest({
        path: '/v2/moderation/statistics'
    })
}

export function getPlayerMeta (translationId: number): Promise<PlayerMeta | null> {
    return makeApiRequest({
        path: `/v2/translations/${translationId}/playerMeta`
    })
}
