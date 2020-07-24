<template>
    <div
        class="vuedio-seek"
        @mousedown.left="mouseDown"
        @mousemove="updateHover"
        @mouseout="mouseOut"
        @mouseover="updateHover"
        @touchstart="mouseDown"
    >
        <div class="vuedio-seek--back" />
        <div
            :style="{ 'max-width': buffered / duration * 100 + '%' }"
            class="vuedio-seek--buffer"
        />
        <div
            :class="{ 'with-transition': wantTransition }"
            :style="{ 'max-width': currentTime / duration * 100 + '%' }"
            class="vuedio-seek--progress"
        />
        <div
            :class="{ 'with-transition': wantTransition }"
            :style="{ left: currentTime / duration * 100 + '%' }"
            class="vuedio-seek--thumb"
        />
        <div
            v-show="hoverValue >= 0 && duration >= 0"
            :style="{ left: hoverValue * 100 + '%' }"
            class="vuedio-seek--hovered"
        >
            <div class="vuedio-seek--grip" />
            <div
                class="vuedio-seek--tooltip"
                v-text="hoverValue >= 0 && duration >= 0 ? formatTime(hoverValue * duration, duration) : ''"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'
import { formatTime } from '@/utils/helpers'

@Component({})
export default class PlayerSeekbar extends Vue {
    // both `progress` and `secondary` are fractions of 1 (i.e. [0, 1])
    @PropSync('time', { default: 0 }) currentTime!: number
    @Prop({ default: 0 }) buffered!: number

    // video duration in seconds
    @Prop({ default: -1 }) duration!: number

    formatTime = formatTime

    dragging = false
    wantTransition = true
    wantTransitionTimeout: number | null = null
    hoverValue = -1


    rect (): DOMRect {
        return this.$el.getBoundingClientRect()
    }

    mouseDown (e: MouseEvent): void {
        this.dragging = true
        // when dragging transition doesnt feel smooth at all
        // so we only run the transition once while dragging (150 ms since first mousedown)
        // and then we disable it
        //
        // that way we also get a cute animation when fast-clicking
        if (this.wantTransitionTimeout) {
            clearTimeout(this.wantTransitionTimeout)
        }
        this.wantTransitionTimeout = setTimeout(() => {
            this.wantTransition = false
        }, 150)

        document.addEventListener('mousemove', this.handleMove)
        document.addEventListener('touchmove', this.handleMove, { passive: false })
        document.addEventListener('mouseup', this.mouseUp)
        document.addEventListener('touchend', this.mouseUp, { passive: false })
        this.handleMove(e)
        this.$emit('drag:start')
    }

    mouseUp (): void {
        this.dragging = false
        // re-enable transition in case click was less than 150ms
        if (this.wantTransitionTimeout) {
            clearTimeout(this.wantTransitionTimeout)
        }
        this.wantTransition = true

        document.removeEventListener('mousemove', this.handleMove)
        document.removeEventListener('touchmove', this.handleMove)
        document.removeEventListener('mouseup', this.mouseUp)
        document.removeEventListener('touchend', this.mouseUp)
        this.$emit('drag:end')
    }

    handleMove (e: MouseEvent | TouchEvent): void {
        if (!this.dragging) {
            return
        }
        let x
        if (e instanceof MouseEvent) {
            x = e.clientX
        } else {
            x = e.changedTouches[0].clientX
        }
        let frac = (x - this.rect().left) / this.rect().width
        this.$emit('dragged', Math.max(Math.min(frac, 1), 0) * this.duration)
        e.preventDefault()
    }

    mouseOut (): void {
        this.hoverValue = -1
    }

    updateHover (e: MouseEvent): void {
        let val = (e.clientX - this.rect().left) / this.rect().width

        this.hoverValue = Math.min(Math.max(val, 0), 1)
    }

}
</script>

<style lang="scss">
.vuedio-seek {
    flex-grow: 1;
    position: relative;
    margin: 0 4px;
    display: flex;
    height: 18px;
    cursor: pointer;


    &--back {
        position: absolute;
        height: 6px;
        background-color: #828282;
        width: 100%;
        border-radius: 3px;
        align-self: center;
        z-index: 0
    }

    &--buffer {
        width: 100%;
        max-width: 0;
        transition: max-width 0.15s linear;
        position: absolute;
        height: 6px;
        background-color: #5f5f5f;
        border-radius: 3px;
        align-self: center;
        z-index: 1;
    }

    &--progress {
        width: 100%;
        max-width: 0;
        position: absolute;
        height: 6px;
        border-radius: 3px;
        background-color: #da0b0b;
        z-index: 3;
        align-self: center;

        &.with-transition {
            transition: max-width 0.15s linear;
        }
    }

    &--thumb {
        position: absolute;
        width: 12px;
        height: 12px;
        align-self: center;
        background-color: #fbfbfb;
        z-index: 5;
        border-radius: 8px;
        box-shadow: 0 3px 8px -2px black;
        transform: translateX(-4px);
        cursor: pointer;

        &.with-transition {
            transition: left 0.15s linear;
        }
    }

    &--hovered {
        position: absolute;
        align-self: center;

        .vuedio-seek--tooltip {
            position: absolute;
            font-size: 13px;
            color: white;
            background-color: rgba(97, 97, 97, 0.9);
            padding: 3px 7px;
            border-radius: 6px;
            height: 24px;
            bottom: 8px;
            transform: translateX(-50%);
            box-shadow: 0 3px 5px -3px black;
        }

        .vuedio-seek--grip {
            position: absolute;
            width: 1px;
            height: 6px;
            background: #000;
            top: -3px;
            z-index: 4;
        }
    }
}
</style>
