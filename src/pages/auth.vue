<template>
    <v-row
        align="center"
        justify="center"
    >
        <v-card max-width="600">
            <v-card-title>
                {{ $t('Pages.Login.Name') }}
            </v-card-title>
            <v-card-text>

                <v-btn
                    :href="getOauthDialogLink('shikimori')"
                    block
                    outlined
                >
                    <ShikimoriIcon class="v-icon v-icon--left" />
                    {{ $t('Pages.Login.LoginVia', { name: $t('Services.Shikimori') }) }}
                </v-btn>
            </v-card-text>
        </v-card>
    </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ShikimoriIcon from '@/assets/svg/shikimori.svg'
import { getOauthDialogLink } from '@/api/auth'
import { authStore } from '@/store'

@Component({
    components: { ShikimoriIcon }
})
export default class AuthPage extends Vue {
    get then (): string | null {
        return Array.isArray(this.$route.query.then) ? this.$route.query.then[0] : this.$route.query.then
    }

    getOauthDialogLink (service: string): string {
        return getOauthDialogLink(service, this.then)
    }

    mounted (): void {
        if (authStore.authenticated) {
            location.href = this.then ?? '/'
        }
    }
}
</script>

<style>

</style>
