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
                v-html="$t(`Api.Errors.${error.code}`, error)"
                v-if="error && error.code"
            />
            <span
                v-else-if="error"
                v-text="error.message"
                v-tooltip="error.stack && error.stack.replace(/\n/g, '<br>')"
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
