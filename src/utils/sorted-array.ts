export type Comparator<T> = (a: T, b: T) => number

// Comparator is always called like:
// comparator(itemFromSortedArray, yourItem)

export default class SortedArray<T> {
    readonly raw: T[]
    comparator: Comparator<T>

    constructor (array: T[] = [], comparator: Comparator<T> = SortedArray.defaultComparator) {
        this.raw = array.sort(comparator)
        this.comparator = comparator
    }

    get length (): number {
        return this.raw.length
    }

    static defaultComparator<T> (a: T, b: T): number {
        if (a === b) return 0
        return a > b ? 1 : -1
    }

    insert (item: T | T[], comparator = this.comparator): number {
        if (Array.isArray(item)) {
            let ind = -1
            item.forEach((it) => {
                ind = this.insert(it)
            })
            return ind
        }

        if (this.raw.length === 0) {
            this.raw.push(item)
            return 0
        }

        // find insert position
        let lo = 0
        let hi = this.raw.length
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2)
            if (comparator(this.raw[mid], item) === 1) {
                hi = mid
            } else {
                lo = mid + 1
            }
        }

        this.raw.splice(lo, 0, item)
        return lo
    }

    index (item: T, comparator = this.comparator): number {
        let lo = 0
        let hi = this.raw.length
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2)
            const cmp = comparator(this.raw[mid], item)
            if (cmp === 0) {
                return mid
            }
            if (cmp === 1) {
                hi = mid
            } else {
                lo = mid + 1
            }
        }
        return -1
    }

    contains (item: T, comparator = this.comparator): boolean {
        return this.index(item, comparator) !== -1
    }

    find (item: T, comparator = this.comparator): T | null {
        const ind = this.index(item, comparator)
        return ind === -1 ? null : this.raw[ind]
    }

    clear (): void {
        this.raw.length = 0
    }
}
