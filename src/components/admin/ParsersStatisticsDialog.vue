<template>
    <v-dialog
        v-model="vmodel"
        scrollable
    >
        <v-card>
            <v-card-title>
                {{ $t('Pages.Statistics.Name') }}
                <v-spacer />
                <v-btn
                    icon
                    @click="vmodel = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-progress-linear
                :active="loading"
                indeterminate
            />

            <v-card-text>
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

                <v-row>
                    <v-col
                        cols="12"
                        sm="6"
                    >
                        <h2>Efficiency</h2>
                        <LineChart :data="efficiencyTrendData" />
                    </v-col>
                    <v-col
                        cols="12"
                        sm="6"
                    >
                        <h2>Added</h2>
                        <LineChart :data="addedNumberTrendData" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import DateRangeInput from '@/components/misc/DateRangeInput.vue'
import {
    createIndexedStatistics,
    daysInRange,
    getTrendForTypesInDateRange,
    IndexedStatistics,
} from '@/utils/stats-utils'
import { getRawStatistics } from '@/api/admin'
import { iziToastError } from '@/plugins/izitoast'
import LineChart from '@/components/charts/LineChart'
import { ChartData } from 'chart.js'

@Component({
    components: { LineChart, DateRangeInput },
})
export default class ParsersStatisticsDialog extends Vue {
    @Prop({ type: Boolean, default: false }) value!: boolean
    @Prop() parserUid!: string

    @Ref() dateRange!: any
    rangeFrom = ''
    rangeTo = ''

    isFirst = true

    data: IndexedStatistics = {}

    loading = false

    get vmodel (): boolean {
        return this.value
    }

    set vmodel (val: boolean) {
        this.$emit('input', val)
    }

    get _daysInRange (): string[] {
        return daysInRange(this.rangeFrom, this.rangeTo)
    }

    private _getTrendForTypes<T extends string> (types: T[]): Record<T, number[]> {
        return getTrendForTypesInDateRange(this._daysInRange, this.data, types)
    }

    get efficiencyTrendData (): ChartData {
        let data = this._getTrendForTypes([`efficiency:${this.parserUid}`])

        return {
            labels: this._daysInRange,
            datasets: [
                {
                    label: this.parserUid,
                    borderColor: '#2222dd',
                    data: data[`efficiency:${this.parserUid}`]
                }
            ]
        }
    }

    get addedNumberTrendData (): ChartData {
        let data = this._getTrendForTypes([`tr-added:${this.parserUid}`])

        return {
            labels: this._daysInRange,
            datasets: [
                {
                    label: this.parserUid,
                    borderColor: '#2222dd',
                    data: data[`tr-added:${this.parserUid}`]
                }
            ]
        }
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

    @Watch('value')
    onFirstOpened (val: boolean): void {
        if (!val || !this.isFirst || this.loading) return

        this.isFirst = false
        this.$nextTick(() => {
            this.dateRange.setLastNDays(7)
            this.load()
        })
    }
}
</script>

<style>

</style>
