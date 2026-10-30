/*
 * Adhan Display
 * App shell, router, theme and the one-second ticker.
 */

import { esc } from './core/util.js';
import { icon } from './core/icons.js';
import { bus } from './core/bus.js';
import { getSettings, setSetting } from './core/storage.js';
import { toast } from './core/ui.js';
import { APP_VERSION } from './app-info.js';
import { t, loadLanguage } from './core/i18n.js';
import { location } from './services/location.js';
import { loadPrayerTimes, tickPrayer } from './services/prayer.js';
import { alerts } from './services/alerts.js';
import { homePage } from './pages/home.js';
import { prayerPage } from './pages/prayer.js';
import { quranPage, initQuranPlayer } from './pages/quran.js';
import { hadithPage } from './pages/hadith.js';
import { islamicPage } from './pages/islamic.js';
import { settingsPage } from './pages/settings.js';
import { displayPage } from './pages/display.js';
import { openLocationDialog } from './pages/components.js';

const PAGES = {
    home: homePage,
    prayer: prayerPage,
    quran: quranPage,
    hadith: hadithPage,
    islamic: islamicPage,
    settings: settingsPage,
    display: displayPage
};

const NAV = [
    ['home', 'home'],
    ['prayer', 'clock'],
    ['quran', 'book'],
    ['hadith', 'scroll'],
    ['islamic', 'crescent']
];

const ALIASES = { '': 'home', dashboard: 'home', discover: 'islamic' };

/* ---------------------------------------------------------------
 * Theme and size
 * ------------------------------------------------------------- */

const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

function resolvedTheme() {
    const theme = getSettings().theme;
    if (theme === 'system') {
        return darkQuery?.matches === false ? 'light' : 'dark';
    }
    return theme;
}

function applyAppearance() {
    const settings = getSettings();
    const theme = resolvedTheme();
    const root = document.documentElement;

    root.dataset.theme = theme;
    root.dataset.size = settings.size;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f3f0ea' : '#14110d');

    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
        const next = theme === 'dark' ? 'light' : 'dark';
        button.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
        const label = t(next === 'light' ? 'app.toLight' : 'app.toDark');
        button.setAttribute('aria-label', label);
        button.title = label;
    }
}

darkQuery?.addEventListener?.('change', () => {
    if (getSettings().theme === 'system') {
        applyAppearance();
    }
});

/* ---------------------------------------------------------------
 * Shell
 * ------------------------------------------------------------- */

function navLinks(className) {
    return NAV.map(([id, iconName]) => `
        <a class="${className}" href="#${id}" data-nav="${id}">
            ${icon(iconName, { size: className === 'tab-link' ? 22 : 18 })}
            <span>${esc(t(`nav.${id}`))}</span>
        </a>
    `).join('');
}

