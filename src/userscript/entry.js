class UserScript {
    __version = '1.0.1'
    __debug = false
    __matchers = []
    __assets = process.env.ASSETS
    __i18n = {
        ru: {
            Watch: 'Смотреть онлайн',
            Banned: 'Забанен',
            Admin: 'Админ',
            Moderator: 'Модератор',
            Trusted: 'Доверенный',
            AddedVideos: [
                'добавленных видео',
                'добавленное видео',
                'добавленных видео',
                'добавленных видео',
            ],
            AtPlashiki: 'на PlaShiki',
        },
    }
    __lang = 'ru'

    match (matcher, func) {
        if (!(matcher instanceof RegExp)) {
            throw Error('Invalid matcher')
        }

        this.__matchers.push({ matcher, func })
    }

    asset (name) {
        return this.__assets[name]
    }

    execute (url) {
        this.__matchers.forEach(({ matcher, func }) => {
            if (url.match(matcher)) func()
        })
    }

    tr (name) {
        return this.__i18n[this.__lang][name]
    }

    trc (name, choice) {
        if (!this.__i18n[this.__lang][name]) return undefined

        let choicesLength = this.__i18n[this.__lang][name].length
        let ind = 0
        if (this.__lang === 'ru') {
            if (choice === 0 || choicesLength === 1) {
                ind = 0
            }

            const teen = choice > 10 && choice < 20
            const endsWithOne = choice % 10 === 1

            if (!teen && endsWithOne) {
                ind = 1
            } else if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
                ind = 2
            } else {
                ind = (choicesLength < 4) ? 2 : 3
            }
        }

        return this.__i18n[this.__lang][name][ind]
    }
}

const ShikimoriRegex = /^https?:\/\/shikimori\.o(?:ne|rg)/
const PlashikiRegex = /^https?:\/\/(beta\.)?(?:plashiki\.(?:tk|online|su)|shikimori\.online|(?:127.0.0.1|localhost):8123)/

const us = new UserScript()

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)
const API_DOMAIN = process.env.VUE_APP_API_ENDPOINT

let galo4kiEnabled = true

function style () {
    let t = document.getElementById('plashiki-inject-css')
    if (!t) {
        const style = document.createElement('style')
        style.type = 'text/css'
        style.id = 'plashiki-inject-css'
        style.innerHTML = us.asset('inject.scss')
        document.getElementsByTagName('head')[0].appendChild(style)
    }
}

function xhr (url, params = {}) {
    return new Promise((res, rej) => {
        let x = new XMLHttpRequest()
        x.open(params.method || 'GET', url)

        let body = typeof params.body === 'object' ? JSON.stringify(params.body) : params.body

        x.send(body)
        x.onload = () => res(x.response)
        x.onerror = rej
    })
}

const galo4kiIndex = {}

function addGalo4kaEl (storage, id, el) {
    if (!el || !galo4kiEnabled) return
    if (!(id in storage)) {
        storage[id] = []
    }
    storage[id].push(el)
}

function drawGalo4ki (storage) {
    Object.entries(storage).forEach(([id, els]) => {
        if (galo4kiIndex[id]) {
            els.forEach(i => i.classList.add('plashiki-has-galo4ka'))
        }
    })
}

function loadGalo4ki (storage, service) {
    if (!galo4kiEnabled) return
    let ids = Object.keys(storage)
    let newIds = ids.filter(i => !(i in galo4kiIndex))
    if (!newIds.length) return drawGalo4ki(storage)

    let url = API_DOMAIN + '/v2/donators/from?ids='
        + encodeURIComponent(newIds.join(','))
    if (service) {
        url += '&service=' + service
    }

    xhr(url).then((res) => {
        if (typeof res === 'string') {
            res = JSON.parse(res)
        }
        if (!res.ok) {
            console.warn('galo4ki load error: ' + res)
        } else {
            res.result.forEach((user) => {
                let id = user.id
                if (service) {
                    id = user.external_ids[service]
                }

                galo4kiIndex[id] = true
            })

            newIds.forEach((id) => {
                if (galo4kiIndex[id] === undefined) {
                    galo4kiIndex[id] = false
                }
            })
        }

        drawGalo4ki(storage)
    }).catch(console.warn)
}

