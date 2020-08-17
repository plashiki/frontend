import { TranslationKind, TranslationLanguage } from '@/types/translation'
import { i18n } from '@/plugins/vue-i18n'
import { ApiNotification, PushNotification } from '@/types/notification'
import { getMediaNames } from '@/api/media'
import { getPreferredName } from '@/utils/media-utils'
import { MediaType } from '@/types/media'

interface NewTranslationFormat {
    mediaId: number
    mediaType: MediaType
    part: number
    kind: TranslationKind
    lang: TranslationLanguage
    author: string
}


export async function getPermission (request = false): Promise<boolean | null> {
    if (typeof Notification === 'undefined') {
        return false
    }
    if (Notification.permission === 'granted') {
        return true
    }
    if (Notification.permission === 'denied') {
        return false
    }
    if (!request) {
        return null
    }
    return Notification.requestPermission()
        .then(p => {
            if (p === 'granted') {
                return true
            }

            if (p === 'default') {
                return null
            }

            return false
        })
        .catch(() => false)
}

export function formatAnimeTranslationMeta (fmt: {
    kind: TranslationKind
    lang: TranslationLanguage
}): string {
    if (i18n.locale === 'ru') {
        let meta = fmt.kind === TranslationKind.Subtitles ? 'с ' : 'в '
        let tran = i18n.t('Items.Translation.Language.' + fmt.lang + fmt.kind) as string
        if (fmt.kind === TranslationKind.Subtitles) {
            if (fmt.lang !== TranslationLanguage.Other) {
                tran = tran.replace('ие ', 'ими ')
            }
            tran = tran.replace('титры', 'титрами')
        } else if (fmt.kind === TranslationKind.Dubbed) {
            if (fmt.lang !== TranslationLanguage.Other) {
                tran = tran.replace('ая ', 'ой ')
            }
            tran = tran.replace('чка', 'чке')
        } else {
            tran = tran.replace('нал ', 'нале ')
        }
        meta += tran.toLowerCase()

        return meta
    } else if (i18n.locale === 'en') {
        let tran = i18n.t('Items.Translation.Language.' + fmt.lang + fmt.kind)
        if (fmt.kind === TranslationKind.Subtitles || fmt.kind === TranslationKind.Dubbed) {
            return 'with ' + tran
        } else {
            return tran
        }
    } else return fmt.lang + fmt.kind
}

export async function prepareNotification (item: ApiNotification<any>): Promise<ApiNotification<any>> {
    let payload = item.payload
    if (payload.type === 'push' || payload.type === 'silent-push') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let { body, format } = payload as PushNotification
        if (body === 'NEW_TRANSLATION_BODY' || body === 'MOD_NEW_TR_BODY') {
            let fmt = format as NewTranslationFormat
            const name = await getMediaNames([fmt.mediaId], fmt.mediaType).then(i => i[fmt.mediaId])
            const mediaName = name ? getPreferredName(name) : ''


            if (fmt.mediaType === 'anime') {
                // ru:
                // N серия «$animeName» [(в/с) $lang $kind] уже доступна! ([..] = $meta)
                // ex.: 9 серия «Kono Subarashii Sekai ni Shukufuku Wo» с русскими субтитрами уже доступна!

                if (body === 'NEW_TRANSLATION_BODY') {
                    payload.body = i18n.t('Items.Notification.Text.NewTranslationBodyAnime', {
                        meta: formatAnimeTranslationMeta(fmt),
                        episode: fmt.part,
                        animeName: mediaName,
                        author: fmt.author
                    })
                }
            }

            if (body === 'MOD_NEW_TR_BODY') {
                payload.body = i18n.t('Items.Notification.Text.NewTranslationModerationBody', {
                    meta: formatAnimeTranslationMeta(format as any),
                    name: mediaName,
                    ...format
                })
            }

            payload.image = `https://shikimori.one/system/${fmt.mediaType}s/original/${fmt.mediaId}.jpg`
            payload.smallImage = `https://shikimori.one/system/${fmt.mediaType}s/preview/${fmt.mediaId}.jpg`
        } else if (body === 'MOD_NEW_REP_BODY') {
            payload.body = i18n.t('Items.Notification.Text.NewReportBody', format)
        }
    }

    return item
}

export function getNotificationTitle (item: ApiNotification<any>): string {
    let payload = item.payload
    if (payload.type === 'push' || payload.type === 'silent-push') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, format } = payload as PushNotification
        if (!title) return ''
        if (title === 'NEW_TRANSLATION') {
            return i18n.t('Items.Notification.Text.NewTranslationTitle')
        } else if (title === 'MOD_NEW_TR') {
            return i18n.t('Items.Notification.Text.NewTranslationModerationTitle', format)
        } else if (title === 'MOD_NEW_REP') {
            return i18n.t(i18n.t('Items.Notification.Text.NewReportTitle', format))
        } else {
            return title
        }
    }
    return ''
}

export function getNotificationBody (item: ApiNotification<any>): string {
    let payload = item.payload
    if (payload.type === 'push' || payload.type === 'silent-push') {
        let { body } = payload as PushNotification
        return body
    } else return ''
}

export function getNotificationIcon (item: ApiNotification<any>): [string, string] | null {
    let payload = item.payload

    // idk...

    return null
}


/**
 * Determines whether a notification should be considered internal (i.e. not displayed to user)
 *
 * @param item
 */
export function isInternalNotification (item: ApiNotification<any>): boolean {
    if (!item.payload) return true

    if (item.payload.type === 'push' || item.payload.type === 'silent-push') return false

    return true
}
