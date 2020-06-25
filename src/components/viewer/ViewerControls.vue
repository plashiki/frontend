<template>
    <v-card class="mt-2">
        <v-card-text :class="{ 'px-0': $r12s.screenWidth < 360 }">
            <v-row
                :class="{ 'px-3': $r12s.screenWidth > 500 }"
                align="center"
                justify="center"
                no-gutters
            >
                <v-dialog
                    max-width="800"
                    v-model="reportDialog"
                >
                    <ReportForm
                        :media="media"
                        :media-type="mediaType"
                        :translation="translation"
                        @close="reportDialog = false"
                        @update="$emit('update')"
                        v-if="translation"
                    />
                </v-dialog>

                <v-dialog
                    v-if="isModerator"
                    max-width="800"
                    v-model="editDialog"
                    scrollable
                >
                    <TranslationEditDialog
                        :translation-id="translation.id"
                        show-meta
                        @close="editDialog = false"
                        @delete="requestUpdate"
                        @update="requestUpdate"
                        v-if="translation !== null && editDialog"
                    />
                </v-dialog>

                <v-dialog
                    max-width="800"
                    v-model="editMultipleDialog"
                >
                    <MultipleTranslationEditDialog
                        :translation-ids="selectedTranslations"
                        @close="editMultipleDialog = false"
                        @update="requestUpdate"
                        v-if="editMultipleDialog"
                    />
                </v-dialog>

                <v-menu
                    offset-y
                    top
                    transition="slide-y-transition"
                >
                    <template #activator="{ on }">
                        <v-badge
                            :color="dark ? 'grey darken-3' : 'grey'"
                            :content="selectedTranslations.length"
                            :offset-x="24"
                            :value="selectedTranslations.length > 0"
                            bottom
                            class="small-badge"
                            overlap
                            right
                        >
                            <v-btn
                                icon
                                v-on="on"
                            >
                                <v-icon>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </v-badge>
                    </template>

                    <v-list dense>
                        <VListItemIconText
                            :title="$t('Pages.Report.Name')"
                            @click="reportDialog = true"
                            icon="mdi-alert-circle"
                        />
                        <VListItemIconText
                            :title="$t('Pages.AddTranslation.Name')"
                            :to="{ name: 'add', query: { id: media.id, type: mediaType } }"
                            icon="mdi-file-plus-outline"
                            target="_blank"
                            v-if="media !== null"
                        />
                        <TranslationSubscribeMenu
                            :media-id="mediaId"
                            :media-type="mediaType"
                            :translation="translation"
                            offset-x
                            right
                            transition="slide-x-transition"
                            v-if="media && authenticated && $r12s.screenWidth <= 480"
                        >
                            <template #default="{ on }">
                                <VListItemIconText
                                    :title="$t('Items.Notification.NamePlural')"
                                    icon="mdi-bell"
                                    v-on="on"
                                />
                            </template>
                        </TranslationSubscribeMenu>
                        <VListItemIconText
                            :title="$t('Items.Translation.Edit')"
                            @click="editDialog = true"
                            icon="mdi-pencil"
                            v-if="translation !== null && !translationSelectionMode && isModerator && $r12s.screenWidth < 570"
                        />
                        <VListItemIconText
                            v-if="translation !== null && !translationSelectionMode && isModerator && $r12s.screenWidth < 570"
                            :title="$t('Items.Translation.Delete')"
                            icon="mdi-delete"
                            @click="deleteCurrent"
                        />
                        <VListItemIconText
                            :title="$t(translationSelectionMode ? 'Common.Collection.Deselect' : 'Common.Collection.Select')"
                            @click.stop.prevent="translationSelectionMode = !translationSelectionMode"
                            icon="mdi-select-group"
                            v-if="isModerator"
                        />

                        <template v-if="isModerator && translationSelectionMode">
                            <v-subheader
                                disabled
                                v-text="$t('Common.Collection.WithSelected')"
                            />

                            <VListItemIconText
                                :disabled="selectedTranslations.length === 0"
                                :title="$t('Common.Form.Edit')"
                                @click="editMultiple"
                                icon="mdi-pencil"
                            />

                            <VListItemIconText
                                :disabled="selectedTranslations.length === 0"
                                :title="$t('Common.Form.Delete')"
                                @click="deleteSelected"
                                icon="mdi-delete"
                            />
                        </template>
                    </v-list>
                </v-menu>

                <TranslationSubscribeMenu
                    :media-id="mediaId"
                    :media-type="mediaType"
                    :translation="translation"
                    offset-y
                    top
                    transition="slide-y-transition"
                    v-if="media && authenticated && $r12s.screenWidth > 480"
                >
                    <template #default="{ on }">
                        <v-btn
                            icon
                            v-on="on"
                        >
                            <v-icon>
                                mdi-bell
                            </v-icon>
                        </v-btn>
                    </template>
                </TranslationSubscribeMenu>

                <v-spacer />

                <v-btn
                    :disabled="partNumber <= 1"
                    @click="partNumber -= 1"
                    icon
                    v-tooltip="$t(mediaType === 'anime' ? 'Pages.Viewer.PrevEpisode' : 'Pages.Viewer.PrevChapter')"
                >
                    <v-icon>mdi-arrow-left</v-icon>
                </v-btn>

                <v-layout
                    column
                    justify-center
                    mx-2
                    style="max-width: 90px;"
                >
                    <v-text-field
                        :label="$t(mediaType === 'anime' ? 'Items.Media.Episode' : 'Items.Media.Chapter')"
                        :suffix="media && media.partsCount ? $t('Pages.Viewer.OutOf', { n: media.partsCount }) : undefined"
                        @change="episodeInputDone"
                        class="mt-2 mb-1 text-right"
                        height="24"
                        hide-details
                        v-model="episodeInput"
                    />
                    <a
                        :href="translation.rawUrl || translation.url"
                        class="text-center text-truncate"
                        style="font-size: 11px;"
                        target="_blank"
                        v-if="translation"
                    >
                        {{ $t('Pages.Viewer.DirectLink') }}
                    </a>
                </v-layout>

                <v-btn
                    :disabled="media && media.partsCount !== 0 && partNumber >= media.partsCount"
                    @click="partNumber += 1"
                    icon
                    v-tooltip="$t(mediaType === 'anime' ? 'Pages.Viewer.NextEpisode' : 'Pages.Viewer.NextChapter')"
                >
                    <v-icon>mdi-arrow-right</v-icon>
                </v-btn>

                <v-btn
                    :color="userRateStatus === 'old-part' ? 'success' : undefined"
                    :disabled="!authenticated || userRateLoading"
                    :loading="userRateControlLoading"
                    @click="userRateControlClicked"
                    icon
                    v-if="$r12s.screenWidth >= 400 || userRate === null"
                    v-tooltip="{ content: $t(`Items.UserRate.ControlButton.${userRateStatus}-${mediaType}`), trigger: 'hover click focus' }"
                >
                    <v-icon>{{ userRateIcon }}</v-icon>
                </v-btn>

                <v-menu
                    :close-on-content-click="false"
                    :disabled="userRateLoading"
                    max-width="250"
                    top
                    transition="slide-x-transition"
                    v-model="userRateEditMenu"
                >
                    <template #activator="{ on }">
                        <v-btn
                            :disabled="!authenticated || !userRate"
                            icon
                            v-if="$r12s.screenWidth >= 400 || userRate !== null"
                            v-on="on"
                            v-tooltip="$t('Items.UserRate.EditEntry')"
                        >
                            <v-icon>mdi-playlist-edit</v-icon>
                        </v-btn>
                    </template>

                    <UserRateEditForm
                        :media="media"
                        :rate.sync="userRate"
                        :visible="userRateEditMenu"
                        @close="userRateEditMenu = false"
                        @rate-update="rateUpdated"
                        v-if="userRate !== null"
                    />
                </v-menu>

                <v-spacer />

                <v-btn
                    v-tooltip="$t('Items.Translation.Delete')"
                    v-if="translation !== null && isModerator && $r12s.screenWidth >= 570"
                    :disabled="translationSelectionMode && selectedTranslations.length === 0"
                    icon
                    @click="translationSelectionMode ? deleteSelected() : deleteCurrent()"
                >
                    <v-icon>mdi-delete</v-icon>
                </v-btn>

                <v-btn
                    v-tooltip="$t('Items.Translation.Edit')"
                    v-if="translation !== null && isModerator && $r12s.screenWidth >= 570"
                    :disabled="translationSelectionMode && selectedTranslations.length === 0"
                    icon
                    @click="() => { if (translationSelectionMode) { editMultipleDialog = true } else { editDialog = true } }"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>

                <AuthorsFiltersMenu :data="authors" />

                <v-btn
                    @click="posterVisible = !posterVisible"
                    icon
                    v-if="!mobileDisplay"
                >
                    <v-icon
                        :class="{ 'mdi-rotate-180': !posterVisible }"
                        class="poster-control-icon"
                    >
                        mdi-chevron-right
                    </v-icon>
                </v-btn>
            </v-row>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator'
