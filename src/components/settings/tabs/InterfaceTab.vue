<template>
    <div>
        <v-select
            v-model="language"
            :label="$t('Pages.Settings.UiLanguage')"
            :items="uiLanguages"
            class="my-2"
            hide-details
        >
            <template #item="{ item }">
                <v-list-item-title>
                    <span :class="'mr-2 flag-' + item.value" />
                    {{ item.text }}
                </v-list-item-title>
            </template>
        </v-select>

        <v-divider class="my-2" />

        <v-row no-gutters>
            <v-col
                cols="12"
                sm="6"
            >
                <v-color-field
                    v-model="primaryColor"
                    :label="$t('Pages.Settings.PrimaryColor')"
                    class="my-2"
                    hide-details
                />
            </v-col>
            <v-col
                cols="12"
                sm="6"
            >
                <v-color-field
                    v-model="accentColor"
                    :label="$t('Pages.Settings.AccentColor')"
                    class="my-2"
                    hide-details
                />
            </v-col>
        </v-row>

        <BooleanSwitch
            name="followSystemDark"
            :label="$t('Pages.Settings.FollowSystemDark')"
        />

        <v-divider class="my-2" />

        <v-select
            v-model="drawerStyle"
            :label="$t('Pages.Settings.DrawerStyle')"
            :items="drawerStyles"
            class="my-2"
            hide-details
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
import BooleanSwitch from '@/components/settings/BooleanSwitch.vue'
import { DrawerStyle } from '@/store/config'

@Component({
    components: { BooleanSwitch, ReorderList, VColorField }
})
export default class InterfaceTab extends Vue {
    uiLanguages = languages

    get drawerStyles (): any[] {
        return ['slim', 'slim-no-hover', 'normal']
            .map(i => ({ text: this.$t('Pages.Settings.Drawer_' + i), value: i }))
    }

    get drawerStyle (): DrawerStyle {
        return configStore.drawerStyle
    }

    set drawerStyle (val: DrawerStyle) {
        configStore.merge({
            drawerStyle: val
        })
    }

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
