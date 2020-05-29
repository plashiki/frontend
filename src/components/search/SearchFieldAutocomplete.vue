<template>
    <v-autocomplete
        :items="items"
        :label="$t('Pages.Search.Name')"
        :loading="loading"
        :rules="required ? [requiredField] : undefined"
        :search-input.sync="input"
        @keyup.enter="links && openSearch()"
        append-icon=""

        autocomplete="off"
        class="search-field-autocomplete"
        hide-no-data
        item-value="id"
        no-filter
        ref="field"
        v-bind="$attrs"
        v-model="selected"
    >
        <template
            #selection
            v-if="links"
        >
            <!-- nop -->
        </template>
        <template
            #selection="{ item }"
            v-else
        >
            <v-chip small>
                {{ name(item) }}
            </v-chip>
        </template>

        <template #item="{ item }">
            <v-list-item-avatar
                style="height: auto"
                tile
            >
                <v-img
                    :lazy-src="smallImage(item)"
                    :src="fullImage(item)"
                    height="48"
                    width="64"
                />
            </v-list-item-avatar>
            <v-list-item-content>
                <v-list-item-title>
                    {{ name(item) }}
                </v-list-item-title>
                <v-list-item-subtitle v-show="!!secondaryName(item)">
                    {{ secondaryName(item) }}
                </v-list-item-subtitle>
            </v-list-item-content>
        </template>
    </v-autocomplete>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { nop } from '@/utils/helpers'
import {
    getMediaFullImage,
    getMediaPreferredName,
    getMediaSecondaryName,
    getMediaSmallImage
} from '@/utils/media-utils'
import { Debounced } from '@/utils/function-utils'
import { getMedias, searchMediaByName } from '@/api/media'
import { requiredField } from '@/utils/validators'
import { Media, MediaId, MediaType } from '@/types/media'
import { iziToastError } from '@/plugins/izitoast'

@Component({})
export default class SearchFieldAutocomplete extends Vue {
    @Prop() value!: Media | undefined
    @Prop({ required: true }) mediaType!: MediaType
    @Prop({ type: Boolean, default: false }) links!: boolean
    @Prop({ type: Boolean, default: false }) required!: boolean

    requiredField = requiredField

    loading = false
    items: Media[] = []
    input = ''
    media: Media | null = null
    selected: MediaId | null = null

    @Watch('selected')
    onSelectionChange (): void {
        this.$nextTick(() => {
            this.media = (this.$refs.field as any).selectedItems[0] ?? null
            this.$emit('input', this.media)
        })

        if (!this.selected) this.items = []
        if (this.selected && this.links) {
            this.$router.push(`/${this.mediaType}/${this.selected}`)
            this.selected = null
        }
    }

    @Watch('value')
    onValueChange (): void {
        if (this.value && (typeof this.value === 'object') && this.value !== this.media) {
            this.media = this.value
            this.selected = this.value.id
            this.items = [this.value]
        }
    }

    fullImage (item: Media): string {
        return getMediaFullImage(item)
    }

    smallImage (item: Media): string | undefined {
        return getMediaSmallImage(item)
    }

    name (item: Media): string {
        return getMediaPreferredName(item)
    }

    secondaryName (item: Media): string | undefined {
        return getMediaSecondaryName(item)
    }

    openSearch (): void {
        this.$router.push({
            name: 'search',
            query: { q: this.input }
        }).catch(nop)
    }

    @Watch('input')
    @Debounced(250)
    search (): void {
        if (!this.input && !this.selected) {
            this.items = []
            return
        }
        if (this.selected) return
        this.loading = true
        searchMediaByName(this.input, this.mediaType, {
            limit: 10
        }).then((items) => {
            this.items = items
        }).catch(iziToastError).finally(() => {
            this.loading = false
        })
    }

    loadMedia (id: number, type: MediaType) {
        this.loading = true

        this.items = []
        this.selected = null
        this.media = null

        getMedias([id], type).then(([media]) => {
            if (media) {
                this.items = [media]
                this.selected = media.id
                this.media = media
                this.$emit('input', media)
            }
        }).catch(nop).finally(() => {
            this.loading = false
        })
    }

    reset (): void {
        this.media = null
        this.selected = null
        this.items = [];
        (this.$refs.field as any).resetValidation()
    }

    mounted (): void {
        this.onValueChange()
    }
}
</script>

<style lang="scss">
/*.v-autocomplete__content .v-list-item--link:not(.media-list-item) {*/
/*    padding: 0!important;*/
/*}*/

/*.v-autocomplete__content .v-list-item--link .media-list-item {*/
/*    padding: 0 16px!important;*/
/*}*/
</style>
