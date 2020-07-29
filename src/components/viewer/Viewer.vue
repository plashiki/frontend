<template>
    <div>
        <ErrorAlert :error="error" />

        <v-simple-card text-class="pa-0">
            <transition mode="out-in" name="fade-transition">
                <div
                    v-if="media != null"
                    class="d-flex flex-row flex-nowrap"
                >
                    <v-img
                        v-show="$r12s.screenWidth >= 360"
                        class="viewer-poster"
                        :class="{ 'viewer-poster--small': mobileDisplay }"
                        :aspect-ratio="2/3"
                        :lazy-src="smallImage"
                        :src="fullImage"
                        :gradient="'to right, #00000000 90%, #' + (isDark ? '1e1e1e' : 'ffffff') + ' 100%'"
                    />

                    <div class="d-flex flex-column flex pa-4 pb-0 pr-0 text-truncate">
                        <h1
                            :class="{
                                'subtitle-05 pb-1': mobileDisplay,
                                'lh-2 mb-1': !mobileDisplay
                            }"
                            class="text-truncate"
                            :title="name"
                            v-text="name"
                        />
                        <h3
                            v-show="!!secondaryName"
                            class="grey--text text-truncate"
                            :class="{ 'subtitle-025': mobileDisplay }"
                            :title="secondaryName"
                            v-text="secondaryName"
                        />

                        <v-spacer />

                        <v-chip-group
                            v-if="media.genres !== undefined"
                            :show-arrows="!mobileDisplay"
                        >
                            <v-chip
                                v-for="genre in media.genres"
                                :key="genre.id"
                                :href="genreLink(genre)"
                                :small="mobileDisplay"
                            >
                                {{ $t(genre.name) }}
                            </v-chip>
                        </v-chip-group>
                    </div>

                    <v-btn
                        v-tooltip="$t('Items.Media.OpenExternal', { service: $t('Providers.' + dataProvider) })"
                        target="_blank"
                        :href="media.url"
                        :small="mobileDisplay"
                        class="ma-2 align-self-center"
                        icon
                    >
                        <v-icon :small="mobileDisplay">
                            mdi-open-in-new
                        </v-icon>
                    </v-btn>
                </div>
                <v-skeleton-loader
                    v-else-if="loading"
                    type="list-item-two-line"
                />
            </transition>
        </v-simple-card>

        <v-row class="ma-0 mt-2" no-gutters>
            <v-col class="d-flex flex-column justify-center">
                <v-responsive
                    :aspect-ratio="16/9"
                    class="viewer-frame--wrap elevation-2"
                >
                    <v-simple-card
                        class="viewer-frame--card"
                        text-class="pa-0"
                    >
                        <iframe
                            ref="iframe"
                            :src="iframeUrl"
                            allowfullscreen
                            allow="autoplay, encrypted-media"
                            class="viewer-iframe"
                            @load="onIframeLoad"
                        />
                        <v-layout
                            class="viewer-iframe__overlay"
                        >
                            <v-progress-linear
                                :active="iframeLoading"
                                color="primary"
                                height="4"
                                indeterminate
                            />
                        </v-layout>
                    </v-simple-card>
                </v-responsive>
            </v-col>
        </v-row>

        <ViewerControls
            :data="data"
            :media="media"
            :media-id="mediaId"
            :media-type="mediaType"
            :part.sync="partNumber"
            :rate.sync="userRate"
            :selected-translations="selectedTranslations"
            :selection-mode.sync="translationSelectionMode"
            :translation="currentTranslation"
            :user-rate-loading="userRateLoading"
            @rate-update="userRate = $event"
            @update="requestUpdate"
            @use-extension="useExtensionChanged"
        />

        <!-- 2000iq -->
        <component
            :is="mobileDisplay ? 'transition' : 'div'"
            :mode="mobileDisplay ? 'out-in' : undefined"
            :name="mobilePage === 'parts' ? 'scroll-x-transition' : 'scroll-x-reverse-transition'"
            :tag="mobileDisplay ? 'div' : undefined"
            class="row"
        >
            <v-col
                v-if="!mobileDisplay || mobilePage === 'parts'"
                key="1"
                :class="{ 'px-0': mobileDisplay }"
                :cols="mobileDisplay ? 12 : 6"
            >
                <PartsList
                    ref="parts"
                    :data="data"
                    :loading="loading"
                    :media-type="mediaType"
                    :part.sync="partNumber"
                    :user-rate="userRate"
                    @item-click="mobilePage = 'authors'"
                />
            </v-col>
            <v-col
                v-if="!mobileDisplay || mobilePage === 'authors'"
                key="2"
                :class="{ 'px-0': mobileDisplay }"
                :cols="mobileDisplay ? 12 : 6"
            >
                <AuthorsList
                    ref="authors"
                    :data="data && data[partNumber] && data[partNumber].authors"
                    :loading="loading"
                    :media-type="mediaType"
                    :selected-translations="selectedTranslations"
                    :translation-selection-mode="translationSelectionMode"
                    :translation.sync="translationId"
                    :translations-index="translationsIndex"
                >
                    <template #left>
                        <v-btn
                            v-show="mobileDisplay"
                            :icon="$r12s.screenWidth <= 500"
                            :text="$r12s.screenWidth > 500"
                            rounded
                            @click="mobilePage = 'parts'"
                        >
                            <v-icon :left="$r12s.screenWidth > 500">
                                mdi-arrow-left
                            </v-icon>
                            <span
                                v-text="($r12s.screenWidth > 500) ? (mediaType === 'anime' ? $t('Pages.Viewer.Episodes') : $t('Pages.Viewer.Chapters')) : ''"
                            />
                        </v-btn>
                    </template>
                </AuthorsList>
            </v-col>
        </component>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import LoadableVue from '@/components/common/LoadableVue'
