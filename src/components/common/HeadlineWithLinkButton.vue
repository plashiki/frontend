<template>
    <div class="headline font-weight-bold text--primary d-flex align-center">
        <slot>{{ text }}</slot>
        &nbsp;
        <slot name="btn">
            <v-btn
                v-show="showButton && (to || href)"
                v-tooltip="tooltip"
                :href="href"
                :target="href !== undefined ? '_blank' : ''"
                :to="to"
                class="ml-1"
                icon
                small
            >
                <v-icon small>
                    {{ icon }}
                </v-icon>
            </v-btn>
        </slot>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class HeaderWithLinkButton extends Vue {
    @Prop({ type: String }) to!: string
    @Prop({ type: String }) href!: string
    @Prop({ type: String, default: 'mdi-chevron-right' }) icon!: string
    @Prop({ type: String }) tooltip!: string
    @Prop({ type: String }) text!: string
    @Prop({ type: Boolean, default: true }) showButton!: string
}
</script>

<style>

</style>
