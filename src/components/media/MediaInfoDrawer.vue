<template>
    <div>
        <slot name="activator" :on="{ click: () => visible = true }"/>

        <v-navigation-drawer
            v-model="visible"
            temporary
            app
            right
            :width="modalWidth"
        >
            <div class="pa-2 d-flex flex-row align-center">
                <v-btn
                    icon
                    @click="visible = false"
                >
                    <v-icon>
                        mdi-arrow-left
                    </v-icon>
                </v-btn>
                <v-spacer />
                <span class="text-center body-2 text--secondary">
                    {{ $t('Common.Collection.DataFrom', { provider: $t('Providers.' + dataProvider) }) }}
                </span>
            </div>
            <v-divider />

            <div class="pa-4 overflow-y-auto">
                <MediaInfo
                    ref="info"
                    :media="media"
                    :is-full="isFull"
                    lazy
                />
            </div>
        </v-navigation-drawer>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator'
import MediaInfo from '@/components/media/MediaInfo.vue'
import { Media } from '@/types/media'
import { DataProviderName } from '@/api/providers'
import { configStore } from '@/store'

@Component({
    components: { MediaInfo },
})
export default class MediaInfoDrawer extends Vue {
    @Prop({ required: true }) media!: Media
    @Prop({ type: Boolean, default: false }) isFull!: boolean
    @Ref('info') info: any

    visible = false

    get dataProvider (): DataProviderName {
        return configStore.dataProvider
    }

    get modalWidth (): string {
        if (this.$r12s.isMobileByWidth) return '100%'
        if (this.$r12s.screenWidth < 600) return '85%'
        if (this.$r12s.screenWidth < 900) return '75%'
        if (this.$r12s.screenWidth < 1200) return '60%'

        return '800px'
    }

    @Watch('visible')
    visibilityChanged (val: boolean): void {
        if (val && !this.info.fullMedia) {
            this.info.load()
        }
    }
}
</script>

<style>

</style>
