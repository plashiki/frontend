<template>
    <v-card
        class="d-flex flex-column"
        outlined
    >
        <v-progress-linear
            :active="loading"
            absolute
            indeterminate
            top
        />
        <v-row no-gutters>
            <v-col
                class="align-center justify-center d-flex pa-0"
                cols="5"
            >
                <AvatarView
                    :src="app.icon"
                    size="96"
                    no-edit
                />
            </v-col>
            <v-col
                class="d-flex flex-column pa-0"
                cols="7"
            >
                <h2 class="my-2">
                    {{ app.name }}
                </h2>
                <span
                    :class="{ 'grey--text': app.description === '' }"
                    class="text-truncate"
                    v-text="app.description || $t('Common.NoDescription')"
                />
                <span class="caption grey--text">
                    id: {{ app.id }}
                </span>
            </v-col>
        </v-row>

        <v-spacer />
        <v-divider />

        <v-card-actions>
            <v-btn
                v-if="context !== 'user'"
                :disabled="loading"
                icon
                small
                @click="del"
            >
                <v-icon small>
                    mdi-delete
                </v-icon>
            </v-btn>
            <UserChip
                v-if="'owner' in app && context !== 'owner'"
                :control="context === 'admin'"
                :user="app.owner"
                chip-class="align-self-center"
                small
            />
            <v-spacer />


            <v-btn
                v-if="context === 'user'"
                :disabled="loading"
                text
                @click="revoke"
            >
                {{ $t('Pages.Applications.Revoke') }}
            </v-btn>
            <v-btn
                v-else
                text
                @click="$emit('control')"
            >
                {{ $t('Common.Action.Control') }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { OauthApp } from '@/types/misc'
import AvatarView from '@/components/avatar/AvatarView.vue'
import UserChip from '@/components/user/UserChip.vue'
import { deleteApplication, revokeApplicationAuthorization } from '@/api/applications'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'

@Component({
    components: { UserChip, AvatarView }
})
export default class Application extends Vue {
    @Prop({ required: true }) app!: OauthApp

    // user -- for apps that are displayed as ones user authed
    // owner -- for apps that are displayed to owner
    // admin -- for apps that are displayed to admin
    @Prop({ type: String, default: 'user' }) context!: string

    loading = false

    revoke (): void {
        this.loading = true

        revokeApplicationAuthorization(this.app.id)
            .then(() => {
                iziToastSuccess()
                this.$emit('delete', this.app)
            })
            .catch(iziToastError)
            .finally(() => {
                this.loading = false
            })
    }

    del (): void {
        this.loading = true

        deleteApplication(this.app.id).then(() => {
            iziToastSuccess(this.$t('Common.Action.Deleted'))
            this.$emit('delete', this.app)
        }).catch(iziToastError).finally(() => {
            this.loading = false
        })
    }
}
</script>

<style>

</style>
