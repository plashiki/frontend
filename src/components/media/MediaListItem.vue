<template>
    <v-list-item
        :to="noLink ? undefined : `/${item.type}/${item.id}`"
        class="text-left media-list-item"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <v-list-item-avatar tile>
            <v-img
                :lazy-src="smallImage"
                :src="fullImage"
                height="48"
                width="64"
            />
        </v-list-item-avatar>
        <v-list-item-content>
            <v-list-item-title>
                {{ name }}
            </v-list-item-title>
            <v-list-item-subtitle v-show="!!secondaryName">
                {{ secondaryName }}
            </v-list-item-subtitle>
        </v-list-item-content>
    </v-list-item>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import {
    getMediaFullImage,
    getMediaPreferredName,
    getMediaSecondaryName,
    getMediaSmallImage
} from '@/utils/media-utils'
import { Media } from '@/types/media'

@Component({})
export default class MediaListItem extends Vue {
    @Prop({ required: true }) item!: Media
    @Prop({ default: false }) noLink!: boolean

    get fullImage (): string {
        return getMediaFullImage(this.item)
    }

    get smallImage (): string | undefined {
        return getMediaSmallImage(this.item)
    }

    get name (): string {
        return getMediaPreferredName(this.item)
    }

    get secondaryName (): string | undefined {
        return getMediaSecondaryName(this.item)
    }
}
</script>

<style lang="scss">
.media-list-item {
    .v-avatar {
        height: auto !important;
    }
}
</style>
