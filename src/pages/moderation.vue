<template>
    <div>
        <v-card class="mb-3">
            <v-card-text>
                <v-tabs v-model="tab">
                    <v-tab>{{ $t('Pages.Moderation.Translations') }}</v-tab>
                    <v-tab>{{ $t('Pages.Moderation.Reports') }}</v-tab>
                    <v-tab>{{ $t('Pages.Moderation.Options') }}</v-tab>
                </v-tabs>
            </v-card-text>
        </v-card>
        <v-tabs-items
            v-model="tab"
            touchless
        >
            <v-tab-item>
                <v-simple-card>
                    <TranslationsTable
                        :medias="medias"
                        moderator
                        ref="translations"
                    />
                </v-simple-card>
            </v-tab-item>
            <v-tab-item>
                <v-simple-card>
                    <ReportsTable
                        moderator
                        ref="reports"
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
                                        @click="loadStats"
                                        class="ml-2"
                                        color="primary"
                                        outlined
                                        rounded
                                        small
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
                                        :disabled="subscriptionLoading !== false"
                                        :input-value="subscribed('mod:tr')"
                                        :loading="subscriptionLoading === 'mod:tr'"
                                        @change="toggleSubscription('mod:tr', $event)"
                                        label="Новые переводы"
                                        ref="mod:tr"
                                    />
                                </v-col>
                                <v-col
                                    cols="12"
                                    sm="6"
                                >
                                    <v-switch
                                        :disabled="subscriptionLoading !== false"
                                        :input-value="subscribed('mod:rep')"
                                        :loading="subscriptionLoading === 'mod:rep'"
                                        @change="toggleSubscription('mod:rep', $event)"
                                        label="Новые жалобы"
                                        ref="mod:rep"
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
        (this.tab === 0 ? this.translations : this.reports).update()
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
