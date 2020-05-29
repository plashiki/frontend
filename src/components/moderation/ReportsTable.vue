<template>
    <div>
        <v-dialog v-model="editing">
            <TranslationEditDialog
                :report-id="currentReport.id"
                :translation-id="currentReport.translation_id"
                @close="editing = false"
                @delete="update"
                @update="update"
                v-if="editing"
            >
                <v-card
                    outlined
                    v-if="currentReport.edit"
                >
                    <v-card-title>
                        {{ $t('Items.Report.ProposedEdit') }}
                    </v-card-title>
                    <v-card-text
                        v-html="proposedEditText(currentReport, true)"
                    />
                </v-card>
            </TranslationEditDialog>
        </v-dialog>

        <ErrorAlert :error="error" />

        <v-data-table
            :footer-props="{ itemsPerPageOptions: [15, 25, 50], class: 'flex-nowrap' }"
            :headers="headers"
            :items="items"
            :loading="loading"
            :mobile-breakpoint="0"
            :no-data-text="$t('Common.Collection.NoItemsFound')"
            :options.sync="options"
            :server-items-length="count"
            class="overflow-auto mt-3"
            multi-sort
        >
            <template #item="{ item }">
                <tr v-if="deleting[item.id]">
                    <td></td>
                    <td>
                        {{ $t('Common.Action.Deleting') }}
                    </td>
                    <td :key="i" v-for="i in 3"></td>
                </tr>
                <tr v-else>
                    <td>
                        <v-icon
                            :color="item.status === 'pending' ? 'primary' : item.status === 'discarded' ? 'error' : 'success'"
                            v-if="item.status !== 'pending' || moderator"
                            v-text="item.status === 'pending' ? 'mdi-clock-outline' : item.status === 'discarded' ? 'mdi-close' : 'mdi-check'"
                            v-tooltip="$t('Items.Report.Status.' + item.status)"
                        />
                        <v-btn
                            :disabled="loading"
                            @click="del(item)"
                            icon
                            small
                            v-else-if="!moderator"
                            v-tooltip="$t('Common.Form.Delete')"
                        >
                            <v-icon small>
                                mdi-delete
                            </v-icon>
                        </v-btn>
                        <template v-if="item.status === 'pending' && moderator">
                            <v-btn
                                :disabled="loading"
                                @click="edit(item)"
                                icon
                                small
                                v-tooltip="$t('Pages.Moderation.CloserLook')"
                            >
                                <v-icon small>
                                    mdi-eye
                                </v-icon>
                            </v-btn>
                        </template>
                    </td>
                    <td v-if="moderator">
                        <UserChip
                            :user="item.sender"
                            control
                            small
                            v-if="item.sender"
                        />
                        <b
                            class="error--text"
                            v-else
                        >
                            {{ $t('Common.No') }}
                        </b>
                    </td>
                    <td>
                        <a
                            :href="'/translations/' + item.translation_id"
                            target="_blank"
                        >
                            {{ item.translation_id }}
                        </a>
                    </td>
                    <td>
                        {{ $t('Items.Report.Type.' + item.type) }}
                    </td>
                    <td>
                        {{ item.comment }}
                    </td>
                    <td>
                        <b
                            class="error--text"
                            v-if="item.edit === null"
                        >
                            {{ $t('Common.No') }}
                        </b>
                        <span
                            v-else
                            v-tooltip="proposedEditText(item)"
                        >
                            {{ $tc('Items.Report.EditNFields', Object.keys(item.edit).length) }}
                        </span>
                    </td>
                </tr>
            </template>
        </v-data-table>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Translation } from '@/types/translation'
import { deleteReport, getRecentlySubmittedReports, getSubmittedReports } from '@/api/moderation'
import { EditableTranslationFields, Report } from '@/types/moderation'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ApiException } from '@/types/api'
import UserChip from '@/components/user/UserChip.vue'
import TranslationEditDialog from '@/components/moderation/TranslationEditDialog.vue'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import { convertDataTableOptionsToPagination } from '@/utils/helpers'

@Component({
    components: { TranslationEditDialog, UserChip, ErrorAlert }
})
export default class ReportsTable extends Vue {
    @Prop({ type: Boolean, default: false }) moderator!: boolean
    error: ApiException | null = null

    options: any = {}
    count = 0

    translations: Record<number, Translation> = {}
    items: Report[] = []
    loading = false

    editing = false
    currentReport: Report | null = null

    deleting: Record<number, true> = {}

    get headers (): any[] {
        let status = {
            text: this.$t('Items.Translation.StatusName'),
            value: 'status',
            width: 116
        }

        let ret = [

            {
                text: this.$t('Items.Translation.Target'),
                value: 'translation_id',
                width: 140
            },
            {
                text: this.$t('Items.Report.TypeText'),
                value: 'type',
                width: 160
            },
            {
                text: this.$t('Items.Report.Comment'),
                value: 'comment',
                width: 200
            },
            {
                text: this.$t('Items.Report.ProposedEdit'),
                sortable: false,
                width: 320
            }
        ]

        if (this.moderator) {
            ret.unshift({
                text: this.$t('Common.Sender'),
                value: 'sender_id',
                width: 160
            })
        }

        ret.unshift(status)

        return ret
    }

    edit (it: Report): void {
        this.editing = true
        this.currentReport = it
    }

    del (item: Report): void {
        this.$set(this.deleting, item.id, true)
        deleteReport(item.id).then(() => {
            this.items = this.items.filter(i => i.id !== item.id)
            iziToastSuccess(this.$t('Common.Action.Deleted'))
        }).catch(iziToastError).finally(() => {
            this.$delete(this.deleting, item.id)
        })
    }

    proposedEditText (it: Report, full = false): string {
        return it.edit
            ? Object.entries(it.edit)
                .map(([key, value]) => {
                    key = key as EditableTranslationFields
                    if (key === 'lang') {
                        return [this.$t('Items.Translation.LanguageName'), this.$t('Items.Translation.Language.' + value)]
                    }

                    if (key === 'kind') {
                        return [this.$t('Items.Translation.KindNameShort'), this.$t('Items.Translation.Kind.' + value)]
                    }

                    if (key === 'hq') {
                        return [this.$t('Items.Translation.IsHqShort'), this.$t(value ? 'Common.Yes' : 'Common.No')]
                    }

                    if (key === 'target_id' || key === 'target_type') {
                        return [this.$t('Items.Translation.Target'), value]
                    }

                    if (key === 'part') {
                        return [this.$t('Items.Translation.Part'), value]
                    }

                    if (key === 'author') {
                        return [this.$t('Items.Translation.Author'), value]
                    }

                    if (key === 'url') {
                        try {
                            let hostname = new URL(value as string).hostname
                            if (full) {
                                return [
                                    this.$t('Items.Translation.Url'),
                                    `<a href="${(value as string).replace(/"/g, '&quot;')}">${hostname}</a>`
                                ]
                            }
                            return [this.$t('Items.Translation.Url'), hostname]
                        } catch (e) {
                            return [this.$t('Items.Translation.Url'), '[parse failed]']
                        }
                    }

                    return [key, value]
                })
                .map(([k, v]) => `${k}: ${v}`)
                .join('<br>')
            : ''
    }

    @Watch('options', { deep: true })
    update (): Promise<void> {
        this.loading = true
        this.error = null

        return (this.moderator ? getRecentlySubmittedReports : getSubmittedReports)(
            convertDataTableOptionsToPagination(this.options, true)
        ).then((data) => {
            this.items = data.items
            this.count = data.count
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }
}
</script>

<style>

</style>
