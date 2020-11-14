import { Leave } from '@/types/index'
import { Translation } from '@/types/translation'
import { User } from '@/types/user'

export enum ReportType {
    InvalidMedia = 'invalid_media',
    InvalidPart = 'invalid_part',
    InvalidMeta = 'invalid_meta',
    BrokenLink = 'broken_link',
    LegalIssue = 'legal_issue',
    Other = 'other'
}

export enum ReportStatus {
    Pending = 'pending',
    Resolved = 'resolved',
    Discarded = 'discarded'
}

export type EditableTranslationFields = 'kind' | 'lang' | 'target_id' | 'target_type' | 'part' | 'author' | 'url'

export interface Report {
    id: number
    translation_id: number
    type: ReportType | null
    comment: string
    sender_id: number
    status: ReportStatus
    edit: Partial<Leave<Translation, EditableTranslationFields>> | null
    created_at: Date
    updated_at: Date
    is_complex: boolean
    closed_by: User | null
}

export interface ModerationStatistics {
    accepted: number
    declined: number
    reports: number
    edited: number
    deleted: number
}


export interface PlayerMeta {
    title?: string
    description?: string
    uploader?: string
    url?: string
    // ---- //
    error?: string
}
