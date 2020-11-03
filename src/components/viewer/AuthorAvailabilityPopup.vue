<template>
    <v-menu>
        <template #activator="props">
            <slot v-bind="props" />
        </template>

        <v-simple-card>
            <v-row class="flex-wrap">
                <v-col
                    v-for="it in groupedAvailabilityData"
                    :key="it.tag"
                    cols="auto"
                >
                    <h3>{{ $t('Items.Translation.Language.' + it.lang + it.kind) }}</h3>
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
        </v-simple-card>
    </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { TranslationDataAuthor, TranslationData, TranslationKind, TranslationLanguage } from '@/types/translation'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import SortedArray from '@/utils/sorted-array'
import { configStore } from '@/store'

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
    components: { VSimpleCard }
})
export default class AuthorAvailabilityPopup extends Vue {
    @Prop({ default: () => ({}) }) data!: Readonly<TranslationData>

    get groupedAvailabilityData (): AvailabilityDataGroup[] {
        // meta tag -> index in `ret`
        let index: Record<string, number> = {}
        let ret: AvailabilityDataGroup[] = []

        for (let it of this.availabilityData) {
            let tag = `${it.lang}:${it.kind}`
            if (!(tag in index)) {
                index[tag] = ret.push({
                    kind: it.kind,
                    lang: it.lang,
                    items: [],
                    tag
                }) - 1
            }

            ret[index[tag]].items.push(it)
        }

        return ret.sort((a, b) => a.tag > b.tag ? -1 : 1)
    }

    get availabilityData (): AvailabilityData[] {
        // create indexes
        // meta tag (w/out episode) -> episodes -> true
        let index: Record<string, Record<number, true> & { author: TranslationDataAuthor }> = {}
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

        for (let [ep, data] of Object.entries(this.data)) {
            for (let author of data.authors.filter(it =>
                languageFilters[it.lang] !== true &&
                it.translations.some(tr => playersFilters[tr.name] !== true)
            )) {
                let tag = author.key

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

                if (!(tag in index)) index[fullTag] = { author }
                if (updateAuthor) index[fullTag].author = author
                if (!(tag in counts)) counts[fullTag] = 0
                if (!(ep in index[fullTag])) {
                    counts[tag] += 1
                    index[tag][ep as any] = true
                }
            }
        }

        let ret: AvailabilityData[] = []
        for (let key of Object.keys(index)) {
            let author = index[key].author
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
                        str.push((i - 1) + '')
                    } else {
                        let first = i - inRow
                        let last = i - 1
                        str.push(`${first}-${last}`)
                    }

                    inRow = 0
                }
            }

            ret.push({
                author: author.name,
                availability: str.join(', '),
                kind: author.kind,
                lang: author.lang,
                key
            })
        }

        return ret.sort((a, b) => counts[b.key] - counts[a.key])
    }
}
</script>

<style>

</style>
