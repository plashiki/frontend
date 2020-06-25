<template>
    <v-menu
        v-model="visible"
        :close-on-content-click="false"
        top
    >
        <template #activator="{ on }">
            <slot :on="on" />
        </template>

        <v-simple-card>
            <v-text-field
                ref="input"
                v-model="reasonInput"
                :label="$t('Pages.Moderation.DeclineReason')"
                dense
                hide-details
                @keyup.enter="send"
            >
                <template #prepend>
                    <v-btn
                        icon
                        small
                        @click="send"
                    >
                        <v-icon
                            color="success"
                            small
                        >
                            mdi-check
                        </v-icon>
                    </v-btn>
                </template>
            </v-text-field>
        </v-simple-card>
    </v-menu>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator'
import VSimpleCard from '@/components/common/VSimpleCard.vue'

@Component({
    components: { VSimpleCard }
})
export default class DeclineReasonMenu extends Vue {
    @Ref() input!: Vue

    reasonInput = ''
    visible = false


    send (): void {
        this.$emit('send', this.reasonInput)
        this.visible = false
    }

    @Watch('visible')
    visibilityChanged (val: boolean): void {
        if (!val) {
            this.reasonInput = ''
        } else {
            this.$nextTick(() => (this.input.$el as HTMLElement).focus())
        }
    }

}
</script>

<style>

</style>
