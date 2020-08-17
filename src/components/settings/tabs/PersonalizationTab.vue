<template>
    <div>
        <v-select
            v-model="language"
            :label="$t('Pages.Settings.UiLanguage')"
            :items="uiLanguages"
        >
            <template #item="{ item }">
                <v-list-item-title>
                    <span :class="'mr-2 flag-' + item.value" />
                    {{ item.text }}
                </v-list-item-title>
            </template>
        </v-select>

        <v-divider class="mb-2" />

        <v-row no-gutters>
            <v-col
                cols="12"
                sm="6"
            >
                <v-color-field
                    v-model="primaryColor"
                    :label="$t('Pages.Settings.PrimaryColor')"
                />
            </v-col>
            <v-col
                cols="12"
                sm="6"
            >
                <v-color-field
                    v-model="accentColor"
                    :label="$t('Pages.Settings.AccentColor')"
                />
            </v-col>
        </v-row>

        <v-divider class="mb-2" />

        <v-select
            v-model="preferredNameLanguage"
            :items="nameLanguageItems"
            :label="$t('Pages.Settings.PreferredNameLanguage')"
            :hint="provider === 'shikimori' && $t('Pages.Settings.PreferredNameLanguageShiki')"
            class="mb-1"
            persistent-hint
        />

        <v-divider class="mb-2" />

        <v-switch
            v-model="oneColumnInMediaList"
            :label="$t('Pages.Settings.OneColumnInMediaList')"
            hide-details
        />
        <v-switch
            v-model="expandAllViewer"
            :label="$t('Pages.Settings.ExpandAllAuthors')"
            hide-details
        />
        <v-switch
            v-model="hideSamePlayers"
            :label="$t('Pages.Settings.HideSamePlayers')"
            hide-details
        />
        <v-switch
            v-if="moderator"
            v-model="highlightUnknownAuthor"
            :label="$t('Pages.Settings.HighlightUnknownAuthor')"
            hide-details
        />

        <v-switch
            v-model="onlyOngoingsInRecent"
            :label="$t('Pages.Settings.OnlyOngoingsInRecent')"
            :hint="$t('Pages.Settings.OnlyOngoingsInRecentDescription' + (onlyOngoingsInRecent ? 'On' : 'Off'))"
            class="mb-1"
            persistent-hint
        />

        <h3
            class="mb-2"
            v-html="$t('Pages.Settings.TranslationPreferenceOrder')"
        />
        <reorder-list
            v-model="translationPreferenceOrder"
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
import { changeLanguage } from '@/plugins/vue-i18n'
import { setUserLanguage } from '@/api/user'
import { iziToastError } from '@/plugins/izitoast'
import { languages } from '@/utils/i18n'

@Component({
    components: { ReorderList, VColorField }
})
export default class PersonalizationTab extends Vue {
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

    get language (): string {
        return configStore.language
    }

    set language (val: string) {
        configStore.merge({
            language: val
        })
        changeLanguage(val)

        if (authStore.authenticated) {
            setUserLanguage(val).catch(iziToastError)
        }
    }

    get primaryColor (): string {
        return this.dark ? configStore.darkColors.primary : configStore.lightColors.primary
    }

    set primaryColor (val: string) {
        configStore.merge({
            [this.dark ? 'darkColors' : 'lightColors']: {
                primary: val
            }
        })
        this.$vuetify.theme.themes[this.dark ? 'dark' : 'light'].primary = val
    }

    get accentColor (): string {
        return this.dark ? configStore.darkColors.accent : configStore.lightColors.accent
    }

    set accentColor (val: string) {
        configStore.merge({
            [this.dark ? 'darkColors' : 'lightColors']: {
                accent: val
            }
        })
        this.$vuetify.theme.themes[this.dark ? 'dark' : 'light'].accent = val
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

    get oneColumnInMediaList (): boolean {
        return configStore.oneColumnInMediaList
    }

    set oneColumnInMediaList (val: boolean) {
        configStore.merge({
            oneColumnInMediaList: val
        })
    }

    get expandAllViewer (): boolean {
        return configStore.expandAllViewer
    }

    set expandAllViewer (val: boolean) {
        configStore.merge({
            expandAllViewer: val
        })
    }

    get hideSamePlayers (): boolean {
        return configStore.hideSamePlayers
    }

    set hideSamePlayers (val: boolean) {
        configStore.merge({
            hideSamePlayers: val
        })
    }

    get highlightUnknownAuthor (): boolean {
        return configStore.highlightUnknownAuthor
    }

    set highlightUnknownAuthor (val: boolean) {
        configStore.merge({
            highlightUnknownAuthor: val
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
