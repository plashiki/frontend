<template>
    <v-simple-card
        class="overflow-x-hidden parts-list"
    >
        <transition mode="out-in" name="fade-transition">
            <div
                v-if="data != null && parts.length > 0"
            >
                <div class="d-flex flex-row">
                    <AuthorAvailabilityPopup
                        #default="{ on }"
                        :data="data"
                    >
                        <v-btn
                            v-tooltip="$t('Pages.Viewer.Availability')"
                            icon
                            small
                            v-on="on"
                        >
                            <v-icon small>
                                mdi-folder-information
                            </v-icon>
                        </v-btn>
                    </AuthorAvailabilityPopup>
                    <v-spacer />
                    <v-btn
                        icon
                        small
                        @click="reverseSortParts = !reverseSortParts"
                    >
                        <v-icon
                            small
                            v-text="reverseSortParts ? 'mdi-sort-numeric-descending' : 'mdi-sort-numeric-ascending'"
                        />
                    </v-btn>
                </div>
                <v-list
                    color="transparent"
                    dense
                >
                    <transition-group name="basic-list-movement">
                        <v-list-item
                            v-for="partN in parts"
                            :key="partN"
                            :ref="'part-' + partN"
                            :class="{ 'primary--text v-list-item--active': selectedPart === partN }"
                            class="basic-list-movement-item"
                            @click="onItemClicked(partN)"
                        >
                            <v-list-item-content>
                                <v-list-item-title>
                                    {{ $tc(mediaType === 'anime' ? 'Items.Media.NthEpisode' : 'Items.Media.NthChapter', partN) }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-truncate">
                                    {{ filterPlayers(data[partN].players).join(', ') }}
                                </v-list-item-subtitle>
                            </v-list-item-content>
                            <v-list-item-avatar v-if="userRate && partN <= userRate.parts" size="30">
                                <v-icon color="success">
                                    mdi-check
                                </v-icon>
                            </v-list-item-avatar>
                        </v-list-item>
                    </transition-group>
                </v-list>
            </div>
            <v-skeleton-loader
                v-else-if="data === null && loading"
                type="list-item-two-line, list-item-two-line, list-item-two-line, list-item-two-line, list-item-two-line"
            />
            <NoItemsPlaceholder
                v-else-if="data !== null && parts.length === 0"
                :text="$t('Pages.Viewer.NoTranslationsAvailable')"
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
import { configStore } from '@/store'
import AuthorAvailabilityPopup from '@/components/viewer/AuthorAvailabilityPopup.vue'
import { includesAll } from '@/utils/object-utils'

@Component({
    components: { AuthorAvailabilityPopup, VSimpleCard, NoItemsPlaceholder }
})
export default class PartsList extends Vue {
    @Prop({ default: () => ({}) }) data!: Readonly<TranslationData>
    @Prop({ required: true }) mediaType!: MediaType
    @Prop() userRate!: UserRate | null
    @Prop({ default: false }) loading!: boolean
    @PropSync('part') selectedPart!: number

    get reverseSortParts (): boolean {
        return configStore.reverseSortParts
    }

    set reverseSortParts (val: boolean) {
        configStore.merge({
            reverseSortParts: val
        })
    }

    get parts (): number[] {
        if (!this.data) return []
        let ret = Object.keys(this.data).map(i => parseInt(i))

        if (this.reverseSortParts) {
            ret.sort((a, b) => b - a)
        } else {
            ret.sort((a, b) => a - b)
        }

        const hiddenPlayers = Object.keys(configStore.playersFilters)

        return ret.filter(it => !includesAll(hiddenPlayers, this.data[it].players))
    }

    filterPlayers (players: string[]): string[] {
        return players.filter(it => !configStore.playersFilters[it])
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
.parts-list {
    max-height: 800px;
}

@media (max-width: 730px) {
    .parts-list {
        max-height: 500px;
    }
}
</style>
