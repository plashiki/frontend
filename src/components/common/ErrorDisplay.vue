<template>
    <div>
        <div class="text-center">
            <img
                alt=""
                src="/img/error.webp"
                style="max-width: 250px; width: 100%"
            >
            <h2 class="my-3">
                {{ $t('Pages.Error.Codes.' + code) }}
            </h2>
            <p v-html="$t('Pages.Error.FullCodes.' + code)" />
        </div>
        <code
            v-if="message !== undefined"
            v-text="message"
        />
        <pre
            v-if="stack !== undefined"
            class="overflow-x-auto"
            v-text="stack"
        />

        <v-row
            align="center"
            class="mt-2"
            justify="center"
        >
            <v-btn
                v-show="fatal"
                outlined
                rounded
                @click="reload"
            >
                <v-icon left>
                    mdi-refresh
                </v-icon>
                {{ $t('Pages.Error.Restart') }}
            </v-btn>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ApiException } from '@/types/api'

@Component({})
export default class ErrorDisplay extends Vue {
    @Prop({ type: Boolean, default: false }) fatal!: boolean

    @Prop() error!: Error | undefined
    @Prop() vm!: Vue | undefined
    @Prop() info!: string | undefined

    @Prop({ type: Number }) errorCode!: number | undefined
    @Prop({ type: String }) errorMessage!: string | undefined

    get code (): number {
        if (this.errorCode !== undefined) return this.errorCode
        if (this.error instanceof ApiException) {
            return 400
        }
        return 500
    }

    get message (): string | undefined {
        if (this.errorMessage !== undefined) return this.errorMessage
        if (this.error instanceof ApiException) {
            return this.$t('Api.Errors.' + this.error.code, this.error)
        }
        if (this.error) {
            let str = this.error.name + ': ' + this.error.message
            if (this.vm) str += ' (@ <' + this.vm.$options.name + '>)'
            if (this.info) str += ' ' + this.info
            return str
        }
        return undefined
    }

    get stack (): string | undefined {
        return this.error?.stack
    }

    reload (): void {
        location.reload()
    }
}
</script>

<style>

</style>
