import iziToast, { IziToastSettings } from 'izitoast'
import { ApiException } from '@/types/api'
import { i18n } from '@/plugins/vue-i18n'

iziToast.settings({
    icon: 'mdi',
    timeout: 2500,
    resetOnHover: true,
    position: 'bottomRight'
})

export function iziToastError (err: ApiException | Error | string, params?: IziToastSettings): void {
    let msg: string
    if (err instanceof ApiException) {
        msg = i18n.t('Api.Errors.' + err.code, err)
    } else if (err instanceof Error) {
        msg = `${err.name}: ${err.message}`
    } else msg = err

    iziToast.error({
        icon: 'mdi mdi-close',
        title: i18n.t('Pages.Error.Occurred'),
        message: msg,
        ...(params || {})
    })
}

export function iziToastSuccess (text?: string, params?: IziToastSettings): void {
    iziToast.success({
        icon: 'mdi mdi-check',
        message: text || i18n.t('Common.Success'),
        ...(params || {})
    })
}
