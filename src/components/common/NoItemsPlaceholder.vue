<template>
    <div
        class="row align-center justify-center grey--text body-1 font-weight-bold text-center"
        style="height: 170px"
        v-bind="$attrs"
        v-html="text"
    />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class NoItemsPlaceholder extends Vue {
    @Prop({ required: true }) text!: string
}
</script>

<style>

</style>
