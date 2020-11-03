import { Translation } from '@/types/translation'
import { makeApiRequest } from '@/api/index'
import { MediaType } from '@/types/media'

export function getSingleTranslation (id: number): Promise<Translation> {
    return makeApiRequest({
        path: '/v2/translations/' + id
    })
}

export function getTranslations (ids: number[]): Promise<Translation[]> {
    return makeApiRequest({
        path: '/v2/translations',
        query: {
            ids: ids.join(',')
        }
    })
}

export function getAvailableParts (mediaId: number, mediaType: MediaType): Promise<number[]> {
    return makeApiRequest({
        path: `/v2/translations/${mediaType}/${mediaId}/parts`
    })
}
export function getTranslationsFor (mediaId: number, mediaType: MediaType, part?: number): Promise<Translation[]> {
    return makeApiRequest({
        path: `/v2/translations/${mediaType}/${mediaId}` + (part ? '/parts/' + part : ''),
        query: {
            raw: '',
            fullAuthor: '',
            external: 'proto'
        }
    })
}
