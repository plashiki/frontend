<template>
    <v-card
        :height="fixedSize ? 240 : undefined"
        :ripple="!$r12s.isTouchDevice"
        :title="name"
        :to="noLink ? undefined : `/${item.type}/${item.id}`"
        :width="fixedSize ? 180 : undefined"
        class="media-card"
        flat
    >
        <v-img
            :aspect-ratio="2/3"
            :height="fixedSize ? 240 : undefined"
            :lazy-src="smallImage"
            :src="fullImage"
            :width="fixedSize ? 180 : undefined"
            class="align-end"
            gradient="to bottom, rgba(0,0,0,0) 80%, rgba(0,0,0,.9) 100%"
        >
            <v-chip
                class="release-type no-hover"
                v-if="item.statusText2 !== undefined || item.releaseType !== undefined"
            >
                {{ item.statusText2 || $t('Items.Media.ReleaseType.' + item.releaseType) }}
            </v-chip>
            <v-chip
                class="status-text no-hover"
                v-if="!!item.statusText"
            >
                {{ item.statusText }}
            </v-chip>
            <v-card-subtitle class="text-left text-truncate white--text pb-2">
                {{ name }}
            </v-card-subtitle>
        </v-img>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { getMediaFullImage, getMediaPreferredName, getMediaSmallImage } from '@/utils/media-utils'
import { Media } from '@/types/media'

@Component({})
export default class MediaCard extends Vue {
    @Prop({ required: true }) item!: Media
    @Prop({ default: false }) noLink!: boolean
    @Prop({ type: Boolean, default: false }) fixedSize!: boolean

    get fullImage (): string {
        return getMediaFullImage(this.item)
    }

    get smallImage (): string | undefined {
        return getMediaSmallImage(this.item)
    }

    get name (): string {
        return getMediaPreferredName(this.item)
    }
}
</script>

<style lang="scss">
.media-card {
    .v-image__image {
        transition: filter 0.25s linear, transform 0.25s linear;
    }

    .release-type {
        position: absolute !important;
        top: 8px;
        left: 8px;
        opacity: 0.95;
    }

    .status-text {
        padding: 0 6px;
        font-size: 10px !important;
        position: absolute !important;
        top: 48px;
        left: 8px;
        opacity: 0.95;
    }

    .theme--light & .v-chip {
        background: darken(white, 5%) !important;
    }

    .theme--dark & .v-chip {
        background: lighten(black, 15%) !important;
    }

    &:hover {
        .v-image__image {
            transform: scale(1.05);
        }
    }
}

</style>