import {
    getMediaFullImage,
    getMediaPreferredName,
    getMediaSecondaryName,
    getMediaSmallImage,
    processTranslations
} from '@/utils/media-utils'
import HeadlineWithLinkButton from '@/components/common/HeadlineWithLinkButton.vue'
import { appStore, authStore, configStore } from '@/store'
import PartsList from '@/components/viewer/PartsList.vue'
import AuthorsList from '@/components/viewer/AuthorsList.vue'
import {
    collectTelemetry,
    getDefaultTranslation,
    processAuthorName,
    sortTranslations
} from '@/utils/user-preferences-utils'
import ViewerControls from '@/components/viewer/ViewerControls.vue'
import { Media, MediaGenre, MediaType } from '@/types/media'
import {
    ExtendedSingleTranslationData,
    SingleTranslationData,
    TranslationAuthor,
    TranslationData
} from '@/types/translation'
import { UserRate, UserRateStatus } from '@/types/user-rate'
import { getSingleMedia } from '@/api/media'
import { ApiException } from '@/types/api'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { getTranslationsFor } from '@/api/translations'
import { getUserRates } from '@/api/user-rates'
import { nop } from '@/utils/helpers'
import { Route } from 'vue-router'
import { getFeatureVarNow } from '@/api/providers'
import { iziToastError } from '@/plugins/izitoast'
import VSimpleCard from '@/components/common/VSimpleCard.vue'

@Component({
    components: { VSimpleCard, ErrorAlert, ViewerControls, AuthorsList, PartsList, HeadlineWithLinkButton }
})
export default class Viewer extends LoadableVue {
    @Prop({ type: String, required: true }) mediaType!: MediaType
    @Ref() iframe!: HTMLIFrameElement
    @Ref() authors!: any
    @Ref() parts!: Vue

    dataProvider = configStore.dataProvider
    error: ApiException | null = null

    iframeLoading = false
    userRateLoading = false

    mediaId = -1
    media: Media | null = null
    data: Readonly<TranslationData> | null = null
    userRate: UserRate | null = null
    partNumber = NaN
    unsetPartNumber = false
    translationId: number | null = null
    iframeUrl = 'about:blank'

