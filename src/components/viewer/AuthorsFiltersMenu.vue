<template>
    <v-menu
        :close-on-content-click="false"
        left
        offset-y
        top
        transition="slide-x-reverse-transition"
    >
        <template #activator="{ on }">
            <v-badge
                :color="dark ? 'grey darken-3' : 'grey'"
                :content="filteredCount"
                :offset-x="24"
                :value="filteredCount > 0"
                bottom
                class="small-badge"
                overlap
                left
            >
                <v-btn
                    icon
                    v-on="on"
                >
                    <v-icon>mdi-filter</v-icon>
                </v-btn>
            </v-badge>
        </template>

        <v-sheet
            :style="{ maxHeight: Math.min($r12s.screenHeight * 0.75, 600) + 'px' }"
            class="layout column notification-dialog--list"
        >
            <v-card-title class="flex-nowrap">
                <v-tabs
                    v-model="tab"
                    grow
                    hide-slider
                >
                    <v-tab>
                        {{ $t('Pages.Viewer.Players') }}
                    </v-tab>
                    <v-tab>
                        {{ $t('Pages.Viewer.Languages') }}
                    </v-tab>
                </v-tabs>
                <v-btn
                    v-tooltip="$t('Pages.Viewer.ResetFilters')"
                    class="align-self-center"
                    icon
                    @click="clearFilters"
                >
                    <v-icon>mdi-backup-restore</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="overflow-y-auto">
                <v-tabs-items v-model="tab">
                    <v-tab-item>
                        <v-switch
                            v-for="it in availablePlayers"
                            :key="it"
                            :input-value="!isActive('player', it)"
                            :label="it"
                            class="mt-0"
                            hide-details
                            @change="setFilter('player', it, !$event)"
                        />
                        <NoItemsPlaceholder
                            v-if="availablePlayers.length === 0"
                            :text="$t('Common.Collection.NoItemsFound')"
                        />
                    </v-tab-item>
                    <v-tab-item>
                        <v-switch
                            v-for="it in availableLanguages"
                            :key="it"
                            :input-value="!isActive('language', it)"
                            class="mt-0"
                            hide-details
                            @change="setFilter('language', it, !$event)"
                        >
                            <template #label>
                                <span
                                    :class="'flag-' + it"
                                >
                                    {{ $t('Items.Translation.Language.' + it) }}
                                </span>
                            </template>
                        </v-switch>
                        <NoItemsPlaceholder
                            v-if="availableLanguages.length === 0"
                            :text="$t('Common.Collection.NoItemsFound')"
                        />
                    </v-tab-item>
                </v-tabs-items>
            </v-card-text>
        </v-sheet>
    </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { configStore } from '@/store'
import { TranslationDataAuthor } from '@/types/translation'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'

@Component({
    components: { NoItemsPlaceholder }
})
export default class AuthorsFiltersMenu extends Vue {
    @Prop({ default: () => [] }) data!: TranslationDataAuthor[]

    tab = 0

    get dark (): boolean {
        return configStore.dark
    }

    get availablePlayers (): string[] {
        let ret: Record<string, boolean> = {}
        this.data?.forEach((author) => {
            author.translations.forEach((tr) => {
                ret[tr.name] = true
            })
        })
        return Object.keys(ret)
    }

    get availableLanguages (): string[] {
        let ret: Record<string, boolean> = {}
        this.data?.forEach((author) => {
            ret[author.lang] = true
        })
        return Object.keys(ret)
    }

    get filteredCount (): number {
        let ret = 0

        this.data?.forEach(it => {
            if (configStore.languageFilters[it.lang] === true) {
                ret += it.translations.length
            } else {
                it.translations.forEach(tr => {
                    if (configStore.playersFilters[tr.name] === true) {
                        ret++
                    }
                })
            }
        })

        return ret
    }

    clearFilters (): void {
        configStore.clearFilters()
    }

    isActive (type: 'language' | 'player', value: string): boolean {
        return configStore[type === 'player' ? 'playersFilters' : 'languageFilters'][value] === true
    }

    setFilter (type: 'language' | 'player', value: string, active: boolean) {
        configStore.setFilter({ type, value, active })
    }
}
</script>

<style>

</style>
