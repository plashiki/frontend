<template>
    <div
        class="viewer-container"
        :class="'viewer-container--' + displayMode"
    >
        <MediaInfoDrawer
            v-model="mediaInfoVisible"
            :media="media"
        />

        <v-dialog
            v-model="reportDialog"
            max-width="1000"
            scrollable
        >
            <ReportForm
                v-if="translation"
                :media="media"
                :media-type="mediaType"
                :translation="translation"
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
                v-if="translation !== null && editDialog"
                :translation-id="translation.id"
                show-meta
                @close="editDialog = false"
                @delete="requestUpdate"
                @update="requestUpdate"
            />
        </v-dialog>

        <div v-show="displayMode !== 'theater'">
            <div class="viewer-header">
                <transition mode="out-in" name="fade-transition">
                    <v-skeleton-loader
                        v-if="loading"
                        type="image"
                        class="ma-4 mr-0"
                    />
                    <ImageWithRadiosity
                        v-else
                        class="viewer-poster mr-0"
                        :class="{
                            'ma-4': displayMode !== 'mobile',
                            'ma-2': displayMode === 'mobile'
                        }"
                        :width="displayMode === 'mobile' ? 60 : 80"
                        :max-width="displayMode === 'mobile' ? 60 : 80"
                        :height="displayMode === 'mobile' ? 90 : 120"
                        :aspect-ratio="2/3"
                        :lazy-src="smallImage"
                        :src="fullImage"
                    />
                </transition>
                <transition mode="out-in" name="fade-transition">
                    <v-skeleton-loader
                        v-if="loading"
                        type="heading, text"
                        class="flex ml-8 my-4"
                    />
                    <div
                        v-else
                        class="d-flex flex-column flex text-truncate"
                        :class="{
                            'ml-8 my-4': displayMode !== 'mobile',
                            'ml-4 mt-2': displayMode === 'mobile'
                        }"
                    >
                        <h2
                            :class="{
                                'subtitle-05 pb-1': displayMode === 'mobile',
                                'lh-2 mb-1': displayMode !== 'mobile'
                            }"
                            class="text-truncate"
                            :title="name"
                            v-text="name"
                        />
                        <h3
                            v-show="!!secondaryName"
                            class="grey--text text-truncate"
                            :class="{ 'subtitle-025': displayMode === 'mobile' }"
                            :title="secondaryName"
                            v-text="secondaryName"
                        />

                        <v-spacer />

                        <v-chip-group v-if="media && media.genres">
                            <v-chip
                                v-for="genre in media.genres"
                                :key="genre.id"
                                class="elevation-1"
                                :href="genreLink(genre)"
                                :small="displayMode === 'mobile'"
                            >
                                {{ $t(genre.name) }}
                            </v-chip>
                        </v-chip-group>
                    </div>
                </transition>

                <div class="d-flex flex-column ma-2">
                    <v-btn
                        v-tooltip="$t('Items.Media.OpenExternal', { service: $t('Providers.' + dataProvider) })"
                        target="_blank"
                        :href="media ? media.url : '#'"
                        :disabled="!media"
                        icon
                    >
                        <v-icon>
                            mdi-open-in-new
                        </v-icon>
                    </v-btn>

                    <v-btn
                        v-tooltip="$t('Pages.MediaInfo.Name_' + mediaType)"
                        icon
                        :disabled="!media"
                        @click="mediaInfoVisible = true"
                    >
                        <v-icon>
                            mdi-information
                        </v-icon>
                    </v-btn>

                    <v-spacer v-show="displayMode !== 'mobile'" />

                    <v-btn
                        v-show="displayMode !== 'mobile'"
                        v-tooltip="$t('Pages.Viewer.TheaterMode')"
                        icon
                        @click="setTheaterMode(true)"
                    >
                        <v-icon>mdi-arrow-expand</v-icon>
                    </v-btn>
                </div>
            </div>

            <v-divider class="mx-4" />
        </div>

        <div class="viewer-player-row">
            <div
                ref="col"
                class="viewer-player-col"
            >
                <component
                    :is="displayMode === 'mobile' ? 'v-responsive' : 'FixedAspectRatio'"
                    ref="aspect"
                    :aspect-ratio="16/9"
                >
                    <BetterIframe
                        ref="iframe"
                        class="viewer-iframe"
                        :class="{ 'elevation-2': displayMode === 'normal' }"
                        :url="iframeUrl"
                    />

                    <template
                        v-if="displayMode === 'theater'"
                        #append
                    >
                        <div class="viewer-player-overlay">
                            <v-btn
                                v-show="!sidebarVisible"
                                color="primary"
                                fab
                                absolute
                                right
                                small
                                @click="setTheaterMode(false)"
                            >
                                <v-icon small>mdi-arrow-collapse</v-icon>
                            </v-btn>
                        </div>
                    </template>
                </component>
                <div class="viewer-player-controls">
                    <v-btn
                        :dark="displayMode === 'theater'"
                        :text="colWidth >= 600 && displayMode !== 'mobile'"
                        :icon="colWidth < 600 || displayMode === 'mobile'"
                        @click="reportDialog = true"
                    >
                        <v-icon
                            :left="colWidth >= 600 && displayMode !== 'mobile'"
                        >
                            mdi-alert-decagram
                        </v-icon>
                        <template v-if="colWidth >= 600 && displayMode !== 'mobile'">
                            {{ $t('Pages.Report.Name') }}
                        </template>
                    </v-btn>

                    <v-spacer />

                    <TranslationSubscribeMenu
                        #default="{ on }"
                        :media-id="mediaId"
                        :media-type="mediaType"
                        :translation="translation"
                        offset-y
                        top
                        transition="slide-y-transition"
                    >
                        <v-btn
                            v-show="media && authenticated"
                            v-tooltip="$t('Items.Notification.NamePlural')"
                            :dark="displayMode === 'theater'"
                            icon
                            v-on="on"
                        >
                            <v-icon>
                                mdi-bell
                            </v-icon>
                        </v-btn>
                    </TranslationSubscribeMenu>

                    <v-btn
                        v-show="colWidth >= 420"
                        v-tooltip="$t(mediaType === 'anime' ? 'Pages.Viewer.PrevEpisode' : 'Pages.Viewer.PrevChapter')"
                        :disabled="partNumber <= 1"
                        :dark="displayMode === 'theater'"
                        icon
                        @click="partNumber -= 1"
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
                            v-model="episodeInput"
                            :label="$t('anime' === 'anime' ? 'Items.Media.Episode' : 'Items.Media.Chapter')"
                            :suffix="media && media.partsCount ? $t('Pages.Viewer.OutOf', { n: media.partsCount }) : undefined"
                            :dark="displayMode === 'theater'"
                            class="mt-2 mb-1 text-right"
                            autocomplete="off"
                            height="24"
                            hide-details
                            @change="episodeInputDone"
                        />
                        <a
                            :href="iframeUrl"
                            class="text-center text-truncate"
                            style="font-size: 11px;"
                            target="_blank"
                        >
                            {{ $t('Pages.Viewer.DirectLink') }}
                        </a>
                    </v-layout>

                    <v-btn
                        v-show="colWidth >= 420"
                        v-tooltip="$t(mediaType === 'anime' ? 'Pages.Viewer.NextEpisode' : 'Pages.Viewer.NextChapter')"
                        :disabled="media && (media.partsCount === 0 ? false : partNumber >= media.partsCount)"
                        :dark="displayMode === 'theater'"
                        icon
                        @click="partNumber += 1"
                    >
                        <v-icon>mdi-arrow-right</v-icon>
                    </v-btn>

                    <v-btn
                        v-show="colWidth >= 320"
                        v-tooltip="{ content: $t(`Items.UserRate.ControlButton.${userRateStatus}-${mediaType}`), trigger: 'hover click focus' }"
                        :color="userRateStatus === 'old-part' ? 'success' : undefined"
                        :disabled="!authenticated || userRateLoading"
                        :loading="userRateControlLoading"
                        :dark="displayMode === 'theater'"
                        icon
                        @click="userRateControlClicked"
                    >
                        <v-icon>{{ userRateIcon }}</v-icon>
                    </v-btn>

                    <v-spacer v-show="displayMode === 'mobile'" />

                    <v-menu
                        v-model="userRateEditMenu"
                        :close-on-content-click="false"
                        :disabled="userRateLoading"
                        max-width="250"
                        top
                        transition="slide-x-transition"
                    >
                        <template #activator="{ on }">
                            <v-btn
                                v-show="userRate !== null"
                                v-tooltip="$t('Items.UserRate.EditEntry')"
                                :disabled="!authenticated || !userRate"
                                :dark="displayMode === 'theater'"
                                icon
                                v-on="on"
                            >
                                <v-icon>mdi-playlist-edit</v-icon>
                            </v-btn>
                        </template>

                        <UserRateEditForm
                            v-if="userRate !== null"
                            :media="media"
                            :rate.sync="userRate"
                            :visible="userRateEditMenu"
                            @close="userRateEditMenu = false"
                            @rate-update="userRate = $event"
                        />
                    </v-menu>

                    <v-spacer v-show="displayMode !== 'mobile'" />

                    <v-btn
                        v-show="displayMode !== 'mobile'"
                        :dark="displayMode === 'theater'"
                        :text="colWidth >= 600"
                        :icon="colWidth < 600"
                        @click="sidebarVisible = !sidebarVisible"
                    >

                        <template v-if="colWidth >= 600">
                            {{ $t('Pages.Viewer.List') }}
                        </template>
                        <v-icon
                            :right="colWidth >= 600"
                        >
                            mdi-format-list-bulleted
                        </v-icon>
                    </v-btn>
                </div>
            </div>
            <v-divider
                v-show="displayMode === 'normal'"
                class="ml-2"
                vertical
            />
            <ResizableDiv
                v-show="sidebarVisible"
                :minimum-width="400"
                :maximum-width="$r12s.screenWidth * 0.5"
                :no-limit="displayMode === 'mobile'"
                persistent-id="viewer-list"
                class="viewer-sidebar-wrap"
                @resize="onSidebarResize"
                @resizestart="$el.classList.add('resize-pending')"
                @resizeend="$el.classList.remove('resize-pending')"
            >
                <div
                    class="flex-row align-center"
                    :class="displayMode === 'theater' ? 'd-flex' : 'd-none'"
                >
                    <v-btn
                        v-tooltip="$t('Items.Media.OpenExternal', { service: $t('Providers.' + dataProvider) })"
                        target="_blank"
                        :disabled="!media"
                        :href="media ? media.url : '#'"
                        icon
                    >
                        <v-icon>
                            mdi-open-in-new
                        </v-icon>
                    </v-btn>

                    <v-btn
                        v-tooltip="$t('Pages.MediaInfo.Name_' + mediaType)"
                        icon
                        :disabled="!media"
                        @click="mediaInfoVisible = true"
                    >
                        <v-icon>
                            mdi-information
                        </v-icon>
                    </v-btn>

                    <div
                        class="flex text-truncate body-1 mx-2"
                        v-text="name"
                    />

                    <v-btn
                        v-tooltip="$t('Pages.Viewer.NormalMode')"
                        icon
                        @click="setTheaterMode(false)"
                    >
                        <v-icon v-text="'mdi-arrow-collapse'" />
                    </v-btn>
                </div>

                <ViewerSidebar
                    ref="sidebar"
                    :translation-id.sync="translationId"
                    :part-number.sync="partNumber"
                    :user-rate="userRate"
                    :media-id="mediaId"
                    :media-type="mediaType"
                    :media="media"
                    :show-parts-arrows="colWidth >= 480"
                    @iframe="iframeUrl = $event"
                    @translation="translation = $event"
                />
            </ResizableDiv>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Watch } from 'vue-property-decorator'