us.match(ShikimoriRegex, () => {
    function button (retry = 0) {
        const animeIdR = location.href.match(
            /^https?:\/\/shikimori\.o(?:ne|rg)\/animes\/[a-zA-Z]*(\d+)(?:.+)?$/,
        )
        if (animeIdR === null || animeIdR[1] === undefined) return
        const animeId = animeIdR[1]
        let t = document.getElementById('plashiki-inject')
        if (t) t.remove()
        const rootAr = document.querySelectorAll(
            'div.c-info-right > .block',
        )
        if (rootAr.length === 0) {
            setTimeout(button, 100, retry + 1)
            return
        }

        const root = rootAr[rootAr.length - 1]
        const customCss = $('#custom_css')
        const isShikiTheme = customCss && customCss.innerText.indexOf('shiki-theme') > -1
        if (isShikiTheme) {
            const btn = document.createElement('a')
            btn.className = 'shiki-theme'
            btn.id = 'plashiki-inject'
            btn.href = 'https://plashiki.su/anime/' + animeId
            btn.innerHTML = us.tr('Watch')
            root.appendChild(btn)
        } else {
            let div = document.createElement('div')
            div.className = 'watch-online'
            div.id = 'plashiki-inject'
            div.innerHTML = `
            <div class="line">
                <a class="b-link_button dark" href="https://plashiki.su/anime/${animeId}" target="_blank" title="PlaShiki">
                    <span>${us.tr('Watch')}</span>
                </a>
            </div>
            <div class="kind">PlaShiki</div>
            `
            root.appendChild(div)
        }
    }

    function galo4ki () {
        if (!galo4kiEnabled) return
        const els = {}

        let currentUser = JSON.parse($('body').dataset.user || '{}').id || null
        if (currentUser) {
            addGalo4kaEl(els, currentUser, $('.menu-dropdown.profile'))
        }

        $$('.b-user').forEach((el) => {
            let id = el.attributes.id.value
            let name = el.querySelector('.name')
            addGalo4kaEl(els, id, name || el.querySelector('img').parentElement)
        })

        $$('.profile-head').forEach((el) => {
            addGalo4kaEl(els, el.dataset.userId, el.querySelector('.head.misc>h1').parentElement)
        })

        $$('.b-user.detailed, .b-user.moderation').forEach((el) => {
            addGalo4kaEl(els, el.attributes.id.value, el.querySelector('.avatar-name .name'))
        })

        $$('.b-comment.shiki-object').forEach((el) => {
            addGalo4kaEl(els, el.dataset.user_id, el.querySelector('.inner header .name-date .name'))
        })

        loadGalo4ki(els, 'S')
    }

    let statsLoading = {}

    function stats () {
        const head = $('.profile-head')
        if (!head || !head.dataset.userId) return
        const userId = head.dataset.userId
        if (statsLoading[userId]) return
        statsLoading[userId] = true

        xhr(API_DOMAIN + '/v2/users?withStat&shikiId=' + head.dataset.userId)
            .then((res) => {
                if (typeof res === 'string') {
                    res = JSON.parse(res)
                }
                if (res.ok) {
                    res = res.result
                } else {
                    return
                }
                let root = $('.c-additionals')
                const old = $('.plashiki-inject-stats')
                if (old) old.remove()

                let text = ''
                if (res.banned) {
                    text = `<span style="color: #de3e35">${us.tr('Banned')}</span>`
                } else if (res.admin) {
                    text = `<span style="color: #2c7ae2">${us.tr('Admin')}</span>`
                } else if (res.moderator) {
                    text = `<span style="color: #2c7ae2">${us.tr('Moderator')}</span>`
                } else if (res.trusted) {
                    text = `<span style="color: #1b9a59">${us.tr('Trusted')}</span>`
                }
                if (res.added > 0) {
                    if (text) text += ', '
                    text += `${res.added} ${us.trc('AddedVideos', res.added)}`
                }

                if (!text) return

                if (!root) {
                    const r = $('.profile-head .c-info')
                    const q = document.createElement('div')
                    q.className = 'c-additionals'
                    if (document.body.dataset.locale === 'en') {
                        q.innerHTML = '<b>Activity:</b>'
                    } else {
                        q.innerHTML = '<b>Активность:</b>'
                    }
                    root = q
                    r.appendChild(q)
                }

                let injectedEl = document.createElement('div')
                injectedEl.dataset.type = 'plashiki'
                injectedEl.className = 'plashiki-inject-stats'
                let injectedSpan = document.createElement('span')
                injectedSpan.innerHTML = text + ' ' + us.tr('AtPlashiki')
                injectedEl.appendChild(injectedSpan)
                root.appendChild(injectedEl)
            })
            .finally(() => {
                statsLoading[userId] = false
            })
    }

    function inject () {
        style()
        button()
        galo4ki()
        stats()
    }

    let ajaxBound = false

    document.addEventListener('page:load', inject)
    document.addEventListener('turbolinks:load', function () {
        inject()
        if (!ajaxBound) {
            unsafeWindow.jQuery(document).on('ajax:complete', () => setTimeout(galo4ki, 25))
            ajaxBound = true
        }
    })
    if (unsafeWindow.jQuery && galo4kiEnabled) {
        unsafeWindow.jQuery(document).on('ajax:complete', () => setTimeout(galo4ki, 25))
        ajaxBound = true
    }
    inject()
})


