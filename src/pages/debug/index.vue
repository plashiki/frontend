<template>
    <div>
        <div>
            ok so here we have some debug stuff. development build only.
        </div>

        <Player
            ref="vuedio"
            style="width: 640px; height: 360px; margin: 16px;"
        />
        <v-btn @click="loadMp4">MP4</v-btn>
        <v-btn @click="loadMp4Qualities">MP4-quals</v-btn>
        <v-btn @click="loadMp4Concat">MP4-concat</v-btn>
        <v-btn @click="loadMp4QualitiesConcat">MP4-concat-quals</v-btn>
        <v-btn @click="loadDash">DASH</v-btn>
        <v-btn @click="loadHls">HLS</v-btn>
        <br />
        <v-btn @click="addSubtitlesTest">subtitles(test)</v-btn>
        <v-btn @click="addSubtitlesKaraoke">subtitles(karaoke)</v-btn>


        <!--        <ImageUploadMenu-->
        <!--            @save="src = $event"-->
        <!--            :src="src"-->
        <!--        >-->
        <!--            <template #default="{ on }">-->
        <!--                <AvatarView-->
        <!--                    :src="src"-->
        <!--                    v-on="on"-->
        <!--                />-->
        <!--            </template>-->
        <!--        </ImageUploadMenu>-->
        <!--        <VirtualGrid-->
        <!--            :items="items"-->
        <!--            :aspect-ratio="1"-->
        <!--            :min-columns="2"-->
        <!--            :max-columns="10"-->
        <!--            :gap-x="8"-->
        <!--            :gap-y="12"-->
        <!--            @visibilitychange="lol"-->
        <!--        >-->
        <!--            <template #default="{ item }">-->
        <!--                <div-->
        <!--                    class="d-flex fill-height align-center justify-center title"-->
        <!--                    style="border: 1px solid red"-->
        <!--                >-->
        <!--                    {{ item }}-->
        <!--                </div>-->
        <!--            </template>-->
        <!--        </VirtualGrid>-->
    </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import PlayPauseIcon from '@/components/player/PlayPauseIcon.vue'
import PlayerSeekbar from '@/components/player/PlayerSeekbar.vue'
import Player from '@/components/player/Player.vue'
import ImageUploadMenu from '@/components/avatar/AvatarUploadMenu.vue'
import AvatarView from '@/components/avatar/AvatarView.vue'
import Application from '@/components/apps/Application.vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'

@Component({
    components: { VirtualGrid, Application, AvatarView, ImageUploadMenu, Player, PlayerSeekbar, PlayPauseIcon }
})
export default class DebugPage extends Vue {
    @Ref() vuedio!: any

    // items: string[] = []

    src = null

    // mounted (): void {
    //     for (let i = 0; i < 100; i++) {
    //         this.items.push('N' + i)
    //     }
    // }

    lol (arg: any): void {
        console.log(arg.item, arg.visible)
    }

    loadMp4 () {
        this.vuedio.src({
            type: 'video/mp4',
            src: 'https://openings.moe/video/ToaruKagakuNoRailgunS-OP01-NCBD.webm'
        })
    }

    loadMp4Qualities () {
        this.vuedio.src(
            [
                {
                    height: 240,
                    type: 'video/mp4',
                    src: 'https://vjs.zencdn.net/v/oceans.mp4#240'
                },
                {
                    height: 360,
                    type: 'video/mp4',
                    src: 'https://vjs.zencdn.net/v/oceans.mp4#360'
                },
                {
                    height: 720,
                    type: 'video/mp4',
                    src: 'https://vjs.zencdn.net/v/oceans.mp4#720'
                }
            ]
        )
    }

    loadMp4Concat () {
        this.vuedio.src({
            type: 'video/mp4',
            // note that urls must be different, otherwise player will count them as same videos.
            urls: ['https://vjs.zencdn.net/v/oceans.mp4#1', 'https://vjs.zencdn.net/v/oceans.mp4#2']
        })
    }

    loadMp4QualitiesConcat () {
        this.vuedio.src(
            [
                {
                    height: 240,
                    type: 'video/mp4',
                    urls: ['https://vjs.zencdn.net/v/oceans.mp4#240-1', 'https://vjs.zencdn.net/v/oceans.mp4#240-2']
                },
                {
                    height: 360,
                    type: 'video/mp4',
                    urls: ['https://vjs.zencdn.net/v/oceans.mp4#360-1', 'https://vjs.zencdn.net/v/oceans.mp4#360-2']
                },
                {
                    height: 720,
                    type: 'video/mp4',
                    urls: ['https://vjs.zencdn.net/v/oceans.mp4#720-1', 'https://vjs.zencdn.net/v/oceans.mp4#720-2']
                }
            ]
        )
    }

    loadDash () {
        this.vuedio.src({
            type: 'application/dash+xml',
            src: 'https://dash.akamaized.net/envivio/Envivio-dash2/manifest.mpd'
        })
    }

    loadHls () {
        this.vuedio.src({
            type: 'application/vnd.apple.mpegurl',
            src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
        })
    }

    addSubtitlesTest () {
        this.vuedio.subtitles(
            'https://raw.githubusercontent.com/Dador/JavascriptSubtitlesOctopus/gh-pages/subtitles/test.ass')
    }

    addSubtitlesKaraoke () {
        this.vuedio.subtitles(
            'https://gist.githubusercontent.com/teidesu/1a81cfa314ac9efc7334818ecccb4412/raw/dc370a2aa43450efa7a684bc9ab02f98ed21e492/railgun_op.ass',
            {
                fonts: [
                    'https://teidesu.github.io/cdn/fonts/SourceSansPro-SemiBold.ttf',
                    'https://teidesu.github.io/cdn/fonts/CabinCondensed-Regular.ttf'
                ]
            }
        )
    }
}
</script>

<style>

</style>
