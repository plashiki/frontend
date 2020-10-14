<template>
    <v-navigation-drawer
        ref="drawer"
        v-model="isVisible"
        class="fix-drawer-labels"
        :mini-variant="mini"
        :permanent="mini"
        :expand-on-hover="expandOnHover"
        app
        @mouseenter.native="onMouseEnter"
        @mouseleave.native="onMouseLeave"
    >
        <template #prepend>
            <VListItemIconText
                v-if="mini"
                title="PlaShiki"
                icon="mdi-menu"
                dense
                @click="forceExpand"
            />
            <v-list
                dense
                class="py-0"
            >
                <v-list-group class="fix-drawer-avatar">
                    <template #activator>
                        <v-list-item-avatar>
                            <img
                                :src="userAvatar"
                                alt=""
                            >
                        </v-list-item-avatar>
                        <v-list-item-content>
                            <v-list-item-title>
                                {{ userDisplayName }}
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                <v-icon
                                    v-for="(galo4ka, i) in userGalo4ki"
                                    :key="i"
                                    v-tooltip="$t(galo4ka.info)"
                                    :color="galo4ka.color || 'primary'"
                                    small
                                >
                                    {{ galo4ka.icon }}
                                </v-icon>
                            </v-list-item-subtitle>
                        </v-list-item-content>
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
            ref="search"
            background-color="transparent"
            media-type="anime"
            :mini="mini && !expandOnHover"
            flat
            hide-details
            links
            solo
            @focusin.native="onSearchFieldFocus"
            @focusout.native="onSearchFieldBlur"
            @navigation="onSearchFieldBlur"
        />
        <v-divider />

        <v-list
            dense
            :nav="!mini"
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
                    :class="{ 'pl-8': !mini }"
                />
                <v-divider />
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
            <VListItemIconText
                :title="$t(isDark ? 'Pages.Settings.DisableDarkMode' : 'Pages.Settings.EnableDarkMode')"
                dense
                @click="toggleDark"
            >
                <template #icon>
                    <v-fade-transition>
                        <v-icon v-if="isDark">
                            mdi-white-balance-sunny
                        </v-icon>
                        <v-icon v-else>
                            mdi-moon-waning-crescent
                        </v-icon>
                    </v-fade-transition>
                </template>
            </VListItemIconText>
            <SettingsDialog
                v-if="$r12s.screenWidth >= 768"
                #default="{ on }"
            >
                <VListItemIconText
                    icon="mdi-cog"
                    :title="$t('Pages.Settings.Name')"
                    dense
                    v-on="on"
                />
            </SettingsDialog>
            <VListItemIconText
                v-else
                icon="mdi-cog"
                to="/settings"
                :title="$t('Pages.Settings.Name')"
                dense
            />
        </template>
    </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator'
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
        ShikimoriIcon,
    },
})
export default class AppNavigation extends Vue {
    @PropSync('visible') isVisible!: boolean
    @Prop({ type: String }) currentTitle!: string
    @Prop({ type: Boolean }) mini!: boolean

    @Ref() drawer!: any
    loginVia = loginVia

    version = version
    userscriptInstalled = userscriptInstalled()
    navigation: PageMeta[] = [
        {
            path: '/',
            name: 'Pages.Index.Name',
            icon: 'mdi-home',
        },
        {
            path: '/search',
            name: 'Pages.Search.Name',
            icon: 'mdi-magnify',
        },
        {
            path: '$current',
            name: '$current',
            nameFallback: 'Pages.Viewer.Name',
            icon: 'mdi-play',
            routeGroup: 'viewer-anime',
        },
        {
            path: '/lists',
            name: 'Pages.Lists.Name',
            icon: 'mdi-format-list-checks',
        },
        {
            path: '/calendar',
            name: 'Pages.Calendar.Name',
            icon: 'mdi-calendar',
        },
        {
            path: '/moderation',
            name: 'Pages.Moderation.Name',
            icon: 'mdi-fingerprint',
            flag: 'moderator',
        },
        {
            path: '/add',
            name: 'Pages.AddTranslation.Name',
            icon: 'mdi-file-plus-outline',
            auth: true,
        },
        {
            path: '/donate',
            name: 'Pages.Donate.Name',
            icon: 'mdi-currency-usd',
        },
    ]
    adminGroup: PageMeta[] = [
        {
            path: '/admin/statistics',
            name: 'Pages.Statistics.Name',
            icon: 'mdi-chart-line',
        },
        {
            path: '/admin/users',
            name: 'Pages.UsersAdmin.Name',
            icon: 'mdi-account',
        },
        {
            path: '/admin/translations',
            name: 'Pages.AdminTranslations.Name',
            icon: 'mdi-translate',
        },
        {
            path: '/admin/parsers',
            name: 'Pages.Parsers.Name',
            icon: 'mdi-code-braces',
        },
    ]

    expandOnHover = false
    timer: number | null = null
    searchFieldFocused = false
    collapseOnceSearchFieldUnfocused = false

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
                || (
                    !!navigator.userAgent.match(/firefox\/|YaBrowser\/|Yowser\//i) &&
                    !!navigator.userAgent.match(/android/i)
                )
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

    onMouseEnter (): void {
        if (!this.mini || this.timer) return
        if (this.searchFieldFocused && this.collapseOnceSearchFieldUnfocused) {
            this.collapseOnceSearchFieldUnfocused = false
            return
        }
        if (this.expandOnHover) return

        this.timer = setTimeout(() => {
            this.timer = null
            this.forceExpand()
        }, 500)
    }

    forceExpand (): void {
        if (!this.mini) return
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }
        this.expandOnHover = true
        this.$nextTick(() => {
            if (this.drawer) this.drawer.isMouseover = true
        })
    }

    onMouseLeave (evt?: MouseEvent): void {
        if (!this.mini) return
        console.log('mouseleave')
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }
        if (this.searchFieldFocused) {
            this.collapseOnceSearchFieldUnfocused = true
            if (evt) {
                evt.stopPropagation()
                evt.stopImmediatePropagation()
                evt.preventDefault()
            }
            return
        }

        console.log('mouseleave handler')
        this.expandOnHover = false
        this.$nextTick(() => {
            if (this.drawer) this.drawer.isMouseover = false
        })
    }

    onSearchFieldFocus (): void {
        this.forceExpand()
        this.searchFieldFocused = true
    }

    onSearchFieldBlur (): void {
        this.searchFieldFocused = false
        if (this.collapseOnceSearchFieldUnfocused) {
            this.onMouseLeave()
            this.collapseOnceSearchFieldUnfocused = false
        }
    }

    toggleDark (): void {
        configStore.merge({
            dark: !this.isDark,
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
.fix-drawer-avatar > .v-list-item {
    padding-right: 8px !important;
    padding-left: 8px !important;
}

.v-navigation-drawer--mini-variant.fix-drawer-labels .v-list-item > *:not(:first-child) {
    position: revert !important;
    height: revert !important;
    width: revert !important;
    overflow: revert !important;
    clip: revert !important;
    white-space: revert !important;
    display: flex !important;
}

.v-navigation-drawer--mini-variant.fix-drawer-labels .v-list-item > *:first-child {
    margin-left: revert !important;
    margin-right: 32px !important;
}
.v-navigation-drawer--mini-variant.fix-drawer-labels .fix-drawer-avatar > .v-list-item > *:first-child {
    margin-left: revert !important;
    margin-right: 16px !important;
}
</style>
