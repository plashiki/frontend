<template>
    <smooth-slide-group
        ref="slider"
        :show-buttons="$r12s.isDesktopByWidth"
        :height="height"
        :count="loading || transitionPending ? -1 : items.length"
        :disabled="loading"
    >
        <transition
            mode="out-in"
            name="fade-transition"
            @before-leave="transitionPending = true"
            @before-enter="transitionPending = false"
        >
            <div
                v-if="loading"
                class="d-flex flex-row overflow-hidden fill-height ma-0 align-left justify-center media-carousel-loader"
            >
                <div
                    v-for="i in 8"
                    :key="i"
                    class="d-flex flex-column"
                >
                    <v-skeleton-loader
                        v-for="i in rows"
                        :key="i"
                        type="image"
                        class="ma-2"
                        :style="{ width: itemWidth + 'px', height: itemHeight + 'px' }"
                    />
                </div>
            </div>
            <v-row
                v-else-if="items.length === 0"
                class="fill-height ma-0"
                align="center"
                justify="center"
                :style="{ height: height + 'px' }"
            >
                <h3 class="grey--text font-weight-bold" v-text="noItemsText" />
            </v-row>
            <VirtualGrid
                v-else
                direction="horizontal"
                :items="items"
                :fixed-width="itemWidth"
                :fixed-height="itemHeight"
                :min-cell-height="itemHeight"
                :gap-x="8"
                :gap-y="8"
                :rows="rows"
            >
                <template #default="{ item }">
                    <MediaCard
                        :item="item"
                        :height="itemHeight"
                        :width="itemWidth"
                        fixed-size
                    />
                </template>
            </VirtualGrid>
        </transition>
    </smooth-slide-group>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import MediaCard from '@/components/media/MediaCard.vue'
import { Media } from '@/types/media'
import SmoothSlideGroup from '@/components/common/SmoothSlideGroup.vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'

@Component({
    components: { VirtualGrid, SmoothSlideGroup, MediaCard }
})
export default class MediaCarousel extends Vue {
    @Prop({ required: true }) items!: Media[]
    @Prop({ type: String, default: '' }) noItemsText!: string
    @Prop({ type: Boolean, default: false }) loading!: boolean
    @Prop({ type: Number, default: 1 }) rows!: number
    @Prop({ type: Number, default: 240 }) itemHeight!: number
    @Prop({ type: Number, default: 180 }) itemWidth!: number

    transitionPending = false

    get height (): number {
        return (this.itemHeight * this.rows
            + 8 * (this.rows + 1)) // gaps - top, bottom + between rows
    }

    @Watch('items')
    @Watch('loading')
    update (): void {
        this.$nextTick(() => {
            (this.$refs.slider as any).updateButtons()
        })
    }
}
</script>

<style>
.media-carousel-loader .v-skeleton-loader__image {
    height: 100%!important;
}
</style>