    selectedTranslations: number[] = []
    translationSelectionMode = false

    telemetryTimeout: number | null = null

    // mobile layout
    mobilePage = 'parts'

    get authenticated (): boolean {
        return authStore.authenticated
    }

    get isDark (): boolean {
        return configStore.dark
    }

    get mobileDisplay (): boolean {
        return this.$r12s.screenWidth < 730
    }

    get fullImage (): string {
        return this.media ? getMediaFullImage(this.media) : ''
    }

    get smallImage (): string | undefined {
        return this.media ? getMediaSmallImage(this.media) : undefined
    }

    get name (): string {
        return this.media ? getMediaPreferredName(this.media) : ''
    }

    get secondaryName (): string | undefined {
        return this.media ? getMediaSecondaryName(this.media) : undefined
    }

    get translationsIndex (): Readonly<Record<number, Readonly<SingleTranslationData & { author: TranslationAuthor }>>> {
        if (!this.data || !this.data[this.partNumber]) return {}
        let ret: Record<number, SingleTranslationData & { author: TranslationAuthor }> = {}

        for (let author of this.data[this.partNumber].authors) {
            for (let tr of author.translations) {
                ret[tr.id] = Object.freeze({ ...tr, author })
            }
        }

        return Object.freeze(ret)
    }

    get currentTranslation (): ExtendedSingleTranslationData | null {
        return this.translationId !== null ? this.translationsIndex[this.translationId] ?? null : null
    }

    @Watch('partNumber')
    onPartNumberChanged (val: number): void {
        if (!this.data) return

        if (this.authors) {
            if (this.currentTranslation === null) {
                const { translation, allTab } = getDefaultTranslation(this.data, val, this.authors.currentTab)
                this.translationId = translation?.id ?? null
                if (allTab) {
                    this.authors.currentTab = 0
                }
            } else {
                // index was re-populated, notifying AuthorsList about it
                const notify = () => {
                    if (this.authors) {
                        this.authors.selectedTranslationChanged()
                    } else {
                        setTimeout(notify, 50)
                    }
                }
                this.$nextTick(notify)
            }
        } else setTimeout(() => this.onPartNumberChanged(val), 50)
    }

    @Watch('translationId')
    onTranslationIdChanged (): void {
        let action: 'push' | 'replace' = this.$route.name === 'viewer-anime-id' ? 'replace' : 'push'

        this.$router[action]({
            name: 'viewer-anime-id-episode' + (this.translationId ? '-translation' : ''),
            params: {
                id: this.mediaId + '',
                part: this.partNumber + '',
                translationId: this.translationId + ''
            }
        }).catch(nop)

        if (this.telemetryTimeout) clearTimeout(this.telemetryTimeout)

        if (!this.currentTranslation) return
        this.telemetryTimeout = setTimeout(() => this.currentTranslation && collectTelemetry(this.currentTranslation), 120000)
        // 2 mins is enough in avg for user to settle on a single translation
    }

    @Watch('currentTranslation')
    onTranslationChanged (val: ExtendedSingleTranslationData | null = this.currentTranslation): void {
        // if (val?.id === old?.id) {
        //     return
        // }

        if (!val) {
            this.iframeUrl = 'about:blank'
            return
        }

        let author = ''
        if (val.author.name) {
            let { studio } = processAuthorName(val.author.name)
            author = studio
        }
        appStore.merge({
            lastAuthor: author,
            lastKind: val.author.kind,
            lastPlayer: val.name
        })

        this.iframeUrl = val.url
    }

    @Watch('iframeUrl')
    onIframeUrlChanged (val: string): void {
        this.iframeLoading = true

        // workaround so urls in iframe dont pollute browser history
        this.$nextTick(() => {
            const el = this.iframe
            if (el) {
                const cont = el.parentElement as HTMLDivElement
                el.remove()
                el.setAttribute('src', val)
                cont.prepend(el)
            }
        })
    }

