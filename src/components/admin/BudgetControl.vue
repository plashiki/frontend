<template>
    <div>
        <h2>{{ $t('Pages.UsersAdmin.Budget') }}</h2>
        <TwoOptionSwitch
            :false-label="$t('Pages.UsersAdmin.Expense')"
            :true-label="$t('Pages.UsersAdmin.Donation')"
            v-model="isDonation"
        />
        <v-number-field
            :label="$t('Pages.UsersAdmin.Amount')"
            :predicate="v => v > 0"
            :step="100"
            prefix="₽"
            v-model="amount"
        />
        <v-text-field
            :label="$t('Pages.UsersAdmin.ChangeTime')"
            @click:append="now"
            append-icon="mdi-calendar-today"
            v-model="date"
        />
        <v-text-field
            :label="isDonation ? undefined : $t('Pages.UsersAdmin.Comment')"
            :prefix="isDonation ? $t('Pages.UsersAdmin.From') : undefined"
            v-model="comment"
        />
        <div class="text-center">
            <v-btn
                :loading="loading"
                @click="create"
                color="primary"
                outlined
                rounded
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
