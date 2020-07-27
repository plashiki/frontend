<template>
    <v-menu
        v-model="visible"
        :close-on-content-click="false"
    >
        <template #activator="{ on }">
            <slot
                :on="on"
                :user="fullUser || user"
            />
        </template>

        <v-card class="d-flex flex-column fill-height pa-1">
            <v-list-item v-if="user">
                <v-list-item-avatar>
                    <v-img :src="user.avatar || defaultAvatar" />
                </v-list-item-avatar>
                <v-list-item-title>
                    {{ user.nickname }}
                </v-list-item-title>
            </v-list-item>

            <v-divider />
            <v-progress-linear
                :active="loading"
                indeterminate
            />

            <ErrorAlert :error="error" />

            <template v-if="fullUser">
                <p class="grey--text caption mx-2 my-1">
                    {{ $t('Items.User.ConnectedServices') }}
                </p>

                <VListItemIconText
                    v-if="fullUser.external_ids.S"
                    :href="'/user/shikimori/' + fullUser.external_ids.S"
                    :title="$t('Services.Shikimori')"
                    dense
                    target="_blank"
                >
                    <template #icon>
                        <ShikimoriIcon class="v-icon v-icon--svg pa-05" fill="#424242" />
                    </template>
                </VListItemIconText>

                <template v-if="control">
                    <v-divider />
                    <v-switch
                        :disabled="!canBan || updating.banned"
                        :input-value="fullUser.banned"
                        :label="$t('Items.User.Banned')"
                        :loading="updating.banned"
                        class="mx-2"
                        hide-details
                        @change="toggleBooleanField('banned', $event)"
                    />
                    <v-switch
                        :disabled="!canMakeTrusted || updating.trusted"
                        :input-value="fullUser.trusted"
                        :label="$t('Items.User.Trusted')"
                        :loading="updating.trusted"
                        class="mx-2"
                        hide-details
                        @change="toggleBooleanField('trusted', $event)"
                    />
                    <v-switch
                        :disabled="!canMakeModerator || updating.moderator"
                        :input-value="fullUser.moderator"
                        :label="$t('Items.User.Moderator')"
                        :loading="updating.moderator"
                        class="mx-2"
                        hide-details
                        @change="toggleBooleanField('moderator', $event)"
                    />
                    <v-switch
                        :disabled="!canMakeAdmin || updating.admin"
                        :input-value="fullUser.admin"
                        :label="$t('Items.User.Admin')"
                        :loading="updating.admin"
                        class="mx-2"
                        hide-details
                        @change="toggleBooleanField('admin', $event)"
                    />
                    <div class="mb-2" />
                </template>
            </template>
        </v-card>
    </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { User } from '@/types/user'
import { ApiException } from '@/types/api'
import { authStore } from '@/store'
import { getUser, patchUser } from '@/api/user'
import { iziToastError } from '@/plugins/izitoast'
import { defaultAvatar } from '@/config'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import VListItemIconText from '@/components/common/VListItemIconText.vue'
import ShikimoriIcon from '@/assets/svg/shikimori.svg'

@Component({
    components: { ErrorAlert, VListItemIconText, ShikimoriIcon }
})
export default class UserPopup extends Vue {
    @Prop({ required: true }) user!: User
    @Prop({ type: Boolean, default: false }) full!: boolean
    @Prop({ type: Boolean, default: false }) control!: boolean

    fullUser: User | null = null

    visible = false
    loading = false
    error: ApiException | null = null

    updating = {
        banned: false,
        trusted: false,
        moderator: false,
        admin: false
    }

    defaultAvatar = defaultAvatar

    get canBan (): boolean {
        return (authStore.user?.moderator || authStore.user?.admin) ?? false
    }

    get canMakeTrusted (): boolean {
        return (authStore.user?.moderator || authStore.user?.admin) ?? false
    }

    get canMakeModerator (): boolean {
        // idiot-proof
        if (this.user.id === authStore.user?.id) return false
        return authStore.user?.admin ?? false
    }

    get canMakeAdmin (): boolean {
        // idiot-proof
        if (this.user.id === authStore.user?.id) return false
        return authStore.user?.admin ?? false
    }

    toggleBooleanField (field: keyof UserPopup['updating'], val: boolean): void {
        this.updating[field] = true
        patchUser({
            [field]: val
        }, this.user.id).then((user) => {
            if (user.id === authStore.user?.id) {
                authStore.setUser(user)
            }
            if (this.full && this.fullUser) {
                // update item in parent
                this.fullUser[field] = val
            } else {
                this.fullUser = user
            }

            this.$emit('change', field, val)
        }).catch(iziToastError).finally(() => {
            this.updating[field] = false
        })
    }

    loadFullUser (): void {
        if (this.full) {
            this.fullUser = this.user
            return
        }

        this.loading = true
        this.error = null

        getUser(this.user.id).then((user) => {
            this.fullUser = user
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }

    @Watch('visible')
    onVisibilityChanged (val: boolean): void {
        if (val && !this.fullUser && !this.loading && !this.error) {
            this.loadFullUser()
        }
    }

}
</script>

<style>

</style>