    @Watch('authenticated')
    authenticationChanged (val: boolean): void {
        if (!val) {
            this.userRate = null
        } else {
            this.updateUserRate()
        }
    }

    useExtensionChanged (): void {
        if (this.translationId === null) return

        this.onTranslationChanged()
    }

    onIframeLoad (): void {
        this.iframeLoading = false
    }

    genreLink (genre: MediaGenre): string {
        return '/search?p=' + getFeatureVarNow('GenreSearchParams', { genre })
    }

    updateUserRate (): Promise<void> {
        if (!this.authenticated) return Promise.resolve()
        // separate method coz it should also be updated when user logins
        this.userRateLoading = true
        return getUserRates({
            target_id: this.mediaId,
            target_type: this.mediaType
        }).then(([rate]) => {
            this.userRate = rate ?? null
            this.userRateLoading = false

            if (this.unsetPartNumber && rate) {
                this.partNumber = rate.status === UserRateStatus.Completed ? 1 : rate.parts + 1
                this.unsetPartNumber = false
            }
        }).catch(iziToastError)
        // note that in case of error user rate is still marked as loading
        // which means user cant edit (create) user rate
        // he can still update data on page anyway
    }

    update (): Promise<any> {
        this.error = null
        this.loading = true
        let mediaProm = getSingleMedia(this.mediaId, this.mediaType)
            .then((media) => {
                this.media = media
            }).catch((err) => {
                // media load error is not as bad as data load, so toast is ok i guess..
                iziToastError(err)
            })
        let dataProm = getTranslationsFor(this.mediaId, this.mediaType)
            .then((data) => {
                this.data = Object.freeze(sortTranslations(processTranslations(data)))
                this.onPartNumberChanged(this.partNumber)
            }).catch((err) => {
                this.error = err
            })
        let userRateProm = this.updateUserRate()
        return Promise.all([mediaProm, dataProm, userRateProm]).finally(() => {
            this.loading = false
        })
    }

    requestUpdate (): Promise<void> {
        return this.update()
    }

    @Watch('name')
    updateName (): void {
        appStore.merge({
            innerTitle: '',
            pageTitle: this.name,
            navTitle: this.name,
            showUpdateButton: true
        })
    }

    @Watch('$route')
    routeChanged (to: Route, from: Route): void {
        if (to.params.id !== from.params.id) {
            const mediaId = parseInt(this.$route.params.id)
            this.mediaId = mediaId

            setTimeout(() => configStore.addRecentMedia({
                type: this.mediaType,
                id: mediaId
            }), 120000)

            this.update()
        }

        if (to.params.part !== from.params.part && to.params.part !== this.partNumber + '') {
            this.partNumber = to.params.part !== undefined ? parseInt(to.params.part) : 1
            this.unsetPartNumber = to.params.part !== undefined
        }

        if (to.params.translationId !== from.params.translationId && to.params.translationId !== this.translationId + '') {
            this.translationId = to.params.translationId === undefined ? parseInt(to.params.translationId) : null
        }
    }

    mounted (): void {
        this.updateName()

        const mediaId = parseInt(this.$route.params.id)
        this.mediaId = mediaId

        setTimeout(() => configStore.addRecentMedia({
            type: this.mediaType,
            id: mediaId
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
        this.mobilePage = 'authors'

        this.update()
    }
}
</script>

<style>
.viewer-poster {
    max-width: 96px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}

.viewer-poster--small {
    width: 64px;
}

.viewer-frame--wrap {
    max-height: 420px;
    max-width: 746.66px;
    margin: 0 auto;
    width: 100%;
    border-radius: 4px;
}

@media screen and (min-width: 968px) {
    .viewer-frame--wrap {
        max-height: 500px;
        max-width: 888.89px;
    }
}

.viewer-frame--card {
    overflow: hidden;
    flex-grow: 1;
    height: 100%;
}

.viewer-frame--card .v-card__text {
    height: 100%
}
</style>
