import { LocalSharedMutation, VLocalModule } from '@/utils/vuex-sugar'
import { VuexModule } from 'vuex-module-decorators'
import { storedNotificationsLimit } from '@/config'
import { indexOfBy, merge } from '@/utils/object-utils'
import { ApiNotification } from '@/types/notification'

@VLocalModule()
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
    updateNotification (data: Partial<ApiNotification>): void {
        this.items.forEach(it => {
            if (it.id === data.id) {
                merge(it, data)
            }
        })
    }

    @LocalSharedMutation()
    removeNotification (id: number): void {
        const index = indexOfBy(this.items, it => it.id === id)
        if (index !== -1) this.items.splice(index, 1)
    }

    @LocalSharedMutation()
    clear (): void {
        this.items = []
    }
}
