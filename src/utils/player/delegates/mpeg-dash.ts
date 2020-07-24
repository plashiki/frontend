import { MediaPlayer, MediaPlayerClass } from 'dashjs'
import { PlayerDelegate } from '@/types/player'

export default class MpegDashPlayer extends PlayerDelegate {
    dash: MediaPlayerClass

    constructor (tech: HTMLVideoElement) {
        super(tech)
        this.dash = MediaPlayer().create()
        this.dash.initialize(tech)
    }

    destroy () {
        this.dash.reset()
    }

    getDuration () {
        return this.dash.duration()
    }

    off (event: string, handler: any) {
        this.dash.off(event, handler)
        this.tech.removeEventListener(event, handler)
    }

    on (event: string, handler: any) {
        // @ts-ignore
        this.dash.on(event, handler)
        this.tech.addEventListener(event, handler)
    }

    getPaused () {
        try {
            return this.dash.isPaused()
        } catch (e) {
            return true
        }
    }

    setPaused (val: boolean) {
        try {
            if (val) {
                this.dash.pause()
            } else {
                this.dash.play()
            }
        } catch (e) {
            //
        }
    }

    getSrc () {
        return this.dash.getSource() as string
    }

    setSrc (url: string) {
        this.dash.attachSource(url)
    }

    getPosition () {
        try {
            return this.dash.time()
        } catch (e) {
            return 0
        }
    }

    setPosition (val: number) {
        this.dash.seek(val)
    }

    getSpeed () {
        return this.dash.getPlaybackRate()
    }

    setSpeed (val: number) {
        this.dash.setPlaybackRate(val)
    }
}
