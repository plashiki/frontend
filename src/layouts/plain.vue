<template>
    <v-app :dark="isDark">
        <v-container class="fill-height">
            <slot />
        </v-container>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { configStore } from '@/store'

@Component({})
export default class PlainLayout extends Vue {
    get isDark (): boolean {
        return configStore.dark
    }

    @Watch('isDark')
    onDarkModeChanged (val: boolean): void {
        this.$vuetify.theme.dark = val
    }

    mounted (): void {
        this.onDarkModeChanged(configStore.dark)
    }
}
</script>

<style>

</style>
