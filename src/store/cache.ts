import { VuexModule } from 'vuex-module-decorators'
import { SharedMutation, VModule } from '@/utils/vuex-sugar'
import { Media, MediaId, MediaStatus, MediaType, NameMeta } from '@/types/media'

// yes i do know about DRY but bruh
@VModule('CacheModule')
export default class CacheModule extends VuexModule {
    media: Record<string, [Media, number]> = {}
    mediaNames: Record<string, [NameMeta, number]> = {}

    @SharedMutation()
    putMediaInCache (media: Media, ttl: number | null = null): void {
        if (ttl === null) {
            ttl = media.status === MediaStatus.Released ? 86400 : 3600
        }
        this.media[`${media.type}:${media.id}`] = [media, Date.now() + ttl * 1000]
    }

    @SharedMutation()
    putMediaNamesInCache (media: Media, ttl: number | null = null): void {
        if (ttl === null) {
            ttl = media.status === MediaStatus.Released ? 86400 : 3600
        }
        this.mediaNames[`${media.type}:${media.id}`] = [media.name, Date.now() + ttl * 1000]
    }

    @SharedMutation()
    deleteMediaFromCache (id: MediaId, type: MediaType): void {
        delete this.media[`${type}:${id}`]
    }

    @SharedMutation()
    deleteMediaNamesFromCache (id: MediaId, type: MediaType): void {
        delete this.mediaNames[`${type}:${id}`]
    }
}
