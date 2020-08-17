<template>
    <div>
        <NoItemsPlaceholder
            v-if="loading || !isAuthenticated || topics.length === 0"
            :text="isAuthenticated ? loading ? $t('Common.Loading') : $t('Pages.Settings.NoTopics') : $t('Common.NeedAuth')"
        />
        <v-list>
            <v-list-item
                v-for="it in topics"
                :key="it.name"
            >
                <v-list-item-title v-text="it.display" />
                <v-list-item-action>
                    <v-btn
                        v-tooltip="$t('Pages.Settings.Unsubscribe')"
                        small
                        icon
                        :disabled="unsubscribing !== false"
                        :loading="unsubscribing === it.name"
                        @click="unsubscribe(it.name)"
                    >
                        <v-icon small>
                            mdi-close
                        </v-icon>
                    </v-btn>
                </v-list-item-action>
            </v-list-item>
        </v-list>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'
import { authStore } from '@/store'
import { uniqueBy } from '@/utils/object-utils'
import { getMediaNames } from '@/api/media'
import { MediaId, NameMeta } from '@/types/media'
import { iziToastError } from '@/plugins/izitoast'
import { getPreferredName } from '@/utils/media-utils'
import { formatAnimeTranslationMeta } from '@/utils/notification-utils'
import { unsubscribeFromTopics } from '@/api/notifications'

interface TopicMeta {
    display: string
    name: string
}

@Component({
    components: { NoItemsPlaceholder }
})
export default class NotificationsTab extends Vue {
    unsubscribing: string | false = false
    loading = true
    names: Record<MediaId, NameMeta> = {}

    get isAuthenticated (): boolean {
        return authStore.authenticated
    }

    get topics (): TopicMeta[] {
        if (this.loading) return []

        return authStore.user?.sub.map((name) => {
            if (name === 'mod:tr') {
                return {
                    display: this.$t('Pages.Moderation.NewTranslations'),
                    name
                }
            }
            if (name === 'mod:rep') {
                return {
                    display: this.$t('Pages.Moderation.NewReports'),
                    name
                }
            }

            let parts = name.split(':')
            if (parts[0] === 'tr' && parts[1] === 'anime' && parts[2] in this.names) {
                if (parts.length === 3) {
                    return {
                        display: this.$t('Pages.Settings.NotificationNewEpisodesOf', {
                            name: getPreferredName(this.names[parts[2]])
                        }),
                        name
                    }
                }
                if (parts.length === 5) {
                    return {
                        display: this.$t('Pages.Settings.NotificationNewEpisodesOfMeta', {
                            name: getPreferredName(this.names[parts[2]]),
                            meta: formatAnimeTranslationMeta({
                                lang: parts[3] as any,
                                kind: parts[4] as any
                            })
                        }),
                        name
                    }
                }
            }

            return {
                display: name,
                name
            }
        }) ?? []
    }

    unsubscribe (topic: string): void {
        this.unsubscribing = topic

        unsubscribeFromTopics([topic])
            .then((topics) => {
                authStore.setUser({
                    ...authStore.user!,
                    sub: topics
                })
            })
            .catch(iziToastError)
            .finally(() => {
                this.unsubscribing = false
            })
    }

    mounted (): void {
        if (authStore.user) {
            let animes = uniqueBy(
                authStore.user.sub
                    .filter(i => i.startsWith('tr:anime:'))
                    .map(i => i.split(':')[2])
            )
            // let mangas = new Set()

            getMediaNames(animes, 'anime')
                .then((res) => {
                    this.names = res
                })
                .catch(iziToastError)
                .finally(() => {
                    this.loading = false
                })
        }
    }
}
</script>

<style>

</style>
