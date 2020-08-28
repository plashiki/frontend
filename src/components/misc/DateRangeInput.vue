<template>
    <v-row>
        <v-col
            cols="6"
            sm="4"
        >
            <v-date-field
                v-model="rangeFrom"
                :disabled="disabled"
                :label="$t('Pages.Statistics.DateRangeFrom')"
                hide-details
            />
        </v-col>
        <v-col
            cols="6"
            sm="4"
        >
            <v-date-field
                v-model="rangeTo"
                :disabled="disabled"
                :label="$t('Pages.Statistics.DateRangeTo')"
                hide-details
            />
        </v-col>
        <v-col
            class="d-flex align-center"
            cols="10"
            sm="3"
        >
            <slot />
        </v-col>
        <v-col
            class="d-flex justify-end align-center"
            cols="2"
            sm="1"
        >
            <v-menu>
                <template #activator="{ on }">
                    <v-btn
                        icon
                        small
                        v-on="on"
                    >
                        <v-icon small>
                            mdi-dots-vertical
                        </v-icon>
                    </v-btn>
                </template>


                <v-list dense>
                    <VListItemIconText
                        :title="$t('Pages.Statistics.Today')"
                        icon="mdi-calendar"
                        @click="setToday"
                    />
                    <VListItemIconText
                        :title="$t('Pages.Statistics.Yesterday')"
                        icon="mdi-calendar"
                        @click="setYesterday"
                    />
                    <VListItemIconText
                        :title="$t('Pages.Statistics.LastWeek')"
                        icon="mdi-calendar"
                        @click="setLastNDays(7)"
                    />
                    <VListItemIconText
                        :title="$t('Pages.Statistics.LastMonth')"
                        icon="mdi-calendar"
                        @click="setLastNDays(31)"
                    />
                    <VListItemIconText
                        :title="$t('Pages.Statistics.LastYear')"
                        icon="mdi-calendar"
                        @click="setLastNDays(365)"
                    />
                    <VListItemIconText
                        :title="$t('Pages.Statistics.AllTime')"
                        icon="mdi-calendar"
                        @click="setAllTime"
                    />
                </v-list>
            </v-menu>
        </v-col>
    </v-row>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'
import { subDays } from "date-fns"
import { formatDate } from '@/utils/stats-utils'
import VListItemIconText from '@/components/common/VListItemIconText.vue'
import VDateField from '@/components/common/fields/VDateField.vue'

@Component({
    components: { VDateField, VListItemIconText },
})
export default class DateRange extends Vue {
    @PropSync('from') rangeFrom!: string
    @PropSync('to') rangeTo!: string
    @Prop({ type: Boolean, default: false }) disabled!: boolean
    @Prop({ default: '2020-06-01' }) allTimeFrom!: string

    setAllTime (): void {
        this.setToday()
        this.rangeFrom = this.allTimeFrom
    }

    setLastNDays (n: number): void {
        this.setToday()
        this.rangeFrom = formatDate(subDays(new Date(), n))
    }

    setYesterday (): void {
        this.rangeTo = this.rangeFrom = formatDate(subDays(new Date(), 1))
    }

    setToday (): void {
        this.rangeTo = this.rangeFrom = formatDate(new Date())
    }
}
</script>

<style>

</style>
