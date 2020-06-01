<template>
    <div class="smooth-slide-group--wrap" :style="{ 'max-height': height + 'px' }">
        <div
            v-show="showButtons && (!isBegin || !isEnd)"
            class="smooth-slide-group--btn mr-1"
        >
            <v-btn
                :disabled="isBegin"
                icon
                @click="scroll(-1)"
            >
                <v-icon>
                    mdi-chevron-left
                </v-icon>
            </v-btn>
        </div>
        <div
            class="smooth-slide-group"
            ref="group"
        >
            <slot name="content">
                <div class="smooth-slide-group--items">
                    <slot />
                </div>
            </slot>
        </div>
        <div
            v-show="showButtons && !(isBegin && isEnd)"
            class="smooth-slide-group--btn ml-1"
        >
            <v-btn
                :disabled="isEnd"
                icon
                @click="scroll(1)"
            >
                <v-icon>
                    mdi-chevron-right
                </v-icon>
            </v-btn>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { Spring, SpringSystem } from 'rebound'

@Component({})
export default class SmoothSlideGroup extends Vue {
    @Prop({ type: Number, required: true }) height!: number
    @Prop({ type: Number, required: true }) count!: number

    @Prop({ type: Boolean, default: true }) showButtons!: boolean
    // portion of viewport which will be scrolled for one button click
    @Prop({ type: Number, default: 0.6 }) strength!: number

    @Ref() group!: HTMLDivElement

    isBegin = true
    isEnd = true

    private _springSystem!: SpringSystem
    private _spring!: Spring

    scroll (direction: number, overrideDelta: number | null = null): void {
        let delta = overrideDelta ?? (this.group.clientWidth * this.strength * direction)

        let oldScroll = this._spring.getEndValue()
        let newScroll = oldScroll + delta

        if (newScroll < 0) newScroll = 0
        if (newScroll > this.maxScroll()) newScroll = this.maxScroll()

        this._spring.setEndValue(newScroll)
    }

    maxScroll (): number {
        return this.group.scrollWidth - this.group.offsetWidth
    }

    @Watch('count')
    countChanged (): void {
        this.$nextTick(() => this.updateButtons())
    }

    updateButtons (): void {
        if (!this.group) return

        let s = this.group.scrollLeft

        this.isBegin = s === 0
        this.isEnd = s === this.maxScroll()
    }

    onWheel (e: WheelEvent): void {
        if (e.deltaY > 0 && !this.isEnd || e.deltaY < 0 && !this.isBegin) {
            e.preventDefault()

            let direction = Math.min(Math.max(e.deltaY, -1), 1)
            this.scroll(0, direction * 100)
        }
    }

    mounted (): void {
        this.group.addEventListener('scroll', this.updateButtons)
        this.group.addEventListener('resize', this.updateButtons)
        window.addEventListener('resize', this.updateButtons)
        this.group.parentElement?.addEventListener('resize', this.updateButtons)
        this.group.addEventListener('wheel', this.onWheel)

        this._springSystem = new SpringSystem()
        this._spring = this._springSystem.createSpring(90, 12.5)
        this._spring.setCurrentValue(0)
        this._spring.addListener({
            onSpringUpdate: (spring: Spring) => {
                this.group.scrollLeft = Math.round(spring.getCurrentValue())
            }
        })

        this.$nextTick(() => this.updateButtons())
    }

    beforeDestroyed (): void {
        this.group.removeEventListener('scroll', this.updateButtons)
        window.removeEventListener('resize', this.updateButtons)
        this.group.removeEventListener('resize', this.updateButtons)
        this.group.parentElement?.removeEventListener('resize', this.updateButtons)
        this.group.removeEventListener('wheel', this.onWheel)
    }
}
</script>

<style lang="scss">
.smooth-slide-group {
    overflow-x: scroll;
    width: 100%;
    height: 100%;
    padding-bottom: 15px;

    display: flex;
    flex-grow: 1;
    flex-direction: row;

    &--wrap {
        overflow: hidden;
        margin: 0 auto;
        position: relative;
        display: flex;
        flex-direction: row;
    }

    &--items {
        display: flex;
        flex-direction: row;
    }

    &--btn {
        flex-shrink: 1;
        display: flex;
        align-items: center;
    }
}
</style>