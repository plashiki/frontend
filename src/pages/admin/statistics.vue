<template>
    <div class="cards-page-container">
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
                Graphs look better in light UI mode.
            </div>
        </v-simple-card>

        <!-- USERS STATS -->

        <h2 class="mt-4 mb-n2">
            Users
        </h2>
        <v-row class="d-flex justify-space-between">
            <v-col
                cols="12"
                lg="5"
                sm="6"
            >
                <v-simple-card>
                    <LineChart :data="userTrendData" />
                </v-simple-card>
            </v-col>
            <v-col
                cols="12"
                lg="5"
                sm="6"
            >
                <v-simple-card>
                    <DonutChart :data="userSourceData" />
                </v-simple-card>
            </v-col>
        </v-row>

        <!-- TRANSLATIONS STATS -->

        <h2 class="mt-4 mb-n2">
            Translations
        </h2>
        <v-row class="d-flex justify-space-between">
            <v-col
                cols="12"
                lg="4"
                sm="6"
            >
                <v-simple-card class="pt-5">
                    <LineChart :data="translationsTrendData" />
                </v-simple-card>
            </v-col>
            <v-col
                cols="12"
                lg="4"
                sm="6"
            >
                <v-simple-card>
                    <h3>Added by</h3>

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
                    <h3>Deleted by</h3>

                    <DonutChart
                        :data="translationsRemovalSourceData"
                        :options="{ legend: { display: false } }"
                    />
                </v-simple-card>
            </v-col>
        </v-row>


        <!-- MODERATION -->
        <h2 class="mt-4 mb-2">
            Moderation
        </h2>
        <v-row>
            <v-col
                cols="12"
                md="4"
                sm="6"
            >
                <v-simple-card class="pt-5">
                    <LineChart :data="moderationTrendData" />
                </v-simple-card>
            </v-col>
            <v-col
                cols="12"
                md="4"
                sm="6"
            >
                <v-simple-card>
                    <h3>Senders</h3>

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
                    <h3>Moderators</h3>

                    <DonutChart
                        :data="moderatorsData"
                        :options="{ legend: { display: false } }"
                    />
                </v-simple-card>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Ref } from 'vue-property-decorator'
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
import {
    createIndexedStatistics,
    daysInRange,
    getSubtypeDistributionForTypesInDateRange,
    getTrendForTypesInDateRange,
    IndexedStatistics,
    SubtypeDistribution,
} from '@/utils/stats-utils'
import DateRangeInput from '@/components/misc/DateRangeInput.vue'

@Component({
    components: { DateRangeInput, VListItemIconText, VDateField, VSimpleCard, LineChart, DonutChart }
})
export default class StatisticsPage extends LoadableVue {
    @Ref() dateRange!: any
    rangeFrom = ''
    rangeTo = ''

    data: IndexedStatistics = {}

    // data getters //

    get userTrendData (): ChartData {
        let data = this._getTrendForTypes(['login:', 'registration:'])

        return {
            labels: this._daysInRange,
            datasets: [
                {
                    label: 'Registration',
                    borderColor: '#dd0000',
                    data: data['registration:']
                },
                {
                    label: 'Login',
                    borderColor: '#00dd00',
                    data: data['login:']
                }
            ]
        }
    }

    get userSourceData (): ChartData {
        let data = this._getSubtypeDistributionForTypes(['login', 'registration'])

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
        let data = this._getTrendForTypes(['tr-added:', 'tr-rem:'])

        return {
            labels: this._daysInRange,
            datasets: [
                {
                    label: 'Added',
                    borderColor: '#00dd00',
                    data: data['tr-added:']
                },
                {

                    label: 'Removed',
                    borderColor: '#dd0000',
                    data: data['tr-rem:']
                }
            ]
        }
    }

    get translationsAdditionSourceData (): ChartData {
        let data = this._getSubtypeDistributionForTypes(['tr-added'])

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
        let data = this._getSubtypeDistributionForTypes(['tr-rem'])

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

    get moderationTrendData (): ChartData {
        let data = this._getTrendForTypes(['moder-new:', 'moder-accept:', 'moder-decline:'])

        return {
            labels: this._daysInRange,
            datasets: [
                {
                    label: 'Sent',
                    borderColor: '#2222dd',
                    data: data['moder-new:']
                },
                {
                    label: 'Accepted',
                    borderColor: '#00dd00',
                    data: data['moder-accept:']
                },
                {
                    label: 'Declined',
                    borderColor: '#dd0000',
                    data: data['moder-decline:']
                }
            ]
        }
    }

    get sendersData (): ChartData {
        let data = this._getSubtypeDistributionForTypes(['moder-new'])

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
        let data = this._getSubtypeDistributionForTypes(['moder-accept', 'moder-decline'])

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

    get _daysInRange (): string[] {
        return daysInRange(this.rangeFrom, this.rangeTo)
    }

    load (): void {
        if (this.loading) return

        this.loading = true
        getRawStatistics(this.rangeFrom, this.rangeTo)
            .then((data) => {
                this.data = createIndexedStatistics(data)
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

    private _getTrendForTypes<T extends string> (types: T[]): Record<T, number[]> {
        return getTrendForTypesInDateRange(this._daysInRange, this.data, types)
    }

    private _getSubtypeDistributionForTypes<T extends string> (types: T[]): SubtypeDistribution {
        return getSubtypeDistributionForTypesInDateRange(this._daysInRange, this.data, types)
    }
}
</script>

<style>

</style>
