import { LocalSharedMutation, VLocalModule } from '@/utils/vuex-sugar'
import { VuexModule } from 'vuex-module-decorators'
import { storedNotificationsLimit } from '@/config'
import { createIndex, indexOfBy, merge } from '@/utils/object-utils'
import { ApiNotification } from '@/types/notification'

@VLocalModule('NotificationsModule')
export default class NotificationsModule extends VuexModule {
    items: ApiNotification[] = []
    lastSyncTime = 0

    @LocalSharedMutation()
    addNotifications (items: ApiNotification | ApiNotification[]): void {
        if (!Array.isArray(items)) items = [items]
        this.items.unshift(...items)

        while (this.items.length > storedNotificationsLimit) {
            this.items.pop()
        }
    }

    @LocalSharedMutation()
    updateLastSyncTime (time: number): void {
        this.lastSyncTime = time
    }

    @LocalSharedMutation()
    updateNotification (data: { $id: number | number[] } & Partial<ApiNotification>): void {
        let index = createIndex(Array.isArray(data.$id) ? data.$id : [data.$id], i => i)
        this.items.forEach(it => {
            if (it.id in index) {
                merge(it, data)
            }
        })
    }

    @LocalSharedMutation()
    removeNotification (ids: number | number[]): void {
        if (!Array.isArray(ids)) {
            ids = [ids]
        }
        ids.forEach((id) => {
            const index = indexOfBy(this.items, it => it.id === id)
            if (index !== -1) this.items.splice(index, 1)
        })
    }
}
