<template>
    <v-menu
        v-model="visible"
        :close-on-content-click="false"
        top
        :min-width="width"
    >
        <template #activator="{ on }">
            <slot :on="on" />
        </template>

        <v-simple-card class="pt-3">
            <v-text-field
                ref="input"
                v-model="textInput"
                dense
                hide-details
                v-bind="$attrs"
                @keyup.enter="send"
            >
                <template #prepend>
                    <v-btn
                        icon
                        small
                        @click="send"
                    >
                        <v-icon
                            :color="iconColor"
                            small
                            v-text="icon"
                        />
                    </v-btn>
                </template>
            </v-text-field>
        </v-simple-card>
    </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import VSimpleCard from '@/components/common/VSimpleCard.vue'

@Component({
    components: { VSimpleCard }
})
export default class PopupTextInput extends Vue {
    @Prop({ type: String, default: '' }) default!: string
    @Prop({ type: Number, default: 240 }) width!: number
    @Prop({ type: String, default: 'mdi-check' }) icon!: string
    @Prop({ type: String, default: 'success' }) iconColor!: string

    @Ref() input!: Vue

    textInput = ''
    visible = false


    send (): void {
        this.$emit('send', this.textInput)
        this.visible = false
    }

    @Watch('visible')
    visibilityChanged (val: boolean): void {
        if (!val) {
            this.textInput = this.default
        } else {
            this.$nextTick(() => (this.input.$el as HTMLElement).focus())
        }
    }

    @Watch('default')
    defaultChanged () {
        this.textInput = this.default
    }

    mounted () {
        this.defaultChanged()
    }

}
</script>

<style>

</style>