import AuthorsFiltersMenu from '@/components/viewer/AuthorsFiltersMenu.vue'
import { authStore, configStore } from '@/store'
import UserRateEditForm from '@/components/user-rates/UserRateEditForm.vue'
import { createUserRate, updateUserRate } from '@/api/user-rates'
import { merge } from '@/utils/object-utils'
import VListItemIconText from '@/components/common/VListItemIconText.vue'
import { Media, MediaType } from '@/types/media'
import { SingleTranslationData, TranslationAuthor, TranslationData } from '@/types/translation'
import { UserRate, UserRateStatus } from '@/types/user-rate'
import ReportForm from '@/components/moderation/ReportForm.vue'
import TranslationEditDialog from '@/components/moderation/TranslationEditDialog.vue'
import { deleteMultipleTranslations, deleteTranslation } from '@/api/moderation'
import MultipleTranslationEditDialog from '@/components/moderation/MultipleTranslationEditDialog.vue'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import TranslationSubscribeMenu from '@/components/notifications/TranslationSubscribeMenu.vue'

type UserRateControlStatus = 'new' | 'new-part' | 'start-repeat' | 'old-part'
const userRateIconMap: Record<UserRateControlStatus, string> = {
    new: 'mdi-playlist-plus',
    'new-part': 'mdi-plus-one',
    'start-repeat': 'mdi-repeat',
    'old-part': 'mdi-check'
}