import LoadableVue from '@/components/common/LoadableVue'
import { appStore, authStore, configStore } from '@/store'
import ImageWithRadiosity from '@/components/common/ImageWithRadiosity.vue'
import { Media, MediaGenre, MediaType } from '@/types/media'
import { DataProviderName, getProviderNow } from '@/api/providers'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import BetterIframe from '@/components/common/BetterIframe.vue'
import FixedAspectRatio from '@/components/common/FixedAspectRatio.vue'
import ResizableDiv from '@/components/common/ResizableDiv.vue'
import { isPointInsideElement, nop } from '@/utils/helpers'
import { UserRate, UserRateStatus } from '@/types/user-rate'
import { getSingleMedia } from '@/api/media'
import { ApiException } from '@/types/api'
import { getUserRates, updateUserRate, createUserRate } from '@/api/user-rates'
import { iziToastError } from '@/plugins/izitoast'
import { getPreferredName, getSecondaryName, getSmallImage } from '@/utils/media-utils'
import { getFullImage } from '@/utils/media-utils'
import MediaInfoDrawer from '@/components/media/MediaInfoDrawer.vue'
import TranslationSubscribeMenu from '@/components/notifications/TranslationSubscribeMenu.vue'
import { merge } from '@/utils/object-utils'
import UserRateEditForm from '@/components/user-rates/UserRateEditForm.vue'
import ViewerSidebar from '@/components/viewer/ViewerSidebar.vue'
import ReportForm from '@/components/moderation/ReportForm.vue'
import { ExtendedSingleTranslationData } from '@/types/translation'
import TranslationEditDialog from '@/components/moderation/TranslationEditDialog.vue'
import { Route } from 'vue-router'
import { VResponsive } from 'vuetify/lib'

