<template>
    <v-form
        ref="form"
        v-model="formValid"
    >
        <TwoOptionSwitch
            v-model="byId"
            :disabled="disabled"
            :false-label="$t('Items.Media.ByName')"
            :true-label="$t('Items.Media.ById')"
            persist="media-id-chooser"
        />
        <v-row
            align="center"
            class="flex-nowrap ma-0"
            justify="center"
        >
            <v-img
                v-if="$r12s.isDesktopByWidth"
                :aspect-ratio="2/3"
                :src="posterSrc"
                class="mr-2"
                max-width="60"
            />
            <SearchFieldAutocomplete
                v-if="!byId"
                ref="idInput"
                v-model="selectedMedia"
                :disabled="disabled"
                :media-type="mediaType"
                :required="!allowEmpty"
                clearable
            />
            <MediaByIdField
                v-else
                ref="idInput"
                v-model="selectedMedia"
                :allow-empty="allowEmpty"
                :disabled="disabled"
                :media-type="mediaType"
                clearable
            />
            <v-btn
                :disabled="!selectedMedia || disabled"
                :href="selectedMedia ? selectedMedia.url : 'about:blank'"
                icon
                target="_blank"
            >
                <v-icon small>
                    mdi-open-in-new
                </v-icon>
            </v-btn>
        </v-row>
        <ErrorAlert
            :error="malLookupError"
        />
        <v-row>
            <v-col
                class="py-0"
                cols="12"
                md="4"
            >
                <v-number-field
                    v-model="proxyPart"
                    :allow-empty="allowEmpty"
                    :disabled="disabled"
                    :label="mediaType === 'anime' ? $t('Items.Media.Episode') : $t('Items.Media.Chapter')"
                    :messages="proxyPart && selectedMedia && selectedMedia.partsCount !== 0 && proxyPart > selectedMedia.partsCount ?
                        $tc(mediaType === 'anime' ? 'Items.Media.OnlyNEpisodes'
                            : 'Items.Media.OnlyNChapters', selectedMedia.partsCount) : undefined"
                    :predicate="v => v > 0"
                    :prefix="$t('Items.Media.PartPrefix')"
                    :validate-on-blur="!allowEmpty"
                />
            </v-col>
            <v-col
                class="py-0"
                cols="12"
                sm="6"
                md="4"
            >
                <v-select
                    v-model="form.lang"
                    :disabled="disabled"
                    :items="langs"
                    :label="$t('Items.Translation.LanguageName')"
                    :rules="[requiredField]"
                    validate-on-blur
                >
                    <template #item="{ item }">
                        <v-list-item-title>
                            <span :class="'mr-2 flag-' + item.value" />
                            {{ item.text }}
                        </v-list-item-title>
                    </template>
                </v-select>
            </v-col>
            <v-col
                class="py-0"
                cols="12"
                sm="6"
                md="4"
            >
                <v-select
                    v-model="form.kind"
                    :disabled="disabled"
                    :items="kinds"
                    :label="$t('Items.Translation.KindName')"
                    :rules="[requiredField]"
                    validate-on-blur
                />
            </v-col>
        </v-row>
        <v-checkbox
            v-model="form.hq"
            :disabled="disabled"
            :label="$t('Items.Translation.IsHq')"
            class="mt-0"
            hide-details
        />
        <v-combobox
            v-model="form.author"
            :disabled="disabled"
            :hint="form.author ? undefined : $t('Items.Translation.LeaveBlankIfUnknown')"
            :label="$t('Items.Translation.Author')"
            :items="authorSearch && commonAuthors.indexOf(authorSearch) === -1 ? commonAuthors : []"
            :search-input.sync="authorSearch"
            :filter="(_, input, text) => input.length < 2 ? false : text.toLowerCase().indexOf(input.toLowerCase()) > -1"
            autocomplete="off"
            persistent-hint
            hide-no-data
            clearable
            validate-on-blur
        />
        <v-text-field
            v-model="inputUrl"
            :disabled="disabled || noUrl"
            :label="$t('Items.Translation.Url')"
            :rules="[requiredField, urlValidator]"
            autocomplete="off"
            clearable
            validate-on-blur
        >
            <template #append-outer>
                <v-btn
                    icon
                    :href="inputUrl"
                    :disabled="inputUrl === ''"
                    target="_blank"
                >
                    <v-icon small>
                        mdi-open-in-new
                    </v-icon>
                </v-btn>
            </template>
        </v-text-field>
        <v-row
            align="center"
            class="mt-3 overflow-x-auto"
            justify="center"
        >
            <v-responsive
                v-if="!noPreview && !!form.url"
                :aspect-ratio="16/9"
                class="elevation-3 ma-2"
                style="max-width: 360px"
            >
                <iframe
                    :src="form.url"
                    allowfullscreen
                    allow="autoplay, encrypted-media"
                    class="viewer-iframe"
                ></iframe>
            </v-responsive>
            <v-layout
                flex-grow-1
                justify-center
                ma-0
                row
                wrapa
            >
                <slot />
                <template v-if="showMeta">
                    <v-simple-card class="v-card--outlined text-wrap">
                        <v-progress-linear v-if="playerMetaLoading" />
                        <template v-if="playerMeta !== null">
                            <h4
                                v-if="playerMeta.title"
                                v-text="playerMeta.title"
                            />
                            <p
                                v-if="playerMeta.description"
                                v-text="playerMeta.description"
                            />
                            <a
                                v-if="playerMeta.uploader"
                                :href="playerMeta.uploader"
                                target="_blank"
                                v-text="playerMeta.uploader"
                            /><br />
                            <a
                                v-if="playerMeta.url"
                                :href="playerMeta.url"
                                target="_blank"
                                v-text="playerMeta.url"
                            /><br />
                            <p
                                v-if="playerMeta.error"
                                class="error--text"
                                v-text="playerMeta.error"
                            />
                        </template>
                    </v-simple-card>
                </template>
            </v-layout>
        </v-row>
    </v-form>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import SearchFieldAutocomplete from '@/components/search/SearchFieldAutocomplete.vue'
