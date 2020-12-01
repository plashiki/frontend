<template>
    <div>
        <transition-group name="basic-list-movement">
            <v-btn
                v-for="tr in translations"
                :key="tr.key"
                :outlined="!itemActive(tr)"
                class="translation-chip basic-list-movement-item"
                color="primary"
                ripple
                rounded
                small
                @click="itemClicked(tr, $event)"
                @mousedown.middle.native.prevent="selectedTranslation = tr.id"
            >
                {{ tr.name }}
                <span
                    v-if="tr.ripper"
                    class="ripper-name"
                    v-text="$t('Pages.Viewer.RippedBy', { name: tr.ripper })"
                />
            </v-btn>
        </transition-group>
        <span
            v-show="!showFull && invisibleItemsCount > 0"
            v-tooltip="invisibleItemsCountWithNames"
            class="link-like grey--text caption text-no-wrap ml-2 no-dots"
            @click="showFull = true"
        >
            {{ $tc('Pages.Viewer.NMoreLinks', invisibleItemsCount) }}
        </span>
    </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'
import { filterVisibleTranslations } from '@/utils/user-preferences-utils'
import { configStore } from '@/store'
import { SingleTranslationData, TranslationDataAuthor } from '@/types/translation'

@Component({})
export default class TranslationsList extends Vue {
    @Prop({ default: () => [] }) data!: SingleTranslationData[]
    @Prop({ default: () => ({}) }) authors!: TranslationDataAuthor[]
    @Prop({ default: '' }) keyPrefix!: string
    @PropSync('translation') selectedTranslation!: number

    @Prop() selectedTranslations!: number[]
    @Prop() translationSelectionMode!: boolean

    showFull_ = false

    get showFull () {
        return this.showFull_ || !configStore.hideSamePlayers
    }

    set showFull (val: boolean) {
        this.showFull_ = val
    }

    get translations (): (SingleTranslationData & { key: string })[] {
        let times: Record<string, number> = {}
        return (this.showFull ? this.preFilteredData : this.filteredData).map((it: any) => {
            if (!(it.name in times)) {
                times[it.name] = 0
            }
            this.$set(it, 'key', `${this.keyPrefix}||${it.name}||${times[it.name]++}`)
            return it
        })
    }

    get preFilteredData (): SingleTranslationData[] {
        // im bad at naming lol
        return this.data.filter(tr => configStore.playersFilters[tr.name] !== true)
    }

    get filteredData (): SingleTranslationData[] {
        return filterVisibleTranslations(this.preFilteredData, this.selectedTranslation)
    }

    get invisibleItemsCount (): number {
        return this.preFilteredData.length - this.filteredData.length
    }

    get invisibleItemsCountWithNames (): string {
        if (this.invisibleItemsCount === 0) return ''

        let times: Record<string, number> = {}
        let timesFiltered: Record<string, number> = {}

        for (let it of this.preFilteredData) {
            const name = it.name
            if (!(name in times)) {
                times[name] = 0
            }
            times[name]++
        }


        for (let it of this.filteredData) {
            const name = it.name
            if (!(name in timesFiltered)) {
                timesFiltered[name] = 0
            }
            timesFiltered[name]++
        }

        let ret: string[] = []

        for (let key of Object.keys(times)) {
            let diff = times[key] - (timesFiltered[key] ?? 0)
            if (diff !== 0) {
                ret.push(this.$t('Pages.Viewer.LinkTimes', {
                    n: diff,
                    name: key
                }) as string)
            }
        }

        return ret.join(', ')
    }

    itemClicked (it: SingleTranslationData, event: MouseEvent): void {
        let active = this.itemActive(it)

        if (this.translationSelectionMode) {
            if (event.button === 1) {
                this.selectedTranslation = it.id
                event.preventDefault()
                event.stopImmediatePropagation()
                return
            }
            if (event.shiftKey && this.selectedTranslations.length) {
                let lastSelected = this.selectedTranslations[this.selectedTranslations.length - 1]
                let newlySelected = it.id

                // determine which appears first
                let first = NaN
                let last = NaN
                outer:
                for (let author of this.authors) {
                    if (configStore.languageFilters[author.lang] === true) continue
                    for (let tr of author.translations) {
                        if (configStore.playersFilters[tr.name] === true) continue

                        if (tr.id === lastSelected || tr.id === newlySelected) {
                            if (isNaN(first)) first = tr.id
                            else {
                                last = tr.id
                                break outer
                            }
                        }
                    }
                }

                if (isNaN(first) || isNaN(last)) return

                // loop again and set selection (probably it could be optimized by storing indexes of `first`, but
                // maybe sometime later :p)
                let inside = false

                outer:
                for (let author of this.authors) {
                    if (configStore.languageFilters[author.lang] === true) continue
                    for (let tr of author.translations) {
                        if (configStore.playersFilters[tr.name] === true) continue

                        if (!inside && tr.id === first) inside = true
                        if (inside) {
                            let idx = this.selectedTranslations.indexOf(tr.id)
                            if (active && idx > -1) {
                                this.selectedTranslations.splice(idx, 1)
                            } else if (!active && idx === -1) {
                                this.selectedTranslations.push(tr.id)
                            }
                            if (tr.id === last) break outer
                        }
                    }
                }
            } else if (active) {
                let idx = this.selectedTranslations.indexOf(it.id)
                this.selectedTranslations.splice(idx, 1)
            } else {
                this.selectedTranslations.push(it.id)
            }
        } else {
            this.selectedTranslation = it.id
        }
    }

    itemActive (it: SingleTranslationData): boolean {
        if (this.translationSelectionMode) {
            return this.selectedTranslations.indexOf(it.id) > -1
        }
        return this.selectedTranslation === it.id
    }
}
</script>

<style>
.translation-chip {
    height: 26px !important;
    font-size: 12px !important;
    text-transform: none !important;
    padding: 2px 10px !important;
    margin: 4px 6px !important;
    letter-spacing: normal !important;
}

.ripper-name {
    font-size: 10px;
    margin-left: 4px;
    align-self: flex-end;
}
</style>
