<template>
    <v-layout
        align-center
        mx-0
        my-2
        row
    >
        <span
            :class="['body-2 two-option-switch--label', !vmodel ? 'text--primary' : 'grey--text']"
            v-html="falseLabel"
        ></span>
        <v-switch
            v-model="vmodel"
            :disabled="disabled"
            class="mx-3 mt-0 pt-0"
            hide-details
        />
        <span
            :class="['body-2 two-option-switch--label', vmodel ? 'text--primary' : 'grey--text']"
            v-html="trueLabel"
        ></span>
    </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { configStore } from '@/store'

@Component({})
export default class TwoOptionSwitch extends Vue {
    @Prop({ type: String, required: true }) falseLabel!: string
    @Prop({ type: String, required: true }) trueLabel!: string
    @Prop({ type: Boolean, default: false }) disabled!: boolean
    @Prop({ type: Boolean, default: false }) value!: boolean
    @Prop({ default: null }) persist!: string | null

    get persistKey (): string | null {
        return this.persist ? `tos:` + this.persist : null
    }

    get vmodel (): boolean {
        return this.value
    }

    set vmodel (val: boolean) {
        this.$emit('input', val)

        if (this.persistKey !== null && val !== configStore.components[this.persistKey]) {
            configStore.merge({
                components: {
                    [this.persistKey]: val
                }
            })
        }
    }

    mounted (): void {
        if (this.persistKey !== null && configStore.components[this.persistKey] !== undefined) {
            this.vmodel = configStore.components[this.persistKey]
        }
    }
}
</script>
