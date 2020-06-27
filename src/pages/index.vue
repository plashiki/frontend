<template>
    <div>
        <ErrorAlert :error="error" />

        <v-card class="my-2">
            <v-card-text>
                <HeadlineWithLinkButton
                    :text="recentOngoings ? $t('Pages.Index.RecentlyUpdatedOngoings') : $t('Pages.Index.RecentlyUpdated')"
                    :to="recentLink"
                    :tooltip="$t('Pages.Index.OpenInSearch')"
                    class="my-2"
                />
                <MediaCarousel
                    :items="items.recent"
                    :loading="loading"
                    :no-items-text="$t('Common.Collection.NoItemsFound')"
                />
            </v-card-text>
        </v-card>

        <v-card class="my-2">
            <v-card-text>
                <HeadlineWithLinkButton
                    :text="$t('Pages.Index.TopOngoings')"
                    :to="topOngoingsLink"
                    :tooltip="$t('Pages.Index.OpenInSearch')"
                    class="my-2"
                />
                <MediaCarousel
                    :items="items.ongoings"
                    :loading="loading"
                    :no-items-text="$t('Common.Collection.NoItemsFound')"
                    :rows="2"
                />
            </v-card-text>
        </v-card>

        <v-card class="my-2">
            <v-card-text>
                <HeadlineWithLinkButton
                    :text="$t('Pages.Index.TopReleased')"
                    :to="topReleasedLink"
                    :tooltip="$t('Pages.Index.OpenInSearch')"
                    class="my-2"
                />
                <MediaCarousel
                    :items="items.released"
                    :loading="loading"
                    :no-items-text="$t('Common.Collection.NoItemsFound')"
                    :rows="2"
                />
            </v-card-text>
        </v-card>

        <p class="text-center body-2 text--secondary">
            {{ $t('Common.Collection.DataFrom', { provider: $t('Providers.' + dataProvider) }) }}
        </p>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import MediaList from '@/components/media/MediaList.vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'
import MediaCard from '@/components/media/MediaCard.vue'
import MediaCarousel from '@/components/media/MediaCarousel.vue'
import { getFeatureVarNow, isFeatureAvailableNow } from '@/api/providers'
import { getOngoings, getPopularReleased, getRecentUpdates } from '@/api/media'
import { appStore, configStore } from '@/store'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import HeadlineWithLinkButton from '@/components/common/HeadlineWithLinkButton.vue'
import { Media, MediaType } from '@/types/media'
import { ApiException } from '@/types/api'
import OneTimeAlert from '@/components/common/OneTimeAlert.vue'


@Component({
    components: { OneTimeAlert, HeadlineWithLinkButton, ErrorAlert, MediaCarousel, MediaCard, VirtualGrid, MediaList }
})
export default class IndexPage extends Vue {
    items: Record<string, Media[]> = {
        recent: [],
        ongoings: [],
        released: []
    }
    loading = false
    error: ApiException | null = null
    mediaType: MediaType = 'anime'

    get dataProvider (): string {
        return configStore.dataProvider
    }

    get recentLink (): string | null {
        return this.searchLink('RecentlyUpdatedSearchParams')
    }

    get topOngoingsLink (): string | null {
        return this.searchLink('TopOngoingsSearchParams')
    }

    get topReleasedLink (): string | null {
        return this.searchLink('TopReleasedSearchParams')
    }

    get recentOngoings (): boolean {
        return configStore.onlyOngoingsInRecent && isFeatureAvailableNow('MediaStatusInBatch', {
            type: this.mediaType
        })
    }

    searchLink (featureName: string): string | null {
        let val = getFeatureVarNow(featureName)

        return val === null ? null : '/search?p=' + val
    }

    updateItems (): void {
        this.error = null
        this.loading = true
        Promise.all([
            getRecentUpdates(this.mediaType),
            getOngoings(this.mediaType, {
                limit: 25
            }),
            getPopularReleased(this.mediaType, {
                limit: 25
            })
        ]).then(([updates, ongoings, released]) => {
            this.items.recent = updates.map(update => ({
                ...update.media,
                statusText: this.$tc(update.media.type === 'anime' ? 'Items.Media.AddedNthEpisode' : 'Items.Media.AddedNthChapter', update.part)
            }))
            this.items.ongoings = ongoings
            this.items.released = released
        }).catch((err: ApiException) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    @Watch('$nuxt.isOnline')
    onOnlineStatusChange (isOnline: boolean): void {
        if (isOnline) {
            this.updateItems()
        }
    }

    requestUpdate (): void {
        this.updateItems()
    }

    mounted (): void {
        this.updateItems()

        appStore.merge({
            showUpdateButton: true,
            showSearch: true
        })
    }
}
</script>
