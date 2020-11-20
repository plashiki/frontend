<template>
    <div class="cards-page-container">
        <MediaList
            :items="items"
            :no-placeholder="hasMore"
        >
            <template #buttons>
                <v-chip-group
                    :show-arrows="$r12s.screenWidth > 600"
                    center-active
                    class="text-center"
                    style="max-width: 72%"
                >
                    <v-chip
                        v-for="it in presets"
                        :key="it.uid"
                        :class="currentPreset && currentPreset.uid === it.uid ? 'primary--text v-chip--active' : ''"
                        :close="!it.default"
                        ripple
                        @click="loadPreset(it)"
                        @click:close="removePreset(it)"
                    >
                        {{ it.$t ? $t(it.name) : it.name }}
                    </v-chip>
                </v-chip-group>
            </template>

            <template #append>
                <v-progress-linear
                    v-if="hasMore"
                    ref="loader"
                    v-intersect="(_, __, v) => v && endReached()"
                    class="mt-2"
                    indeterminate
                />

                <ErrorAlert :error="error">
                    &nbsp;
                    <span
                        class="link-like primary--text"
                        @click.prevent="retry"
                        v-text="$t('Common.Action.TryAgain')"
                    />
                </ErrorAlert>
            </template>
        </MediaList>

        <v-bottom-sheet
            v-model="filtersVisible"
            eager
            inset
            scrollable
        >
            <template #activator="{ on }">
                <v-btn
                    color="primary"
                    :disabled="filterComponent == null"
                    bottom
                    fab
                    fixed
                    right
                    v-on="on"
                >
                    <v-icon>mdi-filter</v-icon>
                </v-btn>
            </template>

            <v-sheet class="layout column">
                <v-card-title>
                    {{ $t('Pages.Search.Filters') }}

                    <v-spacer />

                    <span
                        v-if="currentPreset !== null"
                        class="mx-2 body-2"
                    >
                        {{ currentPreset.$t ? $t(currentPreset.name) : currentPreset.name }}
                    </span>

                    <v-menu
                        v-else
                        v-model="savePopup"
                        :close-on-content-click="false"
                        left
                        top
                    >
                        <template #activator="{ on }">
                            <v-btn
                                class="mx-2"
                                icon
                                v-on="on"
                            >
                                <v-icon>
                                    mdi-content-save
                                </v-icon>
                            </v-btn>
                        </template>

                        <v-card>
                            <v-card-text>
                                <v-text-field
                                    v-model="presetName"
                                    :label="$t('Pages.Search.FilterName')"
                                    append-outer-icon="mdi-check"
                                    dense
                                    hide-details
                                    outlined
                                    @click:append-outer="savePreset"
                                    @keyup.enter="savePreset"
                                />
                            </v-card-text>
                        </v-card>
                    </v-menu>

                    <v-btn
                        v-tooltip="$t('Pages.Viewer.ResetFilters')"
                        :disabled="currentPreset ? currentPreset.uid === defaultPresets[0].uid : false"
                        icon
                        @click="resetFilters"
                    >
                        <v-icon>
                            mdi-backup-restore
                        </v-icon>
                    </v-btn>
                </v-card-title>
                <v-divider />

                <v-card-text class="overflow-y-auto">
                    <component
                        :is="filterComponent"
                        v-if="filterComponent !== null"
                        ref="filters"
                        @update="filtersUpdated"
                    />
                    <NoItemsPlaceholder
                        v-else
                        :text="$t('Pages.Search.NoFilters')"
                    />
                </v-card-text>

                <v-divider />
                <v-card-actions>
                    <v-select
                        v-model="sortMode"
                        :items="sorters"
                        dense
                        hide-details
                        outlined
                    >
                        <template #append>
                            <v-icon>mdi-sort-variant</v-icon>
                        </template>
                        <template #item="{ item }">
                            <v-list-item-avatar
                                v-if="item.icon"
                                size="24"
                                tile
                            >
                                <v-icon>
                                    {{ item.icon }}
                                </v-icon>
                            </v-list-item-avatar>
                            <v-list-item-title>
                                {{ $t(item.text) }}
                            </v-list-item-title>
                        </template>

                        <template #selection="{ item }">
                            <span class="text-truncate">
                                {{ $t(item.text) }}
                            </span>
                        </template>
                    </v-select>
                    <v-btn
                        class="ml-2"
                        color="primary"
                        depressed
                        height="40"
                        @click="filtersVisible = false"
                    >
                        {{ $t('Common.Form.Apply') }}
                    </v-btn>
                </v-card-actions>
            </v-sheet>
        </v-bottom-sheet>
    </div>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator'
