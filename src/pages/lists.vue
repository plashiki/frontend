<template>
    <div>
        <v-row class="flex-nowrap">
            <v-col>
                <template
                    v-if="selectedState"
                >
                    <MediaList
                        :items="selectedState.items"
                        :no-placeholder="!!(selectedState.more || selectedState.error)"
                        :text-class="{'pa-1': $r12s.screenWidth < 480}"
                        :actions="selected === '$recent'"
                    >
                        <template #buttons>
                            <HeadlineWithLinkButton
                                :class="{ 'subtitle-2': $r12s.screenWidth < 480 }"
                                :show-button="selected[0] !== '$'"
                                :text="selectedText"
                                class="my-2"
                            />
                        </template>

                        <template #buttons-right>
                            <v-btn
                                v-if="selected === '$recent'"
                                v-tooltip="$t('Common.Clear')"
                                class="ma-1"
                                icon
                                @click="clearRecent"
                            >
                                <v-icon>
                                    mdi-delete-sweep
                                </v-icon>
                            </v-btn>

                            <v-btn
                                v-show="$r12s.screenWidth >= 380"
                                :disabled="selectedState.loading"
                                class="ma-1"
                                icon
                                @click="resetSelected"
                            >
                                <v-icon>
                                    mdi-refresh
                                </v-icon>
                            </v-btn>
                        </template>

                        <template #append>
                            <v-progress-linear
                                v-if="selectedState.more"
                                ref="loader"
                                v-intersect="(_, __, v) => v && endReached()"
                                class="mt-2"
                                indeterminate
                            />

                            <ErrorAlert :error="selectedState.error">
                                &nbsp;
                                <span
                                    class="link-like primary--text"
                                    @click.prevent="retrySelected"
                                    v-text="$t('Common.Action.TryAgain')"
                                />
                            </ErrorAlert>
                        </template>

                        <template #actions="{ item }">
                            <v-btn
                                v-if="selected === '$recent'"
                                icon
                                @click.stop.prevent="deleteFromRecent(item.type, item.id)"
                                @mousedown.stop
                                @touchstart.native.stop
                            >
                                <v-icon>
                                    mdi-delete
                                </v-icon>
                            </v-btn>
                        </template>
                    </MediaList>
                </template>
            </v-col>
            <v-col
                :class="{'pl-0': $r12s.screenWidth < 480}"
                :style="{'min-width': $r12s.screenWidth < 480 ? '72px' : '96px' }"
                cols="1"
                md="3"
            >
                <v-card style="position:sticky; top: 76px">
                    <v-card-text :class="{'pa-1': $r12s.screenWidth < 480}">
                        <template v-for="(p, i) in ui">
                            <div
                                v-if="p.group !== undefined && $r12s.screenWidth >= 960"
                                :key="i"
                                class="grey--text caption my-2"
                            >
                                {{ $t(p.group) }}
                            </div>

                            <v-divider
                                v-else-if="p.divider !== undefined && $r12s.screenWidth < 960"
                                :key="i"
                                class="my-2"
                            />

                            <v-btn
                                v-else-if="p.id"
                                :key="i"
                                :class="{
                                    'v-btn--active primary--text': selected === p.id,
                                    'justify-start': $r12s.screenWidth >= 960
                                }"
                                :disabled="p.auth !== false && !authenticated"
                                block
                                class="my-1"
                                small
                                text
                                @click="selected = p.id"
                            >
                                <v-icon
                                    :left="$r12s.screenWidth >= 960"
                                    :small="$r12s.screenWidth < 960"
                                >
                                    {{ p.icon }}
                                </v-icon>
                                <template v-if="$r12s.screenWidth >= 960">
                                    {{ $t(p.text) }}
                                </template>
                            </v-btn>
                        </template>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import MediaList from '@/components/media/MediaList.vue'
import { appStore, authStore, configStore } from '@/store'
import HeadlineWithLinkButton from '@/components/common/HeadlineWithLinkButton.vue'
import { Media, MediaType } from '@/types/media'
import { ApiException, PaginatedData } from '@/types/api'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { getMediaInList, getMedias, getRecommendations, getMediaUpdates } from '@/api/media'
import { isElementInViewport, nop } from '@/utils/helpers'
import { Route } from 'vue-router'

interface UiState {
    error: ApiException | null
    more: boolean
    loading: boolean
    items: Media[]

    next?: any
}