type ViewerDisplayMode = 'mobile' | 'normal' | 'theater'
type UserRateControlStatus = 'new' | 'new-part' | 'start-repeat' | 'old-part'
const userRateIconMap: Record<UserRateControlStatus, string> = {
    new: 'mdi-playlist-plus',
    'new-part': 'mdi-check',
    'start-repeat': 'mdi-repeat',
    'old-part': 'mdi-check',
}

@Component({
    components: {
        TranslationEditDialog,
        ReportForm,
        ViewerSidebar,
        UserRateEditForm,
        TranslationSubscribeMenu,
        MediaInfoDrawer,
        ResizableDiv,
        FixedAspectRatio,
        BetterIframe,
        VSimpleCard,
        ImageWithRadiosity,
        VResponsive
    },
})
export default class Viewer extends LoadableVue {
    @Prop({ type: String, required: true }) mediaType!: MediaType
    @Ref() iframe!: HTMLIFrameElement
    @Ref() sidebar!: any
    @Ref() col!: any

    error: ApiException | null = null
    userRateLoading = false
    userRateControlLoading = false
    userRateEditMenu = false

    reportDialog = false
    editDialog = false
    editMultipleDialog = false

    mediaInfoVisible = false

    mediaId = -1
    media: Media | null = null
    userRate: UserRate | null = null
    translationId: number | null = null
    translation: ExtendedSingleTranslationData | null = null