import { appStore, configStore } from '@/store'
import { getSearchProviderNow, ISearchProvider } from '@/api/search'
import { Media, MediaType } from '@/types/media'
import MediaList from '@/components/media/MediaList.vue'
import { ApiException } from '@/types/api'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { VueConstructor } from 'vue'
import { AnyKV } from '@/types'
import { deepEqual } from '@/utils/object-utils'
import { isElementInViewport } from '@/utils/helpers'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'

@Component({
    components: { NoItemsPlaceholder, ErrorAlert, MediaList }
})
export default class SearchPage extends Vue {
    @Ref() filters!: Vue

    mediaType: MediaType = 'anime'
    items: Media[] = []
    error: ApiException | null = null
    hasMore = true
    reqId = 0

    sortMode = ''
    filtersVisible = false
    filtering: AnyKV = {}

    defaultPresets: AnyKV[] = []

    savePopup = false
    presetName = ''

    searchAnchor: any = null

    get currentPreset (): AnyKV | null {
        for (let it of this.presets) {
            if (deepEqual(it, this.filtering, true, ['name', '$t', 'uid', 'default'])) {
                return it
            }
        }
        return null
    }

    get presets (): AnyKV[] {
        return [...this.defaultPresets, ...(configStore.searchPresets[configStore.dataProvider] ?? [])]
    }

    get sorters (): AnyKV[] {
        return this.provider.sorters()
    }

    get filterComponent (): VueConstructor | null {
        return this.provider.filterComponent()
    }

    get provider (): ISearchProvider {
        return getSearchProviderNow()
    }

    @Watch('savePopup')
    savePopupVisibilityChanged (val: boolean): void {
        if (val) {
            this.presetName = ''
        }
    }

    @Watch('sortMode')
    filtersUpdated (): void {
        let filters = this.provider.getCurrentFilters(this.filters)
        filters.sortMode = this.sortMode
        this.filtering = filters
    }

    @Watch('provider')
    providerChanged (): void {
        const presets = this.provider.getDefaultPresets(this.$route)

        this.defaultPresets = presets.map((it, i) => {
            it.uid = i
            it.default = true
            return it
        })

        this.resetFilters()
    }

    savePreset (): void {
        this.savePopup = false
        configStore.addSearchPreset({
            provider: configStore.dataProvider,
            preset: {
                ...this.filtering,
                name: this.presetName,
                uid: Date.now()
            }
        })
    }

    loadPreset (it: AnyKV): void {
        let cfg = this.provider.applyPreset(it as any, this.filters)
        this.sortMode = cfg.sortMode
        this.reset()
    }

    removePreset (it: AnyKV): void {
        configStore.removeSearchPreset({
            provider: configStore.dataProvider,
            uid: it.uid
        })
    }

    endReached (): void {
        // having track of subsequent requests.
        // if multiple simultaneous requests exist only one which started last will do smth
        let reqId = ++this.reqId
        this.provider.execute(appStore.searchInput, this.mediaType, this.filters, this.sortMode, this.searchAnchor)
            .then(({ items, next }) => {
                if (reqId === this.reqId) {
                    this.items.push(...items)
                    this.searchAnchor = next
                    this.hasMore = next != null

                    this.$nextTick(() => {
                        if (this.$refs.loader && isElementInViewport(this.$refs.loader as any)) {
                            // uwu
                            this.endReached()
                        }
                    })
                }
            })
            .catch((err) => {
                if (reqId === this.reqId) {
                    this.error = err
                    this.hasMore = false
                }
            })
    }

    retry (): void {
        this.error = null
        this.hasMore = true
    }

    resetFilters (): void {
        this.sortMode = this.defaultPresets[0].sortMode
        this.provider.applyPreset(this.defaultPresets[0] as any, this.filters)
    }

    @Watch('filtersVisible')
    filtersVisibilityChanged (val: boolean): void {
        if (!val) {
            this.reset()
        }
    }

    @Watch('$route')
    reset (): void {
        this.items = []
        this.error = null
        this.hasMore = true
        this.searchAnchor = null

        let input = (Array.isArray(this.$route.query.q) ? this.$route.query.q[0] : this.$route.query.q) ?? ''
        if (input !== appStore.searchInput) {
            appStore.merge({
                searchInput: input
            })
        }
    }

    mounted (): void {
        appStore.merge({
            showSearch: true,
            searchInput: (Array.isArray(this.$route.query.q) ? this.$route.query.q[0] : this.$route.query.q) ?? ''
        })

        this.providerChanged()

        if (this.$route.query.p) {
            try {
                let p = Array.isArray(this.$route.query.p) ? this.$route.query.p[0] : this.$route.query.p
                let params = JSON.parse(p ?? '')
                this.loadPreset(params)
                this.$router.replace({
                    query: {
                        ...this.$route.query,
                        p: undefined
                    }
                })
            } catch (e) {
                // nop
            }

        }
    }
}
</script>

<style>

</style>
