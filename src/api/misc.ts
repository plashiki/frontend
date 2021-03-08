import axios from 'axios'
import { User } from '@/types/user'
import { makeApiRequest } from './internal/request'
import { Donation } from '@/types/misc'
import { ApiException } from '@/types/api'
import { imgurClientId } from '@/config'
import { lightFormat } from 'date-fns'
import { i18n } from '@/plugins/vue-i18n'
import { createIndex } from '@/utils/object-utils'
import { isRussian } from '@/utils/i18n'

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

export async function getCurrentMotd (): Promise<string | null> {
    return axios.get('https://raw.githubusercontent.com/plashiki/data/master/motd.xml?_=' + Date.now()).then(({ data }) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(data, 'text/xml')
        const today = lightFormat(new Date(), 'yyyy-MM-dd')

        for (let motd of doc.querySelectorAll('motd')) {
            if (today >= motd.getAttribute('start')! && today <= motd.getAttribute('end')!) {
                let languages = createIndex([...motd.querySelectorAll('text')], i => i.getAttribute('lang')!)
                if (i18n.locale in languages) {
                    return languages[i18n.locale].innerHTML
                }
                if (isRussian(i18n.locale) && 'ru' in languages) {
                    return languages.ru.innerHTML
                }
                if ('en' in languages) {
                    return languages.en.innerHTML
                }
                return languages[Object.keys(languages)[0]].innerHTML
            }
        }

        return null
    })
}
