// most player code MIGHT BE <s>STOLEN</s> ADOPTED from my older unmaintained project Vuedio
// :p

export interface PlayerPayload {
    video: PlayerSource | PlayerSource[]
    subtitles?: {
        src: string
        options?: SubtitleOctopusOptions
        srcType?: 'url' | 'text'
    }
}

export interface PlayerSource {
    height?: number
    name?: string
    type?: string            // MIME type of video. Used to determine player.
                             // If none is passed then 'video/mp4' is implied
    src?: string             // Single url to video. Alias for `urls: <src>`
    urls?: string | string[] // Url to video or array of urls.
                             // If array is passed then videos will be
                             // concatenated. Has higher priority than `src`
}

export abstract class PlayerDelegate {
    tech: HTMLVideoElement
    vuedio: any

    constructor (tech: HTMLVideoElement) {
        this.tech = tech
    }

    abstract getDuration (): number

    abstract getPaused (): boolean

    abstract setPaused (val: boolean): void

    abstract getSpeed (): number

    abstract setSpeed (val: number): void

    abstract getSrc (): string

    abstract setSrc (val: string): void

    abstract getPosition (): number

    abstract setPosition (val: number): void

    bind (instance: any) {
        this.vuedio = instance
    }

    on (evt: string, handler: Function): void {
        this.tech.addEventListener(evt, handler as any)
    }

    off (evt: string, handler: Function): void {
        this.tech.removeEventListener(evt, handler as any)
    }

    abstract destroy (): void
}

export interface SubtitleOctopusOptions {
    video?: string
    canvas?: HTMLCanvasElement
    subUrl?: string
    subContent?: string
    workerUrl?: string
    fonts?: string[]
    availableFonts?: Record<string, string>
    timeOffset?: number
    onReady?: Function
    onError?: Function
    debug?: boolean
}