@Component({
    components: { ErrorAlert, HeadlineWithLinkButton, MediaList }
})
export default class ListsPage extends Vue {
    ui = Object.freeze([
        {
            group: 'Pages.Lists.GroupSpecial'
        },
        {
            icon: 'mdi-update',
            text: 'Pages.Lists.Recent',
            id: '$recent',
            auth: false
        },
        {
            icon: 'mdi-plus-one',
            text: 'Pages.Lists.Updated',
            id: '$updated'
        },
        {
            icon: 'mdi-comment-eye-outline',
            text: 'Pages.Lists.Recommendations',
            id: '$recommendations'
        },
        {
            group: 'Pages.Lists.GroupGeneral',
            divider: true
        },
        {
            icon: 'mdi-calendar-text',
            text: 'Items.UserRate.StatusText.planned',
            id: 'planned'
        },
        {
            icon: 'mdi-play-circle-outline',
            text: 'Items.UserRate.StatusText.in_progress',
            id: 'in_progress'
        },
        {
            icon: 'mdi-check',
            text: 'Items.UserRate.StatusText.completed',
            id: 'completed'
        },
        {
            icon: 'mdi-clock-outline',
            text: 'Items.UserRate.StatusText.on_hold',
            id: 'on_hold'
        },
        {
            icon: 'mdi-close',
            text: 'Items.UserRate.StatusText.dropped',
            id: 'dropped'
        }
    ])

    selected = ''
    state: Record<string, UiState> = {}

    mediaType: MediaType = 'anime'


    get authenticated (): boolean {
        return authStore.authenticated
    }

    get selectedState (): UiState | null {
        return this.state[this.selected] ?? null
    }

    get selectedText (): string {
        for (let i of this.ui) {
            if (i.id === this.selected) {
                return this.$t(i.text)
            }
        }
        return ''
    }

    @Watch('selected')
    selectionChanged (val: string, old: string): void {
        const state = this.state[val]
        const oldState = this.state[old]

        if (state && oldState && state.items.length === oldState.items.length && state.more && oldState.more) {
            this.endReached()
        }
        this.$router.push({ name: 'lists', hash: `#${val}` }).catch(nop)
    }

    @Watch('$route')
    routeChanged (val: Route, old?: Route) {
        if (val.hash.length > 1 && val.hash !== old?.hash) {
            const hash = val.hash.substr(1)
            if (hash in this.state) {
                this.selected = hash
            }
        }
    }

    @Watch('authenticated')
    authenticationChanged (val: boolean): void {
        if (!val) {
            this.selected = '$recent'
            this.state = {}
            this.initState()
        }
    }

    deleteFromRecent (type: MediaType, id: number) {
        configStore.deleteRecentMedia({ type, id })
        this.state.$recent.items = this.state.$recent.items.filter(i => i.type !== type || i.id !== id)
    }

    clearRecent (): void {
        configStore.set({
            key: 'recentMedias',
            value: {
                anime: [],
                manga: []
            }
        })
        this.resetSelected()
    }

    endReached (): void {
        let state = this.selectedState
        let selected = this.selected
        let prom: Promise<PaginatedData<Media>> | null = null
        if (!state || !state.more) return

        if (selected[0] === '$') {
            if (selected === '$recent') {
                if (!configStore.recentMedias[this.mediaType].length) {
                    state.more = false
                } else {
                    prom = getMedias(configStore.recentMedias[this.mediaType], this.mediaType).then(items => ({ items }))
                }
            }
            if (selected === '$recommendations') {
                prom = getRecommendations(this.mediaType, state.next)
            }
            if (selected === '$updated') {
                prom = getMediaUpdates(this.mediaType)
                    .then((res) => (
                        {
                            items: res.items.map(it => {
                                it.media.statusText = '+ ' + this.$tc(this.mediaType === 'anime'
                                    ? 'Items.Media.NEpisodes'
                                    : 'Items.Media.NChapters', it.part)
                                return it.media
                            }),
                            next: res.next
                        }
                    ))
            }
        } else {
            prom = getMediaInList(selected as any, this.mediaType, state.next)
        }

        if (!prom) return
        prom.then(({ items, next }) => {
            state!.items.push(...items)
            state!.next = next
            state!.more = next != null

            this.$nextTick(() => {
                if (this.$refs.loader && isElementInViewport(this.$refs.loader as any)) {
                    // uwu
                    this.endReached()
                }
            })
        }).catch((err) => {
            state!.error = err
            state!.more = false
        })
    }

    retrySelected (): void {
        if (!this.selectedState) return

        this.selectedState.error = null
        this.selectedState.more = true
    }

    resetSelected (): void {
        if (!this.selectedState) return

        this.selectedState.error = null
        this.selectedState.next = undefined
        this.selectedState.items = []
        this.selectedState.more = true
    }

    initState (): void {
        this.ui.forEach((it) => {
            if (it.id) {
                this.$set(this.state, it.id, {
                    more: true,
                    loading: false,
                    items: [],
                    error: null
                })
            }
        })
    }

    mounted (): void {
        if (authStore.authenticated && configStore.components.lastList) {
            this.selected = configStore.components.lastList
        } else {
            this.selected = '$recent'
        }

        this.initState()
        appStore.merge({
            pageTitle: this.$t('Pages.Lists.Name'),
            showSearch: true,
        })
        this.routeChanged(this.$route)
    }
}
</script>

<style>

</style>
