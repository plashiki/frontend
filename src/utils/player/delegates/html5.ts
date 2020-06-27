import { PlayerDelegate } from '@/types/player'
import { nop } from '@/utils/helpers'

export default class Html5PlayerDelegate extends PlayerDelegate {
    getPosition () {
        return this.tech.currentTime
    }

    setPosition (val: number) {
        this.tech.currentTime = val
    }

    getDuration () {
        return this.tech.duration
    }

    getSrc () {
        return this.tech.currentSrc
    }

    setSrc (val: string) {
        this.tech.src = val
        this.tech.load()
    }

    getPaused () {
        return this.tech.paused
    }

    setPaused (val: boolean) {
        if (val) {
            this.tech.pause()
        } else {
            this.tech.play().catch(nop)
        }
    }

    getSpeed () {
        return this.tech.playbackRate
    }

    setSpeed (val: number) {
        this.tech.playbackRate = val
    }

    destroy () {
        this.tech.src = ''
    }
}
