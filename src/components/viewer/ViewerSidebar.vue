<template>
    <div class="viewer-sidebar d-flex flex-column fill-height">
        <v-dialog
            v-model="reportDialog"
            max-width="1000"
            scrollable
        >
            <ReportForm
                v-if="currentTranslation"
                :media="media"
                :media-type="mediaType"
                :translation="currentTranslation"
                @close="reportDialog = false"
                @update="$emit('update')"
            />
        </v-dialog>

        <v-dialog
            v-if="isModerator"
            v-model="editDialog"
            max-width="800"
            scrollable
        >
            <TranslationEditDialog
                v-if="currentTranslation !== null && editDialog"
                :translation-id="currentTranslation.id"
                show-meta
                @close="editDialog = false"
                @delete="updateCurrentPart"
                @update="updateCurrentPart"
            />
        </v-dialog>

        <v-dialog
            v-model="editMultipleDialog"
            max-width="800"
        >
            <MultipleTranslationEditDialog
                v-if="editMultipleDialog"
                :translation-ids="selectedTranslations"
                @close="editMultipleDialog = false"
                @update="updateCurrentPart"
            />
        </v-dialog>


        <div class="flex overflow-y-auto viewer-sidebar-translations">
            <AuthorsList
                ref="authors"
                :loading="translationsLoading"
                :data="translations && translations.authors"
                :media-type="mediaType"
                :translation.sync="translationIdSync"
                :translations-index="translationsIndex"
                :selected-translations="selectedTranslations"
                :translation-selection-mode="translationSelectionMode"
            >
                <template #left>
                    <InlineMoreMenu
                        :items="menuItems"
                        :max-width="selfWidth - 400"
                    />
                </template>
            </AuthorsList>
        </div>
        <SmoothSlideGroup
            ref="slider"
            class="viewer-sidebar-parts"
            :show-buttons="showPartsArrows"
            :count="partsLoading || partsTransitionPending ? -1 : availableParts.length"
            :height="36"
            :disabled="partsLoading"
        >
            <transition
                mode="out-in"
                name="fade-transition"
                @before-leave="partsTransitionPending = true"
                @before-enter="partsTransitionPending = false"
            >
                <v-skeleton-loader
                    v-if="partsLoading"
                    type="button@8"
                    class="button-group-skeleton"
                />
                <div
                    v-else
                    class="d-flex flex-row"
                >
                    <VirtualGrid
                        ref="parts-grid"
                        direction="horizontal"
                        :items="availableParts"
                        :fixed-width="partButtonWidth"
                        :fixed-height="32"
                        :min-cell-height="32"
                        :gap-x="8"
                        :rows="1"
                    >
                        <template #default="{ item }">
                            <v-btn
                                :outlined="item !== partNumberSync"
                                :color="userRate && userRate.parts >= item ? 'success' : 'primary'"
                                :style="{ minWidth: partButtonWidth + 'px' }"
                                class="part-button"
                                @click="() => partNumberSync === item ? updateCurrentPart() : partNumberSync = item"
                                v-text="item"
                            />
                        </template>
                    </VirtualGrid>
                </div>
            </transition>
        </SmoothSlideGroup>
    </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator'
import { UserRate } from '@/types/user-rate'
import SmoothSlideGroup from '@/components/common/SmoothSlideGroup.vue'
import { getAvailableParts, getTranslationsFor } from '@/api/translations'
import { Media, MediaType } from '@/types/media'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import {
    ExtendedSingleTranslationData,
    SinglePartTranslations,
} from '@/types/translation'
import { processTranslations } from '@/utils/media-utils'
import AuthorsList from '@/components/viewer/AuthorsList.vue'
import { getDefaultTranslation, collectTelemetry } from '@/utils/user-preferences-utils'
import { appStore, authStore } from '@/store'
import VirtualGrid from '@/components/common/VirtualGrid.vue'
import InlineMoreMenu from '@/components/common/InlineMoreMenu.vue'
import TranslationEditDialog from '@/components/moderation/TranslationEditDialog.vue'
import MultipleTranslationEditDialog from '@/components/moderation/MultipleTranslationEditDialog.vue'
import ReportForm from '@/components/moderation/ReportForm.vue'
import { deleteTranslation, deleteMultipleTranslations } from '@/api/moderation'