import TwoOptionSwitch from '@/components/common/fields/TwoOptionSwitch.vue'
import MediaByIdField from '@/components/media/MediaByIdField.vue'
import { requiredField, urlValidator } from '@/utils/validators'
import { getFeatureVarNow } from '@/api/providers'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { lookupMalId } from '@/api/media'
import { getMediaFullImage, getMediaSmallImage } from '@/utils/media-utils'
import { transparentPixel } from '@/utils/helpers'
import VNumberField from '@/components/common/fields/VNumberField.vue'
import { Translation, TranslationLanguage } from '@/types/translation'
import { Media, MediaType } from '@/types/media'
import { ApiException } from '@/types/api'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import { PlayerMeta } from '@/types/moderation'
import { getPlayerMeta } from '@/api/moderation'
import { iziToastError } from '@/plugins/izitoast'
import { authors as commonAuthors } from '@/assets/authors.txt'

const formDefaults = {
    author: '',
    url: '',
    hq: false
} as any

type TranslationFormData = {
    [P in keyof Translation]?: P extends 'uploader' | 'uploader_id' | 'status' | 'groups' | 'created_at' | 'updated_at'
        ? never : Translation[P] | null
}

@Component({
    components: { VSimpleCard, VNumberField, ErrorAlert, MediaByIdField, TwoOptionSwitch, SearchFieldAutocomplete }
})
export default class TranslationForm extends Vue {
    @Prop({ type: Object, default: () => ({}) }) form!: TranslationFormData
    @Prop({ type: Object, default: null }) media!: Media | null
    @Prop({ type: Boolean, default: false }) noPreview!: boolean
    @Prop({ type: Boolean, default: false }) noUrl!: boolean
    @Prop({ type: Boolean, default: false }) disabled!: boolean
    @Prop({ type: Boolean, default: false }) showMeta!: boolean
    @Prop({ type: Boolean, default: false }) allowEmpty!: boolean

    urlValidator = urlValidator
    commonAuthors = commonAuthors

    byId = false
    valid = false

    authorSearch = null

    formValid = false
    malLookupError: ApiException | null = null
    mediaType: MediaType = 'anime'
    selectedMedia: Media | null = null
    inputUrl = ''

    playerMeta: PlayerMeta | null = null
    playerMetaLoading = false

    get posterSrc (): string {
        return this.selectedMedia ? getMediaSmallImage(this.selectedMedia) ?? getMediaFullImage(this.selectedMedia) : transparentPixel
    }

