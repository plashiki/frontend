export default class HighSpeedClock {
    listeners: Function[] = []
    pending: number | null = null
    lastTickTime = -1
    running = false

    boundOnTick: FrameRequestCallback | null = null

    start (): void {
        this.running = true
        if (this.pending === null) {
            if (!this.boundOnTick) {
                this.boundOnTick = this.onTick.bind(this)
            }
            this.pending = requestAnimationFrame(this.boundOnTick)
        }
    }

    stop (): void {
        this.running = false
        if (this.pending !== null) {
            cancelAnimationFrame(this.pending)
            this.pending = null
        }
    }

    tick (listener: Function): void {
        this.listeners.push(listener)
    }

    force (): Promise<void> {
        return this.onTick(performance.now(), true)
    }

    onTick (now: number, once = false): Promise<void> {
        this.lastTickTime = now
        return Promise.all(this.listeners.map((it) => it(now))).then(() => {
            if (!once && this.running) {
                this.pending = requestAnimationFrame(this.boundOnTick!)
            }
        })
    }
}
