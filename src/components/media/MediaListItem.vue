<template>
    <v-list-item
        :to="noLink ? undefined : `/${item.type}/${item.id}`"
        class="media-list-item d-flex flex-row flex-nowrap"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <v-list-item-avatar tile>
            <v-img
                width="80"
                height="120"
                :lazy-src="smallImage"
                :src="fullImage"
            />
        </v-list-item-avatar>
        <div class="d-flex flex flex-column text-truncate py-2">
            <h3
                class="mb-1 text-truncate"
                :title="name"
                v-text="name"
            />
            <h5
                v-show="!!secondaryName"
                class="grey--text text-truncate"
                :title="secondaryName"
                v-text="secondaryName"
            />
            <p
                v-if="item"
                class="mt-2 mb-0 subtitle-2 font-weight-bold"
                v-text="item.statusText"
            />
            <v-spacer />
            <p
                class="mb-0 caption font-weight-bold"
                v-html="metaInformation.join(' / ')"
            />
        </div>
        <div
            v-if="actions"
            class="d-flex flex-column align-self-center"
        >
            <slot name="actions" :item="item" />
        </div>
    </v-list-item>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import {
    getFullImage,
    getPreferredName,
    getSecondaryName,
    getSmallImage
} from '@/utils/media-utils'
import { Media } from '@/types/media'

@Component({})
export default class MediaListItem extends Vue {
    @Prop({ required: true }) item!: Media
    @Prop({ type: Boolean, default: false }) actions!: boolean
    @Prop({ default: false }) noLink!: boolean

    get fullImage (): string {
        return getFullImage(this.item?.poster)
    }

    get smallImage (): string | undefined {
        return getSmallImage(this.item?.poster)
    }

    get name (): string {
        return getPreferredName(this.item?.name)
    }

    get secondaryName (): string | undefined {
        return getSecondaryName(this.item?.name)
    }

    get metaInformation (): string[] {
        if (!this.item) return []

        let ret: string[] = []

        if (this.item.releaseType) {
            ret.push(this.$t('Items.Media.ReleaseType.' + this.item.releaseType))
        }

        if (this.item.score) {
            ret.push(this.item.score + ' ★')
        }

        if (this.item.studio) {
            ret.push(this.item.studio)
        }

        if (this.item.genres?.length) {
            ret.push(this.$t(this.item.genres[0].name))
        }

        if (this.item.year) {
            ret.push(this.$t('Items.Media.Season.year', { n: this.item.year }))
        }

        return ret
    }
}
</script>

<style lang="scss">
.media-list-item {
    align-items: stretch;
    padding-left: 8px;

    .v-avatar {
        height: auto !important;
        width: auto !important;
        border-radius: 4px;
        flex-shrink: 0;
    }
}
</style>
