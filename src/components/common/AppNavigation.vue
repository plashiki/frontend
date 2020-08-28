<template>
    <v-navigation-drawer
        v-model="isVisible"
        app
    >
        <template #prepend>
            <v-list dense>
                <v-list-item>
                    <v-list-item-avatar>
                        <img
                            :src="userAvatar"
                            alt=""
                        >
                    </v-list-item-avatar>
                    <v-icon
                        v-for="(galo4ka, i) in userGalo4ki"
                        :key="i"
                        v-tooltip="$t(galo4ka.info)"
                        :color="galo4ka.color || 'primary'"
                        small
                    >
                        {{ galo4ka.icon }}
                    </v-icon>
                    <v-spacer />
                    <v-list-item-action>
                        <v-row>
                            <v-btn
                                v-tooltip="$t(isDark ? 'Pages.Settings.DisableDarkMode' : 'Pages.Settings.EnableDarkMode')"
                                class="mx-2"
                                icon
                                @click="toggleDark"
                            >
                                <v-fade-transition>
                                    <v-icon v-if="isDark">
                                        mdi-white-balance-sunny
                                    </v-icon>
                                    <v-icon v-else>
                                        mdi-moon-waning-crescent
                                    </v-icon>
                                </v-fade-transition>
                            </v-btn>

                            <SettingsDialog
                                v-if="$r12s.screenWidth >= 768"
                                #default="{ on }"
                            >
                                <v-btn
                                    v-tooltip="$t('Pages.Settings.Name')"
                                    class="mr-2"
                                    icon
                                    v-on="on"
                                >
                                    <v-icon>mdi-cog</v-icon>
                                </v-btn>
                            </SettingsDialog>
                            <v-btn
                                v-else
                                v-tooltip="$t('Pages.Settings.Name')"
                                active-class="primary--text"
                                class="mr-2"
                                icon
                                to="/settings"
                            >
                                <v-icon>mdi-cog</v-icon>
                            </v-btn>
                        </v-row>
                    </v-list-item-action>
                </v-list-item>
                <v-list-group>
                    <template #activator>
                        <v-list-item class="text-truncate">
                            <v-list-item-title>
                                {{ userDisplayName }}
                            </v-list-item-title>
                        </v-list-item>
                    </template>

                    <VListItemIconText
                        v-if="userAuthenticated"
                        :title="$t('Pages.Login.Logout')"
                        icon="mdi-logout"
                        @click="logout"
                    />

                    <template v-else>
                        <v-list-item @click="loginVia('shikimori')">
                            <v-list-item-icon>
                                <ShikimoriIcon class="v-icon v-icon--svg pa-05" fill="#424242" />
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>
                                    {{ $t('Pages.Login.LoginVia', { name: $t('Services.Shikimori') }) }}
                                </v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </template>
                </v-list-group>
            </v-list>
        </template>

        <v-divider />
        <SearchFieldAutocomplete
            background-color="transparent"
            flat
            hide-details
            links
            media-type="anime"
            solo
        />
        <v-divider />

        <v-list
            dense
            nav
        >
            <template v-if="!userscriptInstalled && canInstallUserscript">
                <InstallUserscriptDialog #default="{ on }">
                    <VListItemIconText
                        :title="$t('Pages.Userscript.Name')"
                        icon="mdi-download"
                        v-on="on"
                    />
                </InstallUserscriptDialog>
                <v-divider class="mb-1" />
            </template>

            <v-list-group
                v-if="userAdmin"
                :value="$route.meta.admin === true"
                prepend-icon="mdi-wrench"
            >
                <template #activator>
                    <v-list-item-title>
                        {{ $t('Pages.Admin.Name') }}
                    </v-list-item-title>
                </template>

                <VListItemIconText
                    v-for="(item, i) in adminGroup"
                    :key="i"
                    :icon="item.icon"
                    :title="$t(item.name)"
                    :to="item.path"
                    active-class="primary--text"
                    class="pl-8"
                />
            </v-list-group>

            <VListItemIconText
                v-for="(item, i) in visibleNavigation"
                :key="i"
                :icon="item.icon"
                :title="item.name === '$current' ? currentTitle || $t(item.nameFallback) : $t(item.name)"
                :to="item.path === '$current' ? $route.path : item.path"
                active-class="primary--text"
            />
        </v-list>

        <template #append>
            <v-footer
                class="justify-center caption"
            >
                <div class="text-center">
                    <span class="text-truncate">
                        <a
                            href="https://telegram.dog/PlashikiSupport"
                            target="_blank"
                            v-text="$t('Pages.Support.Name')"
                        />
                        &nbsp;|&nbsp;
                        <router-link
                            to="/legal"
                            v-text="$t('Pages.Legal.Name')"
                        />
                    </span>
                    <br>
                    &copy; PlaShiki
                    <span v-tooltip="versionInfo">v{{ version }}</span>
                    2019-{{ new Date().getFullYear() }}
                </div>
            </v-footer>
        </template>
    </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'
