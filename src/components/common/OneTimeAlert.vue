<template>
    <v-alert
        dismissible
        v-bind="$attrs"
        v-model="vmodel"
        v-on="$listeners"
    >
        <slot />
    </v-alert>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { configStore } from '@/store'

@Component({})
export default class OneTimeAlert extends Vue {
    @Prop({ required: true }) name!: string

    get vmodel (): boolean {
        return configStore.components[this.name] ?? true
    }

    set vmodel (val: boolean) {
        configStore.merge({
            components: {
                [this.name]: val
            }
        })
    }

}
</script>

<style>

</style>
