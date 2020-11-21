<template>
    <div class="cards-page-container">
        <v-card class="mb-3">
            <v-card-text>
                <v-tabs v-model="tab">
                    <v-tab>{{ $t('Pages.Moderation.Translations') }}</v-tab>
                    <v-tab>{{ $t('Pages.Moderation.Reports') }}</v-tab>
                    <v-tab>{{ $t('Pages.Moderation.ComplexReports') }}</v-tab>
                    <v-tab>{{ $t('Pages.Moderation.Options') }}</v-tab>
                </v-tabs>
            </v-card-text>
        </v-card>
        <v-tabs-items
            v-model="tab"
            touchless
        >
            <v-tab-item>
                <v-simple-card class="page-card">
                    <TranslationsTable
                        ref="translations"
                        :medias="medias"
                        moderator
                    />
                </v-simple-card>
            </v-tab-item>
            <v-tab-item>
                <v-simple-card class="page-card">
                    <ReportsTable
                        ref="reports"
                        moderator
                        @complex="reportsc && reportsc.update()"
                    />
                </v-simple-card>
            </v-tab-item>
            <v-tab-item>
                <v-simple-card class="page-card">
                    <ReportsTable
                        ref="reportsc"
                        moderator
                        for-complex
                    />
                </v-simple-card>
            </v-tab-item>
            <v-tab-item>
                <v-simple-card>
                    <v-row>
                        <v-col>
                            <div class="text-center mb-2">
                                <div class="headline">
                                    {{ $t('Pages.Moderation.Stats') }}

                                    <v-btn
                                        :loading="statsLoading"
                                        class="ml-2"
                                        color="primary"
                                        outlined
                                        rounded
                                        small
                                        @click="loadStats"
                                    >
                                        {{ $t('Common.Load') }}
                                    </v-btn>
                                </div>
                            </div>

                            <div v-if="stats">
                                {{ $t('Pages.Moderation.YourStats') }}
                                <ul>
                                    <li v-html="$tc('Pages.Moderation.Accepted', stats.accepted)" />
                                    <li v-html="$tc('Pages.Moderation.Declined', stats.declined)" />
                                    <li v-html="$tc('Pages.Moderation.ReportsCount', stats.reports)" />
                                    <li v-html="$tc('Pages.Moderation.EditedCount', stats.edited)" />
                                    <li v-html="$tc('Pages.Moderation.DeletedCount', stats.deleted)" />
                                </ul>
                            </div>

                            <v-divider class="my-2" />

                            <div class="text-center headline">
                                {{ $t('Items.Notification.NamePlural') }}
                            </div>
                            <v-row>
                                <v-col
                                    cols="12"
                                    sm="6"
                                >
                                    <v-switch
                                        ref="mod:tr"
                                        :disabled="subscriptionLoading !== false"
                                        :input-value="subscribed('mod:tr')"
                                        :loading="subscriptionLoading === 'mod:tr'"
                                        :label="$t('Pages.Moderation.NewTranslations')"
                                        @change="toggleSubscription('mod:tr', $event)"
                                    />
                                </v-col>
                                <v-col
                                    cols="12"
                                    sm="6"
                                >
                                    <v-switch
                                        ref="mod:rep"
                                        :disabled="subscriptionLoading !== false"
                                        :input-value="subscribed('mod:rep')"
                                        :loading="subscriptionLoading === 'mod:rep'"
                                        :label="$t('Pages.Moderation.NewReports')"
                                        @change="toggleSubscription('mod:rep', $event)"
                                    />
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                </v-simple-card>
            </v-tab-item>
        </v-tabs-items>
    </div>
</template>

<script lang="ts">
import { Component, Ref } from 'vue-property-decorator'
import LoadableVue from '@/components/common/LoadableVue'
import { appStore, authStore } from '@/store'
import TranslationsTable from '@/components/moderation/TranslationsTable.vue'
import { Media, MediaId } from '@/types/media'
import ReportsTable from '@/components/moderation/ReportsTable.vue'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import { ModerationStatistics } from '@/types/moderation'
import { getModerationStatistics } from '@/api/moderation'
import { iziToastError } from '@/plugins/izitoast'
import { subscribeToTopics, unsubscribeFromTopics } from '@/api/notifications'

@Component({
    components: { VSimpleCard, ReportsTable, TranslationsTable }
})
export default class ModerationPage extends LoadableVue {
    @Ref() reports!: any
    @Ref() reportsc!: any
    @Ref() translations!: any

    tab = 0
    medias: Record<MediaId, Media> = {}

    statsLoading = false
    stats: ModerationStatistics | null = null

    subscriptionLoading: string | false = false

    subscribed (topic: string): boolean {
        return (authStore.user?.sub?.indexOf(topic) ?? -1) > -1
    }

    toggleSubscription (topic: string, val: boolean): void {
        let func = val ? subscribeToTopics : unsubscribeFromTopics

        this.subscriptionLoading = topic
        func([topic]).then((topics) => {
            authStore.updateUser({
                sub: topics
            })
        }).catch((err) => {
            iziToastError(err);

            // fix so switch goes back to prev value if failed
            (this.$refs[topic] as any).lazyValue = !val
        }).finally(() => {
            this.subscriptionLoading = false
        })
    }

    loadStats (): void {
        this.statsLoading = true
        getModerationStatistics()
            .then((stats) => {
                this.stats = stats
            })
            .catch(iziToastError)
            .finally(() => {
                this.statsLoading = false
            })
    }

    requestUpdate (): void {
        if (this.tab === 0) this.translations.update()
        if (this.tab === 1) this.reports.update()
        if (this.tab === 2) this.reportsc.update()
    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.Moderation.Name'),
            showUpdateButton: true
        })
    }
}
</script>

<style>

</style>
