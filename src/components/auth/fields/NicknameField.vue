<template>
    <v-text-field
        :error-messages="occupied ? this.$t('Pages.Login.NicknameOccupied') : undefined"
        :loading="loading"
        :rules="[requiredField]"
        autocomplete="username"
        v-bind="{...$attrs, ...$props}"
        v-on="$listeners"
    />
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { requiredField } from '@/utils/validators'
import { Debounced } from '@/utils/function-utils'
import { isAuthDataAvailable } from '@/api/user'

@Component({})
export default class LoginField extends Vue {
    @Prop({ type: Boolean, default: true }) required!: boolean
    @Prop({ type: String, default: '' }) value!: string

    loading = false
    occupied = false

    get requiredField (): any {
        return this.required ? requiredField : (): boolean => true
    }

    @Watch('value')
    @Debounced(500)
    async debouncedCheck (): Promise<void> {
        return this.check()
    }

    async check (): Promise<void> {
        if (!this.value) {
            this.occupied = false
            return
        }
        this.loading = true
        isAuthDataAvailable('nickname', this.value).then((ok) => {
            this.occupied = !ok
            this.loading = false
        })
    }

    mounted (): void {
        if (this.value) this.check()
    }
}
</script>

<style>

</style>
