import Vue from 'vue'

interface VResponsiveness {
    screenWidth: number
    screenHeight: number
    isMobileByWidth: boolean
    isDesktopByWidth: boolean
    // (should be) true when mobile device is in landscape
    isMobileByAspectRatio: boolean

    isIphone: boolean
    isTouchDevice: boolean
    isPwa: boolean
}

const isTouchDevice = function (): boolean {
    // because windows touch support stinks
    if (navigator.userAgent.match(/Windows NT/i)) return false;

    const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ')

    let mq = function (query: string): boolean {
        return window.matchMedia(query).matches
    }

    if ('ontouchstart' in window
        || (navigator.maxTouchPoints > 0)
        || (navigator.msMaxTouchPoints > 0)
        || (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch) {
        return true
    }

    let query = prefixes.map(i => `(${i}touch-enabled)`).join(',')
    return mq(query)
}

export const r12s = Vue.observable<VResponsiveness>({
    screenHeight: window.innerHeight,
    screenWidth: window.innerWidth,
    isMobileByWidth: window.innerWidth <= 480,
    isDesktopByWidth: window.innerWidth > 480,
    isTouchDevice: isTouchDevice(),
    isMobileByAspectRatio: window.innerHeight > window.innerWidth,
    isPwa: (window.matchMedia?.('(display-mode: standalone)').matches) || ((window.navigator as any).standalone) || document.referrer.includes('android-app://'),
    isIphone: !!navigator.userAgent.match(/iPhone/i)
})

Vue.use({
    install (vm) {
        vm.prototype.$r12s = r12s

        if (r12s.isTouchDevice) {
            document.documentElement.classList.add('touch')
        }

        window.addEventListener('resize', () => {
            r12s.screenHeight = window.innerHeight
            r12s.screenWidth = window.innerWidth
            r12s.isMobileByWidth = window.innerWidth <= 480
            r12s.isDesktopByWidth = window.innerWidth > 480
            r12s.isMobileByAspectRatio = window.innerHeight > window.innerWidth
        })
    }
})

declare module 'vue/types/vue' {
    interface Vue {
        $r12s: VResponsiveness
    }
}