@Component({
    components: { ReportForm, MultipleTranslationEditDialog, TranslationEditDialog, InlineMoreMenu, VirtualGrid, AuthorsList, SmoothSlideGroup },
})
export default class ViewerSidebar extends Vue {
    @Prop({ required: true }) media!: Media | null
    @Prop({ required: true }) mediaId!: number
    @Prop({ required: true }) mediaType!: MediaType

    @PropSync('translationId') translationIdSync!: number | null
    @PropSync('partNumber') partNumberSync!: number
    @Prop({ default: null }) userRate!: UserRate | null

    @Prop({ type: Boolean, default: true }) showPartsArrows!: boolean

    @Ref() authors!: any
    @Ref('parts-grid') partsGrid!: any

    partsLoading = true
    partsTransitionPending = false
    translationsLoading = true

    reportDialog = false
    editDialog = false
    editMultipleDialog = false

    availableParts: number[] = []
    translations: SinglePartTranslations | null = null

    translationSelectionMode = false
    selectedTranslations = []

    selfWidth = 0

    telemetryTimeout: number | null = null

    get isModerator (): boolean {
        return authStore.user?.moderator ?? false
    }

    get menuItems (): any[] {
        let ret: any[] = [
            {
                icon: 'mdi-file-plus-outline',
                label: this.$t('Pages.AddTranslation.Name'),
                callback: () => {
                    let routeData = this.$router.resolve({
                        name: 'add',
                        query: { id: this.$route.params.id, type: this.mediaType },
                    })

                    window.open(routeData.href, '_blank')
                },
            }
        ]

        if (this.isModerator) {
            ret.unshift(
                {
                    icon: this.translationSelectionMode ? 'mdi-select-off' : 'mdi-select-group',
                    label: this.$t(this.translationSelectionMode ? 'Common.Collection.Deselect' : 'Common.Collection.Select'),
                    callback : () => {
                        if (this.translationSelectionMode) {
                            this.selectedTranslations.length = 0
                        }
                        this.translationSelectionMode = !this.translationSelectionMode
                    }
                }
            )
            if (this.currentTranslation !== null || (this.translationSelectionMode && this.selectedTranslations.length)) {
                ret.unshift(
                    {
                        icon: 'mdi-pencil',
                        label: this.$t(this.translationSelectionMode ? 'Common.Form.Edit' : 'Items.Translation.Edit'),
                        callback: () => {
                            if (this.translationSelectionMode) {
                                this.editMultipleDialog = true
                            } else {
                                this.editDialog = true
                            }
                        }
                    }, {
                        icon: 'mdi-delete',
                        label: this.$t(this.translationSelectionMode ? 'Common.Form.Delete' : 'Items.Translation.Delete'),
                        callback: () => {
                            if (this.translationSelectionMode) {
                                this.deleteSelected()
                            } else {
                                this.deleteCurrent()
                            }
                        }
                    }
                )
            }
        }

        return ret
    }

    get currentTranslation (): ExtendedSingleTranslationData | null {
        return this.translationIdSync !== null ? this.translationsIndex[this.translationIdSync] ?? null : null
    }

    get translationsIndex (): Readonly<Record<number, Readonly<ExtendedSingleTranslationData>>> {
        if (!this.translations) return {}

        let ret: Record<number, ExtendedSingleTranslationData> = {}
        for (let author of this.translations.authors) {
            for (let tr of author.translations) {
                ret[tr.id] = Object.freeze({ ...tr, author })
            }
        }
        return Object.freeze(ret)
    }

    get partButtonWidth (): number {
        return this.availableParts[this.availableParts.length - 1] >= 1000 ? 48 : 40
    }

    scrollPartsListToCurrent (jump = false, retry = 0): void {
        let num = this.partNumberSync

        // fxxk my life >.<
        if (this.partsGrid) {
            let idx = this.availableParts.indexOf(num)
            if (idx > -1) {
                let buttonPosition = this.partsGrid.cellPosition(idx)

                let center = buttonPosition.x
                    + this.partsGrid.cellWidth / 2
                    - (
                        this.$refs.slider as any
                    ).$refs.group.clientWidth / 2

                if (jump) {
                    (
                        this.$refs.slider as any
                    ).jumpTo(center)
                } else {
                    (
                        this.$refs.slider as any
                    ).scrollTo(center)
                }
            }
        } else if (retry <= 3) {
            setTimeout(() => this.scrollPartsListToCurrent(jump, retry + 1), 50)
        }
    }

