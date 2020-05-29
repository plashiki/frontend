<template>
    <v-card>
        <v-card-title>
            {{ $t('Pages.Report.Name') }}
        </v-card-title>
        <v-divider />
        <v-card-text>
            <v-row>
                <v-col
                    :sm="showEdit ? 6 : 12"
                    cols="12"
                >
                    <ErrorAlert :error="error" />
                    <v-switch
                        :disabled="sending"
                        :label="$t('Pages.Report.SuggestEdit')"
                        :loading="translationLoading"
                        v-model="showEdit"
                    />
                    <v-form v-model="valid1">
                        <v-select
                            :disabled="sending"
                            :items="types"
                            :label="$t('Items.Report.TypeText')"
                            :rules="[requiredField]"
                            class="mb-2"
                            v-model="form.type"
                            validate-on-blur
                        />
                        <v-textarea
                            :disabled="sending"
                            :label="$t('Items.Report.Comment')"
                            auto-grow
                            hide-details
                            outlined
                            v-model="form.comment"
                        />
                    </v-form>
                    <v-responsive
                        :aspect-ratio="16/9"
                        :disabled="sending"
                        class="elevation-3 ma-2"
                        v-if="editableTranslation && !!editableTranslation.url"
                    >
                        <iframe
                            :src="editableTranslation.url"
                            allowfullscreen
                            class="viewer-iframe"
                        ></iframe>
                    </v-responsive>
                </v-col>
                <v-col
                    cols="12"
                    sm="6"
                    v-if="showEdit && editableTranslation"
                >
                    <TranslationForm
                        :form="editableTranslation"
                        :media="media"
                        no-preview
                        v-model="valid2"
                    />
                </v-col>
            </v-row>
        </v-card-text>

        <v-progress-linear
            :active="sending"
            color="primary"
            indeterminate
        />
        <v-divider />

        <v-card-actions>
            <v-btn
                :disabled="sending"
                @click="$emit('close')"
                text
            >
                {{ $t('Common.Form.Cancel') }}
            </v-btn>

            <v-spacer />

            <v-btn
                :disabled="!valid || sending"
                @click="send"
                color="success"
                text
            >
                {{ $t('Common.Form.Send') }}
            </v-btn>
        </v-card-actions>

        <Recaptcha
            :display-legal-notice="false"
            ref="captcha"
        />
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { Report, ReportStatus, ReportType } from '@/types/moderation'
import { ExtendedSingleTranslationData, Translation } from '@/types/translation'
import { requiredField } from '@/utils/validators'
import TranslationForm from '@/components/media/TranslationForm.vue'
import { Media, MediaType } from '@/types/media'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ApiException } from '@/types/api'
import { getSingleTranslation } from '@/api/translations'
import Recaptcha from '@/components/common/Recaptcha.vue'
import { IRecaptcha } from '@/types'
import { submitReport } from '@/api/moderation'
import { sendCaptcha } from '@/api/auth'
import { clone, shallowDiff } from '@/utils/object-utils'
import { iziToastSuccess } from '@/plugins/izitoast'

@Component({
    components: { Recaptcha, ErrorAlert, TranslationForm }
})
export default class ReportForm extends Vue {
    @Prop({ required: true }) translation!: ExtendedSingleTranslationData
    @Prop({ required: true }) mediaType!: MediaType
    @Prop({ required: true }) media!: Media
    @Ref() captcha!: IRecaptcha

    error: ApiException | null = null

    requiredField = requiredField

    valid1 = false
    valid2 = false
    form: Partial<Report> = {}
    showEdit = false

    sending = false

    translationLoading = false
    originalTranslation: Translation | null = null
    editableTranslation: Translation | null = null

    get valid (): boolean {
        return this.valid1 && (!this.showEdit || this.valid2)
    }

    get types (): any[] {
        return Object.values(ReportType).map((type) => ({
            text: this.$t(`Items.Report.Type.${type}`),
            value: type
        }))
    }

    @Watch('showEdit')
    showEditChanged (val: boolean): void {
        if (val) {
            this.translationLoading = true
            getSingleTranslation(this.translation.id).then((tr) => {
                this.originalTranslation = tr
                this.editableTranslation = clone(tr)
            }).catch((err) => {
                this.error = err
            }).finally(() => {
                this.translationLoading = false
            })
        } else {
            this.originalTranslation = null
            this.editableTranslation = null
        }
    }

    initForm (): void {
        this.form = {
            type: null,
            comment: '',
            edit: null
        }
    }

    send (): Promise<void> {
        this.sending = true
        return submitReport({
            ...this.form,
            translation_id: this.translation.id,
            edit: this.originalTranslation && this.editableTranslation ? shallowDiff(this.originalTranslation, this.editableTranslation) as any : undefined
        }).then((report: Report) => {
            iziToastSuccess(this.$t(report.status === ReportStatus.Pending ? 'Pages.Report.ReportSent' : 'Common.Form.ChangesSaved', { id: report.id }))
            this.sending = false
            this.$emit('close')
            this.$emit('update')
            this.initForm()
            this.showEdit = false
        }).catch((err: ApiException) => {
            if (err.code === 'CAPTCHA') {
                return this.captcha.execute()
                    .then(sendCaptcha)
                    .catch((err) => {
                        this.error = err
                    })
                    .then(() => this.send())
            } else {
                this.error = err
                this.sending = false
            }
        })
    }

    mounted (): void {
        this.initForm()
    }
}
</script>

<style>

</style>
