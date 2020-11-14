<template>
    <div>
        <v-dialog
            v-model="editing"
            scrollable
        >
            <TranslationEditDialog
                v-if="editing"
                #default="{ original, editable, setField, proposedEdit = currentReport.edit && proposedEditText(currentReport, true) }"
                :report-id="currentReport.id"
                :translation-id="currentReport.translation_id"
                show-meta
                @close="editing = false"
                @delete="update"
                @update="update"
            >
                <v-card
                    v-if="currentReport.edit"
                    outlined
                >
                    <v-card-title>
                        {{ $t('Items.Report.ProposedEdit') }}
                    </v-card-title>
                    <v-card-text>
                        <div
                            v-for="(it, i) in proposedEdit"
                            :key="i"
                            class="row no-gutters align-center"
                        >
                            <v-btn
                                class="mr-1"
                                small
                                icon
                                :disabled="original[it.object[0]] === it.object[1] || editable[it.object[0]] === it.object[1]"
                                @click="setField(it.object[0], it.object[1])"
                            >
                                <v-icon small>mdi-arrow-top-left</v-icon>
                            </v-btn>
                            <component :is="original[it.object[0]] === it.object[1] ? 's' : 'div'">
                                <b v-html="it.display[0]" />: <span v-html="it.display[1]" />
                            </component>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn
                            color="success"
                            text
                            small
                            :disabled="!proposedEdit.some((it) => original[it.object[0]] !== it.object[1] && editable[it.object[0]] !== it.object[1])"
                            @click="() => proposedEdit.forEach((it) => setField(it.object[0], it.object[1]))"
                        >
                            {{ $t('Common.Form.Apply') }}
                        </v-btn>
                    </v-card-actions>
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
                    <td v-for="i in 3" :key="i"></td>
                </tr>
                <tr v-else>
                    <td>
                        <v-icon
                            v-if="item.status !== 'pending' || moderator"
                            v-tooltip="$t('Items.Report.Status.' + item.status)"
                            :color="item.status === 'pending' ? 'primary' : item.status === 'discarded' ? 'error' : 'success'"
                            v-text="item.status === 'pending' ? 'mdi-clock-outline' : item.status === 'discarded' ? 'mdi-close' : 'mdi-check'"
                        />
                        <v-btn
                            v-else-if="!moderator"
                            v-tooltip="$t('Common.Form.Delete')"
                            :disabled="loading"
                            icon
                            small
                            @click="del(item)"
                        >
                            <v-icon small>
                                mdi-delete
                            </v-icon>
                        </v-btn>
                        <template v-if="item.status === 'pending' && moderator">
                            <template v-if="!item.is_complex">
                                <v-btn
                                    v-tooltip="$t('Pages.Moderation.Consider')"
                                    :disabled="loading"
                                    icon
                                    small
                                    @click="edit(item)"
                                >
                                    <v-icon small>
                                        mdi-eye
                                    </v-icon>
                                </v-btn>
                                <v-btn
                                    v-tooltip="$t('Pages.Moderation.MakeComplex')"
                                    :disabled="loading"
                                    icon
                                    small
                                    @click="makeComplex(item)"
                                >
                                    <v-icon small>
                                        mdi-tag-multiple
                                    </v-icon>
                                </v-btn>
                            </template>
                            <template v-else>
                                <v-btn
                                    v-tooltip="$t('Items.Report.Status.resolved')"
                                    :disabled="loading"
                                    icon
                                    small
                                    @click="resolve(item)"
                                >
                                    <v-icon small>
                                        mdi-check
                                    </v-icon>
                                </v-btn>
                                <v-btn
                                    v-tooltip="$t('Items.Report.Discard')"
                                    :disabled="loading"
                                    icon
                                    small
                                    @click="discard(item)"
                                >
                                    <v-icon small>
                                        mdi-close
                                    </v-icon>
                                </v-btn>
                            </template>
                        </template>
                        <template v-else-if="item.status !== 'pending'">
                            <v-btn
                                v-tooltip="$t('Items.Report.Reopen')"
                                :disabled="loading"
                                icon
                                small
                                @click="reopen(item)"
                            >
                                <v-icon small>
                                    mdi-backup-restore
                                </v-icon>
                            </v-btn>
                        </template>
                    </td>
                    <td v-if="moderator">
                        <UserChip
                            v-if="item.sender"
                            :user="item.sender"
                            control
                            small
                        />
                        <b
                            v-else
                            class="error--text"
                        >
                            {{ $t('Common.No') }}
                        </b>
                    </td>
                    <td v-else>
                        <v-simple-checkbox
                            :value="item.is_complex"
                            readonly
                        />
                    </td>
                    <td>
                        <a
                            :href="item.is_complex ? '/anime/' + item.translation_id : '/translations/' + item.translation_id"
                            target="_blank"
                        >
                            {{ item.translation_id }}
                        </a>
                    </td>
                    <td>
                        {{ $t('Items.Report.Type.' + item.type) }}
                    </td>
                    <td>
                        <i v-if="item.comment === 'AUTO_REPORT_DESCRIPTION'">{{ $t('Pages.Report.AutoReportDescription') }}</i>
                        <template v-else>{{ item.comment }}</template>
                    </td>
                    <td>
                        <b
                            v-if="item.edit === null"
                            class="error--text"
                        >
                            {{ $t('Common.No') }}
                        </b>
                        <span
                            v-else
                            v-tooltip="proposedEditText(item).map(i => `<b>${i.display[0]}</b>: ${i.display[1]}`).join('<br/>')"
                        >
                            {{ $tc('Items.Report.EditNFields', Object.keys(item.edit).length) }}
                        </span>
                    </td>
                    <td>
                        <UserChip
                            v-if="item.closed_by"
                            :user="item.closed_by"
                            :control="moderator"
                            small
                        />
                    </td>
                </tr>
            </template>
        </v-data-table>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Translation } from '@/types/translation'
