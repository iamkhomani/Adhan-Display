import {
    state,
    initializeState,
    toggleTheme
} from './state.js';
import { initializeRouter, navigate } from './router.js';

import { PrayerService } from './services/prayer.js';
import { LocationService } from './services/location.js';
import { AudioService } from './services/audio.js';
import {
    renderPrayerPage,
    bindPrayerPage,
    getPrayerEntries,
    renderPrayerRows,
    renderQiblaCard,
    bindQiblaCompass
} from './pages/prayer.js';
import {
    getDailyAyah,
    openQuranAtAyah,
    renderQuranPage,
    bindQuranPage
} from './pages/quran.js';
import { renderHadithPage, bindHadithPage } from './pages/hadith.js';
import {
    renderDiscoverPage,
    bindDiscoverPage
} from './pages/discover.js';

import {
    renderSettingsPage,
    bindSettingsPage
} from './pages/settings.js';
import {
    renderPrayerTool,
    bindPrayerTools
} from './pages/prayer-tools.js';

import {
    renderIslamicPage,
    renderIslamicTool,
    bindIslamicPage,
    prepareIslamicTool,
    getTodayContent
} from './pages/islamic.js';

const prayer = new PrayerService(
    (data, month, next, previous) => {
        state.prayer.data = data;
        state.prayer.month = month || [];
        state.prayer.next = next || null;
        state.prayer.previous = previous || null;

        window.dispatchEvent(
            new CustomEvent('adhan:prayer-update')
        );
    }
);

let activePrayerTool = null;
let activeIslamicTool = null;

const locationService = new LocationService(
    (location) => {
        state.location = {
            lat: Number(location.lat),
            lon: Number(location.lon),
            city: location.city || 'Current location'
        };

        window.dispatchEvent(
            new CustomEvent('adhan:location-update')
        );
    }
);

async function initialize() {
    console.log(
        '[Adhan Display 2.0] Initializing'
    );

    initializeState();
    initializeRouter();

    bindSkipLink();
    bindNavigation();

    try {
        AudioService.init(
            Number(
                localStorage.getItem('adhan_volume') || 1
            )
        );
    } catch (error) {
        console.warn(
            '[Adhan Display 2.0] Audio initialization failed',
            error
        );
    }

    /*
     * Render the application immediately.
     *
     * Location detection must never block the first
     * application render or the initial prayer request.
     */
    render();

    /*
     * Load prayer times immediately using the location
     * already available in state.
     *
     * This allows the dashboard to become usable while
     * automatic location detection continues in the
     * background.
     */
    try {
        state.prayer.loading = true;

        await prayer.load();

        state.prayer.loading = false;
        state.prayer.error = null;

        render();
    } catch (error) {
        console.error(
            '[Adhan Display 2.0] Prayer initialization failed',
            error
        );

        state.prayer.loading = false;
        state.prayer.error = error;

        render();
    }

    /*
     * Determine the most accurate location in the
     * background.
     *
     * IMPORTANT:
     * We intentionally do not await this call.
     *
     * If browser geolocation or the IP location provider
     * is slow or unavailable, the application remains
     * fully usable with the stored/default location.
     */
    locationService
        .init()
        .catch(error => {
            console.warn(
                '[Adhan Display 2.0] Background location initialization failed',
                error
            );
        });
}

function bindThemeToggle() {

    const button =
        document.querySelector(
            '[data-theme-toggle]'
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        'click',
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            toggleTheme();

            render();
        }
    );
}


function bindSkipLink() {
    const skipLink = document.querySelector('[data-skip-link]');
    const app = document.getElementById('app');

    if (!skipLink || !app) {
        return;
    }

    skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        app.focus({ preventScroll: false });
    });
}

