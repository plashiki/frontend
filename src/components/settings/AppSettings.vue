<template>
    <div class="cards-page-container">
        <v-simple-card
            :class="{'v-card--outlined': flat, 'mb-2': true }"
        >
            <v-tabs
                v-model="tab"
                :show-arrows="$r12s.screenWidth >= 480"
            >
                <v-tab
                    v-for="(tab, i) in tabs"
                    :key="i"
                    v-text="$t('Pages.Settings.' + tab[1])"
                />
            </v-tabs>
        </v-simple-card>

        <v-tabs-items v-model="tab">
            <v-tab-item
                v-for="(tab, i) in tabs"
                :key="i"
            >
                <v-simple-card class="page-card">
                    <component :is="tab[0]" />
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
import InterfaceTab from '@/components/settings/tabs/InterfaceTab.vue'
import BehaviourTab from '@/components/settings/tabs/BehaviourTab.vue'
import AboutTab from '@/components/settings/tabs/AboutTab.vue'
import NotificationsTab from './tabs/NotificationsTab.vue'

@Component({
    components: { VSimpleCard }
})
export default class AppSettings extends Vue {
    @Prop({ type: Boolean, default: false }) flat!: boolean

    tab = 0

    tabs = Object.freeze([
        [AccountTab, 'AccountTab'],
        [InterfaceTab, 'InterfaceTab'],
        [BehaviourTab, 'BehaviourTab'],
        [NotificationsTab, 'NotificationsTab'],
        [NetworkTab, 'NetworkTab'],
        [AboutTab, 'AboutTab']
    ])
}
</script>

<style>

</style>
