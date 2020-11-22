<template>
    <v-autocomplete
        ref="field"
        v-model="selected"
        :items="items"
        :label="$t('Pages.Search.Name')"
        :loading="loading"
        :rules="required ? [requiredField] : undefined"
        :search-input.sync="input"

        :append-icon="$attrs.appendIcon || ''"
        autocomplete="off"
        class="search-field-autocomplete"
        item-value="id"
        hide-no-data
        no-filter
        v-bind="$attrs"
        @keyup.enter="links && openSearch()"
    >
        <template
            v-if="mini"
            #label
        >
            <v-icon class="ml-1">mdi-magnify</v-icon>
        </template>

        <template
            v-if="links"
            #selection
        >
            <!-- nop -->
        </template>
        <template
            v-else
            #selection="{ item }"
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
    getFullImage,
    getPreferredName,
    getSecondaryName,
    getSmallImage
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
    @Prop({ type: Boolean, default: false }) mini!: boolean

    requiredField = requiredField

    loading = false
    items: Media[] = []
    input = ''
    media: Media | null = null
    selected: MediaId | null = null

    lastNavigated = 0

    @Watch('selected')
    onSelectionChange (): void {
        this.$nextTick(() => {
            this.media = (this.$refs.field as any).selectedItems[0] ?? null
            this.$emit('input', this.media)
        })

        if (!this.selected) this.items = []
        if (this.selected && this.links) {
            this.$router.push(`/${this.mediaType}/${this.selected}`)
            this.$emit('navigation')
            this.selected = null
            this.lastNavigated = Date.now()
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
        return getFullImage(item.poster)
    }

    smallImage (item: Media): string | undefined {
        return getSmallImage(item.poster)
    }

    name (item: Media): string {
        return getPreferredName(item.name)
    }

    secondaryName (item: Media): string | undefined {
        return getSecondaryName(item.name)
    }

    openSearch (): void {
        // this is fucking cringe. fuck vuetify, fuck frontend
        if (this.selected || Date.now() - this.lastNavigated < 100) return

        this.$emit('search')
        this.$router.push({
            name: 'search',
            query: { q: this.input }
        }).catch(nop)
        this.$nextTick(() => {
            this.input = ''
            this.selected = null
        })
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
        searchMediaByName(this.input, this.mediaType).then(({ items }) => {
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
