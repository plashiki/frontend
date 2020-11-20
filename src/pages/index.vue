<template>
    <div class="cards-page-container">
        <ErrorAlert :error="error" />
        <v-alert
            transition="slide-y-transition"
            elevation="2"
            prominent
            :value="motd != null"
        >
            <div v-html="motd || ''" />
        </v-alert>

        <v-card
            v-for="(meta, name) of sections"
            :key="name"
            class="mb-2"
        >
            <v-card-text>
                <HeadlineWithLinkButton
                    :text="meta.name"
                    :to="meta.search"
                    :tooltip="$t('Pages.Index.OpenInSearch')"
                    class="mb-2"
                />
                <MediaCarousel
                    :items="states[name].items"
                    :loading="states[name].loading"
                    :rows="meta.rows"
                    :no-items-text="$t('Common.Collection.NoItemsFound')"
                />
            </v-card-text>
        </v-card>

        <p class="text-center body-2 text--secondary my-2 pb-0">
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


interface Section {
    name: string
    search: string | null
    rows: number
}

type SectionName = 'recent' | 'ongoings' | 'released'

interface SectionState {
    loading: boolean
    items: Media[]
}

const baseState: SectionState = {
    loading: false,
    items: [],
}

@Component({
    components: { OneTimeAlert, HeadlineWithLinkButton, ErrorAlert, MediaCarousel, MediaCard, VirtualGrid, MediaList },
})
export default class IndexPage extends Vue {
    states: Record<SectionName, SectionState> = {
        recent: { ...baseState },
        ongoings: { ...baseState },
        released: { ...baseState },
    }
    error: ApiException | null = null
    mediaType: MediaType = 'anime'
    motd: string | null = null

    get dataProvider (): string {
        return configStore.dataProvider
    }

    get sections (): Record<SectionName, Section> {
        return {
            recent: {
                name: configStore.onlyOngoingsInRecent
                    ? this.$t('Pages.Index.RecentlyUpdatedOngoings')
                    : this.$t('Pages.Index.RecentlyUpdated'),
                search: this.searchLink('recentlyUpdatedSearchParams'),
                rows: 1,
            },
            ongoings: {
                name: this.$t('Pages.Index.TopOngoings'),
                search: this.searchLink('topOngoingsSearchParams'),
                rows: 2,
            },
            released: {
                name: this.$t('Pages.Index.TopReleased'),
                search: this.searchLink('topReleasedSearchParams'),
                rows: 2,
            },

        }
    }

    searchLink (featureName: keyof IDataProvider): string | null {
        let val = getProviderNow()[featureName]

        return val === null ? null : '/search?p=' + val
    }

    updateItems (): void {
        this.error = null

        this.states.recent.loading = true
        getRecentUpdates(this.mediaType).then((updates) => {
            this.states.recent.items = updates.map(update => (
                {
                    ...update.media,
                    statusText: this.$tc(update.media.type === 'anime'
                        ? 'Items.Media.AddedNthEpisode'
                        : 'Items.Media.AddedNthChapter', update.part),
                }
            ))
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.states.recent.loading = false
        })

        this.states.ongoings.loading = true
        getOngoings(this.mediaType).then((ongoings) => {
            this.states.ongoings.items = ongoings.items
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.states.ongoings.loading = false
        })

        this.states.released.loading = true
        getPopularReleased(this.mediaType).then((released) => {
            this.states.released.items = released.items
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.states.released.loading = false
        })

        getCurrentMotd().then((motd) => {
            this.motd = motd
        }).catch((err) => {
            this.error = err
        })
    }


    requestUpdate (): void {
        this.updateItems()
    }

    mounted (): void {
        this.updateItems()

        appStore.merge({
            showUpdateButton: true,
            showSearch: true,
        })
    }
}
</script>
