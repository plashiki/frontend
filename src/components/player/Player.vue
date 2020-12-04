<template>
    <!-- LEGACY! LEGACY! LEGACY! -->
    <div
        :class="{
            vuedio: true,
            'vuedio-fullscreen': fullscreen,
            'vuedio-inactive': inactive && !paused,
            'vuedio-controls-locked': controlsLocked
        }"
        tabindex="-1"
        @keyup="onKeyPress"
        @mousemove="notifyActive()"
        @touchend="notifyActive()"
        @touchstart="notifyActive(false)"
    >
        <video
            ref="tech"
            class="vuedio-tech"
            @click="togglePause"
            @dblclick="fullscreen ? exitFullscreen() : enterFullscreen()"
            @mousewheel="onScroll"
        ></video>
        <canvas
            v-show="subtitlesEnabled"
            ref="subtitlesCanvas"
            class="vuedio-subtitles-canvas"
        ></canvas>
        <div
            v-show="loading"
            class="vuedio-loading-wrap"
        >
            <div class="vuedio-loading">
                <div class="vuedio-loading--spinner"></div>
            </div>
        </div>
        <div
            ref="controlBar"
            :class="{ 'vuedio-control-bar-wrap': true, 'vuedio-control-bar-wrap--narrow': narrow }"
            @mouseenter="notifyActive(false)"
            @mouseleave="notifyActive()"
        >
            <div class="vuedio-control-bar">
                <button
                    v-ripple
                    class="vuedio-button vuedio-play-pause-button"
                    @click="togglePause"
                >
                    <PlayPauseIcon
                        :state="paused ? 'play' : 'pause'"
                    />
                </button>
                <span class="vuedio-timer vuedio-timer--current">
                    {{ formatTime(currentTime) }}
                </span>
                <PlayerSeekbar
                    :buffered="bufferedTime"
                    :duration="totalDuration"
                    :time.sync="currentTime"
                    @drag:end="dragEnded()"
                    @drag:start="dragStarted()"
                    @dragged="updateCurrentTime"
                />
                <span v-show="narrow">/</span>
                <span class="vuedio-timer vuedio-timer--total">
                    {{ formatTime(totalDuration) }}
                </span>
                <div
                    v-show="narrow"
                    class="vuedio-spacer"
                ></div>
                <button
                    v-show="subtitlesAvailable"
                    v-ripple
                    :class="{ 'vuedio-button--disabled': !subtitlesEnabled }"
                    class="vuedio-button vuedio-subtitles-button"
                    @click="subtitlesEnabled = !subtitlesEnabled"
                >
                    <i class="mdi mdi-closed-caption"></i>
                </button>
                <div
                    v-show="qualities.length > 1"
                    :class="{ 'vuedio-button--active': qualitiesMenu }"
                    class="vuedio-button vuedio-qualities-button"
                    @click="qualitiesMenu = !qualitiesMenu"
                >
                    <span class="vuedio-button--label">{{currentQuality ? currentQuality.name : ''}}</span>
                    <div
                        v-show="qualitiesMenu"
                        class="vuedio-button--popup"
                    >
                        <ul>
                            <li
                                v-for="it in qualities"
                                :key="it.id"
                                v-ripple
                                :class="{ selected: it.selected }"
                                @click="it.callback"
                                v-text="it.name"
                            />
                        </ul>
                    </div>
                </div>
                <div class="vuedio-button vuedio-volume-button">
                    <span class="vuedio-button--label">
                        <i
                            :class="{
                                'mdi-volume-high': volume >= 0.8,
                                'mdi-volume-medium': volume >= 0.4 && volume < 0.8,
                                'mdi-volume-low': volume > 0 && volume < 0.4,
                                'mdi-volume-variant-off': volume <= 0
                            }"
                            class="mdi"
                        />
                    </span>
                    <div class="vuedio-button--popup">
                        <v-slider
                            v-model="volume"
                            :max="1"
                            :min="0"
                            :step="0"
                            color="red"
                            vertical
                        />
                    </div>
                </div>
                <button
                    v-show="pipAvailable"
                    v-ripple
                    class="vuedio-button vuedio-pip-button"
                    @click="inPip ? exitPip() : enterPip()"
                >
                    <i
                        :class="'mdi ' + (inPip ? 'mdi-window-restore' : 'mdi-picture-in-picture-bottom-right')"
                    />
                </button>
                <button
                    v-show="fullscreenAvailable"
                    v-ripple
                    class="vuedio-button vuedio-fullscreen-button"
                    @click="fullscreen ? exitFullscreen() : enterFullscreen()"
                >
                    <i
                        :class="'mdi ' + (fullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen')"
                    />
                </button>
            </div>
        </div>
        <div
            :class="{ 'vuedio-info--visible': infoVisible }"
            class="vuedio-info"
            v-html="infoText"
        >
        </div>
    </div>
