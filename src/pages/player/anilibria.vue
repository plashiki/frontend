<template>
    <Player
        ref="vuedio"
        class="vuedio-fill"
    />
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import Player from '@/components/player/Player.vue'
import { PlayerSource } from '@/types/player'
import { iziToastError } from '@/plugins/izitoast'
import axios from 'axios'

interface AnilibriaEnvelope<T> {
    status: boolean
    data: T | null
    error?: {
        code: number
        message: string | null
        description: string | null
    }
}

interface AnilibriaRelease {
    id: number
    // anime names, for lookup
    names: string[]
    // unix timestamp in seconds but in string
    last: string
    // moonwalk (actually kodik) player.
    moon: string | null
    voices: string[]
    playlist: AnilibriaEpisode[]
}

interface AnilibriaEpisode {
    // episode number, starting from 1
    id: number
    title: string
    // sd m3u8
    sd: string
    // hd m3u8
    hd: string
    // fhd m3u8, optional
    fullhd?: string
    srcSd?: string
    srcHd?: string
}

@Component({
    components: { Player }
})
export default class AnilibriaPlayer extends Vue {
    @Ref() vuedio!: any

    mounted (): void {
        this.vuedio.controlsLocked = true

        let releaseId: string | null = Array.isArray(this.$route.query.rid) ? this.$route.query.rid[0] : this.$route.query.rid
        let episodeId = parseInt(Array.isArray(this.$route.query.eid) ? this.$route.query.eid[0] : this.$route.query.eid as any)
        if (releaseId == null || isNaN(episodeId)) {
            iziToastError('Invalid query')
        } else {
            this.vuedio.loading = true

            axios.post('https://api-proxy.plashiki.su/anilibria', `query=release&filter=playlist&id=${releaseId}`)
                .then(({ data }: { data: AnilibriaEnvelope<AnilibriaRelease> }) => {
                    if (!data.status) {
                        iziToastError(data.error!.message + '')
                    } else {
                        let found = false
                        for (let it of data.data!.playlist) {
                            if (it.id === episodeId) {
                                found = true
                                let src: PlayerSource[] = [
                                    {
                                        height: 720,
                                        src: it.hd,
                                        type: 'application/vnd.apple.mpegurl',
                                    },
                                    {
                                        height: 480,
                                        src: it.sd,
                                        type: 'application/vnd.apple.mpegurl',
                                    }
                                ]
                                if (it.fullhd) {
                                    src.unshift({
                                        height: 1080,
                                        src: it.fullhd,
                                        type: 'application/vnd.apple.mpegurl',
                                    })
                                }
                                this.vuedio.src(src)
                                break
                            }
                        }
                    }
                })
        }
    }
}
</script>

<style>

</style>