function bindNavigation() {
    document.addEventListener('click', (event) => {
        const link = event.target.closest('[data-route]');

        if (!link) {
            return;
        }

        event.preventDefault();

        navigate(link.dataset.route);
    });

    window.addEventListener('adhan:navigate', render);
    window.addEventListener(
        'adhan:hadith-update',
        render
    );
    window.addEventListener('adhan:prayer-update', render);
    window.addEventListener('adhan:location-update', async () => {
        try {
            await prayer.load();
        } catch (error) {
            console.error(
                '[Adhan Display 2.0] Prayer refresh failed',
                error
            );
        }
    });
}

window.addEventListener(
    'adhan:settings-render',
    () => {
        render();
    }
);

window.addEventListener(
    'adhan:manual-location',
    event => {
        const location = event.detail;

        if (
            !location ||
            !Number.isFinite(Number(location.lat)) ||
            !Number.isFinite(Number(location.lon))
        ) {
            return;
        }

        locationService.set({
            lat: Number(location.lat),
            lon: Number(location.lon),
            city: location.city || 'Selected location'
        });
    }
);

window.addEventListener(
    'adhan:settings-changed',
    async () => {
        try {
            await prayer.load();
        } catch (error) {
            console.error(
                '[Adhan Display 2.0] Prayer settings refresh failed',
                error
            );
        }

        render();
    }
);

window.addEventListener(
    'adhan:islamic-action',
    async (event) => {
        const action = event.detail?.action;

        if (!action) {
            return;
        }

        activeIslamicTool = action;

        await prepareIslamicTool(action);

        if (state.page !== 'islamic') {
            state.page = 'islamic';

            if (window.location.hash !== '#islamic') {
                window.history.replaceState(
                    null,
                    '',
                    '#islamic'
                );
            }
        }

        render();
    }
);

window.addEventListener(
    'adhan:islamic-tool-close',
    () => {
        activeIslamicTool = null;
        render();
    }
);

window.addEventListener(
    'adhan:prayer-action',
    (event) => {
        const action = event.detail?.action;

        if (!action) {
            return;
        }

        activePrayerTool = action;
        render();
    }
);

window.addEventListener(
    'adhan:prayer-tool-close',
    () => {
        activePrayerTool = null;
        render();
    }
);

window.addEventListener(
    'adhan:prayer-tracker-update',
    () => {
        if (activePrayerTool === 'tracker') {
            render();
        }
    }
);

function bindMobileMenu() {
    const toggle = document.querySelector(
        '[data-mobile-menu-toggle]'
    );

    const menu = document.querySelector(
        '[data-mobile-menu]'
    );

    if (!toggle || !menu) {
        return;
    }

    const setOpen = (open) => {
        menu.classList.toggle('is-open', open);

        menu.setAttribute(
            'aria-hidden',
            String(!open)
        );

        toggle.setAttribute(
            'aria-expanded',
            String(open)
        );

        toggle.setAttribute(
            'aria-label',
            open
                ? 'Close navigation'
                : 'Open navigation'
        );

        document.body.classList.toggle(
            'ad2-mobile-menu-open',
            open
        );
    };

    toggle.addEventListener(
        'click',
        event => {
            event.preventDefault();
            event.stopPropagation();

            const isOpen =
                menu.classList.contains('is-open');

            setOpen(!isOpen);
        }
    );

    menu.addEventListener(
        'click',
        event => {
            if (
                event.target.closest('[data-route]')
            ) {
                setOpen(false);
                return;
            }

            if (
                event.target === menu
            ) {
                setOpen(false);
            }
        }
    );

    document.addEventListener(
        'keydown',
        event => {
            if (
                event.key === 'Escape' &&
                menu.classList.contains('is-open')
            ) {
                setOpen(false);
            }
        }
    );
}