import {
    deleteReport, discardReport,
    getRecentlySubmittedReports,
    getSubmittedReports,
    makeReportComplex, reopenReport,
    resolveReport,
} from '@/api/moderation'
import { EditableTranslationFields, Report } from '@/types/moderation'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ApiException, PaginatedResponse } from '@/types/api'
import UserChip from '@/components/user/UserChip.vue'
import TranslationEditDialog from '@/components/moderation/TranslationEditDialog.vue'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import { convertDataTableOptionsToPagination } from '@/utils/helpers'

// type ProposedEditField = [string, string, string, any] // display key, object key, display value (html), value
interface ProposedEditField {
    // key, value (html)
    display: [string, string]
    // key, value (if different from display)
    object?: [string, any]
}

@Component({
    components: { TranslationEditDialog, UserChip, ErrorAlert }
})
export default class ReportsTable extends Vue {
    @Prop({ type: Boolean, default: false }) moderator!: boolean
    @Prop({ type: Boolean, default: false }) forComplex!: boolean
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
                text: this.moderator
                    ? this.forComplex
                        ? this.$t('Items.Media.Name') : this.$t('Items.Translation.Name')
                    : this.$t('Items.Translation.Target'),
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
            },
            {
                text: this.$t('Items.Report.ClosedBy'),
                value: 'closed_by_id',
                width: 160
            }
        ]

        if (this.moderator) {
            ret.unshift({
                text: this.$t('Common.Sender'),
                value: 'sender_id',
                width: 160
            })
        } else {
            ret.unshift({
                text: this.$t('Items.Report.IsComplex'),
                value: 'is_complex',
                width: 120
            })
        }

        ret.unshift(status)

        return ret
    }

    edit (it: Report): void {
        this.editing = true
        this.currentReport = it
    }

    resolve (item: Report) {
        resolveReport(item.id).then(() => {
            iziToastSuccess()
            this.update()
        }).catch(iziToastError)
    }

    discard (item: Report) {
        discardReport(item.id).then(() => {
            iziToastSuccess()
            this.update()
        }).catch(iziToastError)
    }

    reopen (item: Report) {
        reopenReport(item.id).then(() => {
            iziToastSuccess()
            this.update()
        }).catch(iziToastError)
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

    makeComplex (item: Report): void {
        makeReportComplex(item.id).then(() => {
            iziToastSuccess()
            this.update()
        }).catch(iziToastError)
    }

    proposedEditText (it: Report, full = false): ProposedEditField[] {
        return it.edit
            ? Object.entries(it.edit)
                .map((object: [string, any]) => {
                    const [key, value] = object
                    if (key === 'lang') {
                        return {
                            display: [this.$t('Items.Translation.LanguageName'), this.$t('Items.Translation.Language.' + value)],
                            object
                        }
                    }

                    if (key === 'kind') {
                        return {
                            display: [this.$t('Items.Translation.KindNameShort'), this.$t('Items.Translation.Kind.' + value)],
                            object
                        }
                    }

                    if (key === 'target_id' || key === 'target_type') {
                        return {
                            display: [this.$t('Items.Translation.Target'), value],
                            object
                        }
                    }

                    if (key === 'part') {
                        return {
                            display: [this.$t('Items.Translation.Part'), value],
                            object
                        }
                    }

                    if (key === 'author') {
                        return {
                            display: [this.$t('Items.Translation.Author'), value],
                            object
                        }
                    }

                    if (key === 'url') {
                        try {
                            let hostname = new URL(value as string).hostname
                            if (full) {
                                return {
                                    display: [
                                        this.$t('Items.Translation.Url'),
                                        `<a href="${(value as string).replace(/"/g, '&quot;')}" target="_blank">${hostname}</a>`
                                    ],
                                    object
                                }
                            }
                            return {
                                display: [this.$t('Items.Translation.Url'), hostname],
                                object
                            }
                        } catch (e) {
                            return {
                                display: [this.$t('Items.Translation.Url'), '[parse failed]'],
                                object
                            }
                        }
                    }

                    return {
                        display: [key, value + '']
                    }
                })
            : []
    }

    @Watch('options', { deep: true })
    update (): Promise<void> {
        this.loading = true
        this.error = null

        const pagination = convertDataTableOptionsToPagination(this.options, true)

        let promise: Promise<PaginatedResponse<Report>>
        if (this.moderator) {
            promise = getRecentlySubmittedReports(this.forComplex, pagination)
        } else {
            promise = getSubmittedReports(pagination)
        }

        return promise.then((data) => {
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
