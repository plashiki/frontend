<template>
    <OauthWidget
        :error="error"
        :page="page"
    >
        <ErrorAlert :error="error" />
        <p>{{ $t('Pages.Oauth.ProvideNickname') }}</p>
        <v-form v-model="valid">
            <NicknameField
                v-model="nickname"
                :label="$t('Items.User.Nickname')"
                outlined
            />
            <div
                class="text--secondary caption mt-2"
                v-html="$t('Pages.Login.AcceptTos')"
            />
        </v-form>
        <v-btn
            :disabled="!valid"
            :loading="loading"
            block
            color="primary"
            @click="setUserNickname"
        >
            {{ $t('Pages.Oauth.Finish') }}
        </v-btn>
    </OauthWidget>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import OauthWidget from '@/components/auth/OauthWidget.vue'
import NicknameField from '@/components/auth/fields/NicknameField.vue'
import { doShikimoriAuth } from '@/api/auth'
import { authStore, configStore } from '@/store'
import { ApiException } from '@/types/api'
import { changeLanguage } from '@/plugins/vue-i18n'

@Component({
    components: { NicknameField, OauthWidget, ErrorAlert }
})
export default class ShikimoriOauthPage extends Vue {
    error: ApiException | null = null
    page = 'loading'

    nickname = ''
    oauthCode = ''

    valid = true
    loading = false

    setUserNickname (): void {
        this.loading = true
        doShikimoriAuth({
            code: this.oauthCode,
            nickname: this.nickname
        }).then((res) => {
            if (res.state === 'OK') {
                this.page = 'done'
                authStore.setUser(res.user)

                if (res.user.language && res.user.language !== configStore.language) {
                    changeLanguage(res.user.language)
                }
            } else {
                throw new ApiException(res.state)
            }
        }).catch((err: ApiException) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    mounted (): void {
        if (!this.$route.query.code) {
            this.error = new ApiException('INVALID_AUTH_CODE')
            return
        }
        this.oauthCode = this.$route.query.code as string
        doShikimoriAuth({
            code: this.oauthCode
        }).then((res) => {
            if (res.state === 'OK') {
                this.page = 'done'
                authStore.setUser(res.user)

                if (res.user.language) {
                    changeLanguage(res.user.language)
                }
            } else if (res.state === 'NEED_NICKNAME') {
                this.page = 'form'
                this.nickname = res.default
            }
        }).catch((err: ApiException) => {
            this.error = err
        })
    }
}
</script>

<style>

</style>
