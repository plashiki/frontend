<template>
    <v-app :dark="isDark">
        <AppNavigation
            v-if="showAppBar && showNavBar"
            :current-title="navTitle"
            :visible="miniNavBar || navigationVisible"
            :mini="miniNavBar"
            @update:visible="navigationVisible = $event"
        />

        <v-app-bar
            v-if="showAppBar"
            :hide-on-scroll="$r12s.isMobileByWidth || $r12s.screenHeight < 480"
            :scroll-threshold="50"
            :dark="isDark"
            dense
            flat
            app
        >
            <v-app-bar-nav-icon
                v-if="showNavBar && !miniNavBar"
                class="mr-1"
                @click="navigationVisible = !navigationVisible"
            />
            <v-toolbar-title v-if="!showSearch">
                {{ innerTitle }}
            </v-toolbar-title>

            <v-spacer />

            <v-text-field
                v-if="showSearch"
                v-model="searchInput"
                :label="$t('Pages.Search.Name')"
                class="search-field"
                append-icon="mdi-magnify"
                dense
                solo
                flat
                hide-details
                @blur="$route.name === 'search' && doSearch()"
                @click:append="doSearch"
                @keyup.enter="doSearch"
            />

            <v-spacer />

            <v-btn
                v-show="!webSocketStatus.isOnline || connectionIndicator"
                v-tooltip="{ content: webSocketStatusTooltip, hideOnTargetClick: false, trigger: 'hover click focus' }"
                class="ml-1"
                icon
                small
                @click="webSocketStatus.state !== 0 && forceReconnection()"
            >
                <v-avatar
                    :color="webSocketStatus.isOnline ? 'green' : 'transparent'"
                    size="12"
                >
                    <v-fade-transition>
                        <v-progress-circular
                            v-show="!webSocketStatus.isOnline"
                            indeterminate
                            size="12"
                            width="2"
                        />
                    </v-fade-transition>
                </v-avatar>
            </v-btn>

            <v-btn
                v-show="showUpdateButton"
                v-tooltip="$t('Common.Action.Update')"
                :disabled="loading === true || updateDisabled"
                class="ml-1"
                icon
                @click="updateClicked"
            >
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
            <NotificationsDialog
                #default="{ on }"
            >
                <v-btn
                    v-tooltip="$t('Items.Notification.NamePlural')"
                    class="ml-1 mr-n3"
                    icon
                    v-on="on"
                >
                    <v-icon>mdi-bell</v-icon>
                </v-btn>
            </NotificationsDialog>
            <v-progress-linear
                :active="loading === true"
                absolute
                bottom
                indeterminate
            />
        </v-app-bar>

        <v-main>
            <v-container v-if="useContainer">
                <slot />
            </v-container>
            <slot v-else />
        </v-main>

        <Notification
            :item="currentNotification"
            absolute
            @click="onCurrentNotificationClick"
            @close="onCurrentNotificationClick"
        />
    </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import AppNavigation from '@/components/common/AppNavigation.vue'
import { nop, sleep } from '@/utils/helpers'
import { appStore, configStore, notificationsStore } from '@/store'
import NotificationsDialog from '@/components/notifications/NotificationsDialog.vue'
import { createWebSocket, webSocketEventBus, webSocketStatus } from '@/api/internal/websocket'
import Notification from '@/components/notifications/Notification.vue'
import { ApiNotification } from '@/types/notification'
import { WebSocketStatusState } from '@/types/api'
import { merge } from '@/utils/object-utils'
import { markAsSeen } from '@/api/notifications'

@Component({
    components: { Notification, NotificationsDialog, AppNavigation }
})
export default class DefaultLayout extends Vue {
    navigationVisible = window.innerWidth > 1264

    webSocketStatus = webSocketStatus
    updateDisabled = false

    currentNotification: ApiNotification | null = null
    currentNotificationPromise: Promise<void> | null = null

    get isDark (): boolean {
        return configStore.dark
    }

    get showSearch (): boolean {
        return appStore.showSearch
    }

    get searchInput (): string {
        return appStore.searchInput
    }

