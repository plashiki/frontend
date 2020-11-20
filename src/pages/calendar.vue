<template>
    <div class="cards-page-container">
        <ErrorAlert :error="error" />

        <v-fade-transition v-if="items.length > 0 || loading">
            <div v-if="items.length > 0">
                <v-card
                    v-for="day in days"
                    :key="day.name"
                    class="mb-2 page-card"
                >
                    <v-card-title>
                        {{ day.name }}
                    </v-card-title>
                    <v-card-text>
                        <MediaCarousel
                            :items="day.medias"
                        />
                    </v-card-text>
                </v-card>
            </div>
        </v-fade-transition>

        <v-card
            v-show="!loading && items.length === 0"
            class="py-10 align-center"
        >
            <v-card-text>
                <v-row
                    align="center"
                    class="grey--text body-2 font-weight-bold"
                    justify="center"
                    style="height: 150px"
                >
                    {{ $t('Common.Collection.NoItemsFound') }}
                </v-row>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import { appStore } from '@/store'
import { CalendarEntry, Media } from '@/types/media'
import LoadableVue from '@/components/common/LoadableVue'
import { groupBy } from '@/utils/object-utils'
import { formatDistanceStrict, formatRelative } from 'date-fns'
import { dateFnLocale, dateFnsDropTime } from '@/plugins/vue-i18n'
import MediaCarousel from '@/components/media/MediaCarousel.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ApiException } from '@/types/api'
import { getCalendar } from '@/api/media'

interface CalendarDay {
    name: string
    medias: Media[]
}

@Component({
    components: { ErrorAlert, MediaCarousel }
})
export default class CalendarPage extends LoadableVue {
    error: ApiException | null = null
    items: CalendarEntry[] = []

    now = new Date()
    timeInterval: number | null = null

    get today (): Date {
        let r = new Date(this.now)
        r.setHours(0, 0, 0, 0)
        return r
    }

    get days (): CalendarDay[] {
        let grouped = groupBy(this.items, it => it.ts.toDateString())
        let ret: CalendarDay[] = []

        Object.values(grouped).forEach((entries) => {
            let day = new Date(entries[0].ts)
            day.setHours(0, 0, 0, 0)

            if (day < this.today) return

            let name = dateFnsDropTime(formatRelative(day, this.today, {
                locale: dateFnLocale()
            }))
            // capitalize
            name = name[0].toUpperCase() + name.substr(1)

            ret.push({
                name,
                medias: entries.map(it => {
                    it.media.statusText2 = this.$tc('Items.Media.NthEpisode', it.part)
                    it.media.statusText = formatDistanceStrict(it.ts, this.now, {
                        locale: dateFnLocale(),
                        addSuffix: true
                    })

                    return it.media
                })
            })
        })

        return ret
    }

    requestUpdate (): void {
        this.error = null
        this.loading = true
        // todo: pagination for calendar (idk how it may even look, so impl once i find service which provides it)
        getCalendar('anime').then(({ items }) => {
            this.items = items
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.Calendar.Name'),
            showUpdateButton: true
        })

        this.timeInterval = setInterval(() => {
            this.now = new Date()
        }, 1000)

        this.requestUpdate()
    }
}
</script>

<style>

</style>
