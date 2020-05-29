<template>
    <div>
        <v-simple-card
            :class="{'v-card--outlined': flat, 'mb-2': true }"
        >
            <v-tabs
                :show-arrows="$r12s.screenWidth >= 480"
                v-model="tab"
            >
                <v-tab
                    :key="i"
                    v-for="(tab, i) in tabs"
                    v-text="$t('Pages.Settings.' + tab.name)"
                />
            </v-tabs>
        </v-simple-card>

        <v-tabs-items v-model="tab">
            <v-tab-item
                :key="i"
                v-for="(tab, i) in tabs"
            >
                <v-simple-card>
                    <component :is="tab" />
                </v-simple-card>
            </v-tab-item>
        </v-tabs-items>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import AccountTab from '@/components/settings/tabs/AccountTab.vue'
import NetworkTab from '@/components/settings/tabs/NetworkTab.vue'
import PersonalizationTab from '@/components/settings/tabs/PersonalizationTab.vue'
import AboutTab from '@/components/settings/tabs/AboutTab.vue'

@Component({
    components: { VSimpleCard }
})
export default class AppSettings extends Vue {
    @Prop({ type: Boolean, default: false }) flat!: boolean

    tab = 0

    tabs = Object.freeze([
        AccountTab,
        PersonalizationTab,
        NetworkTab,
        AboutTab
    ])
}
</script>

<style>

</style>
