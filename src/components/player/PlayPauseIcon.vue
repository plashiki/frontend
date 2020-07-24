<template>
    <svg
        ref="svg"
        class="play-pause-icon"
        height="100%"
        viewBox="0 0 24 24"
        width="100%"
    >
        <path ref="path1" d=""></path>
        <path ref="path2" d=""></path>
    </svg>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'

const pause1 = [
    20, 4,
    20, 20,
    15, 20,
    15, 4
]
const pause2 = [
    4, 4,
    4, 20,
    9, 20,
    9, 4
]
const play1 = [
    12, 4,
    20, 20,
    12, 20,
    12, 4
]
const play2 = [
    12, 4,
    4, 20,
    12, 20,
    12, 4
]

@Component({
    name: 'PlayPauseIcon'
})
export default class PlayPauseIcon extends Vue {
    @Prop({ default: 'pause', validator: (v) => ['pause', 'play'].indexOf(v) > -1 }) readonly state!: 'pause' | 'play'
    @Prop({ type: Number, default: 300 }) readonly duration!: number

    @Ref() svg!: SVGElement
    @Ref() path1!: SVGPathElement
    @Ref() path2!: SVGPathElement

    private _pendingAnimation?: number
    private _pendingAnimationPos?: number

    private static _interp (t: number): number {
        return t < .5 ? 2 * t * t : -1 + (
            4 - 2 * t
        ) * t
    }

    private static _interpPath (fr: number[], to: number[], pos: number) {
        if (fr.length !== to.length) {
            throw Error('Can\'t interpolate paths with different sizes.')
        }
        const ret: number[] = []
        for (let i = 0; i < fr.length; i++) {
            ret.push((
                to[i] - fr[i]
            ) * pos + fr[i])
        }
        return ret
    }

    private static _buildPath (path: number[]): string {
        let positions = []
        for (let i = 0; i < path.length; i += 2) {
            positions.push(path[i] + ' ' + path[i + 1])
        }
        return 'M ' + positions.join(' L ') + ' Z'
    }

    jumpTo (state: 'pause' | 'play') {
        if (state === 'pause') {
            this._updatePath(pause1, pause2)
            this.svg.style.transform = 'rotate(0deg)'
        } else if (state === 'play') {
            this._updatePath(play1, play2)
            this.svg.style.transform = 'rotate(90deg)'
        } else {
            throw Error('Invalid state: ' + state)
        }
    }

    @Watch('state')
    animateTo (state: 'pause' | 'play', old?: 'pause' | 'play') {
        if (state === this.state && !old) {
            return
        }
        if (['pause', 'play'].indexOf(state) === -1) {
            throw Error('Invalid state: ' + state)
        }
        if (this._pendingAnimation) cancelAnimationFrame(this._pendingAnimation)
        const skip = this._pendingAnimationPos ? 1 - this._pendingAnimationPos : 0
        const start = performance.now()
        const animate = (now: number) => {
            let frac = Math.min(1, (now - start) / this.duration + skip)
            this._pendingAnimationPos = frac
            let pos = PlayPauseIcon._interp(frac)
            if (frac < 1) {
                if (state === 'pause') {
                    this._updatePath(
                        PlayPauseIcon._interpPath(play1, pause1, pos),
                        PlayPauseIcon._interpPath(play2, pause2, pos)
                    )
                } else {
                    this._updatePath(
                        PlayPauseIcon._interpPath(pause1, play1, pos),
                        PlayPauseIcon._interpPath(pause2, play2, pos)
                    )
                }
                this.svg.style.transform = 'rotate(' + ((state === 'pause' ? 1 - pos : pos) * 90) + 'deg)'
                this._pendingAnimation = requestAnimationFrame(animate)
            } else {
                this.svg.style.transform = 'rotate(' + (state === 'pause' ? 0 : 90) + 'deg)'
                this._pendingAnimationPos = undefined
                if (state === 'pause') {
                    this._updatePath(pause1, pause2)
                } else {
                    this._updatePath(play1, play2)
                }
            }
        }
        this._pendingAnimation = requestAnimationFrame(animate)
    }

    mounted () {
        this.jumpTo(this.state)
    }

    private _updatePath (first: number[], second: number[]) {
        this.path1.setAttribute('d', PlayPauseIcon._buildPath(first))
        this.path2.setAttribute('d', PlayPauseIcon._buildPath(second))
    }
}
</script>

<style>
.play-pause-icon {
    transform-origin: center;
}
</style>
