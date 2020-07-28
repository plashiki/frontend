<template>
    <v-card
        :height="fixedSize ? 240 : undefined"
        :ripple="!$r12s.isTouchDevice && !actions"
        :title="name"
        :to="noLink || actions ? undefined : `/${item.type}/${item.id}`"
        :width="fixedSize ? 180 : undefined"
        class="media-card"
        :class="{ 'media-card--has-actions': actions }"
        flat
    >
        <v-hover #default="{ hover }">
            <v-img
                :aspect-ratio="2/3"
                :height="fixedSize ? 240 : undefined"
                :lazy-src="smallImage"
                :src="fullImage"
                :width="fixedSize ? 180 : undefined"
                class="fill-height d-flex align-end"
                gradient="to bottom, rgba(0,0,0,0) 80%, rgba(0,0,0,.9) 100%"
            >
                <v-chip
                    v-if="item.statusText2 !== undefined || item.releaseType !== undefined"
                    class="release-type no-hover"
                >
                    {{ item.statusText2 || $t('Items.Media.ReleaseType.' + item.releaseType) }}
                </v-chip>
                <v-chip
                    v-if="!!item.statusText"
                    class="status-text no-hover"
                >
                    {{ item.statusText }}
                </v-chip>
                <v-card-subtitle class="text-left text-truncate white--text pb-2">
                    {{ name }}
                </v-card-subtitle>

                <transition
                    v-if="actions"
                    name="fade-transition"
                >
                    <div
                        v-if="hover"
                        class="media-card--actions-overlay"
                    >
                        <slot name="actions" :item="item" />

                        <v-btn
                            v-if="!noLink"
                            color="primary"
                            class="ma-1"
                            :to="`/${item.type}/${item.id}`"
                            depressed
                            small
                        >
                            <v-icon left>
                                mdi-open-in-new
                            </v-icon>

                            {{ $t('Common.Action.Open') }}
                        </v-btn>
                    </div>
                </transition>
            </v-img>
        </v-hover>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { getMediaFullImage, getMediaPreferredName, getMediaSmallImage } from '@/utils/media-utils'
import { Media } from '@/types/media'

@Component({})
export default class MediaCard extends Vue {
    @Prop({ required: true }) item!: Media
    @Prop({ type: Boolean, default: false }) noLink!: boolean
    @Prop({ type: Boolean, default: false }) actions!: boolean
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

    &--actions-overlay {
        position: absolute;
        padding-top: 8px;
        padding-bottom: 8px;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(2px);
        transition: all 0.25s linear;
    }

    &:hover {
        .v-image__image {
            transform: scale(1.05);
        }
    }
}

</style>
