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
                v-html="$t(`Api.Errors.${error.code}`, error)"
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
}
</script>
