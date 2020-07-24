<template>
    <v-text-field
        v-model="internalValue"
        readonly
        v-bind="$attrs"
        v-on="listeners"
    >
        <template #append>
            <v-menu
                :close-on-content-click="false"
            >
                <template #activator="{ on }">
                    <v-btn
                        icon
                        small
                        v-on="on"
                    >
                        <v-icon small>
                            mdi-calendar
                        </v-icon>
                    </v-btn>
                </template>

                <v-date-picker
                    v-model="internalValue"
                    v-bind="pickerProps"
                />
            </v-menu>
        </template>
    </v-text-field>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { strip } from '@/utils/object-utils'
import { AnyKV } from '@/types'

@Component({})
export default class VDateField extends Vue {
    @Prop({ default: null }) value!: string
    @Prop({ default: () => ({}) }) pickerProps!: AnyKV

    internalValue: string | null = null

    get vmodel (): string | null {
        return this.value
    }

    set vmodel (val: string | null) {
        this.$emit('input', val)
    }

    get listeners (): any {
        return strip(this.$listeners, ['input'])
    }

    @Watch('vmodel')
    vmodelChanged (): void {
        this.internalValue = this.vmodel
    }

    @Watch('internalValue')
    inputChanged (): void {
        this.vmodel = this.internalValue
    }

    mounted (): void {
        this.internalValue = this.value
    }
}
</script>

<style>

</style>
