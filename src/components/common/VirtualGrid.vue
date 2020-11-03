<template>
    <div
        v-intersect="onVisibilityChange"
        :class="{
            ready
        }"
        class="virtual-grid__wrap"
        @scroll.passive="onScroll"
    >
        <div
            :style="style"
            class="virtual-grid"
        >
            <div
                v-for="cell in visiblePool"
                :key="cell.id"
                :style="cellStyle(cell.index)"
                class="virtual-grid__cell"
            >
                <slot
                    :index="cell.index"
                    :item="items[cell.index]"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
// heavily based on https://github.com/Akryum/vue-virtual-scroller/blob/master/src/components/RecycleScroller.vue
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import scrollParent from 'scrollparent'
import { Throttled } from '@/utils/function-utils'

let uid = 0

interface GridCell {
    id: number
    index: number
}

interface ScrollState {
    start: number
    end: number
}

interface Point {
    x: number
    y: number
}

@Component({})
export default class VirtualGrid extends Vue {
    @Prop({ type: Array, required: true }) items!: any[]
    @Prop({ type: Number, default: 3 / 2 }) aspectRatio!: number
    @Prop({ type: Number, default: 2 }) minColumns!: number
    @Prop({ type: Number, default: 6 }) maxColumns!: number
    @Prop({ type: Number, default: 1 }) rows!: number
    @Prop({ type: Number, default: -1 }) fixedHeight!: number
    @Prop({ type: Number, default: -1 }) fixedWidth!: number
    @Prop({ type: Number, default: 0 }) gapX!: number
    @Prop({ type: Number, default: 0 }) gapY!: number
    @Prop({ type: Number, default: 150 }) minCellWidth!: number
    @Prop({ type: Number, default: 150 }) minCellHeight!: number
    @Prop({ default: 'vertical' }) direction!: 'horizontal' | 'vertical'
    @Prop({ type: Boolean, default: true }) pageMode!: boolean

    pool: GridCell[] = []
    ready = false
    listenerTarget: EventTarget | null = null
    refreshTimout: number | null = null
    innerHeight = 0
    innerWidth = 0
    totalWidth = 0
    totalHeight = 0

    prevStartIndex = 0
    prevEndIndex = 0

    scrollDirty = false


    get visiblePool (): GridCell[] {
        return this.pool.filter(it => it.index < this.items.length)
    }

    get style (): Partial<CSSStyleDeclaration> {
        return {
            height: this.totalHeight + 'px',
            width: this.totalWidth + 'px'
        }
    }

    get cellWidth (): number {
        if (this.fixedWidth !== -1) return this.fixedWidth
        return Math.max(Math.floor((this.innerWidth + this.gapX) / this.columnCount) - this.gapX, 0)
    }

    get cellHeight (): number {
        if (this.fixedHeight !== -1) return this.fixedHeight
        return Math.floor(this.cellWidth * this.aspectRatio)
    }

    get columnCount (): number {
        if (this.direction === 'vertical') {
            let abs = Math.floor(this.innerWidth / this.minCellWidth)
            return Math.min(Math.max(abs, this.minColumns), this.maxColumns)
        } else {
            return Math.ceil(this.items.length / this.rowCount)
        }
    }

    get rowCount (): number {
        if (this.direction === 'horizontal') {
            return this.rows
        } else {
            return Math.ceil(this.items.length / this.columnCount)
        }
    }

    cellStyle (index: number): Partial<CSSStyleDeclaration> {
        let pos = this.cellPosition(index)
        return {
            width: this.cellWidth + 'px',
            height: this.cellHeight + 'px',
            // transform: `matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ${pos.x}, ${pos.y}, 0, 1)`
            transform: `translate(${pos.x}px, ${pos.y}px)`
        }
    }

    cellPosition (index: number): Point {
        return {
            x: (this.cellWidth + this.gapX) * (this.direction === 'vertical' ? index % this.columnCount : Math.floor(index / this.rowCount)),
            y: (this.cellHeight + this.gapY) * (this.direction === 'horizontal' ? index % this.rowCount : Math.floor(index / this.columnCount))
        }
    }

    mounted (): void {
        this.applyPageMode()
        this.$nextTick(() => {
            this.onResize()
            this.updateVisibleItems()
            this.ready = true
        })
    }

    beforeDestroy (): void {
        this.removeListeners()
    }

    notifyUpdateVisibility (si: number, ei: number, scroll: ScrollState): void {
        const psi = this.prevStartIndex
        const pei = this.prevEndIndex

        // for all items in both render distances (prev & current)
        for (let i = Math.min(psi, si); i < Math.max(pei, ei); i++) {
            // check if they are in viewport
            const { x, y } = this.cellPosition(i)
            const coord = this.direction === 'horizontal' ? x : y
            const size = this.direction === 'horizontal' ? this.cellWidth : this.cellHeight
            const visible = coord + size >= scroll.start && coord <= scroll.end

            this.$emit('visibilitychange', {
                index: i,
                item: this.items[i],
                visible
            })
        }
    }

