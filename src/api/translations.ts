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

export function getTranslationsFor (mediaId: number, mediaType: MediaType, part?: number): Promise<Translation[]> {
    return makeApiRequest({
        path: `/v2/translations/${mediaType}/${mediaId}` + (part ? '/part/' + part : ''),
        query: {
            raw: '',
            external: 'proto'
        }
    })
}
