<template>
    <v-simple-card
        class="overflow-x-hidden"
        style="max-height: 920px;"
    >
        <transition mode="out-in" name="fade-transition">
            <v-list
                color="transparent"
                dense
                v-if="data != null && parts.length > 0"
            >
                <v-list-item
                    :class="{ 'primary--text v-list-item--active': selectedPart === partN }"
                    :key="partN"
                    :ref="'part-' + partN"
                    @click="onItemClicked(partN)"
                    v-for="partN in parts"
                >
                    <v-list-item-content>
                        <v-list-item-title>
                            {{ $tc(mediaType === 'anime' ? 'Items.Media.NthEpisode' : 'Items.Media.NthChapter', partN)
                            }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-truncate">
                            {{ data[partN].players.join(', ') }}
                        </v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-avatar size="30" v-if="userRate && partN <= userRate.parts">
                        <v-icon color="success">
                            mdi-check
                        </v-icon>
                    </v-list-item-avatar>
                </v-list-item>
            </v-list>
            <v-skeleton-loader
                type="list-item-two-line, list-item-two-line, list-item-two-line, list-item-two-line, list-item-two-line"
                v-else-if="data === null && loading"
            />
            <NoItemsPlaceholder
                :text="$t('Pages.Viewer.NoTranslationsAvailable')"
                v-else-if="data !== null && parts.length === 0"
            />
        </transition>
    </v-simple-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator'
import { TranslationData } from '@/types/translation'
import { MediaType } from '@/types/media'
import { UserRate } from '@/types/user-rate'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'
import VSimpleCard from '@/components/common/VSimpleCard.vue'

@Component({
    components: { VSimpleCard, NoItemsPlaceholder }
})
export default class PartsList extends Vue {
    @Prop({ default: () => ({}) }) data!: Readonly<TranslationData>
    @Prop({ required: true }) mediaType!: MediaType
    @Prop() userRate!: UserRate | null
    @Prop({ default: false }) loading!: boolean
    @PropSync('part') selectedPart!: number

    get parts (): number[] {
        if (!this.data) return []
        return Object.keys(this.data).map(i => parseInt(i))
    }

    @Watch('selectedPart')
    selectedPartChanged (val: number, old: number): void {
        this.animateScroll(old, val)
    }

    animateScroll (fr: number, to: number): void {
        if (to >= 5 || fr > to) {
            const el = (this.$refs['part-' + to] as any)?.[0]?.$el
            if (el) {
                this.$vuetify.goTo(el, {
                    container: this.$el as any,
                    offset: 90,
                    duration: 600
                })
            }
        }
    }

    onItemClicked (n: number): void {
        this.selectedPart = n
        this.$emit('item-click', n)
    }
}
</script>

<style>

</style>
