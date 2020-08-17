<template>
    <div>
        <div
            class="expandable-div--wrap"
            :style="{ 'max-height': visibleHeight + 'px' }"
        >
            <div
                ref="inner"
                v-html="html"
            />
        </div>

        <v-btn
            v-show="overflows && !expanded"
            text
            block
            small
            @click="expand"
        >
            <v-icon small>
                mdi-chevron-down
            </v-icon>
        </v-btn>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Ref, Watch } from 'vue-property-decorator'

@Component({})
export default class ExpandableDiv extends Vue {
    @Prop({ default: 120, type: Number }) maxHeight!: number
    @Prop({ required: true, type: String }) html!: string
    @Ref() inner!: HTMLDivElement

    overflows = false
    expanded = false

    visibleHeight = 0

    @Watch('html')
    update (): void {
        this.$nextTick(() => {
            this.expanded = false
            this.visibleHeight = this.maxHeight
            this.overflows = this.inner.clientHeight > this.maxHeight
        })
    }

    expand (): void {
        this.expanded = true
        this.visibleHeight = this.inner.clientHeight
    }

    mounted (): void {
        this.update()
    }
}
</script>

<style lang="scss">
.expandable-div {
    &--wrap {
        overflow: hidden;
        transition: max-height 0.5s ease-in-out;
    }
}
</style>
