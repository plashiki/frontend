<template>
    <div>
        <v-row>
            <v-col
                cols="12"
                sm="6"
            >
                <v-color-field
                    :label="$t('Pages.Settings.PrimaryColor')"
                    v-model="primaryColor"
                />
            </v-col>
            <v-col
                cols="12"
                sm="6"
            >
                <v-color-field
                    :label="$t('Pages.Settings.AccentColor')"
                    v-model="accentColor"
                />
            </v-col>
        </v-row>
        <v-select
            :items="nameLanguageItems"
            :label="$t('Pages.Settings.PreferredNameLanguage')"
            v-model="preferredNameLanguage"
        />
        <p
            v-if="provider === 'shikimori'"
            class="caption text--secondary"
            v-html="$t('Pages.Settings.PreferredNameLanguageShiki')"
        />
        <v-switch
            :label="$t('Pages.Settings.OnlyOngoingsInRecent')"
            v-model="onlyOngoingsInRecent"
        />
        <p
            class="caption text--secondary"
            v-html="$t('Pages.Settings.OnlyOngoingsInRecentDescription')"
        />

        <h3
            class="mb-2"
            v-html="$t('Pages.Settings.TranslationPreferenceOrder')"
        />
        <reorder-list
            dense
            v-model="translationPreferenceOrder"
        />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VColorField from '@/components/common/fields/VColorField.vue'
import { configStore } from '@/store'
import { Media } from '@/types/media'
import ReorderList from '@/components/common/fields/ReorderList.vue'

@Component({
    components: { ReorderList, VColorField }
})
export default class PersonalizationTab extends Vue {
    get provider (): string {
        return configStore.dataProvider
    }

    get dark (): boolean {
        return configStore.dark
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

    get preferredNameLanguage (): keyof Media['name'] {
        return configStore.preferredNameLanguage
    }

    set preferredNameLanguage (val: keyof Media['name']) {
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
