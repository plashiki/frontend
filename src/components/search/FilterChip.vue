<template>
    <v-chip
        :filter-icon="icon"
        :input-value="active"
        filter
        outlined
        ripple
        v-bind="$attrs"
        @click="clicked"
    >
        {{ text }}
    </v-chip>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { indexOfBy } from '@/utils/object-utils'

enum FilterChipState {
    Off,
    Add,
    Remove
}

const FilterChipStateIcons: Record<FilterChipState, string> = {
    [FilterChipState.Off]: '',
    [FilterChipState.Add]: 'mdi-plus',
    [FilterChipState.Remove]: 'mdi-minus'
}

@Component({})
export default class FilterChip extends Vue {
    @Prop({ type: String, required: true }) value!: string
    @Prop({ type: String, default: '' }) text!: string
    @Prop({ required: true }) storage!: string[]
    @Prop({ default: null }) negotiator!: ((s: string) => string) | null

    state: FilterChipState = FilterChipState.Off

    get negativeValue (): string | null {
        return this.negotiator?.(this.value) ?? null
    }

    get storageValue (): string | null {
        if (this.state === FilterChipState.Off) return null
        return this.state === FilterChipState.Add ? this.value : this.negativeValue
    }

    get active (): boolean {
        return this.state !== FilterChipState.Off
    }

    get icon (): string {
        return FilterChipStateIcons[this.state]
    }

    get storageIndex (): number {
        return indexOfBy(this.storage, (s) => s === this.value || s === this.negativeValue)
    }

    @Watch('storage')
    storageChanged (): void {
        if (this.storageIndex === -1) {
            this.state = FilterChipState.Off
        } else {
            let val = this.storage[this.storageIndex]
            if (val === this.value) {
                this.state = FilterChipState.Add
            } else {
                this.state = FilterChipState.Remove
            }
        }
    }

    removeFromStorage (): void {
        let idx = this.storageIndex
        if (idx > -1) {
            this.storage.splice(idx, 1)
        }
    }

    clicked (): void {
        if (this.state === FilterChipState.Off) {
            this.state = FilterChipState.Add
            this.storage.push(this.storageValue as string)
        } else if (this.state === FilterChipState.Add) {
            if (this.negativeValue === null) {
                this.state = FilterChipState.Off
                this.removeFromStorage()
            } else {
                this.state = FilterChipState.Remove
                let idx = this.storageIndex
                if (idx > -1) {
                    this.$set(this.storage, idx, this.negativeValue)
                }
            }
        } else {
            this.state = FilterChipState.Off
            this.removeFromStorage()
        }
    }
}
</script>

<style>

</style>
