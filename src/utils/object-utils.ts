import { AnyKV } from '@/types'

/**
 * Returns whether an object is a POJO
 * (probably created by an object literal)
 *
 * @param obj  Object to check
 */
export function isPojo (obj: any): obj is AnyKV {
    return obj && typeof obj === 'object' && obj.constructor === Object
}

/**
 * Returns whether an object is an array
 *
 * @param obj  Object to check
 */
export function isArray<T = any> (obj: any): obj is Array<T> {
    return obj && typeof obj === 'object' && Array.isArray(obj)
}


export function shallowClone<T extends AnyKV> (target: T): T
export function shallowClone<T extends AnyKV> (target: T, condition?: (key: string, value: any) => boolean): Partial<T>

export function shallowClone<T extends AnyKV> (target: T, condition?: (key: string, value: any) => boolean): Partial<T> {
    let ret: AnyKV = {}

    Object.entries(target).forEach(([k, v]) => {
        if (condition && !condition(k, v)) return
        ret[k] = v
    })

    return ret as any
}

export function shallowCloneAndTransform<T extends AnyKV> (
    target: T, params?: {
        condition?: (key: string, value: any) => boolean
        transformer?: (key: string, value: any) => any
    }
): Partial<T> {
    let ret: AnyKV = {}

    Object.entries(target).forEach(([k, v]) => {
        if (params?.condition && !params?.condition(k, v)) return
        ret[k] = params?.transformer?.(k, v) ?? v
    })

    return ret as any
}


/**
 * Creates a deep copy of `target`
 *
 * @param target  Object to be copied
 * @param condition  If passed, only attributes that return true from this func will be added.
 */
export function clone<T> (target: T, condition?: (key: string, value: any) => boolean): T {
    if (target === null) {
        return target
    }
    if (target instanceof Date) {
        return new Date(target.getTime()) as any
    }
    if (target instanceof Array) {
        const cp = [] as any[];
        (target as any[]).forEach((v) => {
            cp.push(v)
        })
        return cp.map((n: any) => clone<any>(n)) as any
    }
    if (isPojo(target)) {
        const cp = { ...(target as { [key: string]: any }) } as { [key: string]: any }
        Object.keys(cp).forEach(k => {
            if (condition && !condition(k as any, cp[k])) {
                return
            }

            cp[k] = clone<any>(cp[k])
        })
        return cp as T
    }
    return target
}

const emptySet = new Set<string>()


/**
 * Merges all `mixins` to `original` object deeply and consequently
 *
 * @param original  Original object
 * @param mixins  List of mixins
 * @param ignore  Properties to ignore while merging mixins
 * @param onlyMissing  Merge only properties that are missing in original
 */
export function merge<T extends AnyKV, M extends AnyKV> (
    original: T,
    mixins: M | M[],
    ignore: Set<string> | string[] = [],
    onlyMissing = false
): T & M {
    if (!Array.isArray(mixins)) mixins = [mixins]
    if (Array.isArray(ignore)) {
        ignore = ignore.length === 0 ? emptySet : new Set(ignore)
    }

    let t = ignore.size > 0

    for (const mixin of mixins) {
        for (const key of Object.keys(mixin)) {
            if (t && ignore.has(key)) continue

            if (key in original) {
                if (onlyMissing) continue
                if (isPojo(original[key]) && isPojo(mixin[key])) {
                    merge(original[key], mixin[key], ignore)
                } else if (isArray(original[key])) {
                    if (isArray(mixin[key])) {
                        original[key].push(...mixin[key])
                    } else {
                        original[key].push(mixin[key])
                    }
                } else {
                    (original as any)[key] = mixin[key]
                }
            } else {
                (original as any)[key] = mixin[key]
            }
        }
    }

    return original as T & M
}

/**
 * Similar to `merge()`, but instead creates a deep copy while merging.
 *
 * @param original  Original object
 * @param mixins  Mixins for that object
 */
export function mergeClone<T extends AnyKV, M extends AnyKV> (original: T, ...mixins: M[]): T & M {
    original = clone(original)
    for (const mixin of mixins) {
        for (const key of Object.keys(mixin)) {
            if (key in original) {
                if (isPojo(original[key]) && isPojo(mixin[key])) {
                    (original as any)[key] = mergeClone(original[key], mixin[key])
                } else if (isArray(original[key])) {
                    if (isArray(mixin[key])) {
                        original[key].push(...mixin[key])
                    } else {
                        original[key].push(mixin[key])
                    }
                } else {
                    (original as any)[key] = mixin[key]
                }
            }
        }
    }

    return original as T & M
}

export function deepEqual<T> (a: T | T[], b: T | T[], ignoreArrayOrder = false, ignoreFields: string[] = []): boolean {
    if (a === b) return true
    if (typeof a !== typeof b) return false

    let t = ignoreFields.length > 0

    if (Array.isArray(a) && Array.isArray(b)) {
        if (ignoreArrayOrder) {
            a = a.slice(0).sort()
            b = b.slice(0).sort()
        }

        if (a.length !== b.length) {
            return false
        }

        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false
        }
        return true
    }

    if (isPojo(a) && isPojo(b)) {
        let aKeys = Object.keys(a)
        if (t) aKeys = aKeys.filter(i => ignoreFields.indexOf(i) === -1)

        let bKeys = Object.keys(b)
        if (t) aKeys = aKeys.filter(i => ignoreFields.indexOf(i) === -1)

        if (aKeys.length !== bKeys.length) return false

        for (let i = 0; i < aKeys.length; i++) {
            let k = aKeys[i]
            if (!deepEqual((a as any)[k], (b as any)[k])) return false
        }
        return true
    }

    // true if both NaNs, false otherwise
    return a !== a && b !== b
}

