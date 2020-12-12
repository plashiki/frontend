<template>
    <v-dialog
        v-model="visible"
        max-width="800"
        scrollable
    >
        <template #activator="props">
            <slot v-bind="props" />
        </template>

        <v-card>
            <v-card-title>
                <h4>{{ $t('Pages.Userscript.Name') }}</h4>
                <v-spacer />
                <v-btn
                    icon
                    @click="visible = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />

            <v-card-text
                class="text--primary pt-2"
                v-html="$t('Pages.Userscript.Text', { violentLink, tamperLink })"
            />
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class InstallUserscriptDialog extends Vue {
    visible = false

    get tamperLink (): string {
        const ua = navigator.userAgent.toLowerCase()
        if (ua.indexOf('firefox') > -1) {
            return 'https://addons.mozilla.org/ru/firefox/addon/tampermonkey/'
        }
        if (ua.indexOf('edge') > -1) {
            return 'https://www.microsoft.com/store/apps/9NBLGGH5162S'
        }
        return 'https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=ru'
    }

    get violentLink (): string {
        const ua = navigator.userAgent.toLowerCase()
        if (ua.indexOf('firefox') > -1) {
            return 'https://addons.mozilla.org/firefox/addon/violentmonkey/'
        }
        return 'https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag'
    }
}
</script>

<style>

</style>
