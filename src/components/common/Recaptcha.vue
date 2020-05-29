<template>
    <div>
        <p
            v-if="displayLegalNotice"
            class="grey--text my-2"
            v-html="$t('Common.RecaptchaLegalNotice')"
        />
        <div ref="root" />
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { IRecaptcha } from '@/types'
import { recaptchaSiteKey } from '@/config'
import { ApiException } from '@/types/api'
import { DEBUG } from '@/utils/debug'

@Component({})
export default class Recaptcha extends Vue implements IRecaptcha {
    @Prop({ type: Boolean, default: true }) displayLegalNotice!: boolean

    static api: any = null
    running = false
    dirty = false
    cached: string | null = null
    widget: any = null
    resolve?: Function
    reject?: Function

    public async execute (): Promise<string> {
        if (this.running) {
            throw new Error('This Recaptcha instance is already running')
        }
        if (this.cached) {
            return this.cached
        }
        if (this.dirty) {
            Recaptcha.api.reset(this.widget)
            this.dirty = false
        }
        if (!Recaptcha.api) {
            Recaptcha.api = await this.getApi()
        }
        return new Promise((resolve, reject) => {
            if (this.widget === null) {
                this.widget = Recaptcha.api.render(this.$refs.root, {
                    sitekey: recaptchaSiteKey,
                    size: 'invisible',
                    badge: 'bottomleft',
                    callback: (function (this: Recaptcha, token: string): void {
                        this.running = false
                        this.dirty = true
                        this.cached = token
                        // using this.<res/rej> because i love google api
                        // (we cant re-render this guy over and over, lmao)
                        this.resolve!(token)
                        this.resolve = undefined
                        this.reject = undefined
                    }).bind(this),
                    'expired-callback': (function (this: Recaptcha): void {
                        if (this.reject) {
                            // should not happen in normal conditions, but still possible
                            this.reject(new ApiException('RECAPTCHA_EXPIRED'))
                            this.resolve = undefined
                            this.reject = undefined
                            this.running = false
                            this.dirty = true
                        }
                        this.cached = null
                    }).bind(this),
                    'error-callback': (function (this: Recaptcha): void {
                        if (this.reject) {
                            this.reject(new ApiException('BAD_CONNECTION'))
                            this.resolve = undefined
                            this.reject = undefined
                            this.running = false
                            this.dirty = true
                        }
                        this.cached = null
                    }).bind(this)
                })
            }
            this.resolve = resolve
            this.reject = reject
            this.running = true
            Recaptcha.api.execute(this.widget)
        })
    }

    getApi (): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const callback = '__callback' + Math.random().toString().slice(2)
            const script = document.createElement('script')
            script.src =
                `https://www.google.com/recaptcha/api.js?onload=${callback}&render=explicit&hl=${this.$t('Meta.LangCode')}`
            script.async = true
            script.defer = true;
            (window as any)[callback] = function (): void {
                delete (window as any)[callback]
                resolve((window as any).grecaptcha)
                delete (window as any).grecaptcha
            }
            script.onerror = (evt: string | Event): void => {
                DEBUG.error('failed to load recaptcha api:', evt)
                reject(new ApiException('BAD_CONNECTION'))
            }
            document.head.appendChild(script)
        })
    }
}
</script>

<style>
.grecaptcha-badge {
    visibility: hidden;
}
</style>
