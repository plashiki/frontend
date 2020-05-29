<template>
    <v-text-field
        class="text--monospace"
        hide-details
        readonly
        ref="field"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <template #append-outer>
            <v-btn
                :disabled="disabled"
                @click="copy"
                icon
            >
                <v-icon>
                    mdi-content-copy
                </v-icon>
            </v-btn>
            <v-btn
                :disabled="disabled"
                @click="$emit('revoke')"
                icon
                v-tooltip="$t('Pages.Applications.Revoke')"
            >
                <v-icon>
                    mdi-key-remove
                </v-icon>
            </v-btn>
        </template>
    </v-text-field>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator'

@Component({})
export default class TokenField extends Vue {
    @Ref() field!: any
    @Prop({ type: Boolean, default: false }) disabled!: boolean

    copy (): void {
        const el = this.field.$el.querySelector('input') as HTMLInputElement
        el.select()
        document.execCommand('copy')
    }
}
</script>

<style>

</style>
