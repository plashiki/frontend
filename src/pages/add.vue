<template>
    <div>
        <v-card>
            <v-card-text>
                <ErrorAlert :error="error" />

                <TranslationForm
                    :disabled="loading || sending"
                    :form="form"
                    :media="initMedia"
                    ref="formEl"
                    v-model="valid"
                >
                    <v-btn
                        :disabled="!valid"
                        :loading="sending"
                        @click="send"
                        color="primary"
                        rounded
                    >
                        {{ $t('Common.Form.Send') }}
                    </v-btn>
                </TranslationForm>
            </v-card-text>
        </v-card>

        <Recaptcha
            :display-legal-notice="false"
            ref="captcha"
        />

        <v-card
            class="mt-2"
        >
            <v-tabs
                v-model="tab"
            >
                <v-spacer />
                <v-tab>
                    {{ $t('Items.Translation.NamePlural') }}
                </v-tab>
                <v-tab>
                    {{ $t('Items.Report.NamePlural') }}
                </v-tab>
                <v-spacer />
                <v-btn
                    @click="update"
                    icon
                >
                    <v-icon>
                        mdi-refresh
                    </v-icon>
                </v-btn>
            </v-tabs>
            <v-tabs-items
                touchless
                v-model="tab"
            >
                <v-tab-item>
                    <TranslationsTable
                        :medias="medias"
                        ref="translations"
                    />
                </v-tab-item>
                <v-tab-item>
                    <ReportsTable
                        ref="reports"
                    />
                </v-tab-item>
            </v-tabs-items>
        </v-card>
        <div
            class="text--secondary caption mt-2"
            v-html="$t('Common.RecaptchaLegalNotice')"
        />
    </div>
</template>

<script lang="ts">
import { Component, Ref } from 'vue-property-decorator'
import SearchFieldAutocomplete from '@/components/search/SearchFieldAutocomplete.vue'
import TranslationForm from '@/components/media/TranslationForm.vue'
import { appStore } from '@/store'
import { getMedias } from '@/api/media'
import LoadableVue from '@/components/common/LoadableVue'
import { Media, MediaId } from '@/types/media'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import TranslationsTable from '@/components/moderation/TranslationsTable.vue'
import Recaptcha from '@/components/common/Recaptcha.vue'
import { IRecaptcha } from '@/types'
import { submitTranslation } from '@/api/moderation'
import { TranslationStatus } from '@/types/translation'
import { ApiException } from '@/types/api'
import { sendCaptcha } from '@/api/auth'
import ReportsTable from '@/components/moderation/ReportsTable.vue'
import { iziToastSuccess } from '@/plugins/izitoast'

@Component({
    components: {
        ReportsTable,
        Recaptcha,
        TranslationsTable,
        ErrorAlert,
        TranslationForm,
        SearchFieldAutocomplete
    }
})
export default class AddTranslationPage extends LoadableVue {
    @Ref() captcha!: IRecaptcha
    @Ref() formEl!: any
    @Ref() translations!: any
    @Ref() reports!: any

    error: ApiException | null = null

    form = {}

    valid = false
    sending = false
    initMedia: Media | null = null

    tab = 0
    medias: Record<MediaId, Media> = {}

    update (): void {
        if (this.tab === 0) this.translations.update()
        else this.reports.update()
    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.AddTranslation.Name')
        })

        if (typeof this.$route.query.id === 'string' && (this.$route.query.type === 'anime' || this.$route.query.type === 'manga')) {
            this.loading = true
            getMedias([this.$route.query.id], this.$route.query.type).then(([media]) => {
                this.initMedia = media
            }).finally(() => {
                this.loading = false
            })
        }
    }

    send (): void {
        this.sending = true
        this.error = null

        submitTranslation(this.form).then((tr) => {
            // just to be sure its not null
            if (this.formEl.selectedMedia) {
                this.medias[tr.target_id] = this.formEl.selectedMedia
            }
            iziToastSuccess(this.$t(tr.status === TranslationStatus.Added ? 'Pages.AddTranslation.Added' : 'Pages.AddTranslation.SentModeration'))
            this.sending = false
            this.translations.update()
        }).catch((err: ApiException) => {
            if (err.code === 'CAPTCHA') {
                this.captcha.execute()
                    .then(sendCaptcha)
                    .then(() => this.send())
            } else if (err.code?.startsWith('TRANSLATION_DUPLICATE_')) {
                this.error = new ApiException('TRANSLATION_DUPLICATE', err.code.substr(22))
                this.sending = false
            } else {
                this.error = err
                this.sending = false
            }
        })
    }
}
</script>

<style>

</style>
