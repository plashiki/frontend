<template>
    <div>
        <v-select
            v-model="preferredNameLanguage"
            :items="nameLanguageItems"
            :label="$t('Pages.Settings.PreferredNameLanguage')"
            :hint="provider === 'shikimori' && $t('Pages.Settings.PreferredNameLanguageShiki')"
            class="my-2"
            persistent-hint
        />

        <v-divider class="my-2" />

        <BooleanSwitch
            name="oneColumnInMediaList"
            :label="$t('Pages.Settings.OneColumnInMediaList')"
        />
        <BooleanSwitch
            name="expandAllViewer"
            :label="$t('Pages.Settings.ExpandAllAuthors')"
        />
        <BooleanSwitch
            name="hideSamePlayers"
            :label="$t('Pages.Settings.HideSamePlayers')"
        />
        <BooleanSwitch
            v-if="moderator"
            name="highlightUnknownAuthor"
            :label="$t('Pages.Settings.HighlightUnknownAuthor')"
        />
        <v-switch
            v-if="moderator"
            v-model="onlyOngoingsInRecent"
            class="my-2"
            :label="$t('Pages.Settings.OnlyOngoingsInRecent')"
            :hint="$t('Pages.Settings.OnlyOngoingsInRecentDescription' + (onlyOngoingsInRecent ? 'On' : 'Off'))"
            persistent-hint
        />

        <v-divider class="my-2" />

        <h3
            class="my-2"
            v-html="$t('Pages.Settings.TranslationPreferenceOrder')"
        />

        <v-switch
            v-model="useSmartSorting"
            class="my-2"
            :label="$t('Pages.Settings.UseSmartSorting')"
            hide-details
        />

        <reorder-list
            v-model="translationPreferenceOrder"
            :disabled="!useSmartSorting"
            dense
        />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VColorField from '@/components/common/fields/VColorField.vue'
import { authStore, configStore } from '@/store'
import { NameMeta } from '@/types/media'
import ReorderList from '@/components/common/fields/ReorderList.vue'
import { languages } from '@/utils/i18n'
import BooleanSwitch from '@/components/settings/BooleanSwitch.vue'

@Component({
    components: { BooleanSwitch, ReorderList, VColorField }
})
export default class BehaviourTab extends Vue {
    uiLanguages = languages

    get moderator (): boolean {
        return authStore.user?.moderator ?? false
    }

    get provider (): string {
        return configStore.dataProvider
    }

    get dark (): boolean {
        return configStore.dark
    }

    get nameLanguageItems (): any[] {
        return [
            'russian',
            'english',
            'romaji',
            'japanese'
        ].map(i => ({
            text: this.$t('Pages.Settings.Language_' + i),
            value: i
        }))
    }

    get preferredNameLanguage (): Exclude<keyof NameMeta, 'other'> {
        return configStore.preferredNameLanguage
    }

    set preferredNameLanguage (val: Exclude<keyof NameMeta, 'other'>) {
        configStore.merge({
            preferredNameLanguage: val
        })
    }

    get onlyOngoingsInRecent (): boolean {
        return configStore.onlyOngoingsInRecent
    }

    set onlyOngoingsInRecent (val: boolean) {
        configStore.merge({
            onlyOngoingsInRecent: val
        })
    }

    get useSmartSorting (): boolean {
        return configStore.useSmartSorting
    }

    set useSmartSorting (val: boolean) {
        configStore.merge({
            useSmartSorting: val
        })
    }

    get translationPreferenceOrder (): any[] {
        return configStore.translationPreferenceOrder.map((i) => ({
            text: this.$t('Pages.Settings.Field_' + i),
            value: i
        }))
    }

    set translationPreferenceOrder (val: any[]) {
        configStore.set({
            key: 'translationPreferenceOrder',
            value: val.map(i => i.value)
        })
    }
}
</script>

<style>

</style>
