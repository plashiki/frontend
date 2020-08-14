<template>
    <div class="flex-grow-1">
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
import { ApiException } from '@/types/api'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { appStore } from '@/store'
import { shikimoriGetUser } from '@/api/providers/shikimori/methods'

@Component({
    components: { ErrorAlert }
})
export default class UserShikimoriRedirectPage extends LoadableVue {
    error: ApiException | null = null

    load (): void {
        this.error = null
        this.loading = true

        const id = parseInt(this.$route.params.id)
        shikimoriGetUser(id).then((user) => {
            location.replace('https://shikimori.one/' + user.nickname)
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