@Component({
    components: {
        TranslationSubscribeMenu,
        MultipleTranslationEditDialog,
        TranslationEditDialog,
        ReportForm,
        VListItemIconText,
        UserRateEditForm,
        AuthorsFiltersMenu
    }
})
export default class ViewerControls extends Vue {
    @Prop({ required: true }) mediaType!: MediaType
    @Prop({ required: true }) mediaId!: number
    @Prop() data!: TranslationData | null
    @Prop() media!: Media | null
    @PropSync('rate') userRate!: UserRate | null
    @PropSync('part') partNumber!: number
    @PropSync('poster') posterVisible!: boolean
    @Prop() userRateLoading!: boolean
    @Prop() translation!: SingleTranslationData | null
    @Prop() selectedTranslations!: number[]
    @PropSync('selectionMode') translationSelectionMode!: boolean

    userRateEditMenu = false
    reportDialog = false
    editDialog = false
    editMultipleDialog = false

    userRateControlLoading = false

    episodeInput = ''

    get dark (): boolean {
        return configStore.dark
    }

    get mobileDisplay (): boolean {
        return this.$r12s.screenWidth < 730
    }

    get authenticated (): boolean {
        return authStore.authenticated
    }

    get isModerator (): boolean {
        return authStore.user?.moderator ?? false
    }

