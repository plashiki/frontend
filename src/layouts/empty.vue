<template>
    <v-app>
        <slot />
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class EmptyLayout extends Vue {
}
</script>

<style>

</style>
