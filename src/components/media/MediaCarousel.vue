<template>
    <smooth-slide-group
        ref="slider"
        :show-buttons="$r12s.isDesktopByWidth"
        :height="height"
        :count="cols.length"
    >
        <template
            v-if="items.length === 0 || loading"
            #content
        >
            <v-row
                :style="{ height: height + 'px' }"
                align="center"
                class="fill-height ma-0"
                justify="center"
            >
                <v-progress-circular
                    v-if="loading"
                    color="primary"
                    indeterminate
                    size="32"
                    width="2"
                />
                <h3
                    v-else
                    class="grey--text font-weight-bold"
                >
                    {{ noItemsText }}
                </h3>
            </v-row>
        </template>
        <template
            v-else
            #default
        >
            <div
                v-for="(col, i) in cols"
                :key="i"
                class="pa-0 ma-0"
            >
                <MediaCard
                    v-for="(item, j) in col"
                    :key="j"
                    :item="item"
                    :height="itemHeight"
                    :width="itemWidth"
                    class="mx-1 my-2"
                    fixed-size
                />
            </div>
        </template>
    </smooth-slide-group>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import MediaCard from '@/components/media/MediaCard.vue'
import { chunksArray } from '@/utils/object-utils'
import { Media } from '@/types/media'
import SmoothSlideGroup from '@/components/common/SmoothSlideGroup.vue'

@Component({
    components: { SmoothSlideGroup, MediaCard }
})
export default class MediaCarousel extends Vue {
    @Prop({ required: true }) items!: Media[]
    @Prop({ type: String, default: '' }) noItemsText!: string
    @Prop({ type: Boolean, default: false }) loading!: boolean
    @Prop({ type: Number, default: 1 }) rows!: number
    @Prop({ type: Number, default: 240 }) itemHeight!: number
    @Prop({ type: Number, default: 180 }) itemWidth!: number

    get height (): number {
        return (this.itemHeight * this.rows
            + 8 * (this.rows + 1)) // gaps - top, bottom + between rows
    }

    get cols (): Media[][] {
        return chunksArray(this.items, this.rows)
    }

    @Watch('cols')
    @Watch('loading')
    update (): void {
        this.$nextTick(() => {
            (this.$refs.slider as any).updateButtons()
        })
    }
}
</script>

<style>
.media-carousel__placeholder {
    height: 240px;
    width: 180px;
}
</style>
