<template>
    <div id="app">
        <component :is="layout">
            <router-view v-if="error === null" />
            <ErrorDisplay
                v-else
                :error="error[0]"
                :info="error[2]"
                :vm="error[1]"
                fatal
            />
        </component>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import DefaultLayout from '@/layouts/default.vue'
import { appStore, configStore } from '@/store'
import { setHtmlThemeColor, titleTemplate } from '@/utils/helpers'
import EmptyLayout from '@/layouts/empty.vue'
import PlainLayout from '@/layouts/plain.vue'
import ErrorDisplay from '@/components/common/ErrorDisplay.vue'
import LoadingLayout from '@/layouts/loading.vue'

@Component({
    components: {
        ErrorDisplay,
        DefaultLayout,
        EmptyLayout,
        PlainLayout,
        LoadingLayout
    }
})
export default class VueApp extends Vue {
    error: [Error, Vue, string] | null = null

    get layout (): string {
        // this prevents flickering when first page loads.
        // without it default layout will appear for a few moments even if another is passed in meta
        if (!this.$route.matched.length) return 'plain-layout'
        return (this.$route.meta?.layout ?? 'default') + '-layout'
    }

    get pageTitle (): string {
        return appStore.pageTitle ?? ''
    }

    get isDark (): boolean {
        return configStore.dark
    }

    @Watch('pageTitle')
    onPageTitleChange (val: string) {
        document.title = titleTemplate(val)
    }

    errorCaptured (err: Error, vm: Vue, info: string): void {
        this.error = [err, vm, info]
        // eslint-disable-next-line
        console.error(err)
    }

    @Watch('isDark')
    onDarkModeChanged (val: boolean): void {
        // sets default background color to prevent flicker
        // also sets background color for page scrollbar
        if (val) {
            setHtmlThemeColor('#272727')
            document.documentElement.classList.remove('light')
            document.documentElement.classList.add('dark')
        } else {
            setHtmlThemeColor('#fbfbfb')
            document.documentElement.classList.remove('dark')
            document.documentElement.classList.add('light')
        }
    }

    mounted (): void {
        this.onPageTitleChange(appStore.pageTitle ?? '')
    }
}
</script>

<style lang="scss">
@import "assets/main.scss";
</style>
