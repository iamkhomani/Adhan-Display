/*
 * Islamic: remembrance tools, Ramadan, the Hijri calendar, holy sites and
 * places nearby. Replaces the separate "Islamic" and "Discover" pages.
 */

import { esc, pickOfDay } from '../core/util.js';
import { icon } from '../core/icons.js';
import { store, getSettings } from '../core/storage.js';
import { spinner, emptyState, confirmDialog, toast } from '../core/ui.js';
import {
    formatGregorian, hijriMonthName, hijriMonthArabic, addDaysToKey,
    zonedDate, keyToParts, daysBetweenKeys
} from '../core/time.js';
import { prayerState, hijriFor } from '../services/prayer.js';
import { location } from '../services/location.js';
import { namesOfAllah } from '../services/api.js';
import {
    ADHKAR, DAILY_DUAS, TASBIH_PHRASES, HOLY_SITES, LEARN_SALAH
} from '../data/content.js';
import { pageHeader, hijriText, timeHTML, upcomingEvents } from './components.js';

const TOOLS = [
    ['adhkar', 'Morning & evening adhkar', 'Daily remembrance with counters', 'sun'],
    ['tasbih', 'Tasbih counter', 'Count your dhikr', 'sparkle'],
    ['names', '99 Names of Allah', 'Asma ul-Husna with meanings', 'star'],
    ['ramadan', 'Ramadan', 'Countdown, suhoor and iftar', 'crescent'],
    ['calendar', 'Islamic calendar', 'Hijri date and key occasions', 'calendar'],
    ['qibla', 'Qibla compass', 'Direction of the Ka\u2018bah', 'compass']
];

function todayKey() {
    return prayerState.todayKey || new Date().toISOString().slice(0, 10);
}

function backLink() {
    return `<a class="back-link" href="#islamic">${icon('left', { size: 18 })} Islamic</a>`;
}

/* ---------------------------------------------------------------
 * Hub
 * ------------------------------------------------------------- */

function hubView() {
    const [arabic, transliteration, meaning, reference] = pickOfDay(DAILY_DUAS, 3) || [];
    const key = todayKey();
    const events = upcomingEvents(key, getSettings().hijriOffset).slice(0, 3);
    const loc = location.get();
    const coords = `${loc.lat.toFixed(4)},${loc.lon.toFixed(4)}`;
    const hijri = hijriFor(key);

    return `
        <div class="page islamic-page">
            ${pageHeader('Islamic', hijri ? `Today is ${hijriText(hijri)}.` : 'Remembrance, the calendar and places of worship.')}

            <nav class="tool-grid" aria-label="Tools">
                ${TOOLS.map(([id, title, text, iconName]) => `
                    <a class="tool-card" href="${id === 'qibla' ? '#prayer/qibla' : `#islamic/${id}`}">
                        <span class="tool-icon">${icon(iconName, { size: 22 })}</span>
                        <span><strong>${esc(title)}</strong><small>${esc(text)}</small></span>
                    </a>
                `).join('')}
            </nav>

            <div class="two-col">
                <article class="panel dua-panel" aria-labelledby="dua-title">
                    <h2 id="dua-title" class="panel-title">Du‘a of the day</h2>
                    <p class="dua-arabic" lang="ar" dir="rtl">${esc(arabic)}</p>
                    <p class="dua-transliteration">${esc(transliteration)}</p>
                    <p class="dua-meaning">${esc(meaning)}</p>
                    <p class="source">${esc(reference)}</p>
                </article>

                <section class="panel" aria-labelledby="events-title">
                    <header class="panel-head">
                        <h2 id="events-title" class="panel-title">Coming up</h2>
                        <a class="link-button" href="#islamic/calendar">Calendar</a>
                    </header>
                    <ul class="event-list">
                        ${events.map(event => `
                            <li class="event">
                                <span class="event-when tnum">${event.days === 0 ? 'Today' : event.days === 1 ? 'Tomorrow' : `${event.days} days`}</span>
                                <span><strong>${esc(event.name)}</strong><small>${esc(formatGregorian(event.date, { weekday: 'short', day: 'numeric', month: 'long' }))}</small></span>
                            </li>
                        `).join('')}
                    </ul>
                    <p class="panel-note">Expected dates; the start of a month depends on the moon sighting.</p>
                </section>
            </div>

            <section class="section" id="discover" aria-labelledby="sites-title">
                <h2 id="sites-title" class="section-title">The holy mosques, live</h2>
                <div class="link-grid">
                    ${HOLY_SITES.map(([name, city, text, url]) => `
                        <a class="link-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
                            <span class="link-card-icon">${icon('video', { size: 20 })}</span>
                            <span><strong>${esc(name)}</strong><small>${esc(city)}, live on YouTube</small></span>
                            ${icon('external', { size: 16, className: 'link-card-arrow' })}
                        </a>
                    `).join('')}
                </div>
            </section>

            <section class="section" aria-labelledby="nearby-title">
                <h2 id="nearby-title" class="section-title">Near ${esc(loc.city)}</h2>
                <div class="link-grid">
                    <a class="link-card" href="https://www.google.com/maps/search/mosque/@${coords},14z" target="_blank" rel="noopener noreferrer">
                        <span class="link-card-icon">${icon('mosque', { size: 20 })}</span>
                        <span><strong>Mosques</strong><small>Open Google Maps around your location</small></span>
                        ${icon('external', { size: 16, className: 'link-card-arrow' })}
                    </a>
                    <a class="link-card" href="https://www.google.com/maps/search/halal+food/@${coords},14z" target="_blank" rel="noopener noreferrer">
                        <span class="link-card-icon">${icon('food', { size: 20 })}</span>
                        <span><strong>Halal food</strong><small>Restaurants and shops nearby</small></span>
                        ${icon('external', { size: 16, className: 'link-card-arrow' })}
                    </a>
                </div>
            </section>

            <section class="section" aria-labelledby="learn-title">
                <h2 id="learn-title" class="section-title">Learn how to pray</h2>
                <div class="link-grid">
                    ${LEARN_SALAH.map(([name, text, url]) => `
                        <a class="link-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
                            <span class="link-card-icon">${icon('hand', { size: 20 })}</span>
                            <span><strong>${esc(name)}</strong><small>${esc(text)}</small></span>
                            ${icon('external', { size: 16, className: 'link-card-arrow' })}
                        </a>
                    `).join('')}
                </div>
            </section>
        </div>
    `;
}

