<template>
    <v-avatar
        class="avatar-view"
        v-bind="$attrs"
    >
        <transition transition="fade-transition">
            <div
                v-if="src == null"
                class="blue-grey lighten-5 avatar-view--placeholder"
            >
                <v-icon
                    color="blue-grey darken-4"
                    v-text="placeholderIcon"
                />
            </div>
            <v-img
                v-else
                :src="src"
                v-bind="imgProps"
                @error="$emit('error', $event)"
            />
        </transition>

        <div
            v-if="!noEdit && !loading"
            v-ripple
            class="avatar-view--overlay"
            v-on="$listeners.click ? { click: $listeners.click } : {}"
        >
            <v-icon
                color="white"
                size="12"
            >
                mdi-image-edit
            </v-icon>
        </div>

        <transition name="fade-transition">
            <div
                v-if="loading"
                class="avatar-view--loading"
            >
                <v-progress-circular
                    color="white"
                    indeterminate
                />
            </div>
        </transition>
    </v-avatar>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class AvatarView extends Vue {
    @Prop() src!: string
    @Prop({ type: Boolean, default: false }) noEdit!: string
    @Prop({ default: 'mdi-camera' }) placeholderIcon!: string
    @Prop({ default: () => ({}) }) imgProps!: string
    @Prop({ type: Boolean, default: false }) loading!: string
}
</script>

<style lang="scss">
.avatar-view {
    position: relative;
    cursor: pointer;

    &--overlay {
        text-align: center;
        background: rgba(0, 0, 0, 0.5);
        position: absolute;
        height: 40%;
        width: 100%;
        bottom: -40%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        color: white;
        transition: bottom 250ms ease-out;
    }

    &:hover &--overlay {
        bottom: 0;
    }

    &--placeholder {
        width: 100%;
        height: 100%;
    }

    &--loading {
        position: absolute;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style>
