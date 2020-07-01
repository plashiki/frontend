<template>
    <v-alert
        :value="error != null"
        border="left"
        color="error"
        dismissible
        icon="mdi-alert"
        text
        transition="slide-y-transition"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <template
            #default
        >
            <span
                v-if="error && error.code"
                v-html="html"
            />
            <span
                v-else-if="error"
                v-tooltip="error.stack && error.stack.replace(/\n/g, '<br>')"
                v-text="error.message"
            />
            <slot v-if="error" />
        </template>
    </v-alert>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ApiException } from '@/types/api'

@Component({})
export default class ErrorAlert extends Vue {
    @Prop() error?: ApiException

    get html (): string {
        if (!this.error) return ''
        if (this.error.code?.startsWith('TRANSLATION_DUPLICATE_')) {
            return this.$t('Api.Errors.TRANSLATION_DUPLICATE', { description: this.error.code.substr(22) })
        }

        return this.$t(`Api.Errors.${this.error.code}`, this.error)
    }
}
</script>
