<template>
    <div :class="{ dark }" class="l-preloader" />
</template>

<script lang="ts">
// this is a special layout which is displayed between html pre-loader and
// an actual component. we want it to be as small and instant as possible,
// so basically we use almost same as in html pre-loader but without
// actual loader
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class LoadingLayout extends Vue {
    dark = false

    mounted (): void {
        this.dark = this.$store.state.ConfigModule?.dark === true
    }
}
</script>

<style>
.l-preloader {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 0;
    background: #fafafa;
}

.l-preloader.dark {
    background: #303030;
}
</style>
