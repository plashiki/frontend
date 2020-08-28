<template>
    <div class="card-layout-bg">
        <v-simple-card>
            <DateRangeInput
                ref="dateRange"
                :from.sync="rangeFrom"
                :to.sync="rangeTo"
                :disabled="loading"
            >
                <v-btn
                    :disabled="loading"
                    color="primary"
                    outlined
                    rounded
                    @click="load"
                >
                    {{ $t('Common.Load') }}
                </v-btn>
            </DateRangeInput>

            <div class="text--secondary caption">
                {{ $t('Pages.Statistics.LightMode') }}
            </div>
        </v-simple-card>

        <!-- USERS STATS -->

        <h2 class="mt-4 mb-n2">
            {{ $t('Pages.Statistics.Users') }}
        </h2>
        <v-row class="d-flex justify-space-between">
            <v-col
                cols="12"
                lg="5"
                sm="6"
            >
                <v-simple-card>
                    <LineChart
                        :data="userTrendData"
                    />
                </v-simple-card>
            </v-col>
            <v-col
                cols="12"
                lg="5"
                sm="6"
            >
                <v-simple-card>
                    <DonutChart
                        :data="userSourceData"
                    />
                </v-simple-card>
            </v-col>
        </v-row>

        <!-- TRANSLATIONS STATS -->

        <h2 class="mt-4 mb-n2">
            {{ $t('Pages.Statistics.Translations') }}
        </h2>
        <v-row class="d-flex justify-space-between">
            <v-col
                cols="12"
                lg="4"
                sm="6"
            >
                <v-simple-card class="pt-5">
                    <LineChart
                        :data="translationsTrendData"
                    />
                </v-simple-card>
            </v-col>
            <v-col
                cols="12"
                lg="4"
                sm="6"
            >
                <v-simple-card>
                    <h3>{{ $t('Pages.Statistics.TranslationsAdditionSource') }}</h3>

                    <DonutChart
                        :data="translationsAdditionSourceData"
                        :options="{ legend: { display: false } }"
                    />
                </v-simple-card>
            </v-col>
            <v-col
                cols="12"
                lg="4"
                sm="6"
            >
                <v-simple-card>
                    <h3>{{ $t('Pages.Statistics.TranslationsRemovalSource') }}</h3>

                    <DonutChart
                        :data="translationsRemovalSourceData"
                        :options="{ legend: { display: false } }"
                    />
                </v-simple-card>
            </v-col>
        </v-row>


        <!-- MODERATION -->
        <h2 class="mt-4 mb-2">
            {{ $t('Pages.Statistics.Moderation') }}
        </h2>
        <v-row>
            <v-col
                cols="12"
                md="4"
                sm="6"
            >
                <v-simple-card class="pt-5">
                    <LineChart
                        :data="moderationTrendData"
                    />
                </v-simple-card>
            </v-col>
            <v-col
                cols="12"
                md="4"
                sm="6"
            >
                <v-simple-card>
                    <h3>{{ $t('Pages.Statistics.Senders') }}</h3>

                    <DonutChart
                        :data="sendersData"
                        :options="{ legend: { display: false } }"
                    />
                </v-simple-card>
            </v-col>
            <v-col
                cols="12"
                md="4"
                sm="6"
            >
                <v-simple-card>
                    <h3>{{ $t('Pages.Statistics.Moderators') }}</h3>

                    <DonutChart
                        :data="moderatorsData"
                        :options="{ legend: { display: false } }"
                    />
                </v-simple-card>
            </v-col>
        </v-row>


        <!-- IMPORTERS -->

        <h2 class="mt-4 mb-2">
            {{ $t('Pages.Statistics.ImportersEfficiency') }}
        </h2>
        <v-simple-card>
            <LineChart
                :data="importersTrendData"
                :options="{ legend: { display: false }, maintainAspectRatio: false }"
            />
        </v-simple-card>
    </div>
</template>

<script lang="ts">
import { Component, Ref } from 'vue-property-decorator'
import { eachDayOfInterval } from 'date-fns'
import LineChart from '@/components/charts/LineChart'
import DonutChart from '@/components/charts/DonutChart'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import VDateField from '@/components/common/fields/VDateField.vue'
import LoadableVue from '@/components/common/LoadableVue'
import { appStore } from '@/store'
import { getRawStatistics } from '@/api/admin'
import { iziToastError } from '@/plugins/izitoast'
import VListItemIconText from '@/components/common/VListItemIconText.vue'
import { ChartData } from 'chart.js'
import { getPallete } from '@/vendor/pallete'
import { formatDate } from '@/utils/stats-utils'
import DateRangeInput from '@/components/misc/DateRangeInput.vue'

@Component({
    components: { DateRangeInput, VListItemIconText, VDateField, VSimpleCard, LineChart, DonutChart }
})
export default class StatisticsPage extends LoadableVue {
    @Ref() dateRange!: any
    rangeFrom = ''
    rangeTo = ''

    data: Record<string, Record<string, number>> = {}

    // data getters //

    get userTrendData (): ChartData {
        let data = this._getTotalOfTypeInRange(['login', 'registration'])

        return {
            labels: this._daysInRange,
            datasets: [
                {
                    label: this.$t('Pages.Statistics.Registration'),
                    borderColor: '#dd0000',
                    data: data.registration
                },
                {
                    label: this.$t('Pages.Statistics.Login'),
                    borderColor: '#00dd00',
                    data: data.login
                }
            ]
        }
    }

