<template>
    <v-card>
        <v-card-text :class="textClass">
            <v-row
                align="center"
                class="flex-nowrap mb-2"
                justify="center"
                no-gutters
            >
                <slot name="buttons" />
                <v-spacer v-if="!noHeaderSpacer" />
                <slot name="buttons-right" />

                <v-btn
                    :color="listViewMode === 'cards' ? 'primary' : 'default'"
                    class="ma-1"
                    icon
                    @click="setListViewMode('cards')"
                >
                    <v-icon>mdi-view-module</v-icon>
                </v-btn>
                <v-btn
                    :color="listViewMode === 'items' ? 'primary' : 'default'"
                    class="ma-1"
                    icon
                    @click="setListViewMode('items')"
                >
                    <v-icon>mdi-view-list</v-icon>
                </v-btn>
            </v-row>
            <!-- bruh -->
            <virtual-grid
                ref="grid"
                #default="{ item }"
                :aspect-ratio="3/2"
                :fixed-height="listViewMode === 'cards' ? -1 : 64"
                :gap-x="listViewMode === 'cards' ? 8 : 4"
                :gap-y="listViewMode === 'cards' ? 8 : 0"
                :items="items"
                :max-columns="listViewMode === 'cards' ? 8 : 2"
                :min-cell-width="listViewMode === 'cards' ? 130 : 300"
                :min-columns="listViewMode === 'cards' ? 2 : 1"
            >
                <MediaCard
                    v-if="listViewMode === 'cards'"
                    :item="item"
                    :actions="actions"
                >
                    <template
                        v-if="actions"
                        #actions="data"
                    >
                        <slot name="actions-card" v-bind="data" />
                    </template>
                </MediaCard>
                <MediaListItem
                    v-else
                    :item="item"
                    :actions="actions"
                >
                    <template
                        v-if="actions"
                        #actions="data"
                    >
                        <slot name="actions-list" v-bind="data" />
                    </template>
                </MediaListItem>
            </virtual-grid>
            <slot name="placeholder">
                <NoItemsPlaceholder
                    v-if="!noPlaceholder && items.length === 0"
                    :text="$t('Common.Collection.NoItemsFound')"
                />
            </slot>

            <slot name="append" />
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { configStore } from '@/store'
import MediaListItem from '@/components/media/MediaListItem.vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'
import MediaCard from '@/components/media/MediaCard.vue'
import { Media } from '@/types/media'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'

@Component({
    components: { NoItemsPlaceholder, MediaCard, VirtualGrid, MediaListItem }
})
export default class MediaList extends Vue {
    @Prop({ default: () => [] }) items!: Media[]
    @Prop({ default: false }) hideButtons!: boolean
    @Prop({ default: false }) flat!: boolean
    @Prop({ type: Boolean, default: false }) noLinks!: boolean
    @Prop({ type: Boolean, default: false }) actions!: boolean
    @Prop({ type: Boolean, default: false }) noPlaceholder!: boolean
    @Prop({ type: Boolean, default: false }) noHeaderSpacer!: boolean
    @Prop({ default: undefined }) textClass!: any

    get listViewMode (): string {
        return configStore.listViewMode
    }

    setListViewMode (mode: 'cards' | 'items'): void {
        configStore.merge({
            listViewMode: mode
        })
    }

    @Watch('listViewMode')
    onListViewModeChanged (): void {
        this.$nextTick(() => {
            (this.$refs.grid as any).onResize()
        })
    }
}
</script>

<style>

</style>
