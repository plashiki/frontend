<template>
    <v-card>
        <v-card-title>
            {{ $t('Items.Translation.Edit') }}
        </v-card-title>

        <v-divider />
        <v-progress-linear
            :active="loading"
            color="primary"
            indeterminate
        />

        <ErrorAlert :error="error" />

        <v-card-text>
            <TranslationForm
                v-if="editableTranslation"
                ref="form"
                #default="{ setField }"
                v-model="valid"
                :disabled="loading"
                :form="editableTranslation"
                :show-meta="showMeta"
            >
                <slot
                    :original="originalTranslation"
                    :editable="editableTranslation"
                    :set-field="setField"
                />
            </TranslationForm>
        </v-card-text>

        <v-card-actions class="overflow-x-auto">
            <v-btn
                text
                @click="close"
            >
                {{ $t('Common.Form.Cancel') }}
            </v-btn>
            <v-btn
                v-if="this.originalTranslation && this.originalTranslation.id"
                text
                :disabled="!this.originalTranslation || !this.editableTranslation"
                @click="reset"
            >
                {{ $t('Common.Action.Reset') }}
            </v-btn>

            <v-spacer />

            <v-btn
                v-if="!hideDelete && (!moderator || this.originalTranslation && this.originalTranslation.status !== 'pending')"
                :disabled="loading"
                icon
                @click="del"
            >
                <v-icon>
                    mdi-delete
                </v-icon>
            </v-btn>
            <PopupTextInput
                v-if="moderator && this.originalTranslation && this.originalTranslation.uploader_id && this.originalTranslation.status !== 'declined'"
                #default="{ on }"
                :label="$t('Pages.Moderation.DeclineReason')"
                @send="decline"
            >
                <v-btn
                    color="error"
                    text
                    v-on="on"
                >
                    {{ $t('Pages.Moderation.Decline') }}
                </v-btn>
            </PopupTextInput>

            <v-btn
                v-if="reportId !== -1"
                color="error"
                text
                @click="discard"
            >
                {{ $t('Items.Report.Discard') }}
            </v-btn>

            <v-btn
                :disabled="loading || (editableTranslation && !valid)"
                color="success"
                text
                @click="save"
            >
                {{ $t(moderator && this.originalTranslation && this.originalTranslation.status !== 'added' ? 'Pages.Moderation.Accept' : 'Common.Form.Save') }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Translation, TranslationStatus } from '@/types/translation'
import { clone, merge, shallowDiff } from '@/utils/object-utils'
import { getSingleTranslation } from '@/api/translations'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ApiException } from '@/types/api'
import TranslationForm from '@/components/media/TranslationForm.vue'
import {
    acceptTranslation,
    declineTranslation,
    deleteTranslation,
    discardReport,
    resolveReport,
    resolveReportDelete,
    updateTranslation
} from '@/api/moderation'
import PopupTextInput from '@/components/misc/PopupTextInput.vue'

@Component({
    components: { PopupTextInput, TranslationForm, ErrorAlert }
})
export default class TranslationEditDialog extends Vue {
    @Prop() value!: boolean
    @Prop({ type: Object, default: null }) initTranslation!: Translation | null
    @Prop({ type: Number, default: null }) translationId!: number | null
    @Prop({ type: Boolean, default: false }) hideDelete!: boolean
    @Prop({ type: Boolean, default: false }) moderator!: boolean
    @Prop({ type: Boolean, default: false }) showMeta!: boolean
    @Prop({ type: Number, default: -1 }) reportId!: number

    error: ApiException | null = null

    loading = false
    valid = false
    originalTranslation: Translation | null = null
    editableTranslation: Translation | null = null

    reset (): void {
        if (!this.originalTranslation || !this.editableTranslation) return
        Object.entries(this.originalTranslation).forEach(([k, v]) => (this.$refs.form as any).setField(k, v))
    }

    close (): void {
        this.$emit('close')
    }

    decline (reason: string): void {
        if (!this.originalTranslation) return
        this.loading = true
        this.error = null

        declineTranslation(this.originalTranslation.id, reason).then((tr) => {
            this.$emit('update', tr)
            this.close()
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    save (): void {
        if ((!this.originalTranslation || !this.editableTranslation) && this.reportId === -1) return;
        (this.$refs.form as any)?.applyPendingChanges()

        this.loading = true
        this.error = null
        let method
        if (this.reportId !== -1) {
            method = resolveReport
        } else if (this.moderator && this.originalTranslation!.status !== TranslationStatus.Added) {
            method = acceptTranslation
        } else {
            method = updateTranslation
        }

        method(
            this.reportId !== -1 ? this.reportId : this.originalTranslation!.id,
            this.originalTranslation && this.editableTranslation ? shallowDiff(this.originalTranslation, this.editableTranslation) : {}
        ).then((tr) => {
            if (this.initTranslation) merge(this.initTranslation, tr)
            this.$emit('update', tr)
            this.$emit('media', (this.$refs.form as any)?.selectedMedia)
            this.close()
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    discard (): void {
        if (this.reportId === -1) return
        this.loading = true
        this.error = null

        discardReport(this.reportId).then(() => {
            this.$emit('update')
            this.close()
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    del (): void {
        if (!this.originalTranslation) return
        this.loading = true
        this.error = null
        let id = this.reportId !== -1 ? this.reportId : this.originalTranslation.id;
        (this.reportId !== -1 ? resolveReportDelete : deleteTranslation)(id).then(() => {
            this.$emit('delete', id)
            this.close()
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    @Watch('initTranslation')
    @Watch('translationId')
    init (): void {
        this.originalTranslation = null
        this.editableTranslation = null
        this.error = null

        if (this.initTranslation) {
            this.originalTranslation = this.initTranslation
            this.editableTranslation = clone(this.initTranslation)
        } else if (this.translationId) {
            this.loading = true

            getSingleTranslation(this.translationId).then((tr) => {
                if (!tr) {
                    throw new ApiException('NOT_FOUND')
                }
                this.originalTranslation = tr
                this.editableTranslation = clone(tr)
            }).catch((err) => {
                this.error = err
            }).finally(() => {
                this.loading = false
            })
        }
    }

    mounted (): void {
        this.init()
    }
}
</script>

<style>

</style>
