<template>
    <div class="better-iframe--container">
        <iframe
            ref="iframe"
            :src="url"
            allowfullscreen
            allow="autoplay, encrypted-media"
            class="better-iframe--frame"
            @load="onIframeLoad"
        />
        <v-layout class="better-iframe--overlay">
            <v-progress-linear
                :active="loading"
                color="primary"
                height="4"
                indeterminate
            />
        </v-layout>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator'

@Component({})
export default class BetterIframe extends Vue {
    @Prop({ type: String, default: 'about:blank' }) url!: string
    @Ref() iframe!: HTMLIFrameElement

    loading = false

    @Watch('url')
    onIframeUrlChanged (val: string): void {
        this.loading = true
        // workaround so urls in iframe dont pollute browser history
        this.$nextTick(() => {
            const el = this.iframe
            if (el) {
                const cont = el.parentElement as HTMLDivElement
                el.remove()
                el.setAttribute('src', val)
                cont.prepend(el)
            }
        })
    }

    onIframeLoad () {
        this.loading = false
    }

    mounted () {
        if (this.url !== 'about:blank') this.loading = true
    }
}
</script>

<style lang="scss">
.better-iframe {
    &--container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    &--frame {
        border: none;
        height: 100%;
        width: 100%;
    }
    &--overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        pointer-events: none;
    }
}
</style>
