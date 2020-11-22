<template>
    <div class="inline-more-menu">
        <v-menu
            offset-y
            bottom
            transition="slide-y-reverse-transition"
        >
            <template #activator="{ on }">
                <v-badge
                    v-show="inlineItemsCount !== items.length"
                    class="small-badge"
                    :color="dark ? 'grey darken-3' : 'grey'"
                    :content="badgeValue"
                    :offset-x="24"
                    :value="badgeValue !== null && badgeValue > 0"
                    bottom
                    right
                    overlap
                >
                    <v-btn
                        icon
                        v-on="on"
                    >
                        <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                </v-badge>
            </template>

            <v-list dense>
                <VListItemIconText
                    v-for="(it, i) in menuItems"
                    :key="i"
                    :icon="it.icon"
                    :title="it.label"
                    @click="it.callback"
                />
            </v-list>
        </v-menu>

        <template v-for="(it, i) in inlineItems">
            <v-badge
                v-if="it.badge !== undefined"
                :key="i"
                class="small-badge"
                :color="dark ? 'grey darken-3' : 'grey'"
                :content="it.badge"
                :offset-x="24"
                :value="it.badge > 0"
                bottom
                overlap
                right
            >
                <v-btn
                    v-tooltip="it.label"
                    icon
                    @click.stop.prevent="it.callback"
                >
                    <v-icon v-text="it.icon" />
                </v-btn>
            </v-badge>
            <v-btn
                v-else
                :key="i"
                v-tooltip="it.label"
                icon
                @click.stop.prevent="it.callback"
            >
                <v-icon v-text="it.icon" />
            </v-btn>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { configStore } from '@/store'
import VListItemIconText from '@/components/common/VListItemIconText.vue'

interface MenuItem {
    icon: string
    label: string
    callback: () => void
    badge?: number
}

@Component({
    components: { VListItemIconText },
})
export default class InlineMoreMenu extends Vue {
    @Prop({ required: true }) items!: MenuItem[]
    @Prop({ required: true }) maxWidth!: number
    @Prop({ default: 36 }) inlineButtonSize!: number

    get dark (): boolean {
        return configStore.dark
    }

    get inlineItemsCount (): number {
        let i = Math.min(this.items.length, Math.max(0, ~~(this.maxWidth / this.inlineButtonSize) - 1))
        if (i === this.items.length - 1) i = this.items.length // do not keep 1 item in menu, inline it instead
        return i
    }

    get inlineItems (): MenuItem[] {
        return this.items.slice(0, this.inlineItemsCount).reverse()
    }

    get menuItems (): MenuItem[] {
        return this.items.slice(this.inlineItemsCount)
    }

    get badgeValue (): number | null {
        let ret: number | null = null

        this.menuItems.forEach((it) => {
            if (it.badge !== undefined) {
                if (ret === null) ret = 0
                ret += it.badge
            }
        })

        return ret
    }
}
</script>

<style>

</style>