function render() {
    const app = document.getElementById('app');

    if (!app) {
        console.error('[Adhan Display 2.0] #app not found');
        return;
    }

    app.innerHTML = `
        <div class="ad2-shell">
            <header class="ad2-header">
                <a href="#dashboard" class="ad2-brand" data-route="home">
                    <span class="ad2-brand-mark"><img src="/images/adhan%20display%20muslim%20prayer%20times%20dashboard%20logo.png" alt="Adhan Display"></span>
                    <span>
                        <strong>Adhan Display</strong>
                    </span>
                </a>

                <div class="ad2-header-actions">

                <nav class="ad2-nav" aria-label="Main navigation">
                    ${navItem('home', 'Dashboard')}
                    ${navItem('quran', 'Quran')}
                    ${navItem('hadith', 'Hadith')}
                    ${navItem('prayer', 'Prayer')}
                    ${navItem('islamic', 'Islamic')}
                    ${navItem('discover', 'Discover')}
                    ${navItem('settings', 'Settings')}
                </nav>

                <button
                    class="ad2-theme-toggle"
                    data-theme-toggle
                    title="Toggle dark mode"
                    aria-label="Toggle dark mode"
                >
                    ${state.ui.darkMode ? '&#9728;' : '&#9790;'}
                </button>

                <button
                    class="ad2-mobile-menu-toggle"
                    data-mobile-menu-toggle
                    type="button"
                    aria-label="Open navigation"
                    aria-expanded="false"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

            </div>
            </header>

            <div
                class="ad2-mobile-menu"
                data-mobile-menu
                aria-hidden="true"
            >
                <div class="ad2-mobile-menu-panel">
                    <div class="ad2-mobile-menu-heading">
                        <span class="ad2-eyebrow">ADHAN DISPLAY</span>
                        <span>Navigation</span>
                    </div>

                    <nav
                        class="ad2-mobile-nav"
                        aria-label="Mobile navigation"
                    >
                        ${navItem('home', 'Dashboard')}
                        ${navItem('quran', 'Quran')}
                        ${navItem('hadith', 'Hadith')}
                        ${navItem('prayer', 'Prayer')}
                        ${navItem('islamic', 'Islamic')}
                        ${navItem('discover', 'Discover')}
                        ${navItem('settings', 'Settings')}
                    </nav>
                </div>
            </div>

            <main class="ad2-main">
                ${renderPage()}
            </main>

            <footer class="ad2-footer">
                <span>Adhan Display</span>
                <span>Prayer &middot; Quran &middot; Islamic Life</span>
            </footer>
        </div>
    `;

    bindThemeToggle();
    bindMobileMenu();

    if (state.page === 'home') {
        bindQiblaCompass();
        loadDashboardAyah();
    }

    if (state.page === 'quran') {
        bindQuranPage();
    }

    if (state.page === 'hadith') {
        bindHadithPage();
    }

    if (state.page === 'discover') {
        bindDiscoverPage();
    }

    if (state.page === 'settings') {
        bindSettingsPage();
    }

    if (state.page === 'prayer') {
        if (activePrayerTool) {
            bindPrayerTools();
        } else {
            bindPrayerPage();
        }
    }

    if (state.page === 'islamic') {
        bindIslamicPage();
    }
}

function navItem(route, label) {
    const active = state.page === route ? 'is-active' : '';

    return `
        <a
            href="#${route}"
            class="ad2-nav-link ${active}"
            data-route="${route}"
        >
            ${label}
        </a>
    `;
}

function renderPage() {
    switch (state.page) {

        case 'quran':
            return renderQuranPage();

        case 'hadith':
            return renderHadithPage();

        case 'prayer':
            if (activePrayerTool) {
                return renderPrayerTool(activePrayerTool);
            }

            return renderPrayerPage();

        case 'islamic':
            if (activeIslamicTool) {
                return renderIslamicTool(activeIslamicTool);
            }

            return renderIslamicPage();

        case 'discover':
            return renderDiscoverPage();

        case 'settings':
            return renderSettingsPage();

        case 'home':
        default:
            return renderDashboard();
    }
}

