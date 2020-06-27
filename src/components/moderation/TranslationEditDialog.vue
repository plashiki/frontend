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
                v-model="valid"
                :disabled="loading"
                :form="editableTranslation"
                :show-meta="showMeta"
            >
                <slot />
            </TranslationForm>
        </v-card-text>

        <v-card-actions class="overflow-x-auto">
            <v-btn
                text
                @click="close"
            >
                {{ $t('Common.Form.Cancel') }}
            </v-btn>

            <v-spacer />

            <v-btn
                v-if="!hideDelete && !moderator"
                :disabled="loading"
                icon
                @click="del"
            >
                <v-icon>
                    mdi-delete
                </v-icon>
            </v-btn>
            <DeclineReasonMenu
                v-if="moderator"
                @send="decline"
            >
                <template #default="{ on }">
                    <v-btn
                        color="error"
                        text
                        v-on="on"
                    >
                        {{ $t('Pages.Moderation.Decline') }}
                    </v-btn>
                </template>
            </DeclineReasonMenu>

            <v-btn
                v-if="reportId !== -1"
                color="error"
                text
                @click="discard"
            >
                {{ $t('Items.Report.Discard') }}
            </v-btn>

            <v-btn
                :disabled="loading || !valid"
                color="success"
                text
                @click="save"
            >
                {{ $t(moderator ? 'Pages.Moderation.Accept' : 'Common.Form.Save') }}
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
import DeclineReasonMenu from '@/components/moderation/DeclineReasonMenu.vue'

@Component({
    components: { DeclineReasonMenu, TranslationForm, ErrorAlert }
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
        if (!this.originalTranslation || !this.editableTranslation) return
        this.loading = true
        this.error = null
        let method
        if (this.moderator && this.originalTranslation.status === TranslationStatus.Pending) {
            method = acceptTranslation
        } else if (this.reportId !== -1) {
            method = resolveReport
        } else {
            method = updateTranslation
        }

        method(
            this.reportId !== -1 ? this.reportId : this.originalTranslation.id,
            shallowDiff(this.originalTranslation, this.editableTranslation)
        ).then((tr) => {
            if (this.initTranslation) merge(this.initTranslation, tr)
            this.$emit('update', tr)
            this.$emit('media', (this.$refs.form as any).selectedMedia)
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
