import axios from 'axios'
import { User } from '@/types/user'
import { makeApiRequest } from '@/api/index'
import { Donation } from '@/types/misc'
import { ApiException } from '@/types/api'
import { imgurClientId } from '@/config'

export async function getDonations (): Promise<Donation[]> {
    const { data } = await axios.get('https://raw.githubusercontent.com/plashiki/data/master/donations.txt?_=' + Date.now(), {
        responseType: 'text'
    })

    return (data as string)
        .trim()
        .split('\n')
        .reverse()
        .map((line) => {
            let m = line.trim().match(/^(.+?)\|([+-])(\d+) ?(.*)$/)

            return {
                date: m?.[1] ?? '?',
                sign: m?.[2] as any ?? '+',
                value: m ? parseInt(m[3]) : 0,
                comment: m?.[4] ?? 'PARSE FAILED'
            }
        })
}


export async function getTopDonators (): Promise<User[]> {
    return makeApiRequest({
        path: '/v2/donators/top'
    })
}


// resolves to image url. may throw IMGUR_ERROR
// progressCallback will be called with upload progress in %
export async function uploadToImgur (file: File, progressCallback?: (progress: number) => void): Promise<string> {
    const form = new FormData()
    form.append('image', file)

    return axios.post('https://api.imgur.com/3/image', form, {
        onUploadProgress (evt: ProgressEvent): void {
            progressCallback?.(Math.round((evt.loaded / evt.total) * 100))
        },
        headers: {
            Authorization: 'Client-ID ' + imgurClientId
        }
    }).then(({ data }) => {
        if (!data.success) {
            throw new ApiException('IMGUR_ERROR', data.data?.error ?? 'Unknown error')
        } else {
            return data.data.link
        }
    })
}