    get userSourceData (): ChartData {
        let data = this._getTotalOfSubtypeInRange(['login', 'registration'])

        return {
            labels: data.labels,
            datasets: [
                {
                    data: data.data,
                    backgroundColor: data.colors
                }
            ]
        }
    }

    get translationsTrendData (): ChartData {
        let data = this._getTotalOfTypeInRange(['tr-added', 'tr-rem'])

        return {
            labels: this._daysInRange,
            datasets: [
                {
                    label: this.$t('Pages.Statistics.TranslationsAdded'),
                    borderColor: '#00dd00',
                    data: data['tr-added']
                },
                {

                    label: this.$t('Pages.Statistics.TranslationsRemoved'),
                    borderColor: '#dd0000',
                    data: data['tr-rem']
                }
            ]
        }
    }

    get translationsAdditionSourceData (): ChartData {
        let data = this._getTotalOfSubtypeInRange(['tr-added'])

        return {
            labels: data.labels,
            datasets: [
                {
                    data: data.data,
                    backgroundColor: data.colors
                }
            ]
        }
    }

    get translationsRemovalSourceData (): ChartData {
        let data = this._getTotalOfSubtypeInRange(['tr-rem'])

        return {
            labels: data.labels,
            datasets: [
                {
                    data: data.data,
                    backgroundColor: data.colors
                }
            ]
        }
    }

    get importersTrendData (): ChartData {
        // maybe not the most efficient way, but im tired
        let obj: Record<string, number[]> = {}
        for (let d of Object.values(this.data)) {
            for (let key of Object.keys(d)) {
                if (key.startsWith('efficiency:importers/')) {
                    obj[key] = []
                }
            }
        }
        let keys = Object.keys(obj)


        for (let day of this._daysInRange) {
            for (let key of keys) {
                if (this.data[day] && key in this.data[day]) {
                    obj[key].push(this.data[day][key])
                } else {
                    obj[key].push(0)

                }
            }
        }

        let colors = getPallete(keys.length)

        return {
            labels: this._daysInRange,
            datasets: keys.map((key, i) => ({
                label: key.split(':')[1],
                borderColor: colors[i],
                data: obj[key]
            }))
        }
    }

    get moderationTrendData (): ChartData {
        let data = this._getTotalOfTypeInRange(['moder-new', 'moder-accept', 'moder-decline'])

        return {
            labels: this._daysInRange,
            datasets: [
                {
                    label: this.$t('Pages.Statistics.ModerationSent'),
                    borderColor: '#2222dd',
                    data: data['moder-new']
                },
                {
                    label: this.$t('Pages.Statistics.ModerationAccepted'),
                    borderColor: '#00dd00',
                    data: data['moder-accept']
                },
                {
                    label: this.$t('Pages.Statistics.ModerationDeclined'),
                    borderColor: '#dd0000',
                    data: data['moder-decline']
                }
            ]
        }
    }

    get sendersData (): ChartData {
        let data = this._getTotalOfSubtypeInRange(['moder-new'])

        return {
            labels: data.labels.map(i => 'ID ' + i),
            datasets: [
                {
                    data: data.data,
                    backgroundColor: data.colors
                }
            ]
        }
    }

    get moderatorsData (): ChartData {
        let data = this._getTotalOfSubtypeInRange(['moder-accept', 'moder-decline'])

        return {
            labels: data.labels.map(i => 'ID ' + i),
            datasets: [
                {
                    data: data.data,
                    backgroundColor: data.colors
                }
            ]
        }
    }

    private get _daysInRange (): string[] {
        if (!this.rangeFrom || !this.rangeTo) return []
        return eachDayOfInterval({
            start: new Date(this.rangeFrom),
            end: new Date(this.rangeTo)
        }).map(i => formatDate(i))
    }

    load (): void {
        if (this.loading) return

        this.loading = true
        getRawStatistics(this.rangeFrom, this.rangeTo)
            .then((data) => {
                let ret: Record<string, Record<string, number>> = {}

                for (let obj of data) {
                    ret[obj.day] = obj.data
                }

                this.data = ret
            })
            .catch(iziToastError)
            .finally(() => {
                this.loading = false
            })
    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.Statistics.Name')
        })

        this.dateRange.setLastNDays(7)
        this.load()
    }

    private _getTotalOfTypeInRange<T extends string> (types: T[]): Record<T, number[]> {
        let ret: Record<string, number[]> = {}
        let i = 0
        for (let day of this._daysInRange) {
            for (let type of types) {
                if (!(type in ret)) ret[type] = []
                ret[type].push(0)
            }

            const data = this.data[day] || {}
            for (let key of Object.keys(data)) {
                for (let type of types) {
                    if (key.startsWith(type + ':')) {
                        ret[type][i] += data[key]
                    }
                }
            }

            i++
        }

        return ret
    }

    private _getTotalOfSubtypeInRange<T extends string> (types: T[]): {
        labels: string[]
        data: number[]
        colors: string[]
    } {
        let obj: Record<string, number> = {}
        for (let day of this._daysInRange) {
            const data = this.data[day] || {}
            for (let key of Object.keys(data)) {
                for (let type of types) {
                    if (key.startsWith(type + ':')) {
                        let subtype = key.split(':')[1]
                        if (!obj[subtype]) obj[subtype] = 0
                        obj[subtype] += data[key]
                    }
                }
            }
        }

        let ret = {
            labels: [] as string[],
            data: [] as number[],
            colors: [] as string[]
        }

        for (let [name, value] of Object.entries(obj)) {
            ret.labels.push(name)
            ret.data.push(value)
        }

        ret.colors = getPallete(ret.labels.length)

        return ret
    }
}
</script>

<style>

</style>
