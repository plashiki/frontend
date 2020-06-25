<template>
    <v-text-field
        ref="field"
        class="text--monospace"
        hide-details
        readonly
        v-bind="$attrs"
        v-on="$listeners"
    >
        <template #append-outer>
            <v-btn
                :disabled="disabled"
                icon
                @click="copy"
            >
                <v-icon>
                    mdi-content-copy
                </v-icon>
            </v-btn>
            <v-btn
                v-tooltip="$t('Pages.Applications.Revoke')"
                :disabled="disabled"
                icon
                @click="$emit('revoke')"
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