</template>

<script>
// plain js because god help me this code is so messed up
// (stolen from Vuedio, originally available under GPLv3)
import getPlayer from '@/utils/player/delegates'
import determineSource from '@/utils/player/determine-source'
import determineDuration, { updateTimestamps } from '@/utils/player/determine-duration'
import PlayPauseIcon from './PlayPauseIcon.vue'
import PlayerSeekbar from './PlayerSeekbar.vue'
import { formatTime, isLocalStorageSupported } from '@/utils/helpers'
import { SubtitlesOctopus } from '@/vendor/libassjs'
import HighSpeedClock from '@/utils/high-speed-clock'
import { DEBUG } from '@/utils/debug'

export default {
    name: 'Player',
    components: { PlayerSeekbar, PlayPauseIcon },
    props: {
        subtitlesWorker: {
            type: String,
            default: '/static/libassjs-worker.js',
        },
        keybinds: {
            type: Boolean,
            default: true,
        },
        gestures: {
            type: Boolean,
            default: true,
        },
        noInjectIcons: {
            type: Boolean,
            default: false,
        },
    },
    data: () => (
        {
            progressiveLevels: false,
            controlsLocked: false,
            subtitlesAvailable: false,
            subtitlesEnabled: false,
            externalSubtitles: false,
            externalSubtitlesListener: null,
            sources: [],
            currentSource: null,
            currentPart: -1,
            player: null,
            playerConstructor: null,
            totalDuration: 0,
            nextSourceId: 0,
            currentTime: 0,
            bufferedTime: 0,
            wasPaused: false,
            paused: true,
            volume: 1,
            loading: false,
            offset: 0,
            fullscreen: false,
            inPip: false,
            inactive: false,
            fullscreenAvailable: false,
            pipAvailable: false,
            inactiveTimer: null,
            narrow: false,
            qualitiesMenu: false,
            subtitlesInstance: null,
            subtitlesClock: null,
            infoVisible: false,
            infoText: '',
            infoTimer: null,
            changeHandler: null,
        }
    ),
    computed: {
        qualities () {
            if (this.progressiveLevels && this.progressiveLevels !== true) {
                return this.progressiveLevels
            }
            if (this.sources) {
                return this.sources.map((it) => (
                    {
                        id: it.id,
                        name: it.quality || it.height ? it.height + 'p' : it.name || '',
                        selected: this.currentSource ? this.currentSource.id === it.id : false,
                        callback: () => {
                            this.changeTo(it, true)
                        },
                    }
                )).sort((a, b) => a.name > b.name ? -1 : 1)
            }
            return []

        },
        currentQuality () {
            for (const it of this.qualities) {
                if (it.selected) {
                    return it
                }
            }
            return null
        },
        tech () {
            return this.$refs.tech
        },
        subtitlesCanvas () {
            return this.$refs.subtitlesCanvas
        },
    },
    methods: {
        rect () {
            return this.$el.getBoundingClientRect()
        },
        src (sources) {
            if (!Array.isArray(sources)) {
                sources = [sources]
            }
            for (const it of sources) {
                if (!Array.isArray(it.urls)) {
                    if (!it.urls && !it.src) {
                        throw Error('Source not found')
                    }
                    it.urls = [it.urls || it.src]
                }
                it.urls = it.urls.map((i) => (
                    {
                        src: i,
                    }
                ))
                it.id = this.nextSourceId++
            }

            if (this.player) {
                this.player.destroy()
            }
            this.tech.pause()
            this.tech.src = ''

            this.sources = sources
            this.currentSource = null
            this.currentVideo = null
            this.currentTime = 0
            this.currentPart = -1
            this.totalDuration = -1
            this.paused = true
            this.progressiveLevels = false
            this.subtitlesAvailable = false
            this.subtitlesEnabled = false
            this.externalSubtitles = false
            this.externalSubtitlesListener = undefined
            this.changeTo(determineSource(this.sources))
        },
        subtitles (src, options = {}, srcType = 'url') {
            if (src === null) {
                this.subtitlesAvailable = false
                this.subtitlesEnabled = false
                if (this.subtitlesClock) {
                    this.subtitlesClock.stop()
                }
                this.subtitlesInstance = null
                return
            }
            if (srcType === 'url') {
                const xhr = new XMLHttpRequest()
                xhr.open(options.method || 'GET', src)
                xhr.onload = () => {
                    this.subtitles(xhr.responseText, options, 'raw')
                }
                if (options.headers) {
                    for (let k in Object.keys(options.headers)) {
                        if (!Array.isArray(options.headers[k])) {
                            xhr.setRequestHeader(k, options.headers[k])
                        } else {
                            for (let val of options.headers[k]) {
                                xhr.setRequestHeader(k, val)
                            }
                        }
                    }
                }
                return xhr.send(options.body)
            } else {
                options.subContent = src
            }
            options.canvas = this.subtitlesCanvas
            options.workerUrl = this.subtitlesWorker
            this.subtitlesInstance = new SubtitlesOctopus(options)
            if (!this.subtitlesClock) {
                this.subtitlesClock = new HighSpeedClock()
                this.subtitlesClock.tick(() => {
                    if (this.subtitlesInstance && this.player) {
                        this.subtitlesInstance.setCurrentTime(this.player.getPosition() + this.offset)
                    }
                })
            }
            this.subtitlesAvailable = true
            this.subtitlesEnabled = true
            this.onResize()
        },
        info (text, temp = true) {
            if (this.infoTimer) {
                clearTimeout(this.infoTimer)
            }
            if (!text) {
                this.infoVisible = false
                return
            }
            this.infoText = text || ''
            this.infoVisible = true
            if (temp) {
                // @ts-ignore
                this.infoTimer = setTimeout(() => {
                    this.infoVisible = false
                    this.infoTimer = null
                }, 3000)
            }
        },
        infoTime (fr, to, temp = true) {
            if (fr < to) {
                this.info(`${this.formatTime(fr)} → ${this.formatTime(to)}<br/>+ ${this.formatTime(to - fr)}`, temp)
            } else {
                this.info(`${this.formatTime(to)} ← ${this.formatTime(fr)}<br/>- ${this.formatTime(fr - to)}`, temp)
            }
        },
        updateCurrentTime (val) {
            if (val < 0) val = 0
            this.currentTime = val
            if (this.player) {
                if (this.currentVideo && (
                    val > this.currentVideo.end || val < this.currentVideo.start
                )) {
                    this.checkCurrentVideo(val)
                }
                this.player.setPosition(val - this.offset)
            }
            if (this.subtitlesClock) {
                this.subtitlesClock.force().catch(DEBUG.error)
            }
        },
        async updatePlayer (mime) {
            const pl = await getPlayer(mime)
            if (this.player instanceof pl.constructor) {
                return
            }
            if (this.player) {
                this.player.destroy()
            }
            this.player = new pl.default(this.tech)
            if (this.player.bind) {
                this.player.bind(this)
            }
            this.playerConstructor = pl.default
            return this.player
        },
        changeTo (src, persist = false) {
            if (this.currentSource && this.currentSource.id === src.id) {
                return
            }
            const time = this.currentTime
            this.currentSource = src
            if (persist && src.height && isLocalStorageSupported()) {
                localStorage['vuedio-quality'] = src.height
            }
            this.updatePlayer(src.type)
                .then(() => determineDuration(src, this.playerConstructor))
                .then(() => {
                    this.totalDuration = updateTimestamps(src)
                    this.checkCurrentVideo(time)
                    this.updateCurrentTime(time)
                })
        },
        checkCurrentVideo (time, paused) {
            let change = true
            let video
            const self = this
            if (time === undefined) {
                time = this.currentTime
            }
            if (this.currentPart >= 0) {
                video = this.currentSource.urls[this.currentPart]
                if (video.start <= time + 1 && video.end > time + 1) {
                    change = false
                }
                if (video.src !== this.player.getSrc()) {
                    change = true
                }
            }
            if (paused === undefined) {
                paused = this.player.getPaused()
            }
            this.player.setPaused(true)
            const ended = video && this.currentPart === this.currentSource.urls.length - 1 && time === video.end
            if (change && !ended) {
                this.controlsLocked = true
                for (let i = 0; i < this.currentSource.urls.length; i++) {
                    const it = this.currentSource.urls[i]
                    if (it.start <= time + 1 && it.end > time + 1 || ended && i === 0) {
                        this.currentPart = i
                        this.currentVideo = it
                        this.offset = it.start || 0
                        this.player.setSrc(it.src)
                        if (this.changeHandler) {
                            this.tech.removeEventListener('durationchange', this.changeHandler)
                            this.changeHandler = null
                        }

                        let handler = () => {
                            // self.updateCurrentTime(time)
                            self.player.setPaused(paused)
                            self.controlsLocked = false

                            self.changeHandler = null
                        }
                        this.changeHandler = handler

                        this.once('durationchange', handler)
                    }
                }
            }
            if (ended) {
                this.currentPart = 0
                this.currentVideo = this.currentSource.urls[0]
                this.offset = 0
                if (this.currentSource.urls.length > 1) {
                    this.once('play', () => this.checkCurrentVideo(0, false))
                }
            }

        },
        onEnded () {
            this.checkCurrentVideo(undefined, false)
            this.$emit('ended')
        },
        onTimeUpdate () {
            this.currentTime = (
                this.player ? this.player.getPosition() : 0
            ) + this.offset
            this.$emit('timeupdate', this.currentTime)
        },
        onProgress () {
            let n = 0
            for (let i = 0; i < this.tech.buffered.length; i++) {
                const e = this.tech.buffered.end(i)
                if (e > n) {
                    n = e
                }
            }
            this.bufferedTime = n + this.offset
            this.$emit('onprogress', this.bufferedTime)
        },
        onWaiting () {
            this.loading = true
            this.$emit('waiting')
        },
        onCanPlay () {
            this.loading = false
            this.$emit('canplay')
        },
        onPause () {
            this.paused = true
            if (this.subtitlesClock && this.subtitlesEnabled) {
                this.subtitlesClock.stop()
            }
            this.$emit('pause')
        },
        onPlay () {
            this.paused = false
            if (this.subtitlesClock && this.subtitlesEnabled) {
                this.subtitlesClock.start()
            }
            this.$emit('play')
        },
        pause () {
            if (this.player) {
                this.player.setPaused(true)
            }
        },
        unpause () {
            if (this.player) {
                this.player.setPaused(false)
            }
        },
        dragStarted () {
            this.wasPaused = this.paused
            this.pause()
        },
        dragEnded () {
            if (this.player) {
                this.player.setPaused(this.wasPaused)
            }
        },
        togglePause () {
            if (this.player) {
                this.player.setPaused(!this.player.getPaused())
            }
        },
        formatTime (n) {
            return formatTime(n, this.totalDuration)
        },
        enterFullscreen () {
            return this.$el.requestFullscreen()
        },
        exitFullscreen () {
            return document.exitFullscreen()
        },
        enterPip () {
            return this.tech.requestPictureInPicture()
        },
        exitPip () {
            return document.exitPictureInPicture()
        },
        notifyActive (temp = true) {
            if (this.inactiveTimer) {
                clearTimeout(this.inactiveTimer)
            }
            if (temp) {
                // @ts-ignore
                this.inactiveTimer = setTimeout(() => {
                    this.inactive = true
                    this.inactiveTimer = undefined
                }, 2500)
            }
            this.inactive = false
        },
        onResize () {
            this.narrow = this.$el.clientWidth < 520
            if (this.subtitlesInstance) {
                const size = this.playerSize()
                this.subtitlesCanvas.style.width = size.width + 'px'
                this.subtitlesCanvas.style.height = size.height + 'px'
                this.subtitlesCanvas.style.left = size.x + 'px'
                this.subtitlesCanvas.style.top = size.y + 'px'
                if (size.width > 0 && size.height > 0) {
                    this.subtitlesInstance.resize(size.width, size.height, size.x, size.y)
                }
            }
        },
        playerSize () {
            const videoRatio = this.tech.videoWidth / this.tech.videoHeight
            const width = this.tech.offsetWidth
            const height = this.tech.offsetHeight
            const elementRatio = width / height
            let realWidth = width
            let realHeight = height
            if (elementRatio > videoRatio) {
                realWidth = Math.floor(height * videoRatio)
            } else {
                realHeight = Math.floor(width / videoRatio)
            }

            const x = (
                width - realWidth
            ) / 2
            const y = (
                height - realHeight
            ) / 2

            return {
                width: realWidth,
                height: realHeight,
                x, y,
            }
        },
        onKeyPress (e) {
            if (this.keybinds) {
                switch (e.key.toLowerCase()) {
                case ' ':
                    this.togglePause()
                    e.preventDefault()
                    e.stopPropagation()
                    break
                case 'f':
                    if (this.fullscreen) {
                        this.exitFullscreen()
                    } else {
                        this.enterFullscreen()
                    }
                    break
                case 'arrowleft': {
                    const fr = this.currentTime
                    let to = fr - (
                        e.altKey ? 5 : e.ctrlKey ? 90 : 10
                    )
                    if (to < 0) {
                        to = 0
                    }
                    this.updateCurrentTime(to)
                    this.infoTime(fr, to)
                    break
                }
                case 'arrowright': {
                    const fr = this.currentTime
                    let to = fr + (
                        e.altKey ? 5 : e.ctrlKey ? 90 : 10
                    )
                    if (to > this.totalDuration) {
                        to = this.totalDuration
                    }
                    this.updateCurrentTime(to)
                    this.infoTime(fr, to)
                    break
                }
                case 'arrowup': {
                    this.volume = Math.min(1, Math.max(0, this.volume + 0.05))
                    this.info('Volume: ' + Math.round(this.volume * 100) + '%')
                    break
                }
                case 'arrowdown': {
                    this.volume = Math.min(1, Math.max(0, this.volume - 0.05))
                    this.info('Volume: ' + Math.round(this.volume * 100) + '%')
                    break
                }
                }
            }
            this.$emit('keydown', e)
        },
        onScroll (e) {
            const isTouchPad = e.wheelDeltaY ? e.wheelDeltaY === -3 * e.deltaY : e.deltaMode === 0
            let delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail))
            if (isTouchPad) delta = -delta
            e.preventDefault()
            this.volume = Math.min(1, Math.max(0, this.volume + 0.05 * delta))
            this.info('Volume: ' + Math.round(this.volume * 100) + '%')
            this.$emit('scroll', e)
        },
        bindGestures () {
            let startX = null
            let startY = null
            let direction = null
            let wasPaused = null

            let startTime = null

            const gesture = (x, y, end = false) => {
                if (startX === null || startY === null) {
                    return
                }
                const diffX = x - startX
                const diffY = startY - y
                if (!direction) {
                    if (Math.abs(diffX) > 50) {
                        direction = 'x'
                    } else if (Math.abs(diffY) > 30) {
                        if (startY < 30 || Math.abs(window.innerHeight - startY) < 30) {
                            direction = 'none' // user probably wanted to open notifications / action center
                            return
                        }
                        direction = 'y'
                    } else {
                        return
                    }
                }
                if (direction === 'x') {
                    if (wasPaused === null) {
                        wasPaused = this.paused
                        this.pause()
                    }
                    const playerWidth = this.rect().width
                    const maxDiff = playerWidth > 900 ? 240 : 120
                    const seconds = diffX / playerWidth * maxDiff
                    if (startTime === null) {
                        startTime = this.currentTime
                    }
                    let newTime = startTime + seconds
                    if (newTime < 0) {
                        newTime = 0
                    }
                    if (newTime > this.totalDuration) {
                        newTime = wasPaused
                            ? this.totalDuration - 0.001 : this.totalDuration
                    }
                    this.infoTime(startTime, newTime, end)
                    this.updateCurrentTime(newTime)
                    if (end) {
                        if (!wasPaused) {
                            this.unpause()
                        }
                    }
                } else if (direction === 'y') {
                    const playerHeight = this.rect().height
                    startY = y
                    const volDiff = diffY / playerHeight
                    const newVolume = Math.max(0, Math.min(1, this.volume + volDiff))
                    this.volume = newVolume
                    this.info('Volume: ' + Math.round(newVolume * 100) + '%', end)
                }
            }

            const touchMove = (e) => {
                const touch = e.changedTouches[0]
                if (!touch) {
                    return
                } // wtf
                gesture(touch.clientX, touch.clientY)
                if (e.cancelable) {
                    e.preventDefault()
                }
            }

            const touchEnd = (e) => {
                const touch = e.changedTouches[0]
                if (!touch) {
                    return
                } // wtf
                gesture(touch.clientX, touch.clientY, true)
                direction = null
                wasPaused = null
                startX = null
                startY = null
                startTime = null
                this.tech.removeEventListener('touchmove', touchMove)
                this.tech.removeEventListener('touchend', touchEnd)
                e.preventDefault()
            }

            const touchStart = (e) => {
                if (!this.gestures) {
                    return
                }
                const touch = e.changedTouches[0]
                if (!touch) {
                    return
                } // wtf
                startX = touch.clientX
                startY = touch.clientY
                direction = null
                wasPaused = null
                this.tech.addEventListener('touchmove', touchMove, { passive: false })
                this.tech.addEventListener('touchend', touchEnd, { passive: false })
            }

            this.tech.addEventListener('touchstart', touchStart)
        },
        once (name, handler) {
            const wrap = (e) => {
                handler(e)
                this.tech.removeEventListener(name, wrap)
            }
            this.tech.addEventListener(name, wrap)
        },
    },
    watch: {
        subtitlesEnabled (val) {
            if (this.subtitlesClock) {
                this.subtitlesClock[val ? 'start' : 'stop']()
            } else if (this.externalSubtitles) {
                this.externalSubtitlesListener(val)
            }
        },
        volume (val) {
            if (isNaN(val)) {
                val = 1
            }
            if (val > 1) {
                val = 1
            }
            if (val < 0) {
                val = 0
            }
            this.tech.volume = val
            if (isLocalStorageSupported()) {
                localStorage['vuedio-volume'] = val
            }
        },
    },
    mounted () {
        this.fullscreenAvailable = document.fullscreenEnabled
        this.pipAvailable = 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled
        this.$el.addEventListener('fullscreenchange', () => {
            this.fullscreen = document.fullscreenElement === this.$el
        })
        this.tech.addEventListener('leavepictureinpicture', () => this.inPip = false)
        this.tech.addEventListener('enterpictureinpicture', () => this.inPip = true)
        this.tech.addEventListener('timeupdate', this.onTimeUpdate.bind(this))
        this.tech.addEventListener('loadedmetadata', this.onResize.bind(this))
        this.tech.addEventListener('volumechange', () => {
            this.volume = this.tech.volume
        })
        this.tech.addEventListener('progress', this.onProgress.bind(this))
        this.tech.addEventListener('loadstart', this.onCanPlay.bind(this))
        this.tech.addEventListener('waiting', this.onWaiting.bind(this))
        this.tech.addEventListener('stalled', this.onWaiting.bind(this))
        this.tech.addEventListener('canplay', this.onCanPlay.bind(this))
        this.tech.addEventListener('pause', this.onPause.bind(this))
        this.tech.addEventListener('ended', this.onEnded.bind(this))
        window.addEventListener('resize', this.onResize.bind(this))
        this.tech.addEventListener('play', this.onPlay.bind(this))
        const observer = new MutationObserver(this.onResize.bind(this))
        observer.observe(this.$el, {
            attributes: true,
        })
        this.onResize()
        this.volume = isLocalStorageSupported() ? parseFloat(localStorage['vuedio-volume'] || 1) : 1
        this.bindGestures()
    },
}
</script>

