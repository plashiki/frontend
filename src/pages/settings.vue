<template>
    <AppSettings />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import AppSettings from '@/components/settings/AppSettings.vue'
import { appStore } from '@/store'

@Component({
    components: { AppSettings }
})
export default class SettingsPage extends Vue {
    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.Settings.Name')
        })
    }
}
</script>

<style>

</style>