function getCurrentPrayer(data) {
    if (!data?.timings) {
        return null;
    }

    const prayers = [
        ['Fajr', 'Fajr'],
        ['Dhuhr', 'Dhuhr'],
        ['Asr', 'Asr'],
        ['Maghrib', 'Maghrib'],
        ['Isha', 'Isha']
    ];

    const now = new Date();
    let current = null;

    for (const [name, key] of prayers) {
        const raw = data.timings[key];

        if (!raw) {
            continue;
        }

        const match = String(raw)
            .split(' ')[0]
            .match(/^(\d{1,2}):(\d{2})/);

        if (!match) {
            continue;
        }

        const time = new Date();

        time.setHours(
            Number(match[1]),
            Number(match[2]),
            0,
            0
        );

        if (time <= now) {
            current = {
                name: name,
                time: time
            };
        }
    }

    if (!current) {
        const raw = data.timings.Isha;

        if (raw) {
            const match = String(raw)
                .split(' ')[0]
                .match(/^(\d{1,2}):(\d{2})/);

            if (match) {
                const time = new Date();

                time.setHours(
                    Number(match[1]),
                    Number(match[2]),
                    0,
                    0
                );

                time.setDate(
                    time.getDate() - 1
                );

                current = {
                    name: 'Isha',
                    time: time
                };
            }
        }
    }

    return current;
}

function renderDashboard() {
    const data = state.prayer.data;
    const next = state.prayer.next;
    const entries = getPrayerEntries(data);
    const content = getTodayContent();

    if (!data) {
        return `
            <section class="ad2-page">
                <div class="ad2-loading">
                    <span class="ad2-spinner"></span>
                    <p>Loading prayer times...</p>
                </div>
            </section>
        `;
    }

    const current = getCurrentPrayer(data);

    const currentTime = current?.time
        ? formatTime(current.time)
        : '--:--';

    const city =
        state.location?.city ||
        'Current location';

    const today =
        data.date?.readable ||
        new Date().toLocaleDateString();

    const prayerRows = entries.length
        ? renderPrayerRows(entries, next)
        : `
            <div class="prayer-empty">
                Prayer times are loading...
            </div>
        `;

    const hadith = content?.hadith;

    const hadithText =
        Array.isArray(hadith)
            ? hadith[0] || ''
            : typeof hadith === 'string'
                ? hadith
                : hadith?.text ||
                  hadith?.english ||
                  hadith?.translation ||
                  '';

    const hadithSource =
        Array.isArray(hadith)
            ? hadith[1] || ''
            : typeof hadith === 'object'
                ? hadith?.source ||
                  hadith?.reference ||
                  hadith?.narrator ||
                  ''
                : '';

    return `
        <section class="ad2-page ad2-home">

            <div class="ad2-location">
                <span class="ad2-location-dot"></span>
                ${escapeHtml(city)}
            </div>

            <section class="ad2-prayer-hero">

                <div class="ad2-hero-copy">

                    <span class="ad2-eyebrow">
                        DASHBOARD
                    </span>

                    <h1>
                        ${escapeHtml(current?.name || 'Prayer')}
                    </h1>

                    <div class="ad2-hero-time">
                        ${escapeHtml(currentTime)}
                    </div>

                    <div
                        id="ad2-countdown"
                        class="ad2-countdown"
                    >
                        ${
                            next?.name
                                ? `Next prayer: ${escapeHtml(next.name)} &middot; in --`
                                : 'Next prayer unavailable'
                        }
                    </div>

                    <p class="ad2-hero-date">
                        ${escapeHtml(today)}
                    </p>

                </div>

                <div class="ad2-prayer-orbit">
                    <div class="ad2-orbit-ring">
                        <span>ADHAN</span>
                    </div>
                </div>

            </section>

            <section class="ad2-section">

                <div class="ad2-section-heading">

                    <div>
                        <span class="ad2-eyebrow">
                            SALAH
                        </span>

                        <h2>
                            Today's Prayer Times
                        </h2>
                    </div>

                </div>

                <div class="prayer-compact-layout">

                    <div class="prayer-compact-main">

                        <div class="prayer-compact-times">
                            ${prayerRows}
                        </div>

                    </div>

                    <div class="prayer-compact-side">
                        ${renderQiblaCard()}
                    </div>

                </div>

            </section>

            <section class="ad2-section">

                <div class="ad2-section-heading">

                    <div>
                        <span class="ad2-eyebrow">
                            REFLECTION
                        </span>

                        <h2>
                            Today's Reminder
                        </h2>
                    </div>

                </div>

                <div class="ad2-content-grid">

                    <article class="ad2-content-card">

                        <span class="ad2-card-eyebrow">
                            HADITH OF THE DAY
                        </span>

                        <div class="ad2-card-text">
                            ${
                                escapeHtml(
                                    hadithText ||
                                    'No Hadith available today.'
                                )
                            }
                        </div>

                        ${
                            hadithSource
                                ? `
                                    <div class="ad2-card-source">
                                        ${escapeHtml(hadithSource)}
                                    </div>
                                `
                                : ''
                        }

                    </article>

                    <article class="ad2-content-card">

                        <span class="ad2-card-eyebrow">
                            AYAH OF THE DAY
                        </span>

                        <div
                            class="ad2-card-text"
                            data-dashboard-ayah
                        >
                            Loading...
                        </div>

                        <div
                            class="ad2-card-source"
                            data-dashboard-ayah-source
                        >
                            Quran
                        </div>

                        <button
                            type="button"
                            class="ad2-card-action"
                            data-dashboard-read-quran
                            disabled
                        >
                            Read in Quran
                        </button>

                    </article>

                </div>

            </section>

            <section
                class="ad2-shahada"
                aria-labelledby="ad2-shahada-title"
            >

                <div class="ad2-shahada-inner">

                    <span class="ad2-shahada-eyebrow">
                        THE SHAHADA
                    </span>

                    <h2
                        id="ad2-shahada-title"
                        class="ad2-shahada-arabic"
                        lang="ar"
                        dir="rtl"
                    >
                        أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله
                    </h2>

                    <p class="ad2-shahada-transliteration">
                        Ashhadu an la ilaha illallah,
                        wa ashhadu anna Muhammadan rasulullah.
                    </p>

                    <p class="ad2-shahada-translation">
                        I bear witness that there is no deity worthy of worship
                        except Allah, and I bear witness that Muhammad is the
                        Messenger of Allah.
                    </p>

                </div>

            </section>

        </section>
    `;
}