<style lang="scss">
* {
    box-sizing: border-box;
    font-family: Roboto, Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.vuedio {
    position: relative;
    background-color: black;
    overflow: hidden;

    &:focus {
        outline: none
    }

    &-subtitles-canvas {
        position: absolute;
        z-index: 1;
        pointer-events: none;
    }

    &-spacer {
        flex-grow: 1;
    }

    &.vuedio-inactive {
        cursor: none;
    }

    &-tech {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 0;

        //noinspection CssInvalidPseudoSelector
        &::-webkit-media-controls {
            display: none !important;
        }
    }

    &-control-bar-wrap {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 8px;
        max-width: 1000px;
        margin: 0 auto;
        height: 56px;
        z-index: 2;
        opacity: 1;
        transition: opacity 0.25s;

        .vuedio-inactive & {
            opacity: 0;
            pointer-events: none;
        }
    }

    &-control-bar {
        background-color: rgba(255, 255, 255, 0.66);
        backdrop-filter: blur(15px);
        width: 100%;
        height: 100%;
        border-radius: 6px;
        display: flex;
        flex-direction: row;
        align-items: center;

        .vuedio-controls-locked & {
            pointer-events: none;
        }

        .theme--dark & {
            background-color: rgba(0, 0, 0, 0.66);
        }

        & > *:first-child {
            border-top-left-radius: 6px;
            border-bottom-left-radius: 6px;
            margin-left: 0 !important
        }

        & > *:last-child {
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
            margin-right: 0 !important
        }

        .vuedio-button {
            box-shadow: none;
            border: none;
            outline: none;
            background: transparent;
            vertical-align: middle;
            height: 100%;
            padding: 4px;
            transition: background-color 0.25s, color 0.25s;
            min-width: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: pointer;

            &:hover, &:active, &--active {
                background: rgba(255, 255, 255, 0.33);
            }

            i {
                font-size: 24px;
                align-self: center;
                height: 24px;
                line-height: 1;
            }

            &--label {
                font-size: 12px;
            }

            &--popup {
                position: absolute;
                background: rgba(255, 255, 255, 0.66);
                backdrop-filter: blur(15px);
                bottom: 46px;
                border-radius: 6px;
                z-index: 2;

                .theme--dark & {
                    background-color: rgba(0, 0, 0, 0.66);
                }

                ul {
                    margin: 0;
                    list-style: none;
                    padding: 6px 0;
                    overflow: auto;
                    max-height: 180px;
                    scrollbar-width: none;

                    &::-webkit-scrollbar {
                        display: none;
                    }

                    li {
                        padding: 4px 8px 4px 24px;
                        transition: background-color 0.25s;
                        font-size: 15px;
                        min-height: 26px;

                        &:hover {
                            background: rgba(255, 255, 255, 0.33)
                        }

                        &.selected {
                            background-color: rgba(255, 255, 255, 0.4);
                            padding-left: 6px;

                            &:before {
                                content: '\F012C';
                                font-family: 'Material Design Icons';
                                font-size: 12px;
                                margin-right: 6px;
                            }
                        }
                    }
                }
            }

            &--disabled {
                color: #777
            }
        }

        .vuedio-play-pause-button {
            width: 40px;
            padding: 8px 8px 8px 8px;

            .theme--dark & svg {
                fill: white
            }
        }

        .vuedio-timer {
            font-size: 12px;
            margin: 0 8px;
            align-self: center;
            line-height: 1;
            height: 12px;
        }
    }

    .vuedio-loading-wrap {
        position: absolute;
        display: flex;
        padding: 8px 8px 56px 8px;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        z-index: 2;

        .vuedio-loading {
            width: 96px;
            height: 96px;
            background: rgba(255, 255, 255, 0.66);
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;

            .theme--dark & {
                background-color: rgba(0, 0, 0, 0.66);
            }

            &--spinner {
                width: 48px;
                height: 48px;
                position: absolute;
                border-radius: 50%;
                border: 2px solid #000;
                border-top-color: rgba(255, 255, 255, .5);
                animation: rotate 0.75s linear infinite;

                .theme--dark & {
                    border-color: #fff;
                }
            }
        }
    }

    .vuedio-qualities-button {
        padding: 4px 12px;
    }

    .vuedio-volume-button {
        .vuedio-button--label {
            font-size: 24px;
            align-self: center;
            height: 24px;
            line-height: 1;
        }

        .vuedio-button--popup {
            pointer-events: none;
            opacity: 0;
            transition: all 0.25s;
            z-index: 1;
            padding: 16px 11px 8px;
            bottom: 40px;
            min-width: 40px;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            background: rgba(255, 255, 255, 0.66);

            .theme--dark & {
                background-color: rgba(0, 0, 0, 0.66);
            }
        }

        &:hover .vuedio-button--popup {
            opacity: 1;
            pointer-events: all;
        }
    }

    .vuedio-control-bar-wrap--narrow .vuedio-seek {
        position: absolute;
        left: 0;
        right: 0;
        top: -20px;
        z-index: -1;
    }

    .vuedio-info {
        max-width: 180px;
        background: rgba(255, 255, 255, 0.66);
        backdrop-filter: blur(15px);
        position: absolute;
        z-index: 2;
        top: 12px;
        left: -12px;
        padding: 8px;
        border-radius: 6px;
        text-align: center;
        opacity: 0;
        transition: all 0.3s;

        .theme--dark & {
            background-color: rgba(0, 0, 0, 0.66);
        }

        &--visible {
            opacity: 1;
            left: 12px
        }
    }
}

@keyframes rotate {
    to {
        transform: rotate(360deg);
    }
}

.vuedio-fill {
    width: 100%;
    height: 100%;
}
</style>