import { authStore, configStore } from '@/store'
import { buildDate, currentCommit, defaultAvatar, version } from '@/config'
import AppSettings from '@/components/settings/AppSettings.vue'
import { loginVia, logout } from '@/api/auth'
import VListItemIconText from '@/components/common/VListItemIconText.vue'
import SearchFieldAutocomplete from '@/components/search/SearchFieldAutocomplete.vue'
import ShikimoriIcon from '@/assets/svg/shikimori.svg'
import { Galo4ka, User } from '@/types/user'
import { userscriptInstalled } from '@/utils/helpers'
import InstallUserscriptDialog from '@/components/settings/InstallUserscriptDialog.vue'
import SettingsDialog from '@/components/settings/SettingsDialog.vue'

interface PageMeta {
    path: string
    name: string
    icon: string

    nameFallback?: string
    routeGroup?: string
    auth?: true
    flag?: keyof User
}

@Component({
    components: {
        SettingsDialog,
        InstallUserscriptDialog,
        SearchFieldAutocomplete,
        VListItemIconText,
        AppSettings,
        ShikimoriIcon
    }
})
export default class AppNavigation extends Vue {
    @PropSync('visible') isVisible!: boolean
    @Prop({ type: String }) currentTitle!: string

    loginVia = loginVia

    version = version
    userscriptInstalled = userscriptInstalled()
    navigation: PageMeta[] = [
        {
            path: '/',
            name: 'Pages.Index.Name',
            icon: 'mdi-home'
        },
        {
            path: '/search',
            name: 'Pages.Search.Name',
            icon: 'mdi-magnify'
        },
        {
            path: '$current',
            name: '$current',
            nameFallback: 'Pages.Viewer.Name',
            icon: 'mdi-play',
            routeGroup: 'viewer-anime'
        },
        {
            path: '/lists',
            name: 'Pages.Lists.Name',
            icon: 'mdi-format-list-checks'
        },
        {
            path: '/calendar',
            name: 'Pages.Calendar.Name',
            icon: 'mdi-calendar'
        },
        {
            path: '/moderation',
            name: 'Pages.Moderation.Name',
            icon: 'mdi-fingerprint',
            flag: 'moderator'
        },
        {
            path: '/add',
            name: 'Pages.AddTranslation.Name',
            icon: 'mdi-file-plus-outline',
            auth: true
        },
        {
            path: '/donate',
            name: 'Pages.Donate.Name',
            icon: 'mdi-currency-usd'
        }
    ]
    adminGroup: PageMeta[] = [
        {
            path: '/admin/statistics',
            name: 'Pages.Statistics.Name',
            icon: 'mdi-chart-line'
        },
        {
            path: '/admin/users',
            name: 'Pages.UsersAdmin.Name',
            icon: 'mdi-account'
        },
        {
            path: '/admin/translations',
            name: 'Pages.AdminTranslations.Name',
            icon: 'mdi-translate'
        },
        {
            path: '/admin/parsers',
            name: 'Pages.Parsers.Name',
            icon: 'mdi-code-braces'
        }
    ]

    get visibleNavigation (): PageMeta[] {
        return this.navigation.filter(it => {
            if (it.auth && !authStore.authenticated) return false
            if (it.routeGroup && it.routeGroup !== this.$route.meta.group) return false
            if (it.flag && !authStore.user?.[it.flag]) return false

            return true
        })
    }

    get canInstallUserscript (): boolean {
        return this.$r12s.isPwa
            // desktop chromium supports plugins inside pwa
            ? 'chrome' in window && !!navigator.userAgent.match(/windows nt|mac os x|X11/i)
            : this.$r12s.isTouchDevice
                // windows/macos/x11 (linux) with touchscreen are probably running full-featured browser
                ? !!navigator.userAgent.match(/windows nt|mac os x|X11/i)
                    // firefox and yandex browser on android support plugins
                    || (!!navigator.userAgent.match(/firefox\/|YaBrowser\/|Yowser\//i) && !!navigator.userAgent.match(/android/i))
                : true
    }

    get versionInfo (): string {
        return `Commit ${currentCommit}, built on ${buildDate}`
    }

    get isDark (): boolean {
        return configStore.dark
    }

    get userAuthenticated (): boolean {
        return authStore.authenticated
    }

    get userAdmin (): boolean {
        return authStore.user?.admin ?? false
    }

    get userAvatar (): string {
        return authStore.user?.avatar ?? defaultAvatar
    }

    get userDisplayName (): string {
        return authStore.user?.nickname ?? this.$t('Items.User.Anonymous') as string
    }

    get userGalo4ki (): Galo4ka[] {
        return authStore.userGalo4ki
    }

    toggleDark (): void {
        configStore.merge({
            dark: !this.isDark
        })
    }

    logout (): void {
        logout().then(() => {
            authStore.logout()
        })
    }
}
</script>

<style>

</style>
