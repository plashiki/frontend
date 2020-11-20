<template>
    <div class="d-flex flex-column fill-height">
        <v-tabs
            ref="tabs"
            v-model="currentTab"
            background-color="transparent"
            class="kinds-tabs flex-grow-0"
            :show-arrows="false"
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

            <div>
                <AuthorsFiltersMenu :data="data" />
            </div>
        </v-tabs>
        <transition mode="out-in" name="fade-transition">
            <template v-if="data != null && authors.length !== 0">
                <transition-group
                    :class="{ 'from-all': prevTab === 0, 'to-all': currentTab === 0 }"
                    class="authors-list"
                    name="authors-list"
                    tag="div"
                >
                    <div
                        v-for="author in authors"
                        :key="author.key"
                        class="authors-list-item my-3"
                        :class="{ 'authors-list-unknown': highlightUnknownAuthor && author.name === '' }"
                    >
                        <v-row
                            class="ma-0"
                            @click="authorClicked(author)"
                        >
                            <p class="mb-0 cursor-pointer flex-fill text-truncate text--primary">
                                <span
                                    v-tooltip="$t('Items.Translation.Language.' + author.lang + author.kind)"
                                    :class="'no-dots mr-2 flag-' + author.lang"
                                >
                                    <v-icon class="author-kind-icon icon-mid-size">
                                        {{
                                            author.kind === 'sub' ? 'mdi-subtitles-outline' :
                                            author.kind === 'dub' ? 'mdi-text-to-speech' :
                                            'mdi-syllabary-hiragana'
                                        }}
                                    </v-icon>
                                </span>
                                {{ author.name || (author.people && author.people.length ? author.people.join(', ') : $t('Items.Translation.UnknownAuthor')) }}
                                <span
                                    v-if="author.name && author.people && author.people.length"
                                    v-tooltip="author.people.length > 2 && author.people.join('<br/>')"
                                    class="grey--text body-2"
                                    :class="{ 'no-dots': author.people.length <= 3 }"
                                    v-text="author.people.length > 3 ? $tc('Pages.Viewer.NPeople', author.people.length) : author.people.join(', ')"
                                />
                                <v-fade-transition>
                                    <span
                                        v-if="!expanded[author.key] && !expandAll"
                                        class="grey--text caption ml-2 text-truncate"
                                    >
                                        {{ playerNames(author) }}
                                    </span>
                                </v-fade-transition>
                            </p>
                        </v-row>
                        <v-expand-transition>
                            <TranslationsList
                                v-if="expandAll || expanded[author.key] === true"
                                :data="author.translations"
                                :key-prefix="author.key"
                                :selected-translations="selectedTranslations"
                                :translation-selection-mode="translationSelectionMode"
                                :translation.sync="selectedTranslation"
                                :authors="authors"
                            />
                        </v-expand-transition>
                    </div>
                </transition-group>
            </template>
            <v-skeleton-loader
                v-else-if="data === null || loading"
                type="heading, chip@3, heading, chip@4"
                class="translation-list-skeleton"
            />
            <NoItemsPlaceholder
                v-else-if="data !== null && authors.length === 0"
                mode="flex"
                :text="$t('Pages.Viewer.NoTranslationsAvailable')"
            />
        </transition>
    </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator'
import TranslationsList from '@/components/viewer/TranslationsList.vue'
import AuthorsFiltersMenu from '@/components/viewer/AuthorsFiltersMenu.vue'
import { authStore, configStore } from '@/store'
import { SingleTranslationData, TranslationDataAuthor } from '@/types/translation'
import { AuthorsTab, MediaType, TabToKind } from '@/types/media'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'
import VSimpleCard from '@/components/common/VSimpleCard.vue'

@Component({
    components: { VSimpleCard, NoItemsPlaceholder, TranslationsList, AuthorsFiltersMenu }
})
export default class AuthorsList extends Vue {
    @Prop({ default: () => [] }) data!: TranslationDataAuthor[]
    @Prop({ required: true }) mediaType!: MediaType
    @PropSync('translation') selectedTranslation!: number
    @Prop() translationsIndex!: Readonly<Record<number, Readonly<SingleTranslationData & { author: TranslationDataAuthor }>>>
    @Prop({ default: false }) loading!: boolean
    @Prop() selectedTranslations!: number[]
    @Prop() translationSelectionMode!: boolean

    currentTab: AuthorsTab = AuthorsTab.All
    prevTab = this.currentTab
    expanded: Record<string, boolean> = {}

    get expandAll (): boolean {
        return configStore.expandAllViewer || this.translationSelectionMode
    }

    get highlightUnknownAuthor (): boolean {
        return authStore.user?.moderator === true && configStore.highlightUnknownAuthor
    }

    get authors (): TranslationDataAuthor[] {
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

    authorClicked (author: TranslationDataAuthor): void {
        if (this.translationSelectionMode) {
            let translations = author.translations.filter(tr => configStore.playersFilters[tr.name] !== true)
            let allSelected = true
            for (let tr of translations) {
                let idx = this.selectedTranslations.indexOf(tr.id)
                if (idx === -1) {
                    allSelected = false
                    this.selectedTranslations.push(tr.id)
                }
            }

            if (allSelected) {
                for (let tr of translations) {
                    let idx = this.selectedTranslations.indexOf(tr.id)
                    if (idx > -1) {
                        this.selectedTranslations.splice(idx, 1)
                    }
                }
            }
            return
        }
        if (this.expandAll) return
        this.$set(this.expanded, author.key, !this.expanded[author.key])
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
    fixSliderPosition (): void {
        const fixSliderPositionWrap = (n = 0) => {
            if (!this.$refs.tabs && n < 5) {
                setTimeout(fixSliderPositionWrap, 100, n + 1)
            } else {
                (this.$refs.tabs as any).callSlider()
            }
        }
        fixSliderPositionWrap()
    }

    playerNames (author: TranslationDataAuthor): string {
        const preFilteredData = author.translations.filter(tr => configStore.playersFilters[tr.name] !== true)
        let times: Record<string, number> = {}

        for (let it of preFilteredData) {
            const name = it.name
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
        height: 100%;
    }

    .v-tabs-bar__content {
        justify-content: center;
        align-items: center;
    }
}

.authors-list {
    overflow-y: auto;
    overflow-x: hidden;
    //max-height: 800px;
    //
    //@media (max-width: 730px) {
    //    max-height: 500px;
    //}

    &-item {
        z-index: 1;
    }

    &-unknown {
        background: rgba(255, 255, 0, 0.3);
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
