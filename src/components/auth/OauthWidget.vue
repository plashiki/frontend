<template>
    <div class="flex-grow-1">
        <v-card
            class="mx-auto text-center overflow-hidden"
            color="transparent"
            flat
            max-width="600"
        >
            <transition
                mode="out-in"
                name="scroll-x-reverse-transition"
            >
                <div
                    key="loading"
                    v-if="page === 'loading'"
                >
                    <ErrorAlert :error="error" />
                    <v-progress-circular
                        class="mb-3"
                        color="primary"
                        indeterminate
                        size="64"
                        v-show="!error"
                        width="2"
                    />
                    <p
                        class="grey--text text--darken-2 font-weight-bold title mb-0"
                        v-show="!error"
                    >
                        {{ $t('Pages.Oauth.WaitASec') }}
                    </p>
                    <p
                        class="grey--text body-2"
                        v-show="!error"
                    >
                        {{ $t('Pages.Oauth.DontCloseThisWindow') }}
                    </p>
                    <p
                        class="grey--text text--darken-3 body-1"
                        v-show="error"
                    >
                        {{ $t('Common.Action.TryAgain').toLowerCase() }}
                    </p>
                </div>
                <div
                    key="form"
                    v-else-if="page === 'form'"
                >
                    <slot />
                </div>
                <div
                    key="done"
                    v-else
                >
                    <v-icon
                        class="md-3"
                        color="success"
                        size="64"
                    >
                        mdi-check-circle
                    </v-icon>
                    <p class="grey--text text--darken-2 font-weight-bold title mb-0">
                        {{ $t(doneString) }}
                    </p>
                    <p class="grey--text body-2" v-if="then === null">
                        {{ $tc('Pages.Oauth.ClosingIn', closingIn) }}
                    </p>
                </div>
            </transition>
        </v-card>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ApiException } from '@/types/api'

@Component({
    components: {
        ErrorAlert
    }
})
export default class OauthWidget extends Vue {
    @Prop({ default: null }) error!: ApiException | null
    @Prop() page!: 'loading' | 'form' | 'done'
    @Prop({ type: String, default: 'Pages.Oauth.Done' }) doneString!: string

    closingIn = 5

    get then (): string | null {
        let qThen = Array.isArray(this.$route.query.then) ? this.$route.query.then[0] : this.$route.query.then
        if (qThen) {
            return qThen
        }

        let qState = Array.isArray(this.$route.query.state) ? this.$route.query.state[0] : this.$route.query.state
        if (qState) {
            let state = decodeURIComponent(qState)
            let m = state.match(/^then=(.+?)$/)
            if (m) return m[1]
        }
        return null
    }

    @Watch('page')
    onPageChanged (val: this['page']): void {
        if (val === 'done') {
            if (this.then === null) {
                const ticker = (): void => {
                    this.closingIn--
                    if (this.closingIn === 0) {
                        window.close()
                    } else {
                        setTimeout(ticker, 1000)
                    }
                }
                setTimeout(ticker, 1000)
            } else {
                location.href = this.then
            }
        }
    }
}
</script>

<style>

</style>
