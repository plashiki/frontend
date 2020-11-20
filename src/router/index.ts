import Vue from 'vue'
import VueRouter, { Route } from 'vue-router'
import { appStore, authStore } from '@/store'
import ErrorPage from '@/pages/error.vue'
import { apiInitialized, initApi } from '@/api'

Vue.use(VueRouter)

const routes: any[] = [
    {
        path: '/',
        name: 'index',
        component: () => import(/* webpackChunkName: "index" */ '@/pages/index.vue')
    },
    {
        path: '/legal',
        name: 'legal',
        component: () => import(/* webpackChunkName: "legal" */ '@/pages/legal.vue')
    },
    {
        path: '/tos',
        name: 'tos',
        component: () => import(/* webpackChunkName: "tos" */ '@/pages/tos.vue')
    },
    {
        path: '/auth',
        name: 'auth',
        component: () => import(/* webpackChunkName: "auth" */ '@/pages/auth.vue'),
        meta: {
            layout: 'plain',
            auth: false,
            noapi: true
        }
    },
    {
        path: '/oauth/shikimori',
        name: 'oauth-shikimori',
        component: () => import(/* webpackChunkName: "oauth-shikimori" */ '@/pages/oauth/shikimori.vue'),
        meta: {
            layout: 'plain',
            auth: false,
            noapi: true
        }
    },
    {
        path: '/anime/:id(\\d+)',
        name: 'viewer-anime-id',
        component: () => import(/* webpackChunkName: "viewer" */ '@/components/viewer/Viewer.vue'),
        props: { mediaType: 'anime' },
        meta: {
            group: 'viewer-anime',
            full: true
        }
    },
    {
        path: '/anime/:id(\\d+)/episodes/:part(\\d+)',
        name: 'viewer-anime-id-episode',
        component: () => import(/* webpackChunkName: "viewer" */ '@/components/viewer/Viewer.vue'),
        props: { mediaType: 'anime' },
        meta: {
            group: 'viewer-anime',
            full: true
        }
    },
    {
        path: '/anime/:id(\\d+)/episodes/:part(\\d+)/translations/:translationId(\\d+)',
        name: 'viewer-anime-id-episode-translation',
        component: () => import(/* webpackChunkName: "viewer" */ '@/components/viewer/Viewer.vue'),
        props: { mediaType: 'anime' },
        meta: {
            group: 'viewer-anime',
            full: true
        }
    },
    {
        path: '/animes/:predicate([a-z]*\\d+[a-zA-Z0-9\\-]*)',
        redirect: (fr: Route) => {
            let d = fr.params.predicate.match(/[a-z]*(\d+)(?:-[a-z0-9-]+)?/i)
            if (!d) return { path: '/err404' }
            return { path: '/anime/' + d[1] }
        }
    },
    {
        path: '/add',
        name: 'add',
        component: () => import(/* webpackChunkName: "add" */ '@/pages/add.vue')
    },
    {
        path: '/upload',
        redirect: '/add'
    },
    {
        path: '/search',
        name: 'search',
        component: () => import(/* webpackChunkName: "search" */ '@/pages/search.vue')
    },
    {
        path: '/calendar',
        name: 'calendar',
        component: () => import(/* webpackChunkName: "calendar" */ '@/pages/calendar.vue')
    },
    {
        path: '/lists',
        name: 'lists',
        component: () => import(/* webpackChunkName: "lists" */ '@/pages/lists.vue')
    },
    {
        path: '/moderation',
        name: 'moderation',
        component: () => import(/* webpackChunkName: "moderation" */ '@/pages/moderation.vue')
    },
    {
        path: '/donate',
        name: 'donate',
        component: () => import(/* webpackChunkName: "donate" */ '@/pages/donate.vue')
    },
    {
        path: '/apps',
        name: 'apps',
        component: () => import(/* webpackChunkName: "applications" */ '@/pages/applications.vue')
    },
    {
        path: '/player',
        name: 'player',
        component: () => import(/* webpackChunkName: "player" */ '@/pages/player.vue'),
        meta: {
            layout: 'empty',
            noapi: true,
            full: true
        }
    },
    {
        path: '/player/anilibria',
        name: 'player-anilibria',
        component: () => import(/* webpackChunkName: "player-anilibria" */ '@/pages/player/anilibria.vue'),
        meta: {
            layout: 'empty',
            noapi: true,
            full: true
        }
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import(/* webpackChunkName: "settings" */ '@/pages/settings.vue')
    },
    {
        path: '/err403',
        name: 'err403',
        component: ErrorPage,
        props: {
            error: {
                statusCode: 403
            }
        },
        meta: { group: 'error' }
    },
    // admin
    {
        path: '/admin/statistics',
        name: 'admin-stats',
        component: () => import(/* webpackChunkName: "admin-stats" */ '@/pages/admin/statistics.vue'),
        meta: { admin: true }
    },
    {
        path: '/admin/users',
        name: 'admin-users',
        component: () => import(/* webpackChunkName: "admin-users" */ '@/pages/admin/users.vue'),
        meta: { admin: true }
    },
    {
        path: '/admin/translations',
        name: 'admin-translations',
        component: () => import(/* webpackChunkName: "admin-translations" */ '@/pages/admin/translations.vue'),
        meta: { admin: true }
    },
    {
        path: '/admin/parsers',
        name: 'admin-parsers',
        component: () => import(/* webpackChunkName: "admin-parsers" */ '@/pages/admin/parsers.vue'),
        meta: { admin: true }
    },
    // redirects
    {
        path: '/translation(s)?/:id(\\d+)',
        name: 'translation',
        component: () => import(/* webpackChunkName: "translation" */ '@/pages/translation.vue')
    },
    {
        path: '/user(s)?/shikimori/:id(\\d+)',
        name: 'shikimori-redirect',
        component: () => import(/* webpackChunkName: "shikimori-redirect" */ '@/pages/user-redirect/shikimori.vue'),
        meta: {
            layout: 'plain',
            noapi: true
        }
    }
]

if (process.env.NODE_ENV === 'development') {
    routes.push({
        path: '/debug',
        name: 'debug-index',
        component: () => import(/* webpackChunkName: "debug-index" */ '@/pages/debug/index.vue')
    })
}

routes.push({
    path: '*',
    name: 'err404',
    // no need in lazy loading because mostly its already in bundle (App.vue has global error handling)
    component: ErrorPage,
    props: {
        error: {
            statusCode: 404
        }
    },
    meta: { group: 'error' }
})

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: routes
})

router.beforeEach((to, from, next) => {
    let authed = authStore.authenticated
    if (to.meta.auth !== undefined && authed !== to.meta.auth) {
        return next(authed ? '/' : '/login')
    }

    // check admin status for admin pages
    if (to.meta.admin && !(authed && authStore.user?.admin)) {
        return next('/err403')
    }

    appStore.set({ key: 'loading', value: true })
    next()
})

router.beforeResolve((to, from, next) => {
    if (!from.meta.group || !to.meta.group || from.meta.group !== to.meta.group) {
        appStore.reset({
            keepSearch: to.name === 'search'
        })

        if (to.meta.full) {
            document.documentElement.classList.add('fullscreen-page')
        } else {
            document.documentElement.classList.remove('fullscreen-page')
        }
    }

    if ((from.meta.noapi || !apiInitialized) && !to.meta.noapi) {
        initApi()
    }

    next()
})

router.afterEach((to) => {
    appStore.set({ key: 'loading', value: false })

    ga('set', 'page', to.path)
    ga('send', 'pageview')
})


export default router
