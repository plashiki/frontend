import Hls from 'hls.js'
import { PlayerDelegate } from '@/types/player'
import { nop } from '@/utils/helpers'

export default class HlsPlayer extends PlayerDelegate {
    hls: Hls

    constructor (tech: HTMLVideoElement) {
        super(tech)

        this.hls = new Hls()
        this.hls.attachMedia(tech)
    }

    getDuration () {
        return this.tech.duration
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

    getSrc () {
        return this.tech.src
    }

    setSrc (val: string) {
        this.hls.loadSource(val)
    }

    getPosition () {
        return this.tech.currentTime
    }

    setPosition (val: number) {
        this.tech.currentTime = val
    }

    bind (instance: any) {
        this.vuedio = instance
        this.vuedio.progressiveLevels = true
        this.hls.on(Hls.Events.MANIFEST_PARSED, (ev: string, data: any) => {
            this.vuedio.progressiveLevels =
                data.levels.map((it: any, i: number) => (
                    {
                        name: it.name || it.height + 'p',
                        id: i,
                        selected: i === data.firstLevel,
                        callback: () => {
                            this.hls.currentLevel = i
                        }
                    }
                ))
            this.vuedio.subtitlesAvailable = this.hls.subtitleTracks.length > 0
        })
        this.hls.on(Hls.Events.LEVEL_SWITCHED, (ev: string, { level }: Hls.levelSwitchedData) => {
            if (!Array.isArray(this.vuedio.progressiveLevels)) {
                return
            }
            for (const it of this.vuedio.progressiveLevels) {
                it.selected = it.id === level
            }
        })
        this.hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (ev: string, { subtitleTracks }: any) => {
            this.vuedio.subtitlesAvailable = subtitleTracks.length > 0
            this.vuedio.subtitlesEnabled = this.hls.subtitleDisplay
        })
        this.vuedio.externalSubtitles = true
        this.vuedio.externalSubtitlesListener = this.subtitlesListener.bind(this)
    }

    off (event: string, handler: any) {
        this.hls.off(event, handler)
        this.tech.removeEventListener(event, handler)
    }

    on (event: string, handler: any) {
        this.hls.on(event as any, handler)
        this.tech.addEventListener(event, handler)
    }


    destroy () {
        this.hls.destroy()
    }

    subtitlesListener (enabled: boolean) {
        this.hls.subtitleDisplay = enabled
    }
}
