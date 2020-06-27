<template>
    <Player
        ref="vuedio"
        class="vuedio-fill"
    />
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import Player from '@/components/player/Player.vue'
import { iziToastError } from '@/plugins/izitoast'
import { PlayerPayload } from '@/types/player'

@Component({
    components: { Player }
})
export default class PlayerPage extends Vue {
    @Ref() vuedio!: any

    mounted (): void {
        let payload: PlayerPayload
        try {
            payload = JSON.parse(this.$route.query.p as any)
            if (!payload.video) throw null
        } catch (e) {
            iziToastError(this.$t('Pages.Player.ParseFailed'), {
                timeout: 15000
            })
            return
        }
        this.vuedio.src(payload.video)
        if (payload.subtitles && payload.subtitles.src) {
            this.vuedio.subtitles(payload.subtitles.src, payload.subtitles.options, payload.subtitles.srcType)
        }

        document.head.style.overflow = 'hidden'
    }
}
</script>