    updateVisibleItems (forceNotify = false): { continuous: boolean } {
        const count = this.items.length
        let startIndex = 0
        let endIndex = 0

        const scroll = this.getScroll()

        let size = this.direction === 'vertical' ? this.cellHeight + this.gapY: this.cellWidth + this.gapX

        let startMainAxis = ~~(scroll.start / size) - 2
        let endMainAxis = Math.ceil(scroll.end / size) + 2

        let secondaryAxisCount = this.direction === 'vertical' ? this.columnCount : this.rowCount

        startIndex = Math.max(0, startMainAxis * secondaryAxisCount)
        endIndex = Math.min(count, endMainAxis * secondaryAxisCount)

        if (this.$listeners.visibilitychange && (this.prevStartIndex !== startIndex || this.prevEndIndex !== endIndex) || forceNotify) {
            this.notifyUpdateVisibility(startIndex, endIndex, scroll)
        }

        const continuous = startIndex <= this.prevEndIndex && endIndex >= this.prevStartIndex

        let lastCell = 0
        const findCellFor = (index: number): void => {
            for (let j = lastCell; j < this.pool.length; j++) {
                let cell = this.pool[j]
                if (cell.index < startIndex || cell.index > endIndex) {
                    // we found a cell that is currently invisible
                    lastCell = j + 1
                    cell.index = index
                    return
                }
            }
            // we couldnt find a spare cell, thus creating one
            this.pool.push({
                id: uid++,
                index
            })
            lastCell++
        }

        let present: Record<number, boolean> = {}
        for (let i = 0; i < this.pool.length; i++) {
            let cell = this.pool[i]
            if (startIndex <= cell.index && cell.index < endIndex) {
                present[cell.index] = true
            }
        }
        for (let i = startIndex; i < endIndex; i++) {
            if (!present[i]) {
                findCellFor(i)
            }
        }

        this.prevStartIndex = startIndex
        this.prevEndIndex = endIndex

        return { continuous }
    }

    @Watch('pageMode')
    applyPageMode (): void {
        if (this.pageMode) {
            this.addListeners()
        } else {
            this.removeListeners()
        }
    }

    getListenerTarget (): EventTarget {
        let target: any = scrollParent(this.$el)
        // Fix global scroll target for Chrome and Safari
        if (window.document && (target === window.document.documentElement || target === window.document.body)) {
            target = window
        }
        return target
    }

    addListeners (): void {
        this.listenerTarget = this.getListenerTarget()
        this.listenerTarget.addEventListener('scroll', this.onScroll, {
            passive: true
        })
        this.listenerTarget.addEventListener('resize', this.onResize)
    }

    removeListeners (): void {
        if (!this.listenerTarget) {
            return
        }
        this.listenerTarget.removeEventListener('scroll', this.onScroll)
        this.listenerTarget.removeEventListener('resize', this.onResize)
        this.listenerTarget = null
    }

    getScroll (): ScrollState {
        let scrollState: ScrollState
        const isVertical = this.direction === 'vertical'
        if (this.pageMode) {
            const bounds = this.$el.getBoundingClientRect()
            let boundsSize = isVertical ? bounds.height : bounds.width
            let start = -(isVertical ? bounds.top : bounds.left)
            let size = isVertical ? window.innerHeight : window.innerWidth
            if (boundsSize === 0) boundsSize = size
            if (start < 0) {
                size += start
                start = 0
            }
            if (start + size > boundsSize) {
                size = boundsSize - start
            }
            scrollState = {
                start,
                end: start + size
            }
        } else if (isVertical) {
            scrollState = {
                start: this.$el.scrollTop,
                end: this.$el.scrollTop + this.$el.clientHeight
            }
        } else {
            scrollState = {
                start: this.$el.scrollLeft,
                end: this.$el.scrollLeft + this.$el.clientWidth
            }
        }
        return scrollState
    }

    @Watch('items')
    onResize (): void {
        this.$emit('resize')

        this.innerHeight =
            !this.pageMode || this.direction === 'horizontal'
                ? (this.$el as HTMLDivElement).clientHeight
                : window.innerHeight
        this.innerWidth =
            !this.pageMode || this.direction === 'vertical'
                ? (this.$el as HTMLDivElement).clientWidth
                : window.innerWidth

        this.totalWidth = Math.max(0, (this.cellWidth + this.gapX) * this.columnCount - this.gapX)
        this.totalHeight = Math.max(0, (this.cellHeight + this.gapY) * this.rowCount - this.gapY)

        if (this.ready) {
            this.updateVisibleItems(true)
        }
    }

    @Throttled({ delay: 50, before: true })
    onScroll (): void {
        if (!this.scrollDirty) {
            this.scrollDirty = true
            requestAnimationFrame(() => {
                this.scrollDirty = false
                const { continuous } = this.updateVisibleItems()

                if (!continuous) {
                    if (this.refreshTimout) {
                        clearTimeout(this.refreshTimout)
                    }
                    this.refreshTimout = setTimeout(this.onScroll, 100) as any
                }
            })
        }
    }

    onVisibilityChange (entries: IntersectionObserverEntry[], observer: IntersectionObserver, isVisible: boolean): void {
        const entry = entries[0]
        if (this.ready) {
            if (isVisible || entry.boundingClientRect.width !== 0 || entry.boundingClientRect.height !== 0) {
                this.$emit('visible')
                requestAnimationFrame(() => {
                    this.updateVisibleItems()
                    this.onResize()
                })
            } else {
                this.$emit('hidden')
            }
        }
    }
}
</script>

<style lang="scss">
.virtual-grid {
    position: relative;

    &__cell {
        position: absolute;
    }
}
</style>
