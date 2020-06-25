<template>
    <v-menu
        :close-on-content-click="false"
        v-bind="$attrs"
    >
        <template #activator="{ on }">
            <slot :on="on" />
        </template>

        <v-list>
            <v-subheader
                v-text="$t('Pages.Viewer.NotificationsTitle')"
            />
            <v-list-item
                v-for="(it, i) in topics"
                :key="i"
                class="d-flex flex-row"
            >
                <v-list-item-title
                    v-text="it.name"
                />
                <v-spacer />
                <v-switch
                    :ref="it.topic"
                    :disabled="loading !== false"
                    :input-value="subscribed(it.topic)"
                    :loading="loading === it.topic"
                    class="ml-2"
                    @change="toggle(it.topic, $event)"
                />
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ExtendedSingleTranslationData } from '@/types/translation'
import { subscribeToTopics, unsubscribeFromTopics } from '@/api/notifications'
import { MediaType } from '@/types/media'
import { authStore } from '@/store'
import { iziToastError } from '@/plugins/izitoast'
import { formatAnimeTranslationMeta } from '@/utils/notification-utils'

@Component({})
export default class TranslationSubscribeMenu extends Vue {
    @Prop({ required: true }) translation!: ExtendedSingleTranslationData | null
    @Prop({ required: true }) mediaType!: MediaType
    @Prop({ required: true }) mediaId!: number

    loading: false | string = false

    get topics (): any[] {
        let ret = [
            {
                topic: `tr:${this.mediaType}:${this.mediaId}`,
                name: this.$t('Pages.Viewer.NotificationNewEpisodes')
            }
        ]
        if (this.translation) {
            ret.push({
                topic: `tr:${this.mediaType}:${this.mediaId}:${this.translation.author.lang}:${this.translation.author.kind}`,
                name: this.$t('Pages.Viewer.NotificationNewEpisodesMeta', { meta: this.i18nMeta })
            })
        }
        return ret
    }

    get i18nMeta (): string {
        if (!this.translation) return ''

        return formatAnimeTranslationMeta({
            kind: this.translation.author.kind,
            lang: this.translation.author.lang
        })
    }

    subscribed (topic: string): boolean {
        return (authStore.user?.sub?.indexOf(topic) ?? -1) > -1
    }

    toggle (topic: string, val: boolean): void {
        let func = val ? subscribeToTopics : unsubscribeFromTopics

        this.loading = topic
        func([topic]).then((topics) => {
            authStore.updateUser({
                sub: topics
            })
        }).catch((err) => {
            iziToastError(err);

            // fix so switch goes back to prev value if failed
            (this.$refs[topic] as any)[0].lazyValue = !val
        }).finally(() => {
            this.loading = false
        })
    }
}
</script>

<style>

</style>
