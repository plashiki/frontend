<template>
    <v-menu
        v-model="visible"
        :close-on-content-click="false"
        offset-y
        transition="slide-x-reverse-transition"
    >
        <template #activator="{ on }">
            <v-badge
                :content="missed"
                :offset-x="24"
                :offset-y="24"
                :value="missed > 0"
                color="red"
            >
                <slot v-bind="{ on }" />
            </v-badge>
        </template>
        <v-sheet
            :style="{ maxHeight: Math.min($r12s.screenHeight * 0.75, 600) + 'px' }"
            class="layout column notification-dialog--list"
        >
            <v-card-title class="px-3 py-1">
                <span>
                    {{ $t('Items.Notification.NamePlural') }}
                </span>
            </v-card-title>
            <v-divider />

            <template v-if="webPushSupported && authenticated">
                <v-switch
                    ref="browserPushSwitch"
                    :disabled="pushPermission === false"
                    :input-value="this.pushPermission === null ? false : pushPermission"
                    :label="$t('Items.Notification.BrowserPush')"
                    class="ma-2 mb-3"
                    hide-details
                    @change="toggleBrowserPush"
                />
                <v-divider />
            </template>

            <v-card-text class="overflow-y-auto">
                <virtual-grid
                    v-if="items.length > 0"
                    ref="grid"
                    #default="{ item }"
                    :fixed-height="150"
                    :gap-y="8"
                    :items="items"
                    :max-columns="1"
                    @visibilitychange="onNotificationVisible($event.item, $event.visible)"
                >
                    <Notification
                        :item="item"
                        :close-button="false"
                        @click="visible = false"
                    />
                </virtual-grid>
                <v-row
                    v-else
                    align="center"
                    class="grey--text font-weight-bold"
                    justify="center"
                    style="height: 120px"
                >
                    {{ $t('Items.Notification.Zero') }}
                </v-row>
            </v-card-text>
        </v-sheet>
    </v-menu>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator'
import { authStore, notificationsStore } from '@/store'
import Notification from '@/components/notifications/Notification.vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'
import { markAsSeen, registerFirebaseToken } from '@/api/notifications'
import { ApiNotification } from '@/types/notification'
import IndexedDBClient from '@/utils/indexed-db-client'
import { firebaseMessaging } from '@/plugins/firebase'
import { iziToastError } from '@/plugins/izitoast'
import { getPermission, isInternalNotification } from '@/utils/notification-utils'

const idb = new IndexedDBClient()

@Component({
    components: { VirtualGrid, Notification }
})
export default class NotificationsDialog extends Vue {
    @Ref() grid!: any

    pushPermission: boolean | null = null
    browserPush = false
    visible = false

    get authenticated (): boolean {
        return authStore.authenticated
    }

    get items (): ApiNotification[] {
        return notificationsStore.items.filter(it => !isInternalNotification(it)) as any
    }

    get missed (): number {
        return this.items.filter(i => !i.seen).length
    }

    get webPushSupported (): boolean {
        if ((window as any).safari) {
            // safari has own proprietary thing.
            // im not sure if they have global Notification since i dont have a mac
            // but as a precaution...
            return false
        }
        return typeof window.Notification !== 'undefined' && firebaseMessaging !== null
    }

    toggleBrowserPush (val: boolean): void {
        if (this.pushPermission === null) {
            getPermission(true).then((perm) => {
                this.pushPermission = perm
                this.toggleBrowserPush(val)
                if (perm) {
                    firebaseMessaging!.getToken().then((token) => {
                        authStore.setFirebaseToken(token)
                        return registerFirebaseToken(token)
                    }).catch(iziToastError)
                } else {
                    iziToastError(this.$t('Items.Notification.BrowserPushDeclined'))
                }
            });
            (this.$refs.browserPushSwitch as any).lazyValue = false
        } else if (this.pushPermission) {
            idb.set('browserPush', val)
        } else {
            (this.$refs.browserPushSwitch as any).lazyValue = false
        }
    }

    @Watch('visible')
    onVisibilityChanged (val: boolean): void {
        // force grid to emit visibility events once grid is actually visible
        if (val && this.items.length) {
            this.$nextTick(() => {
                this.grid.updateVisibleItems(true)
            })
        }
    }

    onNotificationVisible (item?: ApiNotification<any>, visible?: boolean): void {
        if (item && !item?.seen && visible && this.visible) {
            notificationsStore.updateNotification({
                $id: item.id,
                seen: true
            })
            markAsSeen(item.id)
        }
    }

    onNotificationClose (item: ApiNotification<any>): void {
        notificationsStore.removeNotification(item.id)
    }

    mounted (): void {
        getPermission().then((perm) => {
            this.pushPermission = perm
        })
        idb.get('browserPush', false).then((val) => {
            this.browserPush = val!
        })
    }
}
</script>

<style>
.notification-dialog--list {
    max-width: 400px;
    min-width: 320px;
}
</style>
