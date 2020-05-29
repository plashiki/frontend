<template>
    <div>
        <v-row>
            <v-col
                cols="12"
                lg="4"
                md="6"
            >
                <v-card class="fill-height">
                    <v-card-text>
                        <v-autocomplete
                            :items="genres"
                            :label="$t('Pages.Search.Genres')"
                            hide-details
                            multiple
                            v-model="filters.genre"
                        >
                            <template #selection="{ item, index }">
                                <v-chip
                                    small
                                    v-if="index <= 1"
                                >
                                    {{ $t(item.text) }}
                                </v-chip>
                                <span
                                    class="grey--text caption"
                                    v-if="index === 2"
                                >
                                    {{ $tc('Common.Form.PlusNOther', filters.genre.length - 2)  }}
                                </span>
                            </template>

                            <template #item="{ item, attrs, on }">
                                <v-list-item
                                    :disabled="!!item.group"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    <v-list-item-content
                                        class="grey--text subtitle-2"
                                        v-if="!!item.group"
                                    >
                                        {{ $t(item.group) }}
                                    </v-list-item-content>

                                    <template v-else>
                                        <v-list-item-action>
                                            <v-icon
                                                v-text="attrs.inputValue ? 'mdi-checkbox-marked-outline' : 'mdi-checkbox-blank-outline'"
                                            />
                                        </v-list-item-action>
                                        <v-list-item-content>
                                            <v-list-item-title>
                                                {{ $t(item.text) }}
                                            </v-list-item-title>
                                        </v-list-item-content>
                                    </template>
                                </v-list-item>
                            </template>
                        </v-autocomplete>

                        <div class="subtitle-1 mb-1 mt-3 ml-2 text--primary">
                            {{ $t('Pages.Search.MinimumScore') }}
                        </div>
                        <v-row
                            align="center"
                            justify="center"
                        >
                            <v-rating
                                class="rating-smaller-gap text-center"
                                half-icon="mdi-star-half-full"
                                half-increments
                                hover
                                v-model="filters.score"
                            />
                            <v-btn
                                @click="filters.score = 0"
                                class="ml-2"
                                icon
                                small
                                v-tooltip="$t('Common.Action.Reset')"
                            >
                                <v-icon small>
                                    mdi-block-helper
                                </v-icon>
                            </v-btn>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col
                :key="i"
                cols="12"
                lg="4"
                md="6"
                v-for="(f, i) in ui"
            >
                <v-card class="fill-height">
                    <v-card-title>
                        {{ $t(f.name) }}
                        <v-spacer />
                        <v-fade-transition>
                            <v-btn
                                @click="filters[f.storage] = []"
                                icon
                                v-show="filters[f.storage].length > 0"
                            >
                                <v-icon>
                                    mdi-delete-sweep
                                </v-icon>
                            </v-btn>
                        </v-fade-transition>
                    </v-card-title>

                    <v-card-text>
                        <FilterChip
                            :disabled="f.auth ? !authenticated : false"
                            :key="j"
                            :negotiator="i => '!' + i"
                            :storage="filters[f.storage]"
                            :text="typeof it.text === 'string' ? $t(it.text) : $t(it.text[0], it.text[1])"
                            :value="it.value"
                            class="ma-1"
                            v-for="(it, j) in f.list"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import {
    shikimoriDurations,
    shikimoriGenres,
    shikimoriKinds,
    shikimoriLists,
    shikimoriRatings,
    shikimoriSeasons,
    shikimoriStatuses
} from '@/constants/shikimori'
import { emptyShikimoriFilters, ShikimoriFiltering } from '@/api/search/shikimori'
import FilterChip from '@/components/search/FilterChip.vue'
import { authStore } from '@/store'

@Component({
    components: { FilterChip }
})
export default class ShikimoriFilters extends Vue {
    genres = shikimoriGenres
    filters: ShikimoriFiltering = emptyShikimoriFilters

    ui: readonly any[] = []

    get authenticated (): boolean {
        return authStore.authenticated
    }

    @Watch('filters', { deep: true })
    filtersChanged (): void {
        this.$emit('update')
    }

    mounted (): void {
        this.ui = Object.freeze([
            {
                name: 'Items.Translation.StatusName',
                storage: 'status',
                list: shikimoriStatuses
            },
            {
                name: 'Items.UserRate.InList',
                storage: 'mylist',
                list: shikimoriLists,
                auth: true
            },
            {
                name: 'Items.Translation.KindNameShort',
                storage: 'kind',
                list: shikimoriKinds
            },
            {
                name: 'Items.Media.DurationText',
                storage: 'duration',
                list: shikimoriDurations
            },
            {
                name: 'Items.Media.AgeRatingText',
                storage: 'rating',
                list: shikimoriRatings
            },
            {
                name: 'Items.Media.SeasonText',
                storage: 'season',
                list: shikimoriSeasons
            }
        ])
    }
}
</script>

<style>

</style>