    set searchInput (val: string) {
        appStore.merge({
            searchInput: val
        })
    }

    get connectionIndicator (): boolean {
        return configStore.connectionIndicator
    }

    get innerTitle (): string {
        return appStore.innerTitle ?? appStore.pageTitle ?? ''
    }

    get navTitle (): string | null {
        return appStore.navTitle ?? null
    }

    get showAppBar (): boolean {
        return !appStore.hideAppBar
    }

    get showNavBar (): boolean {
        return !appStore.hideNavBar
    }

    get showUpdateButton (): boolean {
        return appStore.showUpdateButton
    }

    get loading (): boolean {
        return appStore.loading
    }

    get webSocketStatusTooltip (): string {
        if (webSocketStatus.state === WebSocketStatusState.CONNECTED) {
            return this.$t('Common.Network.Connected') as string
        }
        if (webSocketStatus.state === WebSocketStatusState.CONNECTING) {
            return this.$t('Common.Network.Connecting') as string
        }
        if (webSocketStatus.state === WebSocketStatusState.WAITING) {
            return this.$tc('Common.Network.ReconnectingInN', webSocketStatus.attemptIn + 1) as string
        }
        return ''
    }

    get useContainer (): boolean {
        return !this.$route.meta.full
    }

    get miniNavBar (): boolean {
        return configStore.drawerStyle !== 'normal' && this.$r12s.screenWidth > 1264
    }

    @Watch('isDark')
    onDarkModeChanged (val: boolean): void {
        this.$vuetify.theme.dark = val

        // set vuetify colors
        merge(this.$vuetify.theme.themes[val ? 'dark' : 'light'], val ? configStore.darkColors : configStore.lightColors)
    }

    @Watch('$r12s.screenWidth')
    onScreenWidthChanged () {
        if (window.innerWidth > 1264) this.navigationVisible = true
    }

    doSearch (): void {
        this.$router.push({
            name: 'search',
            query: {
                q: this.searchInput
            }
        }).catch(nop)
    }

    forceReconnection (): void {
        if (webSocketStatus.state !== WebSocketStatusState.CONNECTING) {
            createWebSocket(true)
        }
    }

    updateClicked (): void {
        let res = (this.$route.matched[0]?.instances?.default as any)?.requestUpdate?.()
        if (res instanceof Promise) {
            this.updateDisabled = true
            res.finally(() => {
                this.updateDisabled = false
            })
        }
    }

    onCurrentNotificationClick (): void {
        if (!this.currentNotification) return

        notificationsStore.updateNotification({
            $id: this.currentNotification.id,
            seen: true
        })
        markAsSeen(this.currentNotification.id)
        this.currentNotification = null
    }

    onNotification (notification: ApiNotification): void {
        if (notification.payload.type === 'silent-push') {
            // we dont want to show a heads-up for it.
            return
        }

        let handler = (): void => {
            this.currentNotification = notification
            this.currentNotificationPromise = sleep(5000).then(() => {
                this.currentNotification = null
                this.currentNotificationPromise = null

                return sleep(500) // so it can fade away
            })
        }

        if (this.currentNotificationPromise) {
            this.currentNotificationPromise.then(handler)
        } else {
            handler()
        }
    }

    mounted (): void {
        this.onDarkModeChanged(configStore.dark)
        this.onNotification = this.onNotification.bind(this)

        webSocketEventBus.$on('push', this.onNotification)
    }

    beforeDestroy (): void {
        webSocketEventBus.$off('push', this.onNotification)
    }
}
</script>

<style>
.theme--light.search-field.v-text-field--solo.v-input--is-focused > .v-input__control > .v-input__slot {
    background: #e6e6e6 !important;
}

.theme--light.search-field.v-text-field--solo > .v-input__control > .v-input__slot {
    background: #f2f2f2 !important;
}

.theme--dark.search-field.v-text-field--solo.v-input--is-focused > .v-input__control > .v-input__slot {
    background: #212121 !important;
}

.theme--dark.search-field.v-text-field--solo > .v-input__control > .v-input__slot {
    background: #2e2e2e !important;
}
</style>
