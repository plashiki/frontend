<template>
    <v-switch
        v-model="value"
        hide-details
        class="my-2"
        v-bind="$attrs"
        v-on="$listeners"
    />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { configStore } from '@/store'

@Component({})
export default class BooleanSwitch extends Vue {
    @Prop({ required: true }) name!: string

    get value (): boolean {
        return (configStore as any)[this.name]
    }

    set value (val: boolean) {
        (configStore as any).merge({ [this.name]: val })
    }
}
</script>

<style>

</style>