    get kinds (): any[] {
        return (this.mediaType === 'anime' ? ['sub', 'dub', 'raw'] : ['scan', 'off', 'raw'])
            .map(value => ({
                text: this.$t('Items.Translation.Kind.' + value),
                value
            }))
    }

    get langs (): any[] {
        return Object.values(TranslationLanguage).map(value => ({
            text: this.$t('Items.Translation.Language.' + value),
            value
        }))
    }

    get proxyPart (): string {
        return this.form.part ? this.form.part + '' : ''
    }

    set proxyPart (val: string) {
        let q = parseInt(val)
        this.form.part = isNaN(q) || q <= 0 ? null : q
    }

    requiredField (v: string): boolean | string {
        if (this.allowEmpty) return true
        return requiredField(v)
    }

    fixValidation (): void {
        if (this.$refs.form) {
            (this.$refs.form as any).inputs.forEach((it: any) => {
                if (it.internalValue) {
                    it.valid = it.validate()
                }
            })
        } else setTimeout(this.fixValidation, 10)
    }

    @Watch('inputUrl')
    urlChanged (val: string): void {
        if (val) {
            let m = val.match(/^\s*<iframe[^>]*?src=['"](.*?)['"][^>]*?>/i)
            if (m) {
                let val = m[1]
                if (val.startsWith('//')) val = 'https:' + val
                this.inputUrl = val.replace(/&amp;/ig, '&')
                return
            }
        }
        let valid = val && urlValidator(val) === true
        this.form.url = valid ? val : null
    }

    @Watch('form')
    initForm (): void {
        ['target_id', 'target_type', 'part', 'kind', 'lang', 'hq', 'author', 'url'].forEach((key) => {
            if (!(key in this.form)) {
                this.$set(this.form, key,
                    key === 'target_type' ? this.mediaType :
                        key in formDefaults ? formDefaults[key] :
                            null
                )
            }
        })
        if (!this.form.target_id && this.selectedMedia !== null) {
            (this.$refs.idInput as any).reset()
            this.selectedMedia = null
        }
        this.inputUrl = this.form.url ?? ''
        this.$nextTick(() => {
            if (this.form.target_id && this.form.target_type && this.selectedMedia?.malId !== this.form.target_id) {
                (this.$refs.idInput as any).loadMedia(this.form.target_id, this.form.target_type)
            }
            this.fixValidation()
        })
    }

    @Watch('selectedMedia')
    onMediaChanged (): void {
        if (!this.selectedMedia) {
            this.form.target_id = null
            return
        }
        let isMalId = getFeatureVarNow('IsMALId', { media: this.selectedMedia })
        let id = this.selectedMedia.id
        if (!id || isMalId) {
            this.form.target_id = id as any
        } else {
            if (this.selectedMedia.malId !== undefined) {
                this.form.target_id = this.selectedMedia.malId
            } else {
                this.form.target_id = null
                lookupMalId(id, this.selectedMedia.type).then((malId) => {
                    // in case promise took too long.
                    if (this.selectedMedia?.id === id) {
                        this.form.target_id = malId
                    }
                }).catch((err) => {
                    this.malLookupError = err
                })
            }
        }
    }

    @Watch('form')
    @Watch('form.target_id')
    @Watch('selectedMedia')
    @Watch('formValid')
    updateValidness (): void {
        if (this.allowEmpty) {
            this.valid = this.formValid
        } else {
            this.valid = this.formValid && this.selectedMedia !== null && this.form.target_id !== null
        }
        this.$emit('input', this.valid)
    }

    @Watch('media')
    updateInputMedia (): void {
        if (this.media !== null && this.selectedMedia !== this.media) {
            this.selectedMedia = this.media
        }
    }

    loadPlayerMeta (): void {
        if (!this.form.id || this.playerMetaLoading) return

        this.playerMetaLoading = true
        getPlayerMeta(this.form.id)
            .then((meta) => {
                this.playerMeta = meta
            })
            .catch(iziToastError)
            .finally(() => {
                this.playerMetaLoading = false
            })
    }

    mounted (): void {
        this.initForm()
        this.updateInputMedia()

        if (this.showMeta) {
            this.loadPlayerMeta()
        }
    }
}
</script>

<style>

</style>
