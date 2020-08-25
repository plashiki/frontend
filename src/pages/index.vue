<template>
    <div>
        <ErrorAlert :error="error" />
        <v-alert
            transition="slide-y-transition"
            elevation="2"
            prominent
            :value="motd != null"
        >
            <div v-html="motd || ''" />
        </v-alert>

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
import { getOngoings, getPopularReleased, getRecentUpdates } from '@/api/media'
import { appStore, configStore } from '@/store'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import HeadlineWithLinkButton from '@/components/common/HeadlineWithLinkButton.vue'
import { Media, MediaType } from '@/types/media'
import { ApiException } from '@/types/api'
import OneTimeAlert from '@/components/common/OneTimeAlert.vue'
import { getProviderNow } from '@/api/providers'
import { IDataProvider } from '@/api/providers/types'
import { getCurrentMotd } from '@/api/misc'


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
    motd: string | null = null

    get dataProvider (): string {
        return configStore.dataProvider
    }

    get recentLink (): string | null {
        return this.searchLink('recentlyUpdatedSearchParams')
    }

    get topOngoingsLink (): string | null {
        return this.searchLink('topOngoingsSearchParams')
    }

    get topReleasedLink (): string | null {
        return this.searchLink('topReleasedSearchParams')
    }

    get recentOngoings (): boolean {
        return configStore.onlyOngoingsInRecent
    }

    searchLink (featureName: keyof IDataProvider): string | null {
        let val = getProviderNow()[featureName]

        return val === null ? null : '/search?p=' + val
    }

    updateItems (): void {
        this.error = null
        this.loading = true
        Promise.all([
            getRecentUpdates(this.mediaType),
            getOngoings(this.mediaType),
            getPopularReleased(this.mediaType),
            getCurrentMotd()
        ]).then(([updates, ongoings, released, motd]) => {
            this.motd = motd
            this.items.recent = updates.map(update => ({
                ...update.media,
                statusText: this.$tc(update.media.type === 'anime' ? 'Items.Media.AddedNthEpisode' : 'Items.Media.AddedNthChapter', update.part)
            }))
            this.items.ongoings = ongoings.items
            this.items.released = released.items
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
