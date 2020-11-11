<template>
    <div class="resizable-div">
        <div
            ref="grip"
            class="resizable-div--grip"
            @mousedown="onMouseDown"
        >
            <div class="resizable-div--grip-icon" />
        </div>
        <div
            class="resizable-div--content d-flex flex-column"
            :style="{ width: width + 'px' }"
        >
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Ref } from 'vue-property-decorator'
import { configStore } from '@/store'

@Component({})
export default class ResizableDiv extends Vue {
    @Prop({ type: String, default: null }) persistentId!: string | null
    @Prop({ type: Number, default: 0 }) minimumWidth!: number
    @Prop({ type: Number, default: Infinity }) maximumWidth!: number
    @Prop({ type: Number, default: 320 }) defaultWidth!: number

    @Ref() grip!: HTMLDivElement

    width = 0
    gripOffset = 0

    onMouseDown (evt: MouseEvent): void {
        this.$emit('resizestart')
        document.addEventListener('mousemove', this.onMouseMove)
        document.addEventListener('mouseup', this.onMouseUp)

        this.gripOffset = this.grip.getBoundingClientRect().right - evt.clientX

        this.onMouseMove(evt)
    }

    onMouseUp (): void {
        this.$emit('resizeend')
        document.removeEventListener('mousemove', this.onMouseMove)
        document.removeEventListener('mouseup', this.onMouseUp)

        if (this.persistentId) {
            configStore.merge({
                components: {
                    [this.persistentId]: this.width
                }
            })
        }
    }

    onMouseMove (evt: MouseEvent): void {
        const rect = this.$el.getBoundingClientRect()
        const neededWidth = rect.right - evt.clientX - this.gripOffset

        this.setWidth(neededWidth)
    }

    setWidth (val: number): void {
        if (val < this.minimumWidth) val = this.minimumWidth
        if (val > this.maximumWidth) val = this.maximumWidth

        this.width = val
        this.$nextTick(() => {
            this.$emit('resize')
        })
    }

    mounted (): void {
        if (this.persistentId && configStore.components[this.persistentId]) {
            this.setWidth(configStore.components[this.persistentId])
        } else {
            this.setWidth(this.defaultWidth)
        }
    }
}
</script>

<style lang="scss">
.resizable-div {
    display: flex;
    flex-direction: row;

    &--grip {
        width: 8px;
        height: 100%;
        cursor: ew-resize;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    &--grip-icon {
        height: 24px;
        width: 4px;
        border-radius: 2px;

        .theme--light & {
            background: #7f7f7f;
        }
        .theme--dark & {
            background: #dedede;
        }
    }
}
</style>