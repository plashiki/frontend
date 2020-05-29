/**
 * Simple client for using IndexedDB as a key-value storage
 */

export default class IndexedDBClient {
    conn: IDBDatabase | null
    name: string

    constructor (name = 'data') {
        this.conn = null
        this.name = name
    }

    connect (): Promise<IDBDatabase> {
        if (this.conn) return Promise.resolve(this.conn)
        const self = this
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(self.name, 1)
            request.onerror = function (err): void {
                reject(err)
            }
            request.onsuccess = function (): void {
                self.conn = request.result
                resolve(request.result)
            }
            request.onupgradeneeded = function (e: IDBVersionChangeEvent): void {
                (e.currentTarget as any)?.result.createObjectStore('data', { keyPath: 'key' })
                resolve(self.connect())
            }
        })
    }

    get<T> (key: string, def: T | null = null): Promise<T | null> {
        return this.connect()
            .then(c => new Promise((resolve, reject) => {
                const tx = c.transaction('data', 'readonly')
                const d = tx.objectStore('data')
                const k = d.get(key)
                k.onsuccess = (e: any): void => {
                    resolve(e.currentTarget.result === undefined ? def : e.currentTarget.result.value)
                }
                k.onerror = reject
            }))
    }

    set<T> (key: string, value: T): Promise<T> {
        return this.connect()
            .then(c => new Promise((resolve, reject) => {
                const tx = c.transaction('data', 'readwrite')
                const d = tx.objectStore('data')
                const k = d.put({
                    key,
                    value
                })
                k.onsuccess = resolve as any
                k.onerror = reject
            }))
    }

    async mutateArray<T> (key: string, mutate: (ar: T[]) => T[] | void): Promise<T[]> {
        const old = await this.get<T[]>(key) ?? []
        const t = await mutate(old)
        return this.set(key, Array.isArray(t) ? t : old)
    }

    pushToArray<T> (key: string, item: T): Promise<T[]> {
        return this.mutateArray(key, it => {
            it.push(item)
        })
    }

    emptyArray<T> (key: string): Promise<T[]> {
        return this.set(key, [])
    }

    removeFromArray<T> (key: string, condition: (item: T) => boolean): Promise<T[]> {
        return this.mutateArray(key, it => it.filter((i => !condition(i))))
    }
}
