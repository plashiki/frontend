<template>
    <div
        :class="className"
        :style="style"
        v-bind="$attrs"
        v-html="text"
    />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class NoItemsPlaceholder extends Vue {
    @Prop({ required: true }) text!: string
    @Prop({ default: 'grid' }) mode!: string

    get className (): string {
        if (this.mode === 'grid') {
            return 'row align-center justify-center grey--text body-1 font-weight-bold text-center'
        }
        if (this.mode === 'flex') {
            return 'd-flex flex-column flex align-center justify-center grey--text body-1 font-weight-bold text-center'
        }
        throw new Error('Unknown mode')
    }

    get style (): string {
        if (this.mode === 'grid') {
            return 'height: 170px'
        }
        return ''
    }
}
</script>

<style>

</style>
