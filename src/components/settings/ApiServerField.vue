<template>
    <v-text-field
        v-model="vmodel"
        :label="service ? $t('Pages.Settings.ApiServer', { service: $t('Services.' + service) }) : undefined"
        v-bind="$attrs"
    >
        <template #append>
            <v-btn
                v-tooltip="$t('Common.Action.Reset')"
                icon
                small
                @click="vmodel = reset"
            >
                <v-icon small>
                    mdi-backup-restore
                </v-icon>
            </v-btn>
            <v-btn
                v-if="proxy"
                v-tooltip="$t('Pages.Settings.EnableProxy')"
                icon
                small
                @click="vmodel = proxy"
            >
                <v-icon small>
                    mdi-server-network
                </v-icon>
            </v-btn>
        </template>
    </v-text-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class ApiServerField extends Vue {
    @Prop({ default: null }) value!: string
    @Prop({ type: String }) service!: string
    @Prop({ type: String, required: true }) reset!: string
    @Prop({ type: String }) proxy!: string

    get vmodel (): string | null {
        return this.value
    }

    set vmodel (val: string | null) {
        this.$emit('input', val)
    }
}
</script>

<style>

</style>
