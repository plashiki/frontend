<template>
    <v-slide-group
        :class="{ loading }"
        :show-arrows="$r12s.isDesktopByWidth"
        ref="slider"
    >
        <v-slide-item
            v-if="items.length === 0 || loading"
        >
            <v-row
                :style="{ height }"
                align="center"
                class="fill-height ma-0"
                justify="center"
            >
                <v-progress-circular
                    color="primary"
                    indeterminate
                    size="32"
                    v-if="loading"
                    width="2"
                />
                <h3
                    class="grey--text font-weight-bold"
                    v-else
                >
                    {{ noItemsText }}
                </h3>
            </v-row>
        </v-slide-item>
        <template v-else>
            <v-slide-item
                :key="i"
                v-for="(col, i) in cols"
            >
                <div class="pa-0 ma-0">
                    <MediaCard
                        :item="item"
                        :key="j"
                        class="mx-1 my-2"
                        fixed-size
                        v-for="(item, j) in col"
                    />
                </div>
            </v-slide-item>
        </template>
    </v-slide-group>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import MediaCard from '@/components/media/MediaCard.vue'
import { chunksArray } from '@/utils/object-utils'
import { Media } from '@/types/media'

@Component({
    components: { MediaCard }
})
export default class MediaCarousel extends Vue {
    @Prop({ required: true }) items!: Media[]
    @Prop({ type: String, default: '' }) noItemsText!: string
    @Prop({ type: Boolean, default: false }) loading!: boolean
    @Prop({ type: Number, default: 1 }) rows!: number

    get height (): string {
        return (240 * this.rows
            + 8 * (this.rows + 1)) // gaps - top, bottom + between rows
            + 'px'
    }

    get cols (): Media[][] {
        return chunksArray(this.items, this.rows)
    }
}
</script>

<style>
.media-carousel__placeholder {
    height: 240px;
    width: 180px;
}
</style>
