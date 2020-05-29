<template>
    <v-dialog
        max-width="800"
        scrollable
        v-model="visible"
    >
        <template #activator="bind">
            <slot v-bind="bind" />
        </template>

        <v-card>
            <v-card-title>
                <h4>{{ $t('Pages.Settings.Name') }}</h4>
                <v-spacer />
                <v-btn
                    @click="visible = false"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="card-layout-bg pt-2">
                <AppSettings />
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import AppSettings from '@/components/settings/AppSettings.vue'

@Component({
    components: { AppSettings }
})
export default class SettingsDialog extends Vue {
    visible = false
}
</script>

<style>

</style>
