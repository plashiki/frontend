<template>
    <div class="cards-page-container">
        <ParsersStatisticsDialog
            v-model="statsDialog"
            :parser-uid="selectedForDialog ? selectedForDialog.uid : ''"
        />
        <v-dialog
            v-if="selectedForDialog"
            v-model="storageDialog"
            scrollable
        >
            <v-card>
                <v-card-title>
                    {{ selectedForDialog.uid }} storage
                    <v-spacer />
                    <v-btn
                        icon
                        @click="storageDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

                <v-card-text>
                    <KeyValueStorage
                        :parser="selectedForDialog"
                    />
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-simple-card>
            <v-text-field
                v-model="searchInput"
                append-icon="mdi-magnify"
                :label="$t('Pages.Search.Name')"
                hide-details
            />
            <div>
                <a @click="searchInput = ''">*</a> /
                <a @click="searchInput = 'importers/*'">importers/*</a> /
                <a @click="searchInput = 'mappers/*'">mappers/*</a> /
                <a @click="searchInput = 'cleaners/*'">cleaners/*</a>
            </div>
        </v-simple-card>
        <v-simple-card class="mt-3">
            <div class="d-flex flex-row">
                <p
                    class="font-weight-bold text--secondary mb-1"
                    v-text="$t('Common.Collection.Selected', { n: selected.length })"
                />
                <v-spacer />
                <v-menu :close-on-content-click="false">
                    <template #activator="{ on }">
                        <p
                            v-show="stateLastUpdated !== ''"
                            class="font-weight-bold text--secondary mb-1 link-like"
                            v-on="on"
                            v-text="`State (last update ${stateLastUpdated})`"
                        />
                    </template>

                    <v-simple-card>
                        <pre>{{ JSON.stringify(state, null, 4) }}</pre>
                    </v-simple-card>
                </v-menu>
            </div>
            <v-btn
                class="ma-1"
                :color="stateTimer ? 'error' : 'primary'"
                depressed
                small
                @click="() => stateTimer ? cancelStateTimer() : updateState(true)"
            >
                <v-icon left>
                    {{ stateTimer ? 'mdi-close' : 'mdi-eye' }}
                </v-icon>
                {{ stateTimer ? 'Cancel' : 'Monitor' }}
            </v-btn>
            <v-btn
                :disabled="selected.length === 0"
                class="ma-1"
                depressed
                small
                @click="selected = []"
            >
                <v-icon left>
                    mdi-select-off
                </v-icon>
                Clear selection
            </v-btn>
            <v-btn
                color="success"
                class="ma-1"
                :disabled="(selected.length === 0 || !selectionIsRunnable) && !entireRunnableKindVisible"
                :loading="actionLoading"
                depressed
                small
                @click="() => start(selected.map(i => i.uid))"
            >
                <v-icon left>
                    mdi-play
                </v-icon>
                {{ entireRunnableKindVisible ? 'Start all' : 'Start' }}
            </v-btn>
            <v-btn
                color="primary"
                class="ma-1"
                :disabled="selected.length === 0"
                :loading="actionLoading"
                depressed
                small
                @click="toggle('enable')"
            >
                <v-icon left>
                    mdi-power-plug
                </v-icon>
                Enable
            </v-btn>
            <v-btn
                color="error"
                class="ma-1"
                :disabled="selected.length === 0"
                :loading="actionLoading"
                depressed
                small
                @click="toggle('disable')"
            >
                <v-icon left>
                    mdi-power-plug-off
                </v-icon>
                Disable
            </v-btn>
        </v-simple-card>
        <v-simple-card class="mt-3">
            <v-data-table
                v-model="selected"
                item-key="uid"
                :footer-props="{ itemsPerPageOptions: [15, 25, 50], class: 'flex-nowrap' }"
                :headers="headers"
                :items="items"
                :loading="loading"
                :mobile-breakpoint="0"
                :no-data-text="$t('Common.Collection.NoItemsFound')"
                :options.sync="options"
                :server-items-length="count"
                show-select
                class="overflow-auto"
                multi-sort
            >
                <template #item._actions="{ item }">
                    <v-btn
                        v-tooltip="'Storage'"
                        icon
                        @click="openStorage(item)"
                    >
                        <v-icon>mdi-database</v-icon>
                    </v-btn>
                    <v-btn
                        v-show="isRunnable(item)"
                        v-tooltip="'Statistics'"
                        icon
                        @click="openStats(item)"
                    >
                        <v-icon>mdi-chart-line</v-icon>
                    </v-btn>
                    <v-btn
                        v-show="isRunnable(item)"
                        v-tooltip="item.disabled ? 'Enable' : 'Disable'"
                        icon
                        @click="toggle(item.disabled ? 'enable' : 'disable', [item.uid])"
                    >
                        <v-icon>
                            {{ item.disabled ? 'mdi-power-plug' : 'mdi-power-plug-off' }}
                        </v-icon>
                    </v-btn>
                    <v-btn
                        v-show="isRunnable(item)"
                        v-tooltip="'Start'"
                        :disabled="item.disabled || isRunning(item.uid.split('/')[0])"
                        icon
                        @click="start([item.uid])"
                    >
                        <v-icon>mdi-play</v-icon>
                    </v-btn>
                </template>
                <template #item._status="{ item }">
                    <passthru
                        #default="{ status }"
                        :status="parseStatus(item)"
                    >
                        <v-chip
                            v-if="status"
                            v-tooltip="status.tooltip"
                            :color="status.color"
                            class="no-dots"
                            label
                            small
                            outlined
                        >
                            <v-icon
                                left
                                small
                                v-text="status.icon"
                            />
                            {{ status.text }}
                        </v-chip>
                    </passthru>
                </template>
                <template #item.provide="{ value }">
                    <span
                        v-if="value.length === 0"
                        v-text="$t('Common.No')"
                    />
                    <span
                        v-else
                        v-tooltip="value.join('<br/>')"
                        v-text="$t('Common.Pcs', { n: value.length })"
                    />
                </template>
                <template #item.cri="{ value }">
                    <v-simple-checkbox
                        :value="value"
                        disabled
                    />
                </template>
                <template #item.disabled="{ value }">
                    <v-simple-checkbox
                        :value="value"
                        disabled
                    />
                </template>
            </v-data-table>
        </v-simple-card>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { appStore } from '@/store'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import { Debounced } from '@/utils/function-utils'
import { ApiException } from '@/types/api'
import { Parser, ParsersState } from '@/types/misc'
import { convertDataTableOptionsToPagination } from '@/utils/helpers'
import { getParsers, getParsersState, startParsers, toggleParsers } from '@/api/admin'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import { Passthru } from '@/components/common/passthru'
import ParsersStatisticsDialog from '@/components/admin/ParsersStatisticsDialog.vue'
import KeyValueStorage from '@/components/admin/KeyValueStorage.vue'

@Component({
    components: { KeyValueStorage, ParsersStatisticsDialog, VSimpleCard, Passthru },
})
export default class ParsersPage extends Vue {
    selected: Parser[] = []
    searchInput = ''

    selectedForDialog: Parser | null = null
    statsDialog = false
    storageDialog = false

    state: ParsersState | null = null
    stateTimer: number | null = null
    stateLastUpdated = ''

    options: any = {}
    count = 0

    error: ApiException | null = null

    loading = false
    actionLoading = false
    items: Parser[] = []

    get headers (): any[] {
        return [
            {
                text: 'Actions',
                value: '_actions',
                sortable: false,
            },
            {
                text: 'Status',
                value: '_status',
                sortable: false,
                align: 'center',
            },
            {
                text: 'UID',
                value: 'uid',
            },
            {
                text: 'Dependencies',
                value: 'provide',
            },
            {
                text: 'CRI',
                value: 'cri',
            },
            {
                text: 'Disabled',
                value: 'disabled',
            },
        ]
    }

    get selectionIsRunnable (): boolean {
        if (!this.selected) return false
        let groupKind: string | null = null
        for (let it of this.selected) {
            let kind = it.uid.split('/')[0]
            if (groupKind === null) groupKind = kind
            else if (kind !== groupKind) return false
        }
        return groupKind === 'importers' || groupKind === 'mappers' || groupKind === 'cleaners'
    }

    get entireRunnableKindVisible (): boolean {
        return this.selected.length === 0 && !!this.searchInput.match(/^(importers|mappers|cleaners)\/\*$/i)
    }

    openStats (parser: Parser) {
        this.selectedForDialog = parser
        this.statsDialog = true
    }

    openStorage (parser: Parser) {
        this.selectedForDialog = parser
        this.storageDialog = true
    }

    parseStatus (item: Parser): any {
        let kind = item.uid.split('/')[0]
        if (!this.state || !(
            kind in this.state
        )) return null

        let status = (
            this.state as any
        )[kind].states[item.uid]
        if (!status) return null

        if (status === 'waiting') {
            return {
                icon: 'mdi-clock',
                color: 'primary',
                text: 'Waiting',
            }
        }
        if (status === 'preparing') {
            return {
                icon: 'mdi-server',
                color: 'primary',
                text: 'Preparing',
            }
        }
        if (status.startsWith('running|')) {
            return {
                icon: 'mdi-play',
                color: 'warning',
                text: `Running (${status.split('|')[1]})`,
            }
        }
        if (status.startsWith('finished|')) {
            return {
                icon: 'mdi-check',
                color: 'success',
                text: `Finished (${status.split('|')[1]})`,
            }
        }
        if (status.startsWith('error\n')) {
            return {
                icon: 'mdi-close',
                color: 'error',
                text: 'Error',
                tooltip: '<pre>'
                    + status.substr(6) // drop 'error\n'
                    + '</pre>',
            }
        }
    }

    cancelStateTimer () {
        if (!this.stateTimer) return

        clearTimeout(this.stateTimer)
        this.stateTimer = null
    }

    updateState (setTimer = false) {
        if (setTimer) {
            this.stateTimer = 1
        }

        getParsersState().then((state) => {
            this.state = state
            this.stateLastUpdated = new Date().toISOString()

            if (setTimer && this.stateTimer) {
                this.stateTimer = setTimeout(() => this.updateState(true), 500)
            }
        }).catch((err) => {
            iziToastError(err)
            this.cancelStateTimer()
        })
    }

    isRunning (kind: string): boolean {
        return (
            this.state as any
        )?.[kind]?.running
    }

    toggle (action: 'enable' | 'disable', uids = this.selected.map(i => i.uid)) {
        this.actionLoading = true

        toggleParsers(uids, action)
            .then(() => {
                iziToastSuccess()
                this.update()
            })
            .catch(iziToastError)
            .finally(() => {
                this.actionLoading = false
            })
    }

    isRunnable (it: Parser): boolean {
        return !it.cri && !!it.uid.match(/^(importers|mappers|cleaners)\//)
    }

    start (uids = this.selected.map(i => i.uid)) {
        let kind
        if (uids.length) {
            kind = uids[0].split('/')[0]
        } else if (this.entireRunnableKindVisible) {
            kind = this.searchInput.split('/')[0]
        } else {
            return
        }

        this.actionLoading = true
        startParsers(kind, uids)
            .then(() => {
                iziToastSuccess()
                this.updateState(true)
            })
            .catch(iziToastError)
            .finally(() => {
                this.actionLoading = false
            })
    }

    @Watch('options', { deep: true })
    update () {
        this.loading = true
        this.error = null

        let pagination = convertDataTableOptionsToPagination(this.options, true)
        getParsers(pagination, this.searchInput).then((items) => {
            this.items = items.items
            this.count = items.count
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })

        this.updateState()
    }

    @Watch('searchInput')
    @Debounced(500)
    doSearch () {
        this.options.page = 1
        this.update()
    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.Parsers.Name'),
            showUpdateButton: true,
        })
    }
}
</script>

<style>

</style>
