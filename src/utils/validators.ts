import { i18n } from '@/plugins/vue-i18n'

export const emailRegex = /^.+@.+$/i
export const emailValidator = (i?: string): boolean | string =>
    i === ''
    || !!i?.match(emailRegex)
    || i18n.t('Pages.Login.InvalidEmail') as string

export const requiredField = (i?: string): boolean | string =>
    !!i
    || i18n.t('Common.Form.ThisFieldIsRequired') as string

export const urlRegex = /^https:\/\/([^@]@+(:[^@]+)?)?([^.:/?]+\.)+[^.:/?]+(:\d+)?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i
export const urlValidator = (i?: string): boolean | string =>
    i === ''
    || !!i?.match(urlRegex)
    || i18n.t('Common.Form.InvalidUrl')
