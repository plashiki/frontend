<template>
    <div>
        <v-number-field
            v-model="apiTimeout"
            :label="$t('Pages.Settings.RequestTimeout')"
            :min="0"
            :step="1000"
        />
        <p
            class="caption text--secondary"
            v-html="$t('Pages.Settings.RequestTimeoutDescription')"
        />

        <v-switch
            v-model="connectionIndicator"
            :label="$t('Pages.Settings.ConnectionIndicatorAlwaysVisible')"
        />

        <v-divider class="mb-4" />

        <ApiServerField
            v-model="shikimoriApiEndpoint"
            :proxy="shikimoriProxy"
            :reset="defaultShikimori"
            service="Shikimori"
        />
        <p
            class="caption text--secondary"
            v-html="$t('Pages.Settings.ApiServerDescription')"
        />

        <v-divider class="mb-4" />
        <p class="mb-0">
            <b v-text="$t('Pages.Settings.CacheSize')" />:
            {{ cacheSize + (cacheQuota ? ' / ' + cacheQuota : '') }} (<span
                class="caption"
                :class="this.clearingCache ? 'text--secondary' : 'primary--text link-like'"
                @click="clearCache"
                v-text="$t('Pages.Settings.ClearCache')"
            />)
        </p>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VNumberField from '@/components/common/fields/VNumberField.vue'
import { configStore } from '@/store'
import { mainDomain, shikimori } from '@/config'
import ApiServerField from '@/components/settings/ApiServerField.vue'
import { formatFileSize } from '@/utils/filesize'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'

@Component({
    components: { ApiServerField, VNumberField }
})
export default class NetworkTab extends Vue {
    defaultShikimori = shikimori.endpoint
    shikimoriProxy = `https://sh.${mainDomain}/api`

    cacheSize = 'N/A'
    cacheQuota = ''
    clearingCache = false

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

    clearCache (): void {
        if (this.clearingCache || typeof caches === 'undefined') return

        this.clearingCache = true
        caches.keys()
            .then((keys) => Promise.all(keys.map(k => caches.delete(k))))
            .then(() => iziToastSuccess())
            .catch(iziToastError)
            .finally(() => {
                this.clearingCache = false
            })
    }

    mounted (): void {
        navigator.storage?.estimate().then((result) => {
            let bytes: number | undefined
            if ('usageDetails' in result) {
                bytes = (result as any).usageDetails.caches
            } else {
                bytes = result.usage
            }

            this.cacheSize = formatFileSize(bytes ?? 0)
            if (result.quota) {
                this.cacheQuota = formatFileSize(result.quota)
            }
        })
    }
}
</script>

<style>

</style>
