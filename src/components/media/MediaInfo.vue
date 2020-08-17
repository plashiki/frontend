<template>
    <v-fade-transition>
        <v-row
            v-if="loading"
            align="center"
            justify="center"
            class="fill-height"
        >
            <v-progress-circular
                size="48"
                width="2"
                color="primary"
                indeterminate
            />
        </v-row>
        <ErrorAlert
            v-else-if="error"
            :error="error"
        />
        <div v-else-if="fullMedia">
            <div class="text-center">
                <h1
                    class="lh-2 mb-1 text-truncate"
                    :title="name"
                    v-text="name"
                />
                <h3
                    v-show="!!secondaryName"
                    class="text--secondary text-truncate"
                    :title="secondaryName"
                    v-text="secondaryName"
                />
            </div>

            <v-row>
                <v-col
                    cols="12"
                    sm="6"
                    md="4"
                    class="d-flex align-start justify-center"
                >
                    <ImageWithRadiosity
                        :src="fullImage"
                        :aspect-ratio="2/3"
                        max-width="140"
                    />
                </v-col>

                <v-col
                    cols="12"
                    sm="6"
                    md="8"
                >
                    <h2
                        class="my-2"
                        v-text="$t('Pages.MediaInfo.Information')"
                    />
                    <div
                        v-for="(it, i) in infoLines"
                        :key="i"
                    >
                        <span class="text--secondary">{{ it.title }}:</span>
                        {{ it.content }}
                    </div>

                    <div class="text-center">
                        <v-rating
                            v-if="fullMedia.score != null"
                            :value="fullMedia.score / 2"
                            class="rating-smaller-gap mt-2"
                            half-icon="mdi-star-half-full"
                            half-increments
                            readonly
                        />
                    </div>
                </v-col>
            </v-row>

            <h2
                class="my-2"
                v-text="$t('Pages.MediaInfo.Description')"
            />
            <ExpandableDiv
                :class="'media-description-' + provider"
                :html="fullMedia.description"
            />

            <template v-if="fullMedia.related && fullMedia.related.length">
                <h2
                    class="my-2"
                    v-text="$t('Pages.MediaInfo.Related')"
                />
                <MediaCarousel
                    :items="fullMedia.related"
                    :item-height="210"
                    :item-width="140"
                />
            </template>

            <template v-if="fullMedia.similar && fullMedia.similar.length">
                <h2
                    class="my-2"
                    v-text="$t('Pages.MediaInfo.Similar')"
                />
                <MediaCarousel
                    :items="fullMedia.similar"
                    :item-height="210"
                    :item-width="140"
                />
            </template>
        </div>
    </v-fade-transition>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ImageWithRadiosity from '@/components/common/ImageWithRadiosity.vue'
import { ExtendedMedia, Media, MediaStatus } from '@/types/media'
import { ApiException } from '@/types/api'
import { getFullImage, getPreferredName, getSecondaryName } from '@/utils/media-utils'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { getSingleExtendedMedia } from '@/api/media'
import { format } from 'date-fns'
import { dateFnLocale } from '@/plugins/vue-i18n'
import { configStore } from '@/store'
import { DataProviderName } from '@/api/providers'
import ExpandableDiv from '@/components/common/ExpandableDiv.vue'
import MediaCarousel from '@/components/media/MediaCarousel.vue'

interface InfoLine {
    title: string
    content: string | number
}

@Component({
    components: { MediaCarousel, ExpandableDiv, ErrorAlert, ImageWithRadiosity },
})
export default class MediaInfo extends Vue {
    @Prop({ required: true }) media!: Media
    @Prop({ type: Boolean, default: false }) isFull!: boolean
    @Prop({ type: Boolean, default: false }) lazy!: boolean

    fullMedia: ExtendedMedia | null = null

    loading = false
    error: ApiException | null = null

    get provider (): DataProviderName {
        return configStore.dataProvider
    }

    get name (): string {
        return this.fullMedia ? getPreferredName(this.fullMedia?.name) : ''
    }

    get secondaryName (): string | undefined {
        return this.fullMedia ? getSecondaryName(this.fullMedia?.name) : undefined
    }

    get infoLines (): InfoLine[] {
        if (!this.fullMedia) return []
        const media = this.fullMedia

        const ret: InfoLine[] = []

        if (media.releaseType) {
            ret.push({
                title: this.$t('Items.Media.ReleaseType._'),
                content: this.$t('Items.Media.ReleaseType.' + media.releaseType),
            })
        }

        if (media.partsAired != null || media.partsCount != null) {
            ret.push({
                title: this.$t(media.type === 'anime' ? 'Items.Media.Episodes' : 'Items.Media.Chapters'),
                content: media.status === MediaStatus.Ongoing
                    ? `${ media.partsAired } / ${ media.partsCount || '?' }`
                    : media.partsCount ?? 0,
            })
        }

        if (media.status === MediaStatus.Ongoing && media.nextPartAt) {
            ret.push({
                title: this.$t(media.type === 'anime' ? 'Items.Media.NextEpisode' : 'Items.Media.NextChapter'),
                content: format(media.nextPartAt, 'PPpp', { locale: dateFnLocale() }),
            })
        }

        if (media.status != null) {
            ret.push({
                title: this.$t('Items.Media.Status._'),
                content: media.status === MediaStatus.Announced
                    ? media.nextPartAt
                        ? this.$t('Items.Media.AnnouncedFor', { date: format(media.nextPartAt, 'PP', { locale: dateFnLocale() }) })
                        : this.$t('Items.Media.Status.announced')
                    : media.status === MediaStatus.Released
                        ? media.releasedOn
                            ?  this.$t('Items.Media.ReleasedOn', { date: format(media.releasedOn, 'PP', { locale: dateFnLocale() }) })
                            : this.$t('Items.Media.Status.released')
                        : media.airedOn
                            ? this.$t('Items.Media.OngoingSince', { date: format(media.airedOn, 'PP', { locale: dateFnLocale() }) })
                            : this.$t('Items.Media.Status.ongoing'),
            })
        }

        if (media.studio != null) {
            ret.push({
                title: this.$t('Items.Media.Studio'),
                content: media.studio
            })
        }

        let otherNames: string[] = []
        for (let [key, value] of Object.entries(media.name)) {
            if (key === 'other') otherNames.push(...value)
            if (key !== configStore.preferredNameLanguage) otherNames.push(value)
        }
        if (otherNames.length) {
            ret.push({
                title: this.$t('Items.Media.OtherNames'),
                content: otherNames.join(', ')
            })
        }

        return ret
    }

    get fullImage (): string {
        return this.media ? getFullImage(this.media?.poster) : ''
    }

    load (): void {
        if (this.isFull) {
            this.fullMedia = this.media
        } else {
            this.loading = true

            getSingleExtendedMedia(this.media.id, this.media.type)
                .then((media) => {
                    if (!media) {
                        throw new ApiException('NOT_FOUND')
                    }
                    this.fullMedia = media
                })
                .catch((err) => {
                    this.error = err
                })
                .finally(() => {
                    this.loading = false
                })
        }
    }

    @Watch('media')
    mediaChanged (): void {
        this.fullMedia = null
        if (!this.lazy) {
            this.load()
        }
    }

    mounted (): void {
        if (!this.lazy) {
            this.load()
        }
    }
}
</script>

<style lang="scss">
// compatibility stuff
.media-description-shikimori {
    .b-prgrph {
        margin-bottom: .5rem !important;
    }
}
</style>
