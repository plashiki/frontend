<template>
    <div>
        <v-number-field
            :label="$t('Pages.Settings.RequestTimeout')"
            :min="0"
            :step="1000"
            v-model="apiTimeout"
        />
        <p
            class="caption text--secondary"
            v-html="$t('Pages.Settings.RequestTimeoutDescription')"
        />

        <v-switch
            :label="$t('Pages.Settings.ConnectionIndicatorAlwaysVisible')"
            v-model="connectionIndicator"
        />

        <v-divider class="mb-4" />

        <ApiServerField
            :proxy="shikimoriProxy"
            :reset="defaultShikimori"
            service="Shikimori"
            v-model="shikimoriApiEndpoint"
        />
        <p
            class="caption text--secondary mb-0"
            v-html="$t('Pages.Settings.ApiServerDescription')"
        />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VNumberField from '@/components/common/fields/VNumberField.vue'
import { configStore } from '@/store'
import { mainDomain, shikimori } from '@/config'
import ApiServerField from '@/components/settings/ApiServerField.vue'

@Component({
    components: { ApiServerField, VNumberField }
})
export default class NetworkTab extends Vue {
    defaultShikimori = shikimori.endpoint
    shikimoriProxy = `https://sh.${mainDomain}/api`

    get apiTimeout (): number {
        return configStore.apiTimeout
    }

    set apiTimeout (val: number) {
        configStore.merge({
            apiTimeout: val
        })
    }

    get shikimoriApiEndpoint (): string {
        return configStore.shikimoriApiEndpoint
    }

    set shikimoriApiEndpoint (val: string) {
        configStore.merge({
            shikimoriApiEndpoint: val
        })
    }

    get connectionIndicator (): boolean {
        return configStore.connectionIndicator
    }

    set connectionIndicator (val: boolean) {
        configStore.merge({
            connectionIndicator: val
        })
    }
}
</script>

<style>

</style>