    colWidth = 0

    partNumber = NaN
    unsetPartNumber = false
    episodeInput = ''

    iframeUrl = 'about:blank'

    get authenticated (): boolean {
        return authStore.authenticated
    }

    get isModerator (): boolean {
        return authStore.user?.moderator ?? false
    }

    get isDark (): boolean {
        return configStore.dark
    }

    get dataProvider (): DataProviderName {
        return configStore.dataProvider
    }

    get displayMode (): ViewerDisplayMode {
        return this.$r12s.screenWidth < 960 ? 'mobile' : configStore.viewerTheaterMode ? 'theater' : 'normal'
    }

    get sidebarVisible (): boolean {
        return configStore.sidebarVisible
    }

    set sidebarVisible (val: boolean) {
        configStore.merge({ sidebarVisible: val })
        this.resizeIframe()
    }

    get fullImage (): string {
        return this.media ? getFullImage(this.media?.poster) : ''
    }

    get smallImage (): string | undefined {
        return this.media ? getSmallImage(this.media?.poster) : undefined
    }

    get name (): string {
        return this.media ? getPreferredName(this.media?.name) : ''
    }

    get secondaryName (): string | undefined {
        return this.media ? getSecondaryName(this.media?.name) : undefined
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


    updateHtmlClass (): void {
        if (this.displayMode === 'mobile') {
            document.documentElement.classList.remove('fullscreen-page')
        } else {
            document.documentElement.classList.add('fullscreen-page')
        }
    }

    @Watch('displayMode')
    resizeIframe (): void {
        this.$nextTick(() => {
            (
                this.$refs.aspect as any
            )?.onResize?.()
        })
        this.updateHtmlClass()
    }

    @Watch('partNumber')
    partChanged (): void {
        this.episodeInput = this.partNumber + ''
    }

    @Watch('translationId')
    onTranslationIdChanged (): void {
        let action: 'push' | 'replace' = this.$route.name === 'viewer-anime-id' ? 'replace' : 'push'
        this.$router[action]({
            name: 'viewer-anime-id-episode' + (
                this.translationId ? '-translation' : ''
            ),
            params: {
                id: this.mediaId + '',
                part: this.partNumber + '',
                translationId: this.translationId + '',
            },
        }).catch(nop)
    }

    episodeInputDone (): void {
        let q = parseInt(this.episodeInput)
        if (isNaN(q) || q <= 0) {
            this.episodeInput = this.partNumber + ''
        } else {
            this.partNumber = q
        }
    }

    setTheaterMode (val: boolean) {
        configStore.merge({
            viewerTheaterMode: val,
        })
    }

    genreLink (genre: MediaGenre): string {
        return '/search?p=' + getProviderNow().getGenreSearchParams(genre)
    }

    @Watch('$route')
    routeChanged (to: Route, from: Route): void {
        if (to.params.id !== from.params.id) {
            const mediaId = parseInt(this.$route.params.id)
            this.mediaId = mediaId
            setTimeout(() => configStore.addRecentMedia({
                type: this.mediaType,
                id: mediaId,
            }), 120000)
            this.update()
        }
        if (to.params.part !== from.params.part && to.params.part !== this.partNumber + '') {
            this.partNumber = to.params.part !== undefined ? parseInt(to.params.part) : 1
            this.unsetPartNumber = to.params.part !== undefined
        }
        if (to.params.translationId !== from.params.translationId && to.params.translationId !== this.translationId
            + '') {
            this.translationId = to.params.translationId != undefined ? parseInt(to.params.translationId) : null
        }
    }

    @Watch('$r12s.screenWidth')
    updateColWidth (): void {
        this.colWidth = this.col.clientWidth
        this.sidebar.onResize()
    }

    onSidebarResize (): void {
        this.updateColWidth()
        this.resizeIframe()
        this.sidebar.onResize()
    }

    updateUserRate (): Promise<void> {
        if (!this.authenticated) return Promise.resolve()
        this.userRateLoading = true
        return getUserRates({
            target_id: this.mediaId,
            target_type: this.mediaType,
        }).then(([rate]) => {
            this.userRate = rate ?? null
            this.userRateLoading = false

            if (this.unsetPartNumber) {
                if (rate) {
                    this.partNumber = rate.status == UserRateStatus.Completed ? 1 : rate.parts + 1
                }
                this.unsetPartNumber = false
            }
        }).catch(iziToastError)
        // note that in case of error user rate is still marked as loading
        // which means user cant edit (create) user rate
        // they can update data on page though
    }

    userRateControlClicked (): void {
        this.userRateControlLoading = true
        let prom: Promise<void>
        if (this.userRateStatus === 'new') {
            prom = createUserRate({
                target_id: parseInt(this.$route.params.id),
                target_type: this.mediaType,
                parts: this.partNumber,
                status: UserRateStatus.InProgress,
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
                status: UserRateStatus.InProgress,
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
                repeats: this.userRate!.repeats + 1,
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
                status: UserRateStatus.InProgress,
            }).then((rate) => {
                merge(this.userRate!, rate)
            })
        }
        prom!.catch(iziToastError).finally(() => {
            this.userRateControlLoading = false
        })
    }

    update (): Promise<void> {
        this.error = null
        this.loading = true
        let media = getSingleMedia(this.mediaId, this.mediaType)
            .then((media) => {
                this.media = media
            }).catch((err) => {
                this.error = err
            })
        let userRate = this.updateUserRate()
        this.$nextTick(() => this.sidebar.update())
        return Promise.all([media, userRate]).then(() => {
            this.loading = false
        })
    }

    requestUpdate (): void {
        this.update()
    }

    @Watch('name')
    updateName (): void {
        appStore.merge({
            innerTitle: '',
            pageTitle: this.name,
            navTitle: this.name,
            showUpdateButton: true,
        })
    }

    mounted (): void {
        this.loading = true
        this.partChanged()

        this.updateColWidth()
        this.updateHtmlClass()

        appStore.merge({
            showSearch: true,
        })
        this.updateName()
        const mediaId = parseInt(this.$route.params.id)
        this.mediaId = mediaId
        setTimeout(() => configStore.addRecentMedia({
            type: this.mediaType,
            id: mediaId,
        }), 120000)
        if (this.$route.params.part !== undefined) {
            this.partNumber = parseInt(this.$route.params.part)
            if (this.$route.params.translationId !== undefined) {
                this.translationId = parseInt(this.$route.params.translationId)
            }
        } else {
            this.partNumber = 1
            this.unsetPartNumber = true
        }
        this.update()
    }
}
</script>

<style lang="scss">
.viewer-container {
    .theme--light & {
        background: #fff;
    }

    .theme--dark & {
        background: #363636;
    }

    display: flex;
    flex-direction: column;
    height: 100%;
}

.viewer-header {
    display: flex;
    flex-direction: row;

    .v-skeleton-loader__image {
        height: 120px;
        width: 80px;
    }

    .v-skeleton-loader__heading {
        margin-bottom: 12px;
    }
}

.viewer-iframe {
    height: 100%;
}

.viewer-player-row {
    .viewer-container:not(.viewer-container--theater) .fixed-ar--container {
        margin-bottom: 8px;
    }

    .viewer-container:not(.viewer-container--normal) & .fixed-ar--container {
        background: black;
    }

    .resizable-div--grip {
        width: 16px;
    }

    .resizable-div--content {
        padding-top: 8px;
        padding-bottom: 8px;
        padding-right: 8px;
    }

    display: flex;
    flex-direction: row;
    flex: 1;
    max-height: 100%;
}

.viewer-player-col {
    .viewer-container--normal & {
        padding: 8px
    }

    .viewer-container:not(.viewer-container--mobile) & {
        height: 100%;
    }

    width: 100%;
    display: flex;
    flex-direction: column;

    .viewer-container--normal & {
        .fixed-ar--wrap, iframe {
            border-radius: 4px;
        }
    }
}


.viewer-player-controls {
    padding: 4px;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;

    .viewer-container--theater & {
        background: black;

        a {
            color: #56a1eb
        }
    }
}

.viewer-player-overlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    color: white;
    padding: 16px;
    pointer-events: none;

    .v-btn {
        pointer-events: all;
    }
}

.resize-pending {
    iframe {
        pointer-events: none;
    }

    user-select: none;
}

.viewer-container--mobile {
    .viewer-player-row {
        flex-direction: column;
    }

    .viewer-sidebar {
        flex-direction: column-reverse!important;
    }

    .viewer-sidebar-wrap .resizable-div--content {
        margin: 8px;
        width: 100%;
        display: flex;
        flex-grow: 1;
    }

    .authors-list {
        padding: 8px
    }

    .kinds-tabs {
        margin-top: 12px;
    }

    .viewer-sidebar-parts {
        margin-right: 8px!important; // idk
    }
}
</style>
