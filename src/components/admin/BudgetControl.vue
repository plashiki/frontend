<template>
    <div>
        <h2>{{ $t('Pages.UsersAdmin.Budget') }}</h2>
        <TwoOptionSwitch
            v-model="isDonation"
            :false-label="$t('Pages.UsersAdmin.Expense')"
            :true-label="$t('Pages.UsersAdmin.Donation')"
        />
        <v-number-field
            v-model="amount"
            :label="$t('Pages.UsersAdmin.Amount')"
            :predicate="v => v > 0"
            :step="100"
            prefix="₽"
        />
        <v-text-field
            v-model="date"
            :label="$t('Pages.UsersAdmin.ChangeTime')"
            append-icon="mdi-calendar-today"
            @click:append="now"
        />
        <v-text-field
            v-model="comment"
            :label="isDonation ? undefined : $t('Pages.UsersAdmin.Comment')"
            :prefix="isDonation ? $t('Pages.UsersAdmin.From') : undefined"
        />
        <div class="text-center">
            <v-btn
                :loading="loading"
                color="primary"
                outlined
                rounded
                @click="create"
            >
                {{ $t('Common.Form.Create') }}
            </v-btn>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TwoOptionSwitch from '@/components/common/fields/TwoOptionSwitch.vue'
import VNumberField from '@/components/common/fields/VNumberField.vue'
import { lightFormat } from 'date-fns'
import { updateBudget } from '@/api/admin'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'

@Component({
    components: { VNumberField, TwoOptionSwitch }
})
export default class BudgetControl extends Vue {
    isDonation = false
    amount = 0
    comment = ''
    date = ''

    loading = false

    create (): void {
        this.loading = true

        updateBudget({
            type: this.isDonation ? 'donation' : 'expense',
            amount: this.amount,
            comment: this.comment,
            date: this.date
        }).then(() => iziToastSuccess())
            .catch(iziToastError)
            .finally(() => {
                this.loading = false
            })
    }

    now (): void {
        this.date = lightFormat(new Date(), 'dd.MM.yyyy в HH:mm')
    }
}
</script>

<style>

</style>
