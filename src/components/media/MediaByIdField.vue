<template>
    <v-text-field
        ref="field"
        v-model="input"
        :error-messages="notFound ? $t('Common.Collection.NoItemsFound') : undefined"
        :loading="loading"
        :prefix="prefix"
        :rules="[validate]"
        :success-messages="media ? name(media) : undefined"
        autocomplete="off"
        class="pretty-prefix"
        v-bind="$attrs"
    />
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Debounced } from '@/utils/function-utils'
import { getMedias } from '@/api/media'
import { getPreferredName, getSecondaryName } from '@/utils/media-utils'
import { Media, MediaType } from '@/types/media'
import { nop } from '@/utils/helpers'
import { getProviderNow } from '@/api/providers'

@Component({})
export default class MediaByIdField extends Vue {
    @Prop() value!: Media | undefined
    @Prop({ required: true }) mediaType!: MediaType
    @Prop({ default: false }) allowEmpty!: boolean

    input = ''
    loading = false
    media: Media | null = null
    notFound = false

    get prefix (): string {
        return getProviderNow().getMediaUrlPrefix(this.mediaType)
    }

    validate (value: string): any {
        if (!value) {
            if (this.allowEmpty) return true
            return this.$t('Items.Media.InvalidId')
        }

        return true
    }

    @Watch('value')
    valueChanged (): void {
        if (this.value && this.value !== this.media) {
            this.notFound = false
            this.media = this.value
            this.input = this.media.id + ''
        }
    }

    @Watch('input')
    inputChanged (): void {
        if (this.media?.id == this.input) return

        this.media = null
        this.notFound = false
        this.$emit('input', this.media)
    }

    @Watch('input')
    @Debounced(250)
    inputChangedDebounced (): void {
        if (!this.input || this.media?.id == this.input) return
        this.loading = true
        getMedias([this.input], this.mediaType).then(([media]) => {
            this.media = media ?? null
            this.loading = false
            this.notFound = !media

            this.$emit('input', this.media)
        })
    }

    name (item?: Media): string {
        if (!item || !item.name) return ''
        let pref = getPreferredName(item?.name)
        let second = getSecondaryName(item?.name)
        return second ? `${pref} / ${second}` : pref
    }

    loadMedia (id: number, type: MediaType) {
        this.loading = true

        this.notFound = false
        this.input = ''
        this.media = null

        getMedias([id], type).then(([media]) => {
            if (media) {
                this.media = media
                this.input = media.id + ''
                this.$emit('input', media)
            }

        }).catch(nop).finally(() => {
            this.loading = false
        })
    }

    reset (): void {
        this.notFound = false
        this.media = null
        this.input = '';
        (this.$refs.field as any).resetValidation()
    }

    mounted (): void {
        this.valueChanged()
    }
}
</script>

<style>

</style>
