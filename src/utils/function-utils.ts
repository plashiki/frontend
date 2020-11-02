/* eslint-disable @typescript-eslint/no-this-alias,prefer-rest-params */
import { AnyKV } from '@/types'

export interface DebounceOptions {
    delay: number
    before?: boolean
}

export interface ThrottleOptions {
    delay: number
    before?: boolean
}

/**
 * Simple debounce function, based on lodash.
 *
 * @param func  Func to be debounced
 * @param options  Debounce options - object or number
 */
export function debounce<T extends Function> (func: T, options: number | DebounceOptions): T {
    let timeout: number | null
    if (typeof options === 'number') {
        options = {
            delay: options
        }
    }

    return function (this: any) {
        const self = this
        const args = arguments
        const later = function (): void {
            timeout = null
            if (!(options as DebounceOptions).before) {
                func.apply(self, args)
            }
        }
        const callNow = (options as DebounceOptions).before && !timeout
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, (options as DebounceOptions).delay) as any
        if (callNow) {
            func.apply(self, args)
        }
    } as any
}

export function throttle<T extends Function> (func: T, options: number | DebounceOptions): T {
    let timeout: number | null
    if (typeof options === 'number') {
        options = {
            delay: options
        }
    }

    return function (this: any) {
        if (timeout) {
            return
        }
        const self = this
        const args = arguments
        const later = function (): void {
            timeout = null
            if (!(options as DebounceOptions).before) {
                func.apply(self, args)
            }
        }
        timeout = setTimeout(later, (options as DebounceOptions).delay) as any
        if ((options as DebounceOptions).before) {
            func.apply(self, args)
        }
    } as any
}

export function memoize<T extends Function> (func: T): T {
    const results: AnyKV = {}

    return function (this: any) {
        const args = arguments
        const json = JSON.stringify(args)
        if (json in results) {
            return results[json]
        }
        const ret = func.apply(this, args)
        results[json] = ret
        return ret
    } as any
}

export function Memoized (): MethodDecorator {
    return <T> (target: object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
        if (typeof descriptor.value !== 'function') {
            throw Error('Trying to memoize a non-function')
        }
        descriptor.value = memoize(descriptor.value)
    }
}

export function Debounced (options: number | DebounceOptions): MethodDecorator {
    return <T> (target: object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
        if (typeof descriptor.value !== 'function') {
            throw Error('Trying to debounce a non-function')
        }
        descriptor.value = debounce(descriptor.value, options)
    }
}

export function Throttled (options: number | DebounceOptions): MethodDecorator {
    return <T> (target: object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
        if (typeof descriptor.value !== 'function') {
            throw Error('Trying to debounce a non-function')
        }
        descriptor.value = throttle(descriptor.value, options)
    }
}
