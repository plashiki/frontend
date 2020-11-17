<template>
    <v-slide-x-reverse-transition>
        <v-card
            v-if="shouldShow"
            :class="{ 'notification__absolute': absolute }"
            :elevation="absolute ? 6 : 0"
            :href="!internal ? url : undefined"
            :outlined="!absolute"
            :ripple="url !== undefined"
            :target="!internal ? '_blank' : undefined"
            :to="internal ? url : undefined"
            class="overflow-hidden"
            v-bind="{ height: 150, ...$attrs }"
            v-on="$listeners"
        >
            <v-layout
                fill-height
                flex-nowrap
            >
                <v-progress-linear
                    v-if="item.progress !== undefined"
                    :active="item.progress !== 1"
                    :indeterminate="item.progress === -1"
                    :value="item.progress * 100"
                    absolute
                    top
                />
                <v-img
                    v-if="!!item.payload.image"
                    :lazy-src="item.payload.smallImage"
                    :src="item.payload.image"
                    height="150"
                    width="100"
                />
                <v-avatar v-if="icon !== null">
                    <v-icon :color="icon[1]">
                        {{ icon[0] }}
                    </v-icon>
                </v-avatar>
                <v-layout
                    class="pa-2"
                    column
                >
                    <v-layout
                        align-center
                        flex-grow-0
                        flex-nowrap
                    >
                        <h4 class="flex-grow-1 text-truncate">
                            {{ title }}
                        </h4>
                        <v-btn
                            v-if="closeButton"
                            class="flex-shrink-1"
                            icon
                            small
                            @click.stop.prevent="$emit('close')"
                            @mousedown.stop
                            @touchstart.native.stop
                        >
                            <v-icon small>
                                mdi-close
                            </v-icon>
                        </v-btn>
                    </v-layout>
                    <div
                        class="grey--text caption text-truncate mt-n1 mb-1"
                        style="min-height: 1rem"
                    >
                        {{ timeDelta }}
                        <v-icon
                            v-if="item.payload.type === 'silent-push'"
                            x-small
                        >
                            mdi-bell-off
                        </v-icon>
                    </div>
                    <div class="body-2 overflow-y-auto">
                        {{ body }}
                    </div>
                    <v-spacer />
                </v-layout>
            </v-layout>
        </v-card>
    </v-slide-x-reverse-transition>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { formatRelative } from 'date-fns'
import { dateFnLocale } from '@/plugins/vue-i18n'
import { ApiNotification } from '@/types/notification'
import { getNotificationBody, getNotificationIcon, getNotificationTitle } from '@/utils/notification-utils'

@Component({})
export default class Notification extends Vue {
    @Prop() item!: ApiNotification
    @Prop({ type: Boolean, default: false }) absolute!: boolean
    @Prop({ type: Boolean, default: true }) visible!: boolean
    @Prop({ type: Boolean, default: true }) closeButton!: boolean

    cachedBody: string | null = null
    bodyPromise: Promise<void> | null = null

    get internal (): boolean {
        return this.item.payload.url?.startsWith('$domain') ?? false
    }

    get url (): string | undefined {
        return this.internal ? this.item.payload.url?.substr(7) : this.item.payload.url
    }

    get timeDelta (): string | undefined {
        if (!this.item.time) return undefined
        return formatRelative(new Date(this.item.time), new Date(), {
            locale: dateFnLocale()
        })
    }

    get shouldShow (): boolean {
        return this.item && (this.absolute ? this.item.payload?.type === 'push' && this.visible : this.visible)
    }

    get title (): string {
        if (!this.item || !this.item.payload) return ''
        return getNotificationTitle(this.item)
    }

    get body (): string {
        return getNotificationBody(this.item)
    }

    get icon (): [string, string] | null {
        if (!this.item || !this.item.payload) return null
        return getNotificationIcon(this.item)
    }
}
</script>

<style>
.notification__absolute {
    position: fixed !important;
    bottom: 0;
    right: 0;
    max-width: 360px !important;
    margin: 16px;
}
</style>
