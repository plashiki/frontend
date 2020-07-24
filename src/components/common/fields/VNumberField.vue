<template>
    <v-text-field
        v-model="internalValue"
        :rules="[v => validNumber(v, predicate) || $t('Common.Form.InvalidNumber')]"
        type="number"
        v-bind="$attrs"
        v-on="listeners"
    >
        <template #append>
            <v-btn
                class="text--primary"
                icon
                small
                tabindex="-1"
                @click="decrement"
            >
                <v-icon small>
                    mdi-minus
                </v-icon>
            </v-btn>
            <v-btn
                class="text--primary"
                icon
                small
                tabindex="-1"
                @click="increment"
            >
                <v-icon small>
                    mdi-plus
                </v-icon>
            </v-btn>
        </template>
    </v-text-field>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { strip } from '@/utils/object-utils'

@Component({})
export default class VNumberField extends Vue {
    @Prop({ default: 0 }) value!: number
    @Prop({ type: Number, default: 1 }) step!: number
    @Prop({ default: null }) predicate!: ((v: number) => boolean) | null
    @Prop({ default: false }) allowEmpty!: boolean
    @Prop({ type: Number, default: -Infinity }) min!: number
    @Prop({ type: Number, default: Infinity }) max!: number

    internalValue = '0'

    get vmodel (): number {
        return this.value
    }

    set vmodel (val: number) {
        this.$emit('input', val)
    }

    get listeners (): any {
        return strip(this.$listeners, ['input'])
    }

    decrement (): void {
        this.vmodel = Math.max(this.min, this.vmodel - this.step)
    }

    increment (): void {
        this.vmodel = Math.min(this.max, this.vmodel - (-this.step))
    }

    validNumber (v: string, predicate?: (v: number) => boolean): boolean {
        if (v === '' && this.allowEmpty) return true

        let q = parseInt(v)
        if (isNaN(q)) return false
        if (predicate && !predicate(q)) return false
        return true
    }

    @Watch('vmodel')
    vmodelChanged (): void {
        this.internalValue = this.vmodel + ''
    }

    @Watch('internalValue')
    inputChanged (): void {
        this.vmodel = parseInt(this.internalValue)
    }

    mounted (): void {
        this.internalValue = this.value + ''
    }
}
</script>

<style>
/* hide arrows from type=number */
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Firefox */
input[type=number] {
    -moz-appearance: textfield;
}
</style>