export function groupBy<T> (ar: T[], grouper: (it: T) => string): Record<string, T[]> {
    let ret: Record<string, T[]> = {}

    ar.forEach((it) => {
        let key = grouper(it)
        if (!ret[key]) {
            ret[key] = []
        }
        ret[key].push(it)
    })

    return ret
}

/**
 * Similar to python's `enumerate()`.
 * Returns a generator, which for each element from `iterable` generates
 * a pair of `i, item` where `i` is `item`'s index in `iterable`
 *
 * @param iterable  Iterable to enumerate
 */
export function * enumerate<T> (iterable: Iterable<T>): Generator<[number, T]> {
    let i = 0

    for (const x of iterable) {
        yield [i, x]
        i++
    }
}


/**
 * Removes properties `properties` from an object by setting them to undefined
 * Can optionally use `delete` operator to do that (slightly slower)
 *
 * @param obj  Original object
 * @param properties  Properties to be stripped
 * @param useDelete  Whether to use `delete` operator
 */
export function strip<T extends AnyKV> (obj: T, properties: (string | number)[], useDelete = false): T {
    if (obj instanceof Array) {
        obj.map(i => strip(i, properties, useDelete))
    } else {
        properties.forEach((prop) => {
            if (prop in obj) {
                if (useDelete) {
                    delete obj[prop]
                } else {
                    (obj as any)[prop] = undefined
                }
            }
        })
    }

    return obj
}


/**
 * Returns a new object that only contains properties `properties` of `obj`
 *
 * @param obj  Original object
 * @param properties  Properties to be in new object
 */
export function leave<T extends AnyKV> (obj: T, properties: (string | number)[]): Partial<T> {
    let newObj: AnyKV = {}
    if (obj instanceof Array) {
        obj.map(i => leave(i, properties))

        return obj
    } else {
        properties.forEach((prop) => {
            if (prop in obj) {
                newObj[prop] = obj[prop]
            }
        })

        return newObj as Partial<T>
    }
}


export function findCommon (a: AnyKV, b: AnyKV): AnyKV {
    let ret: AnyKV = {}

    Object.entries(a).forEach(([k, v]) => {
        if (typeof b[k] === 'object' && deepEqual(b[k], v)) {
            ret[k] = v
        } else if (b[k] === v) {
            ret[k] = v
        }
    })

    return ret
}


/**
 * Returns unique items from `array`, inferred from
 * `selector`'s return value (by default unique by itself)
 *
 * @param array
 * @param selector
 */
export function uniqueBy<T> (array: T[], selector: (obj: T) => any = (i: T): T => i): T[] {
    let seen = new Set<T>()
    let out: T[] = []
    let len = array.length
    let j = 0
    for (let i = 0; i < len; i++) {
        let item = array[i]
        let sel = selector(item)
        if (!seen.has(sel)) {
            seen.add(sel)
            out[j++] = item
        }
    }
    return out
}

/**
 * Similar to [].indexOf, but instead searches for the first item for which `selector` returns true
 *
 * @param array
 * @param selector
 */
export function indexOfBy<T> (array: T[], selector: (obj: T) => boolean): number {
    for (let i = 0; i < array.length; i++) {
        if (selector(array[i])) return i
    }
    return -1
}

/**
 * Returns generator of chunks of size `size` from array `arr`
 *
 * @param arr  Original array
 * @param size  Single chunk size
 */
export function * chunks<T> (arr: T[], size: number): Generator<T[]> {
    for (let i = 0; i < arr.length; i += size) {
        yield arr.slice(i, i + size)
    }
}

/**
 * Returns array of chunks of size `size` from array `arr`
 *
 * @param arr  Original array
 * @param size  Single chunk size
 */
export function chunksArray<T> (arr: T[], size: number): T[][] {
    return Array.from(chunks(arr, size))
}

/**
 * Returns shallow difference of object `modified` compared to `obj`,
 * in a way that `merge(obj, diff)` deeply equals `modified`
 *
 * @param obj  Object that is used as a base
 * @param modified  Object that is derived from base
 * @param ignoreValues  Values to be ignored when diffing
 */
export function shallowDiff<T extends AnyKV> (obj: T, modified: T, ignoreValues: any[] = []): Partial<T> {
    let ret: Partial<T> = {}

    for (let [key, value] of Object.entries(modified)) {
        if (ignoreValues.indexOf(value) > -1) continue
        if (!(key in obj) || obj[key] !== value) {
            (ret as any)[key] = value
        }
    }

    return ret
}

export type KeyDelegate<T> = (obj: T) => any

export function createIndex<T, M extends keyof T> (arr: T[], key: M | KeyDelegate<T>): Record<any, T> {
    let ret: Record<any, T> = {} as any

    if (typeof key === 'string') {
        let k = key
        key = (obj: T): T[M] => obj[k]
    }

    for (let item of arr) {
        ret[(key as KeyDelegate<T>)(item)] = item
    }

    return ret
}

export function sum (arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0)
}

export function arrayMove<T> (array: T[], fromIndex: number, toIndex: number): T[] {
    while (fromIndex < 0) fromIndex += array.length
    while (toIndex < 0) toIndex += array.length

    return array.splice(toIndex, 0, array.splice(fromIndex, 1)[0])
}

export function includesAll<T> (haystack: T[], needles: T[]): boolean {
    return needles.every(i => haystack.indexOf(i) > -1)
}
