<template>
    <v-simple-card>
        <v-tabs
            background-color="transparent"
            class="kinds-tabs mb-5"
            ref="tabs"
            v-model="currentTab"
        >
            <div style="display: flex; align-items: center">
                <slot name="left" />
            </div>
            <v-spacer />
            <v-tab v-tooltip="$t('Pages.Viewer.TabAll')">
                <v-icon>
                    mdi-check-all
                </v-icon>
            </v-tab>
            <v-tab v-tooltip="$t('Pages.Viewer.TabSub')">
                <v-icon>
                    mdi-subtitles-outline
                </v-icon>
            </v-tab>
            <v-tab v-tooltip="$t('Pages.Viewer.TabDub')">
                <v-icon>
                    mdi-text-to-speech
                </v-icon>
            </v-tab>
            <v-tab v-tooltip="$t('Pages.Viewer.TabRaw')">
                <v-icon>
                    mdi-syllabary-hiragana
                </v-icon>
            </v-tab>
            <v-spacer />
        </v-tabs>
        <transition mode="out-in" name="fade-transition">
            <template v-if="data != null && authors.length !== 0">
                <transition-group
                    :class="{ 'from-all': prevTab === 0, 'to-all': currentTab === 0 }"
                    class="authors-list"
                    name="authors-list"
                >
                    <div
                        :key="author.key"
                        class="authors-list-item my-3"
                        v-for="author in authors"
                    >
                        <v-row
                            @click="toggleExpanded(author.key)"
                            class="ma-0"
                        >
                            <p class="mb-0 cursor-pointer flex-fill text-truncate text--primary">
                                <span
                                    :class="'no-dots mr-2 flag-' + author.lang"
                                    v-tooltip="$t('Items.Translation.Language.' + author.lang + author.kind)"
                                >
                                    <v-icon class="author-kind-icon icon-mid-size">
                                        {{
                                            author.kind === 'sub' ? 'mdi-subtitles-outline' :
                                            author.kind === 'dub' ? 'mdi-text-to-speech' :
                                            'mdi-syllabary-hiragana'
                                        }}
                                    </v-icon>
                                </span>
                                {{ author.name || $t('Items.Translation.UnknownAuthor') }}
                                <v-fade-transition>
                                    <span
                                        class="grey--text caption ml-2 text-truncate"
                                        v-if="!expanded[author.key] && !expandAll"
                                    >
                                        {{ playerNames(author) }}
                                    </span>
                                </v-fade-transition>
                            </p>
                        </v-row>
                        <v-expand-transition>
                            <TranslationsList
                                :data="author.translations"
                                :key-prefix="author.key"
                                :selected-translations="selectedTranslations"
                                :translation-selection-mode="translationSelectionMode"
                                :translation.sync="selectedTranslation"
                                :authors="authors"
                                v-if="expandAll || expanded[author.key] === true"
                            />
                        </v-expand-transition>
                    </div>
                </transition-group>
            </template>
            <v-skeleton-loader
                type="list-item-two-line, list-item, list-item, list-item, list-item"
                v-else-if="data === null && loading"
            />
            <NoItemsPlaceholder
                :text="$t('Pages.Viewer.NoTranslationsAvailable')"
                v-else-if="data !== null && authors.length === 0"
            />
        </transition>
    </v-simple-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator'
import TranslationsList from '@/components/viewer/TranslationsList.vue'
import AuthorsFiltersMenu from '@/components/viewer/AuthorsFiltersMenu.vue'
import { configStore } from '@/store'
import { SingleTranslationData, TranslationAuthor } from '@/types/translation'
import { AuthorsTab, MediaType, TabToKind } from '@/types/media'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'
import VSimpleCard from '@/components/common/VSimpleCard.vue'

@Component({
    components: { VSimpleCard, NoItemsPlaceholder, TranslationsList, AuthorsFiltersMenu }
})
export default class AuthorsList extends Vue {
    @Prop({ default: () => [] }) data!: TranslationAuthor[]
    @Prop({ required: true }) mediaType!: MediaType
    @PropSync('translation') selectedTranslation!: number
    @Prop() translationsIndex!: Readonly<Record<number, Readonly<SingleTranslationData & { author: TranslationAuthor }>>>
    @Prop({ default: false }) loading!: boolean
    @Prop() selectedTranslations!: number[]
    @Prop() translationSelectionMode!: boolean

    currentTab: AuthorsTab = AuthorsTab.All
    prevTab = this.currentTab
    expanded: Record<string, boolean> = {}

    get expandAll (): boolean {
        return configStore.expandAllViewer
    }

    get authors (): TranslationAuthor[] {
        let list = this.data ?? []
        if (this.currentTab !== AuthorsTab.All) {
            list = list.filter(it => it.kind === TabToKind[this.currentTab])
        }

        const { languageFilters, playersFilters } = configStore

        list = list.filter(it =>
            languageFilters[it.lang] !== true &&
            it.translations.some(tr => playersFilters[tr.name] !== true)
        )

        return list
    }

    toggleExpanded (key: string): void {
        if (this.expandAll) return
        this.$set(this.expanded, key, !this.expanded[key])
    }

    @Watch('currentTab')
    onTabChanged (val: AuthorsTab, fromVal: AuthorsTab): void {
        this.prevTab = fromVal

        if (val !== configStore.components.authorsTab) {
            configStore.merge({
                components: {
                    authorsTab: val
                }
            })
        }
    }

    @Watch('selectedTranslation')
    selectedTranslationChanged (): void {
        // we need to expand current tr's author.
        if (!this.selectedTranslation) return
        let tr = this.translationsIndex[this.selectedTranslation]
        if (!tr) {
            return
        }
        this.$set(this.expanded, tr.author.key, true)
    }

    @Watch('data')
    dataChanged (): void {
        setTimeout(() => {
            // fix slider position
            (this.$refs.tabs as any).callSlider()
        }, 100)
    }

    playerNames (author: TranslationAuthor): string {
        const preFilteredData = author.translations.filter(tr => configStore.playersFilters[tr.name] !== true)
        let times: Record<string, number> = {}

        for (let it of preFilteredData) {
            const name = (it.hq ? 'HQ ' : '') + it.name
            if (!(name in times)) {
                times[name] = 0
            }
            times[name]++
        }

        let ret: string[] = []

        for (let key of Object.keys(times)) {
            ret.push(this.$t('Pages.Viewer.LinkTimes', {
                n: times[key],
                name: key
            }) as string)
        }

        return ret.join(', ')
    }

    mounted (): void {
        this.selectedTranslationChanged()

        if (configStore.components.authorsTab !== undefined) {
            this.currentTab = configStore.components.authorsTab
        }
    }
}
</script>

<style lang="scss">
.kinds-tabs {
    .v-tab {
        min-width: 60px !important;
    }

    .v-tabs-bar__content {
        justify-content: center;
    }
}

.authors-list {
    &-item {
        z-index: 1;
    }

    &-move {
        transition: transform 0.5s;
    }

    &-enter-active {
        transition: all 0.5s ease-out;
    }

    &-leave-active {
        transition: all 0.2s linear;
        position: absolute;
        z-index: 0;
    }

    &:not(.from-all):not(.to-all) &-leave-active {
        transition: transform 1s linear;
    }

    .author-kind-icon {
        opacity: 0;
        max-width: 0;
        transition: all 0.4s ease-in;
    }

    &.to-all .author-kind-icon {
        opacity: 1;
        max-width: 20px;
    }

    &-enter, &-leave-to {
        opacity: 0;
    }
}
</style>