    @Watch('partNumber')
    updateCurrentPart () {
        if (isNaN(this.partNumberSync)) return

        let newPartNumber = this.partNumberSync

        if (!this.partsLoading) {
            this.scrollPartsListToCurrent()
        }

        this.translationsLoading = true
        getTranslationsFor(this.mediaId, this.mediaType, newPartNumber)
            .then((translations) => {
                if (newPartNumber !== this.partNumberSync) return // prevent race condition
                this.translations = Object.freeze(processTranslations(translations)[this.partNumberSync] ?? {
                    authors: [],
                    players: [],
                })
                if (this.currentTranslation === null) {
                    const { translation, allTab } = getDefaultTranslation(this.translations, this.authors.currentTab)
                    this.translationIdSync = translation?.id ?? null
                    if (allTab) {
                        this.authors.currentTab = 0
                    }
                }
            })
            .catch(iziToastError)
            .then(() => {
                if (newPartNumber !== this.partNumberSync) return // prevent race condition
                this.translationsLoading = false
            })
    }

    @Watch('currentTranslation')
    onTranslationChanged (val: ExtendedSingleTranslationData | null = this.currentTranslation): void {
        this.$emit('translation', val)
        if (!val) {
            this.$emit('iframe', 'about:blank')
            return
        }
        appStore.merge({
            lastAuthor: val.author.name,
            lastKind: val.author.kind,
            lastPlayer: val.name,
        })
        this.$emit('iframe', val.url)

        if (this.telemetryTimeout) clearTimeout(this.telemetryTimeout)
        this.telemetryTimeout = setTimeout(() => this.currentTranslation === val && collectTelemetry(val), 120000)
        // 2 mins is enough in avg for user to settle on a single translation
    }

    updateAvailableParts (): Promise<void> {
        if (this.mediaId === -1) return Promise.resolve()

        this.partsLoading = true
        return getAvailableParts(this.mediaId, this.mediaType)
            .then((parts) => {
                this.availableParts = parts
                this.$nextTick(() => this.scrollPartsListToCurrent(true))
            })
            .catch(iziToastError)
            .then(() => {
                this.partsLoading = false
            })
    }

    // moderator stuff //
    deleteCurrent (): void {
        if (!this.translationIdSync) return
        deleteTranslation(this.translationIdSync).then(() => {
            iziToastSuccess(this.$t('Common.Action.Deleted'))
            this.updateCurrentPart()
        }).catch(iziToastError)
    }

    deleteSelected (): void {
        let ids = [...this.selectedTranslations]
        this.selectedTranslations.length = 0
        this.translationSelectionMode = false
        deleteMultipleTranslations(ids).then(() => {
            iziToastSuccess(this.$t('Common.Action.Deleted'))
            this.updateCurrentPart()
        }).catch(iziToastError)
    }

    onResize (): void {
        this.$nextTick(() => {
            (
                this.$refs.authors as any
            )?.fixSliderPosition()
            ;(
                this.$refs.slider as any
            )?.updateButtons()
            this.partsGrid?.onResize()
            this.selfWidth = this.$el.clientWidth
        })
    }

    update (): void {
        this.updateAvailableParts().then(() => this.updateCurrentPart())
    }
}
</script>

<style lang="scss">
.button-group-skeleton.v-skeleton-loader {
    display: flex;
    flex-direction: row;

    .v-skeleton-loader__button {
        margin: 2px 4px;
        width: 40px;
    }
}

.translation-list-skeleton.v-skeleton-loader {
    .v-skeleton-loader__heading {
        margin-top: 16px;
        margin-left: 4px
    }

    .v-skeleton-loader__chip {
        display: inline-block;
        margin-left: 4px;
        margin-right: 4px;
        margin-top: 8px;
    }
}

.part-button {
    height: 32px !important;
    margin: 2px 0 !important;
    padding: 0 4px !important;
}

.viewer-sidebar-translations {
    .viewer-container:not(.viewer-container--mobile) & {
        height: 0;
    }

    margin-bottom: 8px;
}

.viewer-sidebar-parts {
    margin: 0;
}
</style>