/* ---------------------------------------------------------------
 * Adhkar
 * ------------------------------------------------------------- */

function adhkarProgress() {
    const saved = store.get('adhkar_progress', null);
    return saved?.date === todayKey() && saved.counts ? saved.counts : {};
}

function saveAdhkarProgress(counts) {
    store.set('adhkar_progress', { date: todayKey(), counts });
}

function adhkarView() {
    const counts = adhkarProgress();
    const asr = prayerState.today?.entries.find(entry => entry.name === 'Asr');
    const period = asr?.passed || (!asr && new Date().getHours() >= 15) ? 'evening' : 'morning';

    return `
        <div class="page tool-page">
            ${backLink()}
            ${pageHeader('Morning & evening adhkar',
                `Recite these after Fajr and after Asr. Tap a counter as you go; progress resets each day. It is ${period} now.`,
                `<button type="button" class="button button-ghost" data-adhkar-reset>${icon('refresh', { size: 18 })} Reset</button>`)}
            <ol class="adhkar">
                ${ADHKAR.map((item, index) => {
                    const count = Math.min(item.count, counts[index] || 0);
                    const done = count >= item.count;
                    return `
                        <li class="panel dhikr ${done ? 'is-done' : ''}" data-dhikr="${index}">
                            <header class="dhikr-head">
                                <h2 class="dhikr-title">${esc(item.title)}</h2>
                                <span class="dhikr-times">${item.count === 1 ? 'Once' : `${item.count} times`}</span>
                            </header>
                            ${item.arabic ? `<p class="dhikr-arabic" lang="ar" dir="rtl">${esc(item.arabic)}</p>` : ''}
                            ${item.transliteration ? `<p class="dhikr-transliteration">${esc(item.transliteration)}</p>` : ''}
                            <p class="dhikr-meaning">${esc(item.meaning)}</p>
                            <footer class="dhikr-foot">
                                <span class="source">${esc(item.reference)}</span>
                                ${item.quran ? `<a class="button button-ghost" href="#quran/${item.quran}">${icon('book', { size: 18 })} Open in the Quran</a>` : ''}
                                <button type="button" class="counter ${done ? 'is-done' : ''}" data-count="${index}" aria-label="Count ${esc(item.title)}: ${count} of ${item.count}">
                                    ${done ? icon('check', { size: 18 }) : ''}<span class="tnum">${count} / ${item.count}</span>
                                </button>
                            </footer>
                        </li>
                    `;
                }).join('')}
            </ol>
        </div>
    `;
}

