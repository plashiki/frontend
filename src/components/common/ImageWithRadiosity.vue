<template>
    <v-img
        :src="src"
        class="image-with-radiosity--container"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <img :src="src" class="image-with-radiosity--fx" />
        <slot />
    </v-img>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class ImageWithRadiosity extends Vue {
    @Prop({ required: true, type: String }) src!: string
}
</script>

<style lang="scss">
.image-with-radiosity {
    // <s>shamelessly stolen</s> inspired by apple music
    &--container {
        overflow: visible!important;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, .1), 0 10px 13px 0 rgba(0, 0, 0, .11);

        .v-image__image {
            border-radius: 4px;
        }
    }

    &--fx {
        user-select: none;
        position: absolute;
        transform: scale(.92) translateY(calc(4% + 14px));
        filter: blur(30px) brightness(130%);
        opacity: .55;
        width: 100%;
        height: 100%;
        z-index: -2;

        .theme--dark & {
            filter: blur(30px) brightness(70%);
            opacity: 0.5;
        }
    }
}
</style>
