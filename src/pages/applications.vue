<template>
    <div class="cards-page-container">
        <v-dialog
            v-model="editingDialog"
            max-width="600"
        >
            <ApplicationEditForm
                v-if="editingDialog"
                :app="editing"
                @close="(editingDialog = false) && (editing = null)"
                @create="storage[1].push($event)"
                @update="requestUpdate"
            />
        </v-dialog>

        <v-card class="pa-1">
            <v-tabs
                v-model="tab"
                centered
            >
                <v-tab>{{ $t('Pages.Applications.HaveAccessTab') }}</v-tab>
                <v-tab>{{ $t('Pages.Applications.MyAppsTab') }}</v-tab>
                <v-tab v-if="admin">
                    {{ $t('Pages.Applications.AllAppsTab') }}
                </v-tab>
            </v-tabs>
        </v-card>
        <v-card class="mt-2">
            <v-card-text>
                <v-tabs-items v-model="tab">
                    <v-tab-item>
                        <div
                            class="font-weight-bold text--primary title"
                            v-text="$t('Pages.Applications.HaveAccess')"
                        />
                    </v-tab-item>
                    <v-tab-item>
                        <HeadlineWithLinkButton
                            :text="$t('Pages.Applications.MyApps')"
                            class="title"
                        >
                            <template #btn>
                                <v-spacer />
                                <v-btn
                                    class="ml-1"
                                    color="primary"
                                    rounded
                                    small
                                    @click="create"
                                >
                                    <v-icon
                                        :left="$r12s.screenWidth > 480"
                                    >
                                        mdi-plus
                                    </v-icon>
                                    {{ $r12s.screenWidth > 480 ? $t('Common.Form.Create') : '' }}
                                </v-btn>
                            </template>
                        </HeadlineWithLinkButton>
                    </v-tab-item>
                    <v-tab-item v-if="admin">
                        <div
                            class="font-weight-bold text--primary title"
                            v-text="$t('Pages.Applications.AllApps')"
                        />
                    </v-tab-item>
                </v-tabs-items>

                <ErrorAlert :error="error" />

                <virtual-grid
                    #default="{ item }"
                    :fixed-height="180"
                    :gap-x="8"
                    :gap-y="8"
                    :items="storage[tab]"
                    :max-columns="4"
                    :min-cell-width="260"
                    :min-columns="1"
                    class="mt-2"
                >
                    <Application
                        :app="item"
                        :context="context"
                        class="fill-height"
                        @control="edit(item)"
                        @delete="requestUpdate()"
                    />
                </virtual-grid>
                <NoItemsPlaceholder
                    v-if="storage[tab].length === 0 && !loading[tab]"
                    :text="$t('Common.Collection.NoItemsFound')"
                />
                <v-progress-linear
                    :active="loading[tab]"
                    indeterminate
                />
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { appStore, authStore } from '@/store'
import HeadlineWithLinkButton from '@/components/common/HeadlineWithLinkButton.vue'
import Application from '@/components/apps/Application.vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'
import { ApiException } from '@/types/api'
import { OauthApp } from '@/types/misc'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { getAllApplications, getAuthedApplications, getMyApplications } from '@/api/applications'
import ApplicationEditForm from '@/components/apps/ApplicationEditForm.vue'

@Component({
    components: {
        ApplicationEditForm,
        ErrorAlert,
        NoItemsPlaceholder,
        VirtualGrid,
        Application,
        HeadlineWithLinkButton
    }
})
export default class ApplicationsPage extends Vue {
    tab = 0

    // so each element represents one tab.
    // i.e. storage[0] is haveaccess, storage[1] is my apps and storage[2] is all apps
    // at this point in time i zaebalsa so imma leaving it like this
    storage: OauthApp[][] = [
        [],
        [],
        []
    ]
    // same here
    loading = [
        true,
        true,
        true
    ]
    error: ApiException | null = null

    editing: Partial<OauthApp> | null = null
    editingDialog = false

    get context (): string {
        if (this.tab === 0) return 'user'
        if (this.tab === 1) return 'owner'
        if (this.tab === 2) return 'admin'
        return 'unknown'
    }

    get admin (): boolean {
        return authStore.user?.admin ?? false
    }

    edit (app: OauthApp): void {
        this.editing = app
        this.editingDialog = true
    }

    create (): void {
        this.editing = {}
        this.editingDialog = true
    }

    @Watch('tab')
    tabChanged (val: number): void {
        if (this.storage[val].length === 0) {
            this.requestUpdate(val)
        }
    }

    requestUpdate (tab = this.tab): void {
        this.error = null
        this.storage[tab] = []
        this.loading[tab] = true

        let prom
        if (tab === 0) prom = getAuthedApplications()
        if (tab === 1) prom = getMyApplications()
        if (tab === 2) prom = getAllApplications()
        if (!prom) return

        prom.then((items) => {
            this.storage[tab] = items
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading[tab] = false
            // idk i dont want to debug it
            this.$forceUpdate()
        })
    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.Applications.Name'),
            showUpdateButton: true
        })

        this.requestUpdate()
    }
}
</script>

<style>

</style>