/* ---------------------------------------------------------------
 * Tasbih
 * ------------------------------------------------------------- */

function tasbihState() {
    const saved = store.get('tasbih', {}) || {};
    return {
        count: Math.max(0, Number(saved.count) || 0),
        total: Math.max(0, Number(saved.total) || 0),
        phrase: Number.isInteger(saved.phrase) && TASBIH_PHRASES[saved.phrase] ? saved.phrase : 0,
        target: [33, 99, 100, 0].includes(Number(saved.target)) ? Number(saved.target) : 33
    };
}

function tasbihView() {
    const tasbih = tasbihState();
    const phrase = TASBIH_PHRASES[tasbih.phrase];
    const circumference = 2 * Math.PI * 46;
    const progress = tasbih.target ? (tasbih.count % tasbih.target || (tasbih.count ? tasbih.target : 0)) / tasbih.target : 0;
    const rounds = tasbih.target ? Math.floor(tasbih.count / tasbih.target) : 0;

    return `
        <div class="page tool-page tasbih-page">
            ${backLink()}
            ${pageHeader('Tasbih counter', 'Tap the circle for each dhikr. Your count is saved on this device.')}

            <div class="chips-scroll" role="group" aria-label="Dhikr">
                ${TASBIH_PHRASES.map((item, index) => `
                    <button type="button" class="chip ${index === tasbih.phrase ? 'is-on' : ''}" data-phrase="${index}" aria-pressed="${index === tasbih.phrase}">${esc(item.label)}</button>
                `).join('')}
            </div>

            <div class="tasbih">
                <p class="tasbih-phrase" lang="ar" dir="rtl">${esc(phrase.arabic)}</p>
                <button type="button" class="tasbih-button" data-tasbih="add" aria-label="Count. Current count ${tasbih.count}">
                    <svg class="tasbih-ring" viewBox="0 0 100 100" aria-hidden="true">
                        <circle cx="50" cy="50" r="46" class="ring-track"/>
                        <circle cx="50" cy="50" r="46" class="ring-fill" data-ring
                            style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference * (1 - progress)}"/>
                    </svg>
                    <span class="tasbih-count tnum" data-tasbih-count>${tasbih.count}</span>
                    <span class="tasbih-sub" data-tasbih-sub>${tasbih.target ? `of ${tasbih.target}${rounds ? `, round ${rounds + (tasbih.count % tasbih.target ? 1 : 0)}` : ''}` : 'Free count'}</span>
                </button>

                <div class="segmented" role="group" aria-label="Target">
                    ${[[33, '33'], [99, '99'], [100, '100'], [0, 'No limit']].map(([value, label]) => `
                        <button type="button" class="segment ${tasbih.target === value ? 'is-active' : ''}" data-target="${value}" aria-pressed="${tasbih.target === value}">${label}</button>
                    `).join('')}
                </div>

                <div class="button-row">
                    <button type="button" class="button button-ghost" data-tasbih="minus">${icon('minus', { size: 18 })} Undo</button>
                    <button type="button" class="button button-ghost" data-tasbih="reset">${icon('refresh', { size: 18 })} Reset</button>
                </div>
                <p class="panel-note tnum" data-tasbih-total>Total counted on this device: ${tasbih.total.toLocaleString('en')}</p>
            </div>
        </div>
    `;
}

function updateTasbih(root, change) {
    const tasbih = tasbihState();

    if (change === 'add') {
        tasbih.count += 1;
        tasbih.total += 1;
    } else if (change === 'minus') {
        if (tasbih.count > 0) {
            tasbih.count -= 1;
            tasbih.total = Math.max(0, tasbih.total - 1);
        }
    } else if (change === 'reset') {
        tasbih.count = 0;
    }

    store.set('tasbih', tasbih);

    const reached = change === 'add' && tasbih.target && tasbih.count % tasbih.target === 0;
    const milestone = change === 'add' && !tasbih.target && tasbih.count % 33 === 0;

    if (reached || milestone) {
        navigator.vibrate?.([60, 40, 60]);
    } else if (change === 'add') {
        navigator.vibrate?.(12);
    }

    const circumference = 2 * Math.PI * 46;
    const within = tasbih.target ? tasbih.count % tasbih.target : 0;
    const progress = tasbih.target ? (within || (tasbih.count ? tasbih.target : 0)) / tasbih.target : 0;
    const rounds = tasbih.target ? Math.floor(tasbih.count / tasbih.target) : 0;

    root.querySelector('[data-tasbih-count]').textContent = tasbih.count;
    root.querySelector('[data-ring]').style.strokeDashoffset = String(circumference * (1 - progress));
    root.querySelector('[data-tasbih-sub]').textContent = tasbih.target
        ? `of ${tasbih.target}${rounds ? `, round ${rounds + (within ? 1 : 0)}` : ''}`
        : 'Free count';
    root.querySelector('[data-tasbih-total]').textContent = `Total counted on this device: ${tasbih.total.toLocaleString('en')}`;
    root.querySelector('[data-tasbih="add"]').setAttribute('aria-label', `Count. Current count ${tasbih.count}`);
    root.querySelector('.tasbih').classList.toggle('is-complete', Boolean(reached));

    if (reached) {
        setTimeout(() => root.querySelector('.tasbih')?.classList.remove('is-complete'), 900);
    }
}

