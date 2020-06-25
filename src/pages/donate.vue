<template>
    <div>
        <v-card>
            <v-card-text class="text--primary">
                <p
                    v-html="$t('Pages.Donate.Text')"
                />
            </v-card-text>
        </v-card>

        <v-card class="mt-2">
            <v-card-text>
                <v-row justify="center">
                    <v-btn
                        class="ma-2"
                        href="https://qiwi.com/n/tggdesu"
                        target="_blank"
                    >
                        {{ $t('Pages.Donate.Qiwi') }}
                    </v-btn>
                    <v-btn
                        class="ma-2"
                        href="https://money.yandex.ru/to/410014650864996"
                        target="_blank"
                    >
                        {{ $t('Pages.Donate.YM') }}
                    </v-btn>
                    <v-menu
                        :close-on-content-click="false"
                    >
                        <template #activator="{ on }">
                            <v-btn
                                class="ma-2"
                                v-on="on"
                            >
                                {{ $t('Pages.Donate.Sberbank') }}
                            </v-btn>
                        </template>

                        <v-card>
                            <v-card-text>
                                4276690015445056
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card class="mt-2">
            <v-card-text>
                <ErrorAlert :error="error" />

                <v-tabs
                    v-model="tab"
                    class="mb-2"
                >
                    <v-tab>{{ $t('Pages.Donate.History') }}</v-tab>
                    <v-tab>{{ $t('Pages.Donate.Top') }}</v-tab>
                </v-tabs>

                <v-tabs-items v-model="tab">
                    <v-tab-item>
                        <p v-if="!loading">
                            <span
                                :class="total > 0 ? 'success--text' : 'error--text'"
                                v-text="$tc('Pages.Donate.Left', total)"
                            />
                            <template v-if="total > 0">
                                {{ $tc('Pages.Donate.WillLast', months) }}
                            </template>
                        </p>

                        <v-timeline dense>
                            <v-timeline-item
                                v-for="(it, i) in timeline"
                                :key="i"
                                :color="(it.sign === '+' ? 'green' : 'red') + ' darken-2'"
                            >
                                <template #icon>
                                    <span
                                        class="white--text"
                                        v-text="it.sign"
                                    />
                                </template>

                                <div
                                    class="caption font-weight-bold"
                                    v-text="it.date"
                                />

                                <div class="body-1 text--primary">
                                    <span
                                        :class="it.sign === '+' ? 'success--text' : 'error--text'"
                                        class="font-weight-bold"
                                    >
                                        {{ it.sign }}{{ it.value }}₽
                                    </span>
                                    {{ it.comment }}
                                </div>
                            </v-timeline-item>
                        </v-timeline>
                    </v-tab-item>

                    <v-tab-item>
                        <v-list>
                            <v-list-item
                                v-for="(u, i) in top"
                                :key="i"
                            >
                                <v-list-item-avatar
                                    :color="i === 0 ? 'yellow darken-2' : i === 1 ? 'grey lighten-3' : i === 2 ? 'deep-orange darken-2' : 'transparent'"
                                    class="align-center justify-center"
                                    v-text="i + 1"
                                />
                                <v-list-item-title>
                                    <UserChip
                                        :user="u"
                                        full
                                    />
                                    ({{ u.donated }}₽)
                                </v-list-item-title>
                            </v-list-item>

                            <NoItemsPlaceholder
                                v-if="top.length === 0"
                                :text="$t('Common.Collection.NoItemsFound')"
                            />
                        </v-list>
                    </v-tab-item>
                </v-tabs-items>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts">
import { Component, Watch } from 'vue-property-decorator'
import LoadableVue from '@/components/common/LoadableVue'
import { appStore } from '@/store'
import { ApiException } from '@/types/api'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { getDonations, getTopDonators } from '@/api/misc'
import { User } from '@/types/user'
import UserChip from '@/components/user/UserChip.vue'
import { Donation } from '@/types/misc'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'

const SERVER_COST = 350

@Component({
    components: { NoItemsPlaceholder, UserChip, ErrorAlert }
})
export default class DonatePage extends LoadableVue {
    error: ApiException | null = null

    timeline: Donation[] = []
    top: User[] = []
    tab = 0

    get months (): number {
        if (this.total <= 0) return 0
        return Math.floor(this.total / SERVER_COST)
    }

    get total (): number {
        return this.timeline.reduce((a, b) => a + (b.sign === '-' ? -1 : 1) * b.value, 0)
    }

    updateTimeline (): Promise<void> {
        return getDonations().then((items) => {
            this.timeline = items
        })
    }

    updateTop (): Promise<void> {
        return getTopDonators().then((top) => {
            this.top = top
        })
    }

    @Watch('tab')
    tabChanged (): void {
        if (this.tab === 1 && this.top.length === 0) {
            this.requestUpdate()
        }
    }

    requestUpdate (): void {
        this.error = null
        this.loading = true

        let prom: Promise<void>
        if (this.tab === 0) {
            prom = this.updateTimeline()
        } else {
            prom = this.updateTop()
        }

        prom.catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    mounted (): void {
        appStore.merge(({
            showUpdateButton: true,
            pageTitle: this.$t('Pages.Donate.Name')
        }))

        this.requestUpdate()
    }
}
</script>

<style>

</style>
