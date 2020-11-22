<template>
    <v-dialog
        v-model="vmodel"
        :max-width="800"
        scrollable
    >
        <v-card>
            <v-card-title>
                {{ $t('Pages.Viewer.Availability') }}
                <v-spacer />
                <v-btn
                    icon
                    @click="vmodel = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />

            <v-card-text>
                <transition>
                    <div
                        v-if="loading"
                        class="text-center"
                    >
                        <v-progress-circular
                            v-if="loading"
                            class="my-5"
                            color="primary"
                            :size="64"
                            :width="3"
                            indeterminate
                        />
                    </div>
                    <NoItemsPlaceholder
                        v-else-if="!data || data.length === null"
                        :text="$t('Common.Collection.NoItemsFound')"
                    />
                    <v-row
                        v-else
                        class="flex-wrap"
                    >
                        <v-col
                            v-for="it in groupedAvailabilityData"
                            :key="it.tag"
                            cols="auto"
                        >
                            <h3 class="text--primary" v-text="$t('Items.Translation.Language.' + it.lang + it.kind)" />
                            <div
                                v-for="i in it.items"
                                :key="i.key"
                                class="caption"
                            >
                                <b>{{ i.author || $t('Items.Translation.UnknownAuthor') }}</b>
                                —
                                {{ i.availability }}
                            </div>
                        </v-col>
                    </v-row>
                </transition>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Translation, TranslationKind, TranslationLanguage } from '@/types/translation'
import SortedArray from '@/utils/sorted-array'
import { configStore } from '@/store'
import { MediaType } from '@/types/media'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'
import { getTranslationsFor } from '@/api/translations'
import { iziToastError } from '@/plugins/izitoast'

interface AvailabilityData {
    kind: TranslationKind
    lang: TranslationLanguage
    author: string
    // user-readable string
    // format: A, B, C-D means that parts A, B and all parts between C and D are available
    availability: string

    key: string
}

interface AvailabilityDataGroup {
    kind: TranslationKind
    lang: TranslationLanguage
    items: AvailabilityData[]
    tag: string
}

@Component({
    components: { NoItemsPlaceholder },
})
export default class AuthorAvailabilityPopup extends Vue {
    @Prop({ required: true }) mediaId!: number
    @Prop({ required: true }) mediaType!: MediaType

    @Prop({ default: false }) value!: boolean

    loading = false

    data: Translation[] | null = null

    get vmodel (): boolean {
        return this.value
    }

    set vmodel (val: boolean) {
        this.$emit('input', val)
    }

    get groupedAvailabilityData (): AvailabilityDataGroup[] {
        // meta tag -> index in `ret`
        let index: Record<string, number> = {}
        let ret: AvailabilityDataGroup[] = []

        for (let it of this.availabilityData) {
            let tag = `${it.lang}:${it.kind}`
            if (!(
                tag in index
            )) {
                index[tag] = ret.push({
                    kind: it.kind,
                    lang: it.lang,
                    items: [],
                    tag,
                }) - 1
            }

            ret[index[tag]].items.push(it)
        }

        return ret.sort((a, b) => a.tag > b.tag ? -1 : 1)
    }

    get availabilityData (): AvailabilityData[] {
        if (this.loading || !this.data) return []

        // create indexes
        // meta tag (w/out episode) -> episodes -> true
        let index: Record<string, Record<number, true> & { meta: Translation }> = {}
        // author -> number of available episodes
        let counts: Record<string, number> = {}

        const tagsRegistry = new SortedArray<string>([], (a, b) => {
            if (a === b) return 0
            if (a.length === b.length) return a > b ? 1 : -1
            const substr = b.substr(0, a.length)
            if (a === substr) return 0
            return a > substr ? 1 : -1
        })

        // populate them
        const { languageFilters, playersFilters } = configStore

        for (let tr of this.data) {
            if (languageFilters[tr.lang] === true || playersFilters[new URL(tr.url).hostname] === true) continue
            const tag = `${tr.kind}:${tr.lang}:${tr.author}`
            ;(tr as any).tag = tag

            // same stuff as when sorting translations
            // we need to find best tag
            let tagIndex = tagsRegistry.index(tag)
            if (tagIndex === -1) {
                tagIndex = tagsRegistry.insert(tag)
            }

            let updateAuthor = false
            if (tag.length > tagsRegistry.raw[tagIndex].length) {
                index[tag] = index[tagsRegistry.raw[tagIndex]]

                tagsRegistry.raw[tagIndex] = tag
                updateAuthor = true
            }
            const fullTag = tagsRegistry.raw[tagIndex]

            if (!(tag in index)) index[fullTag] = { meta: tr }
            if (updateAuthor) index[fullTag].meta = tr
            if (!(tag in counts)) counts[fullTag] = 0
            if (!(tr.part in index[fullTag])) {
                counts[tag] += 1
                index[tag][tr.part] = true
            }
        }

        let ret: AvailabilityData[] = []
        let met: Record<string, true> = {}
        for (let key of Object.keys(index)) {
            let tr = index[key].meta
            if ((tr as any).tag in met) continue
            met[(tr as any).tag] = true

            let episodes = Object.keys(index[key])

            // find min & max episodes
            let min = Infinity
            let max = -Infinity
            for (let it of episodes) {
                if (it === 'author') continue

                let i = parseInt(it)
                if (i < min) min = i
                if (i > max) max = i
            }

            // iterate over all and create info
            let str: string[] = []
            let inRow = 0
            for (let i = min; i <= max + 1; i++) {
                if (index[key][i]) inRow += 1
                else if (inRow > 0) {
                    if (inRow === 1) {
                        str.push((
                            i - 1
                        ) + '')
                    } else {
                        let first = i - inRow
                        let last = i - 1
                        str.push(`${first}-${last}`)
                    }

                    inRow = 0
                }
            }

            ret.push({
                author: tr.author as any,
                availability: str.join(', '),
                kind: tr.kind,
                lang: tr.lang,
                key,
            })
        }

        return ret.sort((a, b) => counts[b.key] - counts[a.key])
    }

    @Watch('value')
    valueChanged (val: boolean) {
        if (val) this.update()
    }

    update (): void {
        this.loading = true
        getTranslationsFor(this.mediaId, this.mediaType, undefined, false)
            .then((res) => {
                this.data = res
            })
            .catch(iziToastError)
            .finally(() => {
                this.loading = false
            })
    }
}
</script>

<style>

</style>