/* ---------------------------------------------------------------
 * 99 Names
 * ------------------------------------------------------------- */

function namesView() {
    return `
        <div class="page tool-page">
            ${backLink()}
            ${pageHeader('99 Names of Allah', 'Asma ul-Husna, the most beautiful names.')}
            <div class="filter-field">
                ${icon('search', { size: 16 })}
                <input type="search" placeholder="Search a name or meaning" data-names-filter aria-label="Search names">
            </div>
            <div data-names>${spinner('Loading the names')}</div>
        </div>
    `;
}

async function loadNames(root) {
    const box = root.querySelector('[data-names]');

    try {
        const names = await namesOfAllah();

        if (!box.isConnected) {
            return;
        }

        box.innerHTML = `
            <ol class="names-grid">
                ${names.map(item => `
                    <li class="name-card" data-search="${esc(`${item.tr} ${item.en} ${item.n}`.toLowerCase())}">
                        <span class="name-number tnum">${item.n}</span>
                        <span class="name-arabic" lang="ar" dir="rtl">${esc(item.ar)}</span>
                        <strong class="name-tr">${esc(item.tr)}</strong>
                        <span class="name-en">${esc(item.en)}</span>
                    </li>
                `).join('')}
            </ol>
            <p class="panel-note" data-names-empty hidden>No name matches your search.</p>
        `;

        root.querySelector('[data-names-filter]').addEventListener('input', event => {
            const query = event.target.value.trim().toLowerCase();
            let visible = 0;
            box.querySelectorAll('.name-card').forEach(card => {
                const match = !query || card.dataset.search.includes(query);
                card.hidden = !match;
                visible += match ? 1 : 0;
            });
            box.querySelector('[data-names-empty]').hidden = visible > 0;
        });
    } catch (error) {
        box.innerHTML = emptyState({ title: 'The names could not be loaded', text: error.message });
    }
}

/* ---------------------------------------------------------------
 * Ramadan
 * ------------------------------------------------------------- */

