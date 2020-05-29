<template>
    <v-text-field
        :label="service ? $t('Pages.Settings.ApiServer', { service: $t('Services.' + service) }) : undefined"
        v-bind="$attrs"
        v-model="vmodel"
    >
        <template #append>
            <v-btn
                @click="vmodel = reset"
                icon
                small
                v-tooltip="$t('Common.Action.Reset')"
            >
                <v-icon small>
                    mdi-backup-restore
                </v-icon>
            </v-btn>
            <v-btn
                @click="vmodel = proxy"
                icon
                small
                v-if="proxy"
                v-tooltip="$t('Pages.Settings.EnableProxy')"
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
