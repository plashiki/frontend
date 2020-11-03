import { appName } from '@/config'
import { Vue } from 'vue-property-decorator'
import { PaginationSort } from '@/types/api'
import { AnyKV } from '@/types'
import { memoize } from '@/utils/function-utils'

export const titleTemplate = (val: string): string => val ? val + ' - ' + appName : appName
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
export const nop = () => {
    // no-op //
}
export const transparentPixel = 'data:avatar/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

export const userscriptInstalled = () => (window as any).USERSCRIPT_VERSION !== undefined

export function isElementInViewport (el: Element | Vue) {
    if (el instanceof Vue) {
        el = (el as Vue).$el
    }

    const rect = (el as Element).getBoundingClientRect()
    const windowHeight = (window.innerHeight || document.documentElement.clientHeight)
    const windowWidth = (window.innerWidth || document.documentElement.clientWidth)

    const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0)
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0)

    return (vertInView && horInView)
}

export function isPointInsideElement (el: HTMLElement, x: number, y: number) {
    const rect = el.getBoundingClientRect()
    return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom
}

export function setHtmlThemeColor (color: string) {
    let element = document.querySelector('meta[name=theme-color]')
    if (!element) {
        return
    }
    element.setAttribute('content', color)
}

export function once (target: EventTarget, eventName: string, handler: Function): void {
    target.addEventListener(eventName, function wrapHandler (this: any, e: any) {
        handler.call(this, e)

        target.removeEventListener(eventName, wrapHandler)
    })
}

export function formatTime (seconds: number, duration: number) {
    seconds = seconds < 0 ? 0 : seconds
    let s: number | string = Math.floor(seconds % 60)
    let m: number | string = Math.floor(seconds / 60 % 60)
    let h: number | string = Math.floor(seconds / 3600)
    const gm = Math.floor(duration / 60 % 60)
    const gh = Math.floor(duration / 3600)

    if (isNaN(seconds) || seconds === Infinity) {
        h = m = s = '-'
    }

    h = (h > 0 || gh > 0) ? h + ':' : ''

    m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':'

    s = (s < 10) ? '0' + s : s

    return h + m + s
}

export const isLocalStorageSupported = memoize((): boolean =>  {
    try {
        const key = `_LSPROBE_${Date.now()}_`
        const ls = window.localStorage
        if (!ls) return false
        ls.setItem(key, key)
        ls.removeItem(key)

        return true
    } catch (e) {
        return false
    }
})

export function compareVersions (a: string, b: string): number {
    let i
    let diff
    const regExStrip0 = /(\.0+)+$/
    let segmentsA = a.replace(regExStrip0, '')
        .split('.')
    let segmentsB = b.replace(regExStrip0, '')
        .split('.')
    let l = Math.min(segmentsA.length, segmentsB.length)

    for (i = 0; i < l; i += 1) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10)
        if (diff) {
            return diff
        }
    }
    return segmentsA.length - segmentsB.length
}

export function convertDataTableOptionsToPagination (options: AnyKV, enableSorting = false): PaginationSort {
    let ret: PaginationSort = {
        offset: ((options.page ?? 1) - 1) * (options.itemsPerPage ?? 25),
        limit: options.itemsPerPage ?? 25
    }

    if (enableSorting && options.sortBy && options.sortBy.length) {
        let fields = []

        for (let i = 0; i < options.sortBy.length; i++) {
            fields.push((options.sortDesc?.[i] ? '-' : '') + options.sortBy[i])
        }
        ret.sort = fields.join(',')
    }

    return ret
}

export function fixRelativeUrl (url: string, base: string) {
    if (url.startsWith('//')) return 'https:' + url
    if (!url.match(/^https?:\/\//)) return base + url
    return url
}