function ramadanView() {
    const key = todayKey();
    const hijri = hijriFor(key);
    const entries = prayerState.today?.entries || [];
    const time = name => entries.find(entry => entry.name === name);
    const fajr = time('Fajr');
    const maghrib = time('Maghrib');
    const isRamadan = hijri?.month === 9;
    const offset = getSettings().hijriOffset;
    const start = upcomingEvents(key, offset).find(event => event.month === 9 && event.day === 1);
    const eid = upcomingEvents(key, offset).find(event => event.month === 10 && event.day === 1);

    let body;

    if (isRamadan) {
        const now = new Date();
        const progress = fajr?.date && maghrib?.date
            ? Math.min(100, Math.max(0, ((now - fajr.date) / (maghrib.date - fajr.date)) * 100))
            : 0;

        body = `
            <section class="panel ramadan-now">
                <p class="ramadan-day">Day <span class="tnum">${hijri.day}</span> of Ramadan</p>
                <div class="fast-bar" role="img" aria-label="Today's fast is ${Math.round(progress)}% complete">
                    <span style="width:${progress}%" data-fast-bar></span>
                </div>
                <div class="fast-times">
                    <div><span>Suhoor ends</span><strong>${fajr ? timeHTML(fajr.hm) : '--:--'}</strong></div>
                    <div><span>Iftar</span><strong>${maghrib ? timeHTML(maghrib.hm) : '--:--'}</strong></div>
                </div>
                ${hijri.day >= 20 ? '<p class="panel-note">The last ten nights have begun. Seek Laylat al-Qadr in the odd nights.</p>' : ''}
                ${eid ? `<p class="panel-note">Eid al-Fitr is expected on ${esc(formatGregorian(eid.date))}.</p>` : ''}
            </section>
        `;
    } else if (start) {
        const { y, m, d } = keyToParts(start.date);
        const target = zonedDate(y, m, d, 0, 0, prayerState.tz);
        body = `
            <section class="panel ramadan-count" data-ramadan-target="${target.getTime()}">
                <p class="ramadan-lead">Ramadan ${hijriFor(start.date)?.year || ''} is expected to begin on</p>
                <p class="ramadan-date">${esc(formatGregorian(start.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</p>
                <div class="countdown" aria-live="off">
                    ${['Days', 'Hours', 'Minutes', 'Seconds'].map(label => `<div><span class="tnum" data-unit="${label}">--</span><small>${label}</small></div>`).join('')}
                </div>
                <p class="panel-note">Subject to the sighting of the moon. The first tarawih prayer is on the night before.</p>
            </section>
        `;
    } else {
        body = emptyState({ title: 'The Ramadan date could not be calculated in this browser' });
    }

    return `
        <div class="page tool-page">
            ${backLink()}
            ${pageHeader('Ramadan', isRamadan ? 'May Allah accept your fasting and prayers.' : 'Prepare your heart and your worship.')}
            ${body}
            ${!isRamadan && fajr && maghrib ? `
                <section class="panel">
                    <h2 class="panel-title">If you fast today</h2>
                    <div class="fast-times">
                        <div><span>Suhoor ends at Fajr</span><strong>${timeHTML(fajr.hm)}</strong></div>
                        <div><span>Iftar at Maghrib</span><strong>${timeHTML(maghrib.hm)}</strong></div>
                    </div>
                </section>` : ''}
        </div>
    `;
}

function updateRamadan(root, now) {
    const box = root.querySelector('[data-ramadan-target]');

    if (!box) {
        return;
    }

    const remaining = Math.max(0, Number(box.dataset.ramadanTarget) - now.getTime());
    const values = {
        Days: Math.floor(remaining / 86400000),
        Hours: Math.floor(remaining / 3600000) % 24,
        Minutes: Math.floor(remaining / 60000) % 60,
        Seconds: Math.floor(remaining / 1000) % 60
    };

    Object.entries(values).forEach(([unit, value]) => {
        const element = box.querySelector(`[data-unit="${unit}"]`);
        if (element) {
            element.textContent = unit === 'Days' ? String(value) : String(value).padStart(2, '0');
        }
    });
}

/* ---------------------------------------------------------------
 * Calendar
 * ------------------------------------------------------------- */

