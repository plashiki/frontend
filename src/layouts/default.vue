<template>
    <v-app :dark="isDark">
        <AppNavigation
            :current-title="navTitle"
            :visible.sync="navigationVisible"
            v-if="showAppBar && showNavBar"
        />

        <v-app-bar
            app
            dark
            v-if="showAppBar"
        >
            <v-app-bar-nav-icon
                @click="navigationVisible = !navigationVisible"
                class="mr-1"
                v-if="showNavBar"
            />
            <v-toolbar-title v-if="!showSearch">
                {{ innerTitle }}
            </v-toolbar-title>

            <v-spacer />

            <v-text-field
                :label="$t('Pages.Search.Name')"
                @blur="$route.name === 'search' && doSearch()"
                @click:append="doSearch"
                @keyup.enter="doSearch"
                append-icon="mdi-magnify"
                flat
                hide-details
                solo-inverted
                v-if="showSearch"
                v-model="searchInput"
            />

            <v-spacer />

            <v-btn
                @click="webSocketStatus.state !== 0 && forceReconnection()"
                class="ml-1"
                icon
                small
                v-show="!webSocketStatus.isOnline || connectionIndicator"
                v-tooltip="{ content: webSocketStatusTooltip, hideOnTargetClick: false, trigger: 'hover click focus' }"
            >
                <v-avatar
                    :color="webSocketStatus.isOnline ? 'green' : 'transparent'"
                    size="12"
                >
                    <v-fade-transition>
                        <v-progress-circular
                            indeterminate
                            size="12"
                            v-show="!webSocketStatus.isOnline"
                            width="2"
                        />
                    </v-fade-transition>
                </v-avatar>
            </v-btn>

            <v-btn
                :disabled="loading === true || updateDisabled"
                @click="updateClicked"
                class="ml-1"
                icon
                v-show="showUpdateButton"
                v-tooltip="$t('Common.Action.Update')"
            >
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
            <NotificationsDialog>
                <template #default="{ on }">
                    <v-btn
                        class="ml-1 mr-n3"
                        icon
                        v-on="on"
                        v-tooltip="$t('Items.Notification.NamePlural')"
                    >
                        <v-icon>mdi-bell</v-icon>
                    </v-btn>
                </template>
            </NotificationsDialog>
            <v-progress-linear
                :active="loading === true"
                absolute
                bottom
                indeterminate
            />
        </v-app-bar>

        <v-content>
            <v-container>
                <slot />
            </v-container>
        </v-content>

        <Notification
            :item="currentNotification"
            @click="onCurrentNotificationClick"
            @close="onCurrentNotificationClick"
            absolute
        />
    </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import AppNavigation from '@/components/common/AppNavigation.vue'
import { sleep } from '@/utils/helpers'
import { appStore, configStore, notificationsStore } from '@/store'
import NotificationsDialog from '@/components/notifications/NotificationsDialog.vue'
import { createWebSocket, webSocketEventBus, webSocketStatus } from '@/api'
import Notification from '@/components/notifications/Notification.vue'
import { ApiNotification } from '@/types/notification'
import { WebSocketStatusState } from '@/types/api'
import { merge } from '@/utils/object-utils'

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

    @Watch('isDark')
    onDarkModeChanged (val: boolean): void {
        this.$vuetify.theme.dark = val

        // set vuetify colors
        merge(this.$vuetify.theme.themes[val ? 'dark' : 'light'], val ? configStore.darkColors : configStore.lightColors)
    }

    doSearch (): void {
        this.$router.push({
            name: 'search',
            query: {
                q: this.searchInput
            }
        })
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
            id: this.currentNotification.id,
            new: false
        })
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
