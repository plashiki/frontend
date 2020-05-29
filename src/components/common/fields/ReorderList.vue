<template>
    <div class="d-flex flex-row">
        <div class="d-flex flex-column flex-shrink-1">
            <v-btn
                :disabled="selected == null || selected === 0"
                @click="moveAbsolute(0)"
                icon
            >
                <v-icon>
                    mdi-chevron-double-up
                </v-icon>
            </v-btn>
            <v-btn
                :disabled="selected == null || selected === 0"
                @click="moveRelative(-1)"
                icon
            >
                <v-icon>
                    mdi-chevron-up
                </v-icon>
            </v-btn>
            <v-btn
                :disabled="selected == null || selected === internalValue.length - 1"
                @click="moveRelative(1)"
                icon
            >
                <v-icon>
                    mdi-chevron-down
                </v-icon>
            </v-btn>
            <v-btn
                :disabled="selected == null || selected === internalValue.length - 1"
                @click="moveAbsolute(-1)"
                icon
            >
                <v-icon>
                    mdi-chevron-double-down
                </v-icon>
            </v-btn>
        </div>
        <v-list
            class="flex-grow-1 elevation-5"
            v-bind="$attrs"
        >
            <v-list-item-group
                v-model="selected"
            >
                <div
                    :key="i"
                    v-for="(it, i) in internalValue"
                >
                    <slot
                        :index="i"
                        :item="it"
                        name="item"
                    >
                        <v-list-item active-class="primary--text">
                            <v-list-item-title
                                v-text="it.text"
                            />
                        </v-list-item>
                    </slot>
                </div>
            </v-list-item-group>
        </v-list>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { arrayMove } from '@/utils/object-utils'

interface ReorderItem {
    text: string
    value: any
}

@Component({})
export default class ReorderList extends Vue {
    @Prop({ required: true }) value!: ReorderItem[]

    selected: number | null = null
    internalValue: ReorderItem[] = []

    moveAbsolute (position: number): void {
        if (this.selected == null) return

        if (position < 0) position += this.internalValue.length

        arrayMove(this.internalValue, this.selected, position)
        this.selected = position
        this.$emit('input', this.internalValue)
    }

    moveRelative (delta: number): void {
        if (this.selected == null) return

        arrayMove(this.internalValue, this.selected, this.selected + delta)
        this.selected = this.selected + delta
        this.$emit('input', this.internalValue)
    }

    @Watch('value', { deep: true })
    valueChanged (val: ReorderItem[]): void {
        this.internalValue = [...val]
    }

    mounted (): void {
        this.valueChanged(this.value)
    }
}
</script>

<style>

</style>
