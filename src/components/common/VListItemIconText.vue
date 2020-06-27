<template>
    <v-list-item
        v-bind="$attrs"
        v-on="$listeners"
    >
        <v-list-item-icon>
            <slot name="icon">
                <v-icon>{{ icon }}</v-icon>
            </slot>
        </v-list-item-icon>

        <v-list-item-content>
            <v-list-item-title>
                {{ title }}
            </v-list-item-title>
        </v-list-item-content>

        <v-list-item-action v-if="withAction">
            <slot name="right" />
        </v-list-item-action>
    </v-list-item>
</template>

<script lang="ts">
// shorthand for simple icon-text <v-list-item> with optional action
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class VListItemIconText extends Vue {
    @Prop({ type: String }) icon!: string
    @Prop({ required: true, type: String }) title!: string
    @Prop({ default: false, type: Boolean }) withAction!: string
}
</script>

<style>

</style>
