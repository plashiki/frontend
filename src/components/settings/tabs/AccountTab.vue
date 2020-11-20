<template>
    <NoItemsPlaceholder
        v-if="!authenticated"
        :text="$t('Common.NeedAuth')"
    />
    <div v-else>
        <v-row>
            <v-col
                class="text-center"
                cols="12"
                sm="4"
            >
                <AvatarUploadMenu
                    #default="{ on }"
                    :src="user.avatar"
                    @save="updateAvatar"
                >
                    <AvatarView
                        :loading="avatarLoading"
                        :src="user.avatar"
                        class="elevation-5"
                        size="96"
                        v-on="on"
                    />
                </AvatarUploadMenu>
            </v-col>
            <v-col
                class="text-center text-sm-left"
                cols="12"
                sm="8"
            >
                <transition mode="out-in" name="fade-transition">
                    <div
                        v-if="!editingNickname"
                    >
                        <h3 class="d-block">
                            {{ user.nickname }}
                            <v-btn
                                v-tooltip="$t('Pages.Settings.ChangeNickname')"
                                icon
                                small
                                @click="editNickname"
                            >
                                <v-icon small>
                                    mdi-pencil
                                </v-icon>
                            </v-btn>
                        </h3>
                    </div>
                    <v-text-field
                        v-else
                        v-model="nicknameInput"
                        :disabled="nicknameLoading"
                        :label="$t('Items.User.Nickname')"
                    >
                        <template #append-outer>
                            <v-btn
                                v-tooltip="$t('Common.Form.Cancel')"
                                :disabled="nicknameLoading"
                                color="error"
                                icon
                                @click="editingNickname = false"
                            >
                                <v-icon>
                                    mdi-close
                                </v-icon>
                            </v-btn>
                            <v-btn
                                v-tooltip="$t('Common.Form.Save')"
                                :loading="nicknameLoading"
                                icon
                                @click="saveNickname"
                            >
                                <v-icon>
                                    mdi-content-save
                                </v-icon>
                            </v-btn>
                        </template>
                    </v-text-field>
                </transition>
            </v-col>
        </v-row>

        <v-divider class="mt-2 mb-4" />

        <h2 class="mb-2">
            {{ $t('Pages.Settings.ConnectedServices') }}
        </h2>
        <p
            class="caption text--secondary"
            v-html="$t('Pages.Settings.PrimaryServiceDescription')"
        />
        <v-row>
            <v-col
                v-for="s in services"
                :key="s.id"
                cols="12"
                md="4"
                sm="6"
            >
                <v-simple-card
                    class="v-card--outlined fill-height"
                    text-class="text-center d-flex flex-column align-center fill-height"
                    flat
                >
                    <div class="d-flex flex-row fill-width align-center justify-center">
                        <component :is="s.icon" class="connectable-service-icon ml-10" />
                        <v-btn
                            v-tooltip="$t(user.service === s.id ? 'Pages.Settings.PrimaryService' : 'Pages.Settings.MakePrimaryService')"
                            :class="{ 'v-btn--active primary--text': user.service === s.id }"
                            :disabled="primaryLoading !== null || !connected(s.id)"
                            :loading="primaryLoading === s.id"
                            class="ml-2"
                            icon
                            @click="makePrimary(s.id)"
                        >
                            <v-icon>
                                {{ user.service === s.id ? 'mdi-star' : 'mdi-star-outline' }}
                            </v-icon>
                        </v-btn>
                    </div>
                    <h5
                        class="overline mt-3"
                        v-text="$t('Services.' + s.name)"
                    />
                    <v-spacer class="my-3" />
                    <div class="d-flex flex-column px-5">
                        <template v-if="connected(s.id)">
                            <v-btn
                                :href="url(s.id)"
                                block
                                class="my-1"
                                color="primary"
                                outlined
                                target="_blank"
                                v-text="$t('Pages.Settings.JumpToProfile')"
                            />
                            <v-btn
                                :disabled="!canDisconnect || disconnecting !== null"
                                :loading="disconnecting === s.id"
                                block
                                class="my-1"
                                color="secondary"
                                @click="disconnect(s.id)"
                                v-text="$t('Pages.Settings.Disconnect')"
                            />
                        </template>
                        <v-btn
                            v-else
                            :disabled="disconnecting !== null"
                            color="primary"
                            @click="loginVia(s.serviceName)"
                            v-text="$t('Pages.Settings.Connect')"
                        />
                    </div>
                </v-simple-card>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NoItemsPlaceholder from '@/components/common/NoItemsPlaceholder.vue'
import AvatarUploadMenu from '@/components/avatar/AvatarUploadMenu.vue'
import AvatarView from '@/components/avatar/AvatarView.vue'
import { User } from '@/types/user'
import { disconnectService, patchUser } from '@/api/user'
import { iziToastError } from '@/plugins/izitoast'
import ShikimoriIcon from '@/assets/svg/shikimori.svg'
import { authStore } from '@/store'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import { loginVia } from '@/api/auth'

@Component({
    components: { VSimpleCard, AvatarView, AvatarUploadMenu, NoItemsPlaceholder }
})
export default class AccountTab extends Vue {
    editingNickname = false
    nicknameInput = ''
    nicknameLoading = false

    avatarLoading = false

    services = Object.freeze([
        {
            icon: ShikimoriIcon,
            name: 'Shikimori',
            serviceName: 'shikimori',
            id: 'S'
        }
    ])
    disconnecting: string | null = null
    primaryLoading: string | null = null
    loginVia = loginVia

    get authenticated (): boolean {
        return authStore.authenticated
    }

    get user (): User {
        return authStore.user!
    }

    get canDisconnect (): boolean {
        return Object.keys(this.user?.external_ids ?? {}).length > 1
    }

    connected (service: string): boolean {
        return service in this.user.external_ids
    }

    url (service: string): string {
        let id = this.user.external_ids[service]
        if (service === 'S') {
            return '/user/shikimori/' + id
        }

        return '/err404'
    }

    disconnect (service: string): void {
        if (this.disconnecting) return

        this.disconnecting = service
        disconnectService(service)
            .then((user) => {
                authStore.updateUser(user)
            })
            .catch(iziToastError)
            .finally(() => {
                this.disconnecting = null
            })
    }

    makePrimary (service: string): void {
        if (this.primaryLoading || this.user.service === service) return

        this.primaryLoading = service
        patchUser({
            service
        }).then((user) => {
            authStore.updateUser(user)
        }).catch(iziToastError).finally(() => {
            this.primaryLoading = null
        })
    }

    editNickname (): void {
        this.nicknameInput = this.user.nickname
        this.editingNickname = true
    }

    saveNickname (): void {
        this.nicknameLoading = true

        patchUser({
            nickname: this.nicknameInput
        }).then((user) => {
            authStore.updateUser(user)
            this.editingNickname = false
        }).catch(iziToastError).finally(() => {
            this.nicknameLoading = false
        })
    }

    updateAvatar (avatar: string | null): void {
        this.avatarLoading = true

        patchUser({
            avatar
        }).then((user) => {
            authStore.updateUser(user)
        }).catch(iziToastError).finally(() => {
            this.avatarLoading = false
        })
    }
}
</script>

<style>
.connectable-service-icon {
    width: 72px;
    height: 72px;
    justify-self: center;
}
</style>
