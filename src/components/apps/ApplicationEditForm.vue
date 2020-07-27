<template>
    <v-card>
        <v-card-title>
            {{ isNew ? $t('Common.Form.Create') : $t('Common.Action.Control') }}
            <v-spacer />
            <v-btn
                icon
                @click="$emit('close')"
            >
                <v-icon>
                    mdi-close
                </v-icon>
            </v-btn>
        </v-card-title>
        <v-divider />
        <v-progress-linear
            :active="loading"
            indeterminate
        />

        <v-card-text class="py-2">
            <NoItemsPlaceholder
                v-if="fullApp === null"
                :text="$t('Common.Loading')"
            />
            <template v-else>
                <div class="text-center">
                    <AvatarUploadMenu
                        #default="{ on }"
                        :src="fullApp.icon"
                        @save="fullApp.icon = $event"
                    >
                        <AvatarView
                            :no-edit="loading"
                            :src="fullApp.icon"
                            size="96"
                            v-on="on"
                        />
                    </AvatarUploadMenu>
                </div>

                <v-text-field
                    v-model="fullApp.name"
                    :disabled="loading"
                    :label="$t('Common.ItemName')"
                    hide-details
                />
                <v-text-field
                    v-model="fullApp.description"
                    :disabled="loading"
                    :label="$t('Common.Description')"
                />

                <template v-if="fullApp.client_id">
                    <TokenField
                        :disabled="loading"
                        :value="fullApp.client_id"
                        label="client_id"
                        @revoke="revoke('id')"
                    />
                    <TokenField
                        :disabled="loading"
                        :value="fullApp.client_secret"
                        label="client_secret"
                        @revoke="revoke('secret')"
                    />
                </template>

                <v-text-field
                    v-model="fullApp.redirect_uri"
                    :disabled="loading"
                    class="text--monospace"
                    label="redirect_uri"
                />

                <template v-if="!isNew">
                    <p v-if="!admin && fullApp.server_scope">
                        <span class="text--primary font-weight-bold">
                            {{ $t('Pages.Applications.ServerScope') }}:
                        </span>
                        <span
                            v-text="fullApp.server_scope.length ? fullApp.server_scope.join(', ') : this.$t('Common.No')"
                        />
                    </p>
                    <v-text-field
                        v-else
                        v-model="serverScopeProxy"
                        :disabled="loading"
                        :hint="$t('Pages.Applications.ServerScopeFmt')"
                        :label="$t('Pages.Applications.ServerScope')"
                        persistent-hint
                    />
                </template>
            </template>
        </v-card-text>

        <v-divider />
        <v-card-actions>
            <v-spacer />
            <v-btn
                :disabled="loading"
                color="success"
                text
                @click="save"
            >
                {{ isNew ? $t('Common.Form.Create') : $t('Common.Form.Save') }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { OauthApp } from '@/types/misc'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'
import { createApplication, editApplication, getApplication, revokeApplicationToken } from '@/api/applications'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import AvatarView from '@/components/avatar/AvatarView.vue'
import { clone, shallowDiff } from '@/utils/object-utils'
import AvatarUploadMenu from '@/components/avatar/AvatarUploadMenu.vue'
import TokenField from '@/components/common/fields/TokenField.vue'
import { authStore } from '@/store'

@Component({
    components: { TokenField, AvatarUploadMenu, AvatarView, NoItemsPlaceholder }
})
export default class ApplicationEditDialog extends Vue {
    @Prop({ required: true }) app!: Partial<OauthApp>

    loading = false
    fullApp: Partial<OauthApp> | null = null
    originalFullApp: Partial<OauthApp> | null = null

    get serverScopeProxy (): string {
        return this.fullApp?.server_scope?.join(',') ?? ''
    }

    set serverScopeProxy (val: string) {
        if (!this.fullApp) return
        if (!val) {
            this.fullApp.server_scope = []
        } else {
            this.fullApp.server_scope = val.split(',')
        }
    }

    get admin (): boolean {
        return authStore.user?.admin ?? false
    }

    get isNew (): boolean {
        if (!this.fullApp) return !('id' in this.app)
        return !('id' in this.fullApp)
    }

    save (): void {
        if (!this.originalFullApp || !this.fullApp) return
        this.loading = true
        let diff = shallowDiff(this.originalFullApp, this.fullApp)
        if (this.admin) {
            diff.server_scope = this.fullApp.server_scope
        } else {
            diff.server_scope = undefined
        }

        const isNew = this.isNew
        let prom = isNew ? createApplication(diff) : editApplication((this.fullApp || this.app).id!, diff)

        prom.then((app) => {
            iziToastSuccess()

            this.app.name = app.name
            this.app.description = app.description
            this.app.icon = app.icon

            this.fullApp = app
            this.originalFullApp = clone(app)

            this.$emit('update')
        }).catch(iziToastError).finally(() => {
            this.loading = false
        })
    }

    revoke (field: 'id' | 'secret'): void {
        this.loading = true
        revokeApplicationToken(this.app.id!, field).then((app) => {
            if (!this.fullApp) return
            const fieldName = field === 'id' ? 'client_id' : 'client_secret'
            this.fullApp[fieldName] = app[fieldName]
        }).catch(iziToastError).finally(() => {
            this.loading = false
        })
    }

    mounted (): void {
        if (this.isNew) {
            this.fullApp = {}
            this.originalFullApp = {}
        } else {
            this.loading = true
            getApplication(this.app.id!)
                .then((app) => {
                    this.fullApp = app
                    this.originalFullApp = clone(app)
                })
                .catch((err) => {
                    iziToastError(err)
                    this.$emit('close')
                })
                .finally(() => {
                    this.loading = false
                })
        }
    }
}
</script>

<style>

</style>
