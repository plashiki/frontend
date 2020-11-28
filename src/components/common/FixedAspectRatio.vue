<template>
    <div
        ref="container"
        class="fixed-ar--container"
    >
        <div
            ref="wrap"
            class="fixed-ar--wrap"
        >
            <slot />
        </div>

        <slot name="append" />
    </div>
</template>

<script lang="ts">
import { Component, Vue, Ref, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class FixedAspectRatio extends Vue {
    @Prop({ type: Number, required: true }) aspectRatio!: number
    @Prop({ type: Boolean, default: false }) forContainer!: boolean

    @Ref() container!: HTMLDivElement
    @Ref() wrap!: HTMLDivElement

    @Watch('forContainer')
    forContainerChanged (val: boolean) {
        if (val) {
            this.wrap.style.width = '100%'
            this.wrap.style.height = '100%'
            this.wrap.style.left = '0'
            this.wrap.style.top = '0'
        } else {
            this.container.style.height = ''
        }
    }

    onResize (): void {
        const width = this.container.offsetWidth
        if (this.forContainer) {
            this.container.style.height = width / this.aspectRatio + 'px'
        } else {
            const height = this.container.offsetHeight
            const elementRatio = width / height
            let realWidth = width
            let realHeight = height
            if (elementRatio > this.aspectRatio) {
                realWidth = Math.floor(height * this.aspectRatio)
            } else {
                realHeight = Math.floor(width / this.aspectRatio)
            }

            const x = (width - realWidth) / 2
            const y = (height - realHeight) / 2

            this.wrap.style.width = realWidth + 'px'
            this.wrap.style.height = realHeight + 'px'
            this.wrap.style.left = x + 'px'
            this.wrap.style.top = y + 'px'
        }
    }

    addListeners (): void {
        window.addEventListener('resize', this.onResize)
    }

    removeListeners (): void {
        window.removeEventListener('resize', this.onResize)
    }

    mounted (): void {
        this.addListeners()
        this.$nextTick(() => {
            this.onResize()
        })
        this.forContainerChanged(this.forContainer)
    }

    beforeDestroy (): void {
        this.removeListeners()
    }
}
</script>

<style>
.fixed-ar--container {
    width: 100%;
    height: 100%;
    position: relative;
}
.fixed-ar--wrap {
    position: absolute;
}
</style>
