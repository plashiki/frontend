<template>
    <div>
        <v-dialog
            v-model="editing"
            scrollable
        >
            <TranslationEditDialog
                v-if="editing"
                :init-translation="editingTranslation"
                :moderator="moderator"
                :show-meta="moderator"
                @close="editing = false"
                @media="medias[$event.id] = $event"
                @update="update"
            />
        </v-dialog>

        <ErrorAlert :error="error" />

        <v-data-table
            v-model="selected"
            :footer-props="{ itemsPerPageOptions: [15, 25, 50], class: 'flex-nowrap' }"
            :headers="headers"
            :items="items"
            :loading="loading"
            :mobile-breakpoint="0"
            :no-data-text="$t('Common.Collection.NoItemsFound')"
            :options.sync="options"
            :server-items-length="count"
            :show-select="admin"
            class="overflow-auto mt-3"
            multi-sort
        >
            <template #item.status="{ value, item }">
                <v-icon
                    v-if="value !== 'pending' || moderator || admin"
                    v-tooltip="{
                        content: () => getTooltip(item),
                        loadingContent: $t('Common.Loading')
                    }"
                    :class="{ 'mr-1': moderator }"
                    :color="value === 'declined' ? 'error' : value === 'pending' ? 'primary' : 'success'"
                >
                    {{ value === 'declined' ? 'mdi-close' : value === 'pending' ? 'mdi-clock-outline' : 'mdi-check' }}
                </v-icon>
                <template v-if="value === 'pending' || moderator || admin">
                    <template v-if="value === 'pending' && moderator">
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

                        <PopupTextInput
                            #default="{ on }"
                            :label="$t('Pages.Moderation.DeclineReason')"
                            @send="decline(item, $event)"
                        >
                            <v-btn
                                v-tooltip="$t('Pages.Moderation.Decline')"
                                :disabled="loading"
                                icon
                                small
                                v-on="on"
                            >
                                <v-icon small>
                                    mdi-close
                                </v-icon>
                            </v-btn>
                        </PopupTextInput>
                    </template>
                    <template v-else>
                        <v-btn
                            v-tooltip="$t('Common.Form.Edit')"
                            :disabled="deleting[item.id]"
                            icon
                            small
                            @click="edit(item)"
                        >
                            <v-icon small>
                                mdi-pencil
                            </v-icon>
                        </v-btn>
                        <v-btn
                            v-tooltip="$t('Common.Form.Delete')"
                            :disabled="loading || deleting[item.id]"
                            icon
                            small
                            @click="del(item)"
                        >
                            <v-icon small>
                                mdi-delete
                            </v-icon>
                        </v-btn>
                    </template>
                </template>

                <v-btn
                    v-if="value === 'added'"
                    v-tooltip="$t('Common.Action.Open')"
                    :href="'/translations/' + item.id"
                    icon
                    small
                    target="_blank"
                >
                    <v-icon small>
                        mdi-open-in-new
                    </v-icon>
                </v-btn>
            </template>
            <template #item.uploader_id="{ item }">
                <UserChip
                    v-if="item.uploader"
                    :user="item.uploader"
                    control
                    small
                />
                <b
                    v-else
                    class="error--text"
                >
                    {{ $t('Common.No') }}
                </b>
            </template>
            <template #item.target_id="{ value, item }">
                <a
                    v-tooltip="value in medias ? `${mediaName(medias[value])} (${value})` : undefined"
                    :href="value in medias ? medias[value].url : mediaLinkFor(item)"
                    class="text-truncate d-block text--primary"
                    style="width: 160px"
                    target="_blank"
                >
                    {{ value in medias ? mediaName(medias[value]) : 'id' + value }}
                </a>
            </template>
            <template #item._kind="{ item }">
                <div
                    v-tooltip="$t('Items.Translation.Language.' + item.lang + item.kind)"
                    :class="'no-dots text-truncate large flag-' + item.lang"
                >
                    <v-icon
                        class="icon-mid-size"
                        style="vertical-align: text-bottom;"
                    >
                        {{
                            item.kind === 'sub' ? 'mdi-subtitles-outline' :
                            item.kind === 'dub' ? 'mdi-text-to-speech' :
                            'mdi-syllabary-hiragana'
                        }}
                    </v-icon>
                </div>
            </template>
            <template #item.author="{ value }">
                <div
                    v-tooltip.bottom="(value.ripper || value.group && value.people && value.people.length) && $t('Items.Translation.AuthorTooltip', {
                        group: value.group || 'N/A',
                        people: value.people && value.people.length ? value.people.join(', ') : 'N/A',
                        ripper: value.ripper || 'N/A'
                    })"
                    class="text-truncate"
                    :class="{ 'underline-dots': value.ripper || value.group && value.people && value.people.length }"
                    style="width: 140px"
                >
                    {{ authorToString(value, true) }}
                </div>
            </template>
            <template #item.updated_at="{ value }">
                {{ formatTime(value) }}
            </template>
            <template #item.url="{ value }">
                <a
                    :href="value"
                    class="text-truncate d-block"
                    style="width: 320px"
                    target="_blank"
                >
                    {{ value }}
                </a>
            </template>
        </v-data-table>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { ApiException, PaginatedResponse } from '@/types/api'