function calendarView() {
    const key = todayKey();
    const hijri = hijriFor(key);
    const offset = getSettings().hijriOffset;
    const events = upcomingEvents(key, offset);

    /* White days (13-15) of the current or next Hijri month. */
    let whiteStart = null;
    for (let i = 0; i < 31 && !whiteStart; i += 1) {
        const date = addDaysToKey(key, i);
        const h = hijriFor(date);
        if (h?.day === 13 || (i === 0 && h?.day >= 13 && h?.day <= 15)) {
            whiteStart = addDaysToKey(date, h.day === 13 ? 0 : -(h.day - 13));
        }
    }

    return `
        <div class="page tool-page">
            ${backLink()}
            ${pageHeader('Islamic calendar', 'Dates follow the Umm al-Qura calendar.')}

            <section class="panel hijri-today">
                ${hijri ? `
                    <p class="hijri-day tnum">${hijri.day}</p>
                    <div>
                        <p class="hijri-month">${esc(hijriMonthName(hijri.month))} <span class="num">${hijri.year}</span></p>
                        <p class="hijri-month-ar" lang="ar" dir="rtl">${esc(hijriMonthArabic(hijri.month))}</p>
                        <p class="muted">${esc(formatGregorian(key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</p>
                    </div>
                ` : '<p>The Hijri date is not available in this browser.</p>'}
            </section>

            <section class="panel" aria-labelledby="occasions-title">
                <h2 id="occasions-title" class="panel-title">Occasions in the coming year</h2>
                <ul class="event-list">
                    ${events.map(event => `
                        <li class="event ${event.days === 0 ? 'is-today' : ''}">
                            <span class="event-when tnum">${event.days === 0 ? 'Today' : event.days === 1 ? 'Tomorrow' : `${event.days} days`}</span>
                            <span>
                                <strong>${esc(event.name)}</strong>
                                <small>${esc(formatGregorian(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}, ${event.day} ${esc(hijriMonthName(event.month))}</small>
                                <small>${esc(event.note)}</small>
                            </span>
                        </li>
                    `).join('')}
                </ul>
            </section>

            ${whiteStart ? `
                <section class="panel">
                    <h2 class="panel-title">White days</h2>
                    <p>Fasting on the 13th, 14th and 15th of each Hijri month is a Sunnah. ${daysBetweenKeys(key, whiteStart) <= 0 ? 'They are this week' : 'Next'}: ${esc(formatGregorian(whiteStart, { weekday: 'long', day: 'numeric', month: 'long' }))} to ${esc(formatGregorian(addDaysToKey(whiteStart, 2), { weekday: 'long', day: 'numeric', month: 'long' }))}.</p>
                </section>` : ''}

            <p class="fine-print">Local moon sighting can differ by a day. You can shift the Hijri date in <a href="#settings/prayer">Settings</a>.</p>
        </div>
    `;
}

/* ---------------------------------------------------------------
 * Page
 * ------------------------------------------------------------- */

function viewFor(tool) {
    switch (tool) {
        case 'adhkar': return adhkarView();
        case 'tasbih': return tasbihView();
        case 'names': return namesView();
        case 'ramadan': return ramadanView();
        case 'calendar': return calendarView();
        default: return hubView();
    }
}

export const islamicPage = {
    title: 'Islamic',

    render(path) {
        return viewFor(path[0]);
    },

    mount(root, path, ctx) {
        const tool = path[0];

        if (tool === 'discover') {
            requestAnimationFrame(() => root.querySelector('#discover')?.scrollIntoView());
        }

        if (tool === 'names') {
            loadNames(root);
        }

        if (tool === 'ramadan') {
            updateRamadan(root, new Date());
            ctx.on('tick', ({ now }) => updateRamadan(root, now));
        }

        if (['ramadan', 'calendar', undefined, 'discover'].includes(tool)) {
            ctx.on('prayer', ({ reason }) => {
                if (reason !== 'next') {
                    root.innerHTML = viewFor(tool);
                }
            });
        }

        if (tool === 'tasbih') {
            const onKey = event => {
                if ((event.key === ' ' || event.key === 'Enter') && !event.target.closest('button, input, select, textarea, a')) {
                    event.preventDefault();
                    updateTasbih(root, 'add');
                }
            };
            document.addEventListener('keydown', onKey);
            ctx.cleanup(() => document.removeEventListener('keydown', onKey));
        }

        root.addEventListener('click', async event => {
            const target = event.target;
            const counter = target.closest('[data-count]');
            const tasbihAction = target.closest('[data-tasbih]');
            const phrase = target.closest('[data-phrase]');
            const goal = target.closest('[data-target]');

            if (counter) {
                const index = Number(counter.dataset.count);
                const item = ADHKAR[index];
                const counts = adhkarProgress();
                const next = Math.min(item.count, (counts[index] || 0) + 1);
                counts[index] = next;
                saveAdhkarProgress(counts);
                const done = next >= item.count;
                counter.classList.toggle('is-done', done);
                counter.closest('.dhikr').classList.toggle('is-done', done);
                counter.innerHTML = `${done ? icon('check', { size: 18 }) : ''}<span class="tnum">${next} / ${item.count}</span>`;
                counter.setAttribute('aria-label', `Count ${item.title}: ${next} of ${item.count}`);
                navigator.vibrate?.(done ? [50, 30, 50] : 10);
            } else if (target.closest('[data-adhkar-reset]')) {
                if (await confirmDialog('Reset all counters for today?', { confirm: 'Reset' })) {
                    saveAdhkarProgress({});
                    root.innerHTML = adhkarView();
                }
            } else if (tasbihAction) {
                const action = tasbihAction.dataset.tasbih;
                if (action === 'reset') {
                    if (tasbihState().count && !(await confirmDialog('Set the counter back to zero?', { confirm: 'Reset' }))) {
                        return;
                    }
                }
                updateTasbih(root, action);
            } else if (phrase) {
                store.set('tasbih', { ...tasbihState(), phrase: Number(phrase.dataset.phrase), count: 0 });
                root.innerHTML = tasbihView();
            } else if (goal) {
                store.set('tasbih', { ...tasbihState(), target: Number(goal.dataset.target), count: 0 });
                root.innerHTML = tasbihView();
                toast('Counter reset for the new target', { duration: 2000 });
            }
        });

    }
};