us.match(PlashikiRegex, () => {
    if (process.ctx.isUserscript) {
        unsafeWindow.USERSCRIPT_VERSION = us.__version
        unsafeWindow.corsAjax = GM_xmlhttpRequest
        unsafeWindow.toggleGalo4ki = (val) => {
            galo4kiEnabled = val
            GM_setValue('galo4kiEnabled', val + '')
        }
        unsafeWindow.galo4kiEnabled = () => {
            return Promise.resolve(GM_getValue('galo4kiEnabled')).then(i => i !== 'false')
        }
    } else {
        const vendorGlobal = process.ctx.target === 'firefox' ? browser : chrome

        // basically the original Greasemonkey implementation.
        // https://github.com/greasemonkey/greasemonkey
        // licensed under MIT
        // doesnt support .abort() but idc tbh
        function GM_xmlhttpRequest (d) {
            if (!d) throw new Error('xhr_no_details')
            if (!d.url) throw new Error('xhr_no_url')

            let url
            try {
                url = new URL(d.url, location.href)
            } catch (e) {
                throw new Error('xhr_bad_url ' + d.url + ' ' + e.stack)
            }

            if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'ftp:') {
                throw new Error('xhr_bad_url_scheme ' + d.url)
            }

            let port = vendorGlobal.runtime.connect(extensionId, { name: 'PageXhr' })
            port.onMessage.addListener(function (msg) {
                if (msg.responseState.responseXML) {
                    try {
                        msg.responseState.responseXML = (new DOMParser()).parseFromString(
                            msg.responseState.responseText,
                            'application/xml',
                        )
                    } catch (e) {
                        console.warn('GM_xhr could not parse XML:', e)
                        msg.responseState.responseXML = null
                    }
                }
                let o = msg.src === 'up' ? d.upload : d
                let cb = o['on' + msg.type]
                if (cb) cb(msg.responseState)
            })

            let noCallbackDetails = {}
            Object.keys(d).forEach(k => {
                let v = d[k]
                noCallbackDetails[k] = v
                if ('function' == typeof v) noCallbackDetails[k] = true
            })
            noCallbackDetails.upload = {}
            d.upload && Object.keys(k => noCallbackDetails.upload[k] = true)
            noCallbackDetails.url = url.href
            port.postMessage({
                'details': noCallbackDetails,
                'name': 'open',
            })
        }

        function getGalo4kiEnabled (callback) {
            // in ff i cant return promises from exported functions, lol
            // return new Promise(callback => {
            return vendorGlobal.runtime.sendMessage(extensionId, {
                action: 'getGalo4kiEnabled',
            }, callback)
            // })
        }

        function toggleGalo4ki (val, callback) {
            // return new Promise(callback => {
            return vendorGlobal.runtime.sendMessage(extensionId, {
                action: 'toggleGalo4ki',
                val,
            }, callback)
            // })
        }

        if (process.ctx.target === 'firefox') {
            unsafeWindow.EXTENSION_VERSION = '%VERSION%'
            unsafeWindow.EXTENSION_ID = extensionId
            unsafeWindow.EXTENSION_SPECIALS_API_VERSION = '1'
            unsafeWindow.firefox = true
            exportFunction(function (onload, onerror, onabort, onprogress, onreadystatechange, ontimeout, params) {
                // firefox cant xray-vision functions inside object fsr, so using this XD
                return GM_xmlhttpRequest({
                    onload,
                    onerror,
                    onabort,
                    onprogress,
                    onreadystatechange,
                    ontimeout,
                    ...params,
                })
            }, window, { defineAs: 'corsAjaxFF' })

            let scr = document.createElement('script')
            scr.text =
                'window.corsAjax = function (p) { return corsAjaxFF(p.onload, p.onerror, p.onabort, p.onprogress, p.onreadystatechange, p.ontimeout, p) }'
            document.documentElement.appendChild(scr)
            scr.onload = () => {
                scr.remove()
            }

            exportFunction(getGalo4kiEnabled, window, { defineAs: 'galo4kiEnabled' })
            exportFunction(toggleGalo4ki, window, { defineAs: 'toggleGalo4ki' })
        } else if (process.ctx.target === 'chrome') {
            window.EXTENSION_VERSION = '%VERSION%'
            window.EXTENSION_SPECIALS_API_VERSION = '1'
            window.EXTENSION_ID = extensionId
            window.corsAjax = GM_xmlhttpRequest
            window.galo4kiEnabled = getGalo4kiEnabled
            window.toggleGalo4ki = toggleGalo4ki
        }
    }
})