import { Translation, TranslationStatus } from '@/types/translation'
import {
    declineTranslation,
    deleteTranslation,
    getDeclineReason,
    getRecentlySubmittedTranslations,
    getSubmittedTranslations,
    getTranslationsInGroup
} from '@/api/moderation'
import { Media, MediaId } from '@/types/media'
import { getPreferredName, authorToString } from '@/utils/media-utils'
import { getMedias } from '@/api/media'
import TranslationEditDialog from '@/components/moderation/TranslationEditDialog.vue'
import { uniqueBy } from '@/utils/object-utils'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import UserChip from '@/components/user/UserChip.vue'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import { convertDataTableOptionsToPagination } from '@/utils/helpers'
import { formatDistance } from 'date-fns'
import { dateFnLocale } from '@/plugins/vue-i18n'
import { getProviderNow } from '@/api/providers'
import PopupTextInput from '@/components/misc/PopupTextInput.vue'

@Component({
    components: { PopupTextInput, UserChip, ErrorAlert, TranslationEditDialog }
})
export default class TranslationsTable extends Vue {
    @Prop({ default: () => [] }) value!: any[]
    @Prop({ required: true }) medias!: Record<MediaId, Media>
    @Prop({ type: Boolean, default: false }) moderator!: boolean
    @Prop({ type: Boolean, default: false }) admin!: boolean
    @Prop({ type: String, default: '' }) group!: string

    authorToString = authorToString

    options: any = {}
    count = 0

    error: ApiException | null = null

    loading = false
    items: Translation[] = []

    editing = false
    editingTranslation: Translation | null = null

    declineReasons: Record<number, string | Promise<string>> = {}
    deleting: Record<number, true> = {}

    get selected (): any[] {
        return this.value
    }

    set selected (items: any[]) {
        this.$emit('input', items)
    }

    get headers (): any[] {
        let status = {
            text: this.$t('Items.Translation.StatusName'),
            value: 'status',
            width: this.moderator || this.admin ? 144 : 116
        }

        let arr = [
            {
                text: this.$t('Items.Translation.Target'),
                value: 'target_id',
                sortable: false,
                width: 160
            },
            {
                text: this.$t('Items.Translation.Part'),
                value: 'part',
                width: 116
            },
            {
                text: this.$t('Items.Translation.KindNameShort'),
                value: '_kind',
                sortable: false,
                width: 70
            },
            {
                text: this.$t('Items.Translation.Author'),
                value: 'author',
                width: 140
            }
        ]

        if (this.moderator || this.admin) {
            arr.unshift({
                text: this.$t('Common.Sender'),
                value: 'uploader_id',
                width: 160
            })
            arr.push({
                text: this.$t('Common.UpdatedAt'),
                value: 'updated_at',
                width: 150
            })
        }

        arr.unshift(status)
        arr.push({
            text: this.$t('Items.Translation.Url'),
            value: 'url',
            sortable: false,
            width: 320
        })

        return arr
    }

    formatTime (time: string): string {
        if (time === '1970-01-01T00:00:00.000Z') return this.$t('Common.No')
        let date = new Date(time)
        return formatDistance(date, new Date(), {
            locale: dateFnLocale(),
            addSuffix: true
        })
    }

    getTooltip (item: Translation): Promise<string> {
        if (item.status !== TranslationStatus.Declined) {
            return Promise.resolve(this.$t('Items.Translation.Status.' + item.status))
        }
        if (item.id in this.declineReasons) {
            return Promise.resolve(this.declineReasons[item.id])
        }

        let prom = getDeclineReason(item.id).then((reason) => {
            let str = this.$t('Items.Translation.Status.declined')
            if (reason) {
                str += ': ' + reason
            }
            this.declineReasons[item.id] = str
            return str
        })

        this.declineReasons[item.id] = prom

        return prom

    }

    mediaName (item: Media): string {
        return getPreferredName(item.name)
    }

    edit (it: Translation): void {
        this.editing = true
        this.editingTranslation = it
    }

    del (it: Translation): void {
        this.$set(this.deleting, it.id, true)
        deleteTranslation(it.id).then(() => {
            this.items = this.items.filter(i => i.id !== it.id)
            iziToastSuccess(this.$t('Common.Action.Deleted'))
        }).catch(iziToastError).finally(() => {
            this.$delete(this.deleting, it.id)
        })
    }

    decline (it: Translation, reason = ''): void {
        if (!this.moderator) return
        this.loading = true
        this.error = null

        declineTranslation(it.id, reason)
            .then(() => this.update())
            .catch((err) => {
                this.error = err
            })
            .finally(() => {
                this.loading = false
            })
    }

    @Watch('options', { deep: true })
    update (): Promise<void> {
        this.loading = true
        this.error = null
        let prom: Promise<PaginatedResponse<Translation>>
        let pagination = convertDataTableOptionsToPagination(this.options, true)
        if (this.admin && this.group) {
            prom = getTranslationsInGroup(this.group, pagination)
        } else if (this.moderator || this.admin) {
            prom = getRecentlySubmittedTranslations(pagination, this.admin)
        } else {
            prom = getSubmittedTranslations(pagination)
        }

        return prom
            .then((data) => {
                this.count = data.count
                this.items = data.items

                let animeIds = uniqueBy(
                    data.items.filter(it => it.target_type === 'anime').map(i => i.target_id)
                ).filter(i => !(i in this.medias))
                // let mangaIds = data.filter(it => it.target_type === 'manga')

                return getMedias(animeIds, 'anime')
            }).then((res) => {
                res.forEach((it) => {
                    this.$set(this.medias, it.id, it)
                })
            }).catch((err) => {
                this.error = err
            }).finally(() => {
                this.loading = false
            })
    }

    mediaLinkFor (tr: Translation): string {
        return getProviderNow().getUrlByMediaId(tr.target_type, tr.target_id)
    }
}
</script>