    get userRateStatus (): UserRateControlStatus {
        if (!this.userRate || !this.authenticated) {
            return 'new'
        } else if (this.userRate.parts < this.partNumber) {
            return 'new-part'
        } else if (this.userRate.parts === this.media?.partsCount && this.partNumber === 1) {
            return 'start-repeat'
        } else {
            return 'old-part'
        }
    }

    get userRateIcon (): string {
        return userRateIconMap[this.userRateStatus]
    }

    get authors (): TranslationAuthor[] {
        return this.data?.[this.partNumber]?.authors ?? []
    }

    @Watch('translationSelectionMode')
    translationSelectionModeChanged (val: boolean): void {
        if (!val) {
            this.selectedTranslations.length = 0
        }
    }

    @Watch('partNumber')
    partChanged (): void {
        this.episodeInput = this.partNumber + ''
    }

    editMultiple (): void {
        this.editMultipleDialog = true
    }

    deleteCurrent (): void {
        if (!this.translation) return

        deleteTranslation(this.translation.id).then(() => {
            iziToastSuccess(this.$t('Common.Action.Deleted'))
            this.requestUpdate()
        }).catch(iziToastError)
    }

    deleteSelected (): void {
        let ids = [...this.selectedTranslations]
        this.translationSelectionMode = false
        deleteMultipleTranslations(ids).then(() => {
            iziToastSuccess(this.$t('Common.Action.Deleted'))
            this.requestUpdate()
        }).catch(iziToastError)
    }

    requestUpdate (): void {
        this.$emit('update')
    }

    episodeInputDone (): void {
        let q = parseInt(this.episodeInput)
        if (isNaN(q) || q <= 0) {
            this.episodeInput = this.partNumber + ''
        } else {
            this.partNumber = q
        }
    }

    rateUpdated (): void {
        this.userRate = null
        this.$emit('rate-update', null)
    }

    userRateControlClicked (): void {
        this.userRateControlLoading = true
        let prom: Promise<void>
        if (this.userRateStatus === 'new') {
            prom = createUserRate({
                target_id: parseInt(this.$route.params.id),
                target_type: this.mediaType,
                parts: this.partNumber,
                status: UserRateStatus.InProgress
            }).then((rate) => {
                this.userRate = rate
                this.$emit('rate-update', rate)

                if (this.media && this.partNumber !== this.media.partsCount) {
                    this.partNumber++
                }
            })
        } else if (this.userRateStatus === 'new-part') {
            prom = updateUserRate(this.userRate!.id, {
                target_type: this.mediaType,
                parts: this.partNumber,
                status: UserRateStatus.InProgress
            }).then((rate) => {
                merge(this.userRate!, rate)

                if (this.media && this.partNumber !== this.media.partsCount) {
                    this.partNumber++
                }
            })
        } else if (this.userRateStatus === 'start-repeat') {
            prom = updateUserRate(this.userRate!.id, {
                target_type: this.mediaType,
                parts: 1,
                status: UserRateStatus.InProgress,
                repeats: this.userRate!.repeats + 1
            }).then((rate) => {
                merge(this.userRate!, rate)

                if (this.media && this.partNumber !== this.media.partsCount) {
                    this.partNumber++
                }
            })
        } else if (this.userRateStatus === 'old-part') {
            prom = updateUserRate(this.userRate!.id, {
                target_type: this.mediaType,
                parts: this.partNumber - 1,
                status: UserRateStatus.InProgress
            }).then((rate) => {
                merge(this.userRate!, rate)
            })
        }

        prom!.catch(iziToastError).finally(() => {
            this.userRateControlLoading = false
        })
    }

    mounted (): void {
        this.partChanged()
    }
}
</script>

<style>
.poster-control-icon:before {
    transition: transform 0.25s ease-in-out;
}
</style>