function renderShell() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <button type="button" class="skip-link" data-skip>${esc(t('app.skip'))}</button>
        <header class="topbar">
            <a class="brand" href="#home" aria-label="${esc(t('app.brandHome'))}">
                <img src="images/icons/logo-96.png" width="36" height="36" alt="">
                <span class="brand-name">Adhan Display</span>
            </a>
            <nav class="topnav" aria-label="${esc(t('app.mainNav'))}">${navLinks('topnav-link')}</nav>
            <div class="topbar-actions">
                <button type="button" class="place-button" data-action="location" aria-label="${esc(t('app.changeLocation'))}">
                    ${icon('pin', { size: 18 })}<span data-place-name></span>
                </button>
                <button type="button" class="icon-button" data-theme-toggle></button>
                <a class="icon-button" href="#settings" data-nav="settings" aria-label="${esc(t('nav.settings'))}" title="${esc(t('nav.settings'))}">${icon('sliders')}</a>
            </div>
        </header>

        <div class="banner-slot" data-banner aria-live="polite"></div>

        <main id="view" class="view" tabindex="-1"></main>

        <footer class="site-footer">
            <p>${esc(t('app.footer', { version: APP_VERSION }))}</p>
            <p><a href="#settings/about">${esc(t('settings.about'))}</a> <a href="#settings/data">${esc(t('settings.data'))}</a></p>
        </footer>

        <div id="player" class="player-slot"></div>
        <nav class="tabbar" aria-label="${esc(t('app.mainNav'))}">${navLinks('tab-link')}</nav>
        <div id="toast" class="toast-region" aria-live="polite"></div>
    `;

    app.addEventListener('click', event => {
        if (event.target.closest('[data-theme-toggle]')) {
            setSetting('theme', resolvedTheme() === 'dark' ? 'light' : 'dark');
            applyAppearance();
            bus.emit('settings', { key: 'theme' });
        } else if (event.target.closest('.topbar [data-action="location"]')) {
            openLocationDialog();
        } else if (event.target.closest('[data-stop-adhan]')) {
            alerts.stop();
        } else if (event.target.closest('[data-skip]')) {
            document.getElementById('view')?.focus();
        }
    });

    updatePlaceName();
}

function updatePlaceName() {
    const element = document.querySelector('[data-place-name]');
    if (element) {
        element.textContent = location.get().city;
    }
}

function updateBanner() {
    const slot = document.querySelector('[data-banner]');

    if (!slot) {
        return;
    }

    const playing = alerts.playing;

    if (playing && playing.kind !== 'preview') {
        slot.innerHTML = `
            <div class="banner banner-adhan">
                ${icon('volume', { size: 18 })}
                <span>${esc(playing.label)}</span>
                <button type="button" class="button button-small" data-stop-adhan>${icon('stop', { size: 14 })} ${esc(t('common.stop'))}</button>
            </div>
        `;
    } else if (navigator.onLine === false) {
        slot.innerHTML = `<div class="banner">${icon('info', { size: 18 })}<span>${esc(t('app.offline'))}</span></div>`;
    } else {
        slot.innerHTML = '';
    }
}

/* ---------------------------------------------------------------
 * Router
 * ------------------------------------------------------------- */

let active = null;

function parseRoute() {
    let hash = window.location.hash.replace(/^#\/?/, '');

    try {
        hash = decodeURIComponent(hash);
    } catch {
        /* keep raw */
    }

    const [first = '', ...rest] = hash.split('/').filter((part, index) => part || index === 0);
    let name = ALIASES[first] ?? first;
    let path = rest;

    if (first === 'discover') {
        path = ['discover'];
    }

    if (!PAGES[name]) {
        name = 'home';
        path = [];
    }

    return { name, path, key: `${name}/${path.join('/')}` };
}

function makeContext() {
    const cleanups = [];
    return {
        on(type, handler) {
            cleanups.push(bus.on(type, handler));
        },
        cleanup(fn) {
            cleanups.push(fn);
        },
        dispose() {
            cleanups.splice(0).forEach(fn => {
                try {
                    fn();
                } catch {
                    /* ignore */
                }
            });
        }
    };
}

function render() {
    const route = parseRoute();

    if (active?.key === route.key) {
        return;
    }

    const view = document.getElementById('view');
    const page = PAGES[route.name];
    const samePage = active?.name === route.name;

    active?.ctx.dispose();

    const ctx = makeContext();
    view.innerHTML = page.render(route.path);

    /* The view element is reused, so clone it to drop old listeners. */
    const fresh = view.cloneNode(true);
    view.replaceWith(fresh);

    active = { ...route, page, ctx };

    try {
        page.mount?.(fresh, route.path, ctx);
    } catch (error) {
        console.error('[Adhan Display] Page error', error);
        fresh.innerHTML = `<div class="page"><div class="empty"><p class="empty-title">${esc(t('app.pageError'))}</p><p class="empty-text">${esc(error.message)}</p><a class="button button-primary" href="#home">${esc(t('app.goHome'))}</a></div></div>`;
    }

    document.body.dataset.page = route.name;
    document.querySelectorAll('[data-nav]').forEach(link => {
        const current = link.dataset.nav === route.name;
        link.classList.toggle('is-active', current);
        if (current) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    document.title = route.name === 'home'
        ? `Adhan Display | ${t('app.homeTitle')}`
        : `${t(page.titleKey)} | Adhan Display`;

    if (!samePage || route.name !== 'prayer') {
        window.scrollTo(0, 0);
    }

    if (!samePage) {
        fresh.focus({ preventScroll: true });
    }

    bus.emit('route', { route: route.name });
    trackPageView(route);
}

function trackPageView(route) {
    if (typeof window.gtag !== 'function') {
        return;
    }
    const path = route.name === 'home' ? '/' : `/${route.name}${route.path[0] && route.name !== 'quran' && route.name !== 'hadith' ? `/${route.path[0]}` : ''}`;
    window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: path
    });
}

/* ---------------------------------------------------------------
 * Ticker: aligned to the start of each second
 * ------------------------------------------------------------- */

function tick() {
    const now = new Date();

    try {
        tickPrayer(now);
    } catch (error) {
        console.warn('[Adhan Display] Tick failed', error);
    }

    bus.emit('tick', { now });
    setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
}

/* ---------------------------------------------------------------
 * Service worker
 * ------------------------------------------------------------- */

function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
        return;
    }

    const hadController = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker.register('sw.js').then(registration => {
        setInterval(() => registration.update().catch(() => {}), 6 * 60 * 60 * 1000);
    }).catch(error => console.warn('[Adhan Display] Service worker not registered', error));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController) {
            return;
        }
        if (document.body.dataset.page === 'display') {
            window.location.reload();
            return;
        }
        toast(t('app.updated'), {
            duration: 0,
            action: { label: t('app.reload'), run: () => window.location.reload() }
        });
    });
}

/* ---------------------------------------------------------------
 * Start
 * ------------------------------------------------------------- */

async function start() {
    await loadLanguage();
    applyAppearance();
    renderShell();
    applyAppearance();
    alerts.init();
    initQuranPlayer();

    bus.on('settings', ({ key }) => {
        if (['theme', 'size'].includes(key)) {
            applyAppearance();
        }
        if (['method', 'school', 'latAdjust', 'tune', 'cache', 'hijriOffset'].includes(key)) {
            loadPrayerTimes();
        }
    });

    bus.on('location', () => {
        updatePlaceName();
        loadPrayerTimes();
    });

    bus.on('alert-audio', updateBanner);
    window.addEventListener('online', updateBanner);
    window.addEventListener('offline', updateBanner);

    window.addEventListener('hashchange', render);
    render();
    updateBanner();

    loadPrayerTimes();
    location.refreshIfAllowed();
    tick();

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            tickPrayer(new Date());
        }
    });

    registerServiceWorker();
}

start();