function formatTime(date) {
    if (!(date instanceof Date)) {
        return '--:--';
    }

    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


/* AD2_RAMADAN_FUNCTIONS_START */

/*
 * Ramadan 1448 AH
 *
 * The expected first fasting day is 8 February 2027.
 * The actual beginning remains subject to moon sighting.
 *
 * Keep this date in one place so it can easily be updated
 * when the official local date is confirmed.
 */



function getRamadanStartDate() {
    return new Date(
        RAMADAN_COUNTDOWN.expectedStart.year,
        RAMADAN_COUNTDOWN.expectedStart.month,
        RAMADAN_COUNTDOWN.expectedStart.day,
        0,
        0,
        0,
        0
    );
}


function formatRamadanNumber(value) {
    return String(
        Math.max(0, value)
    ).padStart(2, '0');
}


function getNextRamadanStart() {
    const formatter = new Intl.DateTimeFormat(
        'en-u-ca-islamic-umalqura',
        {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }
    );

    const now = new Date();

    /*
     * Begin vandaag en zoek maximaal 400 dagen vooruit.
     * We zoeken specifiek naar:
     *
     * Hijri month = 9
     * Hijri day   = 1
     *
     * De eerste Ramadan die strikt in de toekomst ligt
     * wordt gebruikt.
     */

    for (let offset = 0; offset <= 400; offset++) {
        const candidate = new Date(now);

        candidate.setHours(0, 0, 0, 0);
        candidate.setDate(candidate.getDate() + offset);

        const parts = formatter.formatToParts(candidate);

        const values = {};

        for (const part of parts) {
            if (part.type !== 'literal') {
                values[part.type] = Number(part.value);
            }
        }

        if (
            values.month === 9 &&
            values.day === 1
        ) {
            /*
             * Als Ramadan vandaag begint, gebruiken we niet
             * vandaag als countdown-doel. De timer hoort altijd
             * naar de volgende Ramadan in de toekomst te tellen.
             */

            if (candidate.getTime() > now.getTime()) {
                return {
                    date: candidate,
                    hijriYear: values.year
                };
            }
        }
    }

    return null;
}

function updateRamadanCountdown() {
    const containers = document.querySelectorAll(
        '[data-ramadan-countdown]'
    );

    if (!containers.length) {
        return;
    }

    const ramadan = getNextRamadanStart();

    if (!ramadan) {
        return;
    }

    const now = new Date();

    let difference =
        ramadan.date.getTime() - now.getTime();

    if (difference < 0) {
        difference = 0;
    }

    const totalSeconds =
        Math.floor(difference / 1000);

    const days =
        Math.floor(totalSeconds / 86400);

    const hours =
        Math.floor(
            (totalSeconds % 86400) / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    const formatter =
        new Intl.DateTimeFormat(
            'en-u-ca-islamic-umalqura',
            {
                month: 'numeric'
            }
        );

    const currentHijriMonth =
        Number(formatter.format(now));

    const isBeforeRamadan =
        currentHijriMonth < 9;

    const formattedDate =
        ramadan.date.toLocaleDateString(
            'en-GB',
            {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }
        );

    containers.forEach((container) => {
        const values =
            container.querySelectorAll(
                '.ramadan-countdown-value'
            );

        if (values.length < 4) {
            return;
        }

        values[0].textContent =
            String(days).padStart(2, '0');

        values[1].textContent =
            String(hours).padStart(2, '0');

        values[2].textContent =
            String(minutes).padStart(2, '0');

        values[3].textContent =
            String(seconds).padStart(2, '0');

        const eyebrow =
            container.querySelector(
                '.ramadan-countdown-eyebrow'
            );

        if (eyebrow) {
            eyebrow.textContent =
                `RAMADAN ${ramadan.hijriYear} AH`;
        }

        const header =
            container.querySelector(
                '.ramadan-countdown-header'
            );

        if (header) {
            const paragraphs =
                header.querySelectorAll('p');

            if (paragraphs.length > 0) {
                paragraphs[paragraphs.length - 1].textContent =
                    isBeforeRamadan
                        ? `Prepare your heart and your worship. Ramadan is expected to begin on ${formattedDate}, subject to moon sighting.`
                        : `The next Ramadan is expected to begin on ${formattedDate}, subject to moon sighting.`;
            }
        }

        const note =
            container.querySelector(
                '.ramadan-countdown-note'
            );

        if (note) {
            note.textContent =
                `Expected start: ${formattedDate}`;
        }
    });
}


/* AD2_RAMADAN_FUNCTIONS_END */

async function loadDashboardAyah() {
    const textElement =
        document.querySelector(
            '[data-dashboard-ayah]'
        );

    const sourceElement =
        document.querySelector(
            '[data-dashboard-ayah-source]'
        );

    if (!textElement || !sourceElement) {
        return;
    }

    try {
        const ayah = await getDailyAyah();

        textElement.innerHTML = `
            <div class="ad2-ayah-arabic">
                ${escapeHtml(ayah.arabic)}
            </div>
            <div class="ad2-ayah-translation">
                ${escapeHtml(ayah.translation)}
            </div>
        `;

        sourceElement.textContent =
            ayah.surah && ayah.ayahNumber
                ? `${ayah.surah} · ${ayah.surahNumber}:${ayah.ayahNumber}`
                : 'Quran';

        const readButton =
            document.querySelector(
                '[data-dashboard-read-quran]'
            );

        if (readButton) {
            readButton.disabled =
                !ayah.surahNumber ||
                !ayah.ayahNumber;

            readButton.onclick = () => {
                openQuranAtAyah(
                    ayah.surahNumber,
                    ayah.ayahNumber
                );

                navigate('quran');
            };
        }
    } catch (error) {
        console.error(
            '[Dashboard] Failed to load daily Ayah:',
            error
        );

        textElement.textContent =
            'Quran content is currently unavailable.';

        sourceElement.textContent = 'Quran';
    }
}

function updateCountdown() {
    const element =
        document.getElementById('ad2-countdown');

    /*
     * The countdown is a Dashboard UI element.
     * The prayer/audio check below is intentionally
     * independent from the current page.
     */
    if (element && state.prayer.next) {
        const diff =
            state.prayer.next.time - new Date();

        if (diff <= 0) {
            element.textContent = 'Now';
        } else {
            const totalSeconds =
                Math.floor(diff / 1000);

            const hours =
                Math.floor(totalSeconds / 3600);

            const minutes =
                Math.floor(
                    (totalSeconds % 3600) / 60
                );

            const seconds =
                totalSeconds % 60;

        element.innerHTML =
            `<span class="ad2-countdown-label">` +
            `Next prayer: ${escapeHtml(state.prayer.next.name)}` +
            `</span>` +
            `<span class="ad2-countdown-value">` +
            `in ${String(hours).padStart(2, '0')}:` +
            `${String(minutes).padStart(2, '0')}:` +
            `${String(seconds).padStart(2, '0')}` +
            `</span>`;
        }
    }

    /*
     * IMPORTANT:
     *
     * PrayerService.tick() is global.
     * It does not depend on the current route.
     *
     * This means the Adhan can trigger while the user
     * is on Dashboard, Quran, Hadith, Prayer, Islamic,
     * Discover or Settings.
     *
     * PrayerService itself protects against duplicate
     * playback through its lastAdhanKey value.
     */
    if (state.prayer.next) {
        try {
            const result = prayer.tick();

            if (result?.diff === 0) {
                /*
                 * prayer.tick() refreshes the next prayer
                 * internally. Update the visible Dashboard
                 * if it is currently open.
                 */
                if (state.page === 'home') {
                    render();
                }
            }
        } catch (error) {
            console.warn(
                '[Adhan Display 2.0] Global prayer tick failed',
                error
            );
        }
    }
}

setInterval(updateCountdown, 1000);
setInterval(updateRamadanCountdown, 1000);

initialize().then(() => {
    updateRamadanCountdown();
}).catch((error) => {
    console.error(
        '[Adhan Display 2.0] Fatal initialization error',
        error
    );
});

/* AD2_SPA_ANALYTICS_START */
(function installAdhanDisplayAnalytics() {
  const ANALYTICS_GA_ID = 'G-BEKQEF4RR5';

  const routeMeta = {
    home: {
      title: 'Dashboard',
      path: '/'
    },
    quran: {
      title: 'Quran',
      path: '/quran'
    },
    hadith: {
      title: 'Hadith',
      path: '/hadith'
    },
    prayer: {
      title: 'Prayer Times',
      path: '/prayer'
    },
    islamic: {
      title: 'Islamic Tools',
      path: '/islamic'
    },
    discover: {
      title: 'Discover',
      path: '/discover'
    },
    settings: {
      title: 'Settings',
      path: '/settings'
    }
  };

  function getAnalyticsRoute() {
    const rawHash = window.location.hash || '#dashboard';
    const route = rawHash
      .replace(/^#/, '')
      .split('?')[0]
      .replace(/\/+$/, '') || 'dashboard';

    const normalizedRoute =
      route === 'dashboard'
        ? 'home'
        : route;

    return routeMeta[normalizedRoute]
      ? normalizedRoute
      : 'home';
  }

  function trackPageView() {
    if (typeof window.gtag !== 'function') {
      return;
    }

    const route = getAnalyticsRoute();
    const meta = routeMeta[route];

    const pageTitle = `${meta.title} | Adhan Display`;
    const pagePath = meta.path;
    const pageLocation = window.location.href;

    document.title = pageTitle;

    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: pageLocation,
      page_path: pagePath,
      send_to: ANALYTICS_GA_ID
    });
  }

  window.addEventListener('hashchange', trackPageView);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView, {
      once: true
    });
  } else {
    setTimeout(trackPageView, 0);
  }
})();
/* AD2_SPA_ANALYTICS_END */


