<template>
    <div>
        <ErrorAlert :error="error">
            <span
                class="link-like primary--text"
                @click.prevent="load"
                v-text="$t('Common.Action.TryAgain')"
            />
        </ErrorAlert>

        <v-row
            align="center"
            class="mt-5"
            justify="center"
        >
            {{ $t('Pages.Redirect.Text') }}
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import LoadableVue from '@/components/common/LoadableVue'
import { getSingleTranslation } from '@/api/translations'
import { ApiException } from '@/types/api'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { getLinkToTranslation } from '@/utils/media-utils'
import { appStore } from '@/store'

@Component({
    components: { ErrorAlert }
})
export default class TranslationPage extends LoadableVue {
    error: ApiException | null = null

    load (): void {
        this.error = null
        this.loading = true

        const id = parseInt(this.$route.params.id)
        getSingleTranslation(id).then((tr) => {
            if (!tr) {
                this.$router.replace('/err404')
            } else {
                this.$router.replace(getLinkToTranslation(tr))
            }
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.Redirect.Name')
        })

        this.load()
    }
}
</script>

<style>

</style>
