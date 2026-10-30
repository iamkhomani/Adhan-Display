/*
 * Islamic: remembrance tools, Ramadan, the Hijri calendar, holy sites and
 * places nearby. Replaces the separate "Islamic" and "Discover" pages.
 */

import { esc, pickOfDay } from '../core/util.js';
import { icon } from '../core/icons.js';
import { store, getSettings } from '../core/storage.js';
import { spinner, emptyState, confirmDialog, toast, shareText } from '../core/ui.js';
import {
    formatGregorian, hijriMonthName, hijriMonthArabic, addDaysToKey,
    zonedDate, keyToParts, daysBetweenKeys
} from '../core/time.js';
import { prayerState, hijriFor } from '../services/prayer.js';
import { location } from '../services/location.js';
import { namesOfAllah } from '../services/api.js';
import {
    ADHKAR, DAILY_DUAS, TASBIH_PHRASES, HOLY_SITES, LEARN_SALAH, DUA_CATEGORIES
} from '../data/content.js';
import { pageHeader, hijriText, timeHTML, upcomingEvents } from './components.js';
import { t, locale } from '../core/i18n.js';

/* [id, icon]; titles and descriptions are translation keys tool.<id> and tool.<id>.text */
const TOOLS = [
    ['adhkar', 'sun'],
    ['duas', 'hand'],
    ['tasbih', 'sparkle'],
    ['names', 'star'],
    ['ramadan', 'crescent'],
    ['calendar', 'calendar']
];

function whenLabel(days) {
    if (days === 0) {
        return t('common.today');
    }
    if (days === 1) {
        return t('common.tomorrow');
    }
    return t('common.days', { count: days });
}

function tasbihSub(tasbih) {
    if (!tasbih.target) {
        return t('tasbih.free');
    }
    const within = tasbih.count % tasbih.target;
    const rounds = Math.floor(tasbih.count / tasbih.target);
    return rounds
        ? t('tasbih.ofRound', { target: tasbih.target, round: rounds + (within ? 1 : 0) })
        : t('tasbih.of', { target: tasbih.target });
}

function todayKey() {
    return prayerState.todayKey || new Date().toISOString().slice(0, 10);
}

function backLink() {
    return `<a class="back-link" href="#islamic">${icon('left', { size: 18 })} ${esc(t('nav.islamic'))}</a>`;
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
            ${pageHeader(t('nav.islamic'), hijri ? t('islamic.today', { date: hijriText(hijri) }) : t('islamic.lead'))}

            <nav class="tool-grid" aria-label="${esc(t('islamic.tools'))}">
                ${TOOLS.map(([id, iconName]) => `
                    <a class="tool-card" href="#islamic/${id}">
                        <span class="tool-icon">${icon(iconName, { size: 22 })}</span>
                        <span><strong>${esc(t(`tool.${id}`))}</strong><small>${esc(t(`tool.${id}.text`))}</small></span>
                    </a>
                `).join('')}
            </nav>

            <div class="two-col">
                <article class="panel dua-panel" aria-labelledby="dua-title">
                    <h2 id="dua-title" class="panel-title">${esc(t('islamic.duaOfDay'))}</h2>
                    <p class="dua-arabic" lang="ar" dir="rtl">${esc(arabic)}</p>
                    <p class="dua-transliteration">${esc(transliteration)}</p>
                    <p class="dua-meaning" lang="en">${esc(meaning)}</p>
                    <p class="source">${esc(reference)}</p>
                </article>

                <section class="panel" aria-labelledby="events-title">
                    <header class="panel-head">
                        <h2 id="events-title" class="panel-title">${esc(t('islamic.comingUp'))}</h2>
                        <a class="link-button" href="#islamic/calendar">${esc(t('islamic.calendarLink'))}</a>
                    </header>
                    <ul class="event-list">
                        ${events.map(event => `
                            <li class="event">
                                <span class="event-when tnum">${esc(whenLabel(event.days))}</span>
                                <span><strong>${esc(event.name)}</strong><small>${esc(formatGregorian(event.date, { weekday: 'short', day: 'numeric', month: 'long' }))}</small></span>
                            </li>
                        `).join('')}
                    </ul>
                    <p class="panel-note">${esc(t('islamic.expectedNote'))}</p>
                </section>
            </div>

            <section class="section" id="discover" aria-labelledby="sites-title">
                <h2 id="sites-title" class="section-title">${esc(t('islamic.holyMosques'))}</h2>
                <div class="link-grid">
                    ${HOLY_SITES.map(([id, url]) => `
                        <a class="link-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
                            <span class="link-card-icon">${icon('video', { size: 20 })}</span>
                            <span><strong>${esc(t(`site.${id}`))}</strong><small>${esc(t('islamic.liveOn', { city: t(`site.${id}.city`) }))}</small></span>
                            ${icon('external', { size: 16, className: 'link-card-arrow' })}
                        </a>
                    `).join('')}
                </div>
            </section>

            <section class="section" aria-labelledby="nearby-title">
                <h2 id="nearby-title" class="section-title">${esc(t('islamic.near', { place: loc.city }))}</h2>
                <div class="link-grid">
                    <a class="link-card" href="https://www.google.com/maps/search/mosque/@${coords},14z" target="_blank" rel="noopener noreferrer">
                        <span class="link-card-icon">${icon('mosque', { size: 20 })}</span>
                        <span><strong>${esc(t('islamic.mosques'))}</strong><small>${esc(t('islamic.mosquesText'))}</small></span>
                        ${icon('external', { size: 16, className: 'link-card-arrow' })}
                    </a>
                    <a class="link-card" href="https://www.google.com/maps/search/halal+food/@${coords},14z" target="_blank" rel="noopener noreferrer">
                        <span class="link-card-icon">${icon('food', { size: 20 })}</span>
                        <span><strong>${esc(t('islamic.halal'))}</strong><small>${esc(t('islamic.halalText'))}</small></span>
                        ${icon('external', { size: 16, className: 'link-card-arrow' })}
                    </a>
                </div>
            </section>

            <section class="section" aria-labelledby="learn-title">
                <h2 id="learn-title" class="section-title">${esc(t('islamic.learn'))}</h2>
                <div class="link-grid">
                    ${LEARN_SALAH.map(([id, url]) => `
                        <a class="link-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
                            <span class="link-card-icon">${icon('hand', { size: 20 })}</span>
                            <span><strong>${esc(t(`learn.${id}`))}</strong><small>${esc(t(`learn.${id}.text`))}</small></span>
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
    const evening = asr?.passed || (!asr && new Date().getHours() >= 15);

    return `
        <div class="page tool-page">
            ${backLink()}
            ${pageHeader(t('tool.adhkar'),
                `${t('adhkar.lead')} ${t(evening ? 'adhkar.evening' : 'adhkar.morning')}`,
                `<button type="button" class="button button-ghost" data-adhkar-reset>${icon('refresh', { size: 18 })} ${esc(t('common.reset'))}</button>`)}
            <ol class="adhkar">
                ${ADHKAR.map((item, index) => {
                    const count = Math.min(item.count, counts[index] || 0);
                    const done = count >= item.count;
                    return `
                        <li class="panel dhikr ${done ? 'is-done' : ''}" data-dhikr="${index}">
                            <header class="dhikr-head">
                                <h2 class="dhikr-title">${esc(t(item.title))}</h2>
                                <span class="dhikr-times">${esc(t('adhkar.times', { count: item.count }))}</span>
                            </header>
                            ${item.arabic ? `<p class="dhikr-arabic" lang="ar" dir="rtl">${esc(item.arabic)}</p>` : ''}
                            ${item.transliteration ? `<p class="dhikr-transliteration">${esc(item.transliteration)}</p>` : ''}
                            ${item.note ? `<p class="dhikr-meaning">${esc(t(item.note))}</p>` : `<p class="dhikr-meaning" lang="en">${esc(item.meaning)}</p>`}
                            <footer class="dhikr-foot">
                                <span class="source">${esc(item.reference)}</span>
                                ${item.quran ? `<a class="button button-ghost" href="#quran/${item.quran}">${icon('book', { size: 18 })} ${esc(t('adhkar.openQuran'))}</a>` : ''}
                                <button type="button" class="counter ${done ? 'is-done' : ''}" data-count="${index}" aria-label="${esc(t('adhkar.countLabel', { title: t(item.title), count, total: item.count }))}">
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
 * Du'a collection
 * ------------------------------------------------------------- */

function duasView() {
    return `
        <div class="page tool-page">
            ${backLink()}
            ${pageHeader(t('tool.duas'), t('duas.lead'))}
            <div class="chips-scroll" role="group" aria-label="${esc(t('duas.categories'))}">
                <button type="button" class="chip is-on" data-dua-cat="" aria-pressed="true">${esc(t('duas.all'))}</button>
                ${DUA_CATEGORIES.map(category => `
                    <button type="button" class="chip" data-dua-cat="${category.id}" aria-pressed="false">${esc(t(`duas.cat.${category.id}`))}</button>
                `).join('')}
            </div>
            ${DUA_CATEGORIES.map(category => `
                <section class="dua-section" data-dua-section="${category.id}" aria-labelledby="duas-${category.id}">
                    <h2 class="section-title" id="duas-${category.id}">${icon(category.icon, { size: 18 })} ${esc(t(`duas.cat.${category.id}`))}</h2>
                    <div class="adhkar">
                        ${category.duas.map(dua => `
                            <article class="panel dhikr" id="dua-${dua.id}">
                                <header class="dhikr-head">
                                    <h3 class="dhikr-title">${esc(t(`dua.${dua.id}`))}</h3>
                                </header>
                                <p class="dhikr-arabic" lang="ar" dir="rtl">${esc(dua.arabic)}</p>
                                <p class="dhikr-transliteration">${esc(dua.transliteration)}</p>
                                <p class="dhikr-meaning" lang="en">${esc(dua.meaning)}</p>
                                <footer class="dhikr-foot">
                                    <span class="source">${esc(dua.reference)}</span>
                                    <button type="button" class="icon-button" data-dua-share="${dua.id}" aria-label="${esc(t('duas.share'))}">${icon('share', { size: 18 })}</button>
                                </footer>
                            </article>
                        `).join('')}
                    </div>
                </section>
            `).join('')}
        </div>
    `;
}

function findDua(id) {
    for (const category of DUA_CATEGORIES) {
        const dua = category.duas.find(item => item.id === id);
        if (dua) {
            return dua;
        }
    }
    return null;
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

    return `
        <div class="page tool-page tasbih-page">
            ${backLink()}
            ${pageHeader(t('tool.tasbih'), t('tasbih.lead'))}

            <div class="chips-scroll" role="group" aria-label="${esc(t('tasbih.dhikr'))}">
                ${TASBIH_PHRASES.map((item, index) => `
                    <button type="button" class="chip ${index === tasbih.phrase ? 'is-on' : ''}" data-phrase="${index}" aria-pressed="${index === tasbih.phrase}">${esc(item.label)}</button>
                `).join('')}
            </div>

            <div class="tasbih">
                <p class="tasbih-phrase" lang="ar" dir="rtl">${esc(phrase.arabic)}</p>
                <button type="button" class="tasbih-button" data-tasbih="add" aria-label="${esc(t('tasbih.countLabel', { count: tasbih.count }))}">
                    <svg class="tasbih-ring" viewBox="0 0 100 100" aria-hidden="true">
                        <circle cx="50" cy="50" r="46" class="ring-track"/>
                        <circle cx="50" cy="50" r="46" class="ring-fill" data-ring
                            style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference * (1 - progress)}"/>
                    </svg>
                    <span class="tasbih-count tnum" data-tasbih-count>${tasbih.count}</span>
                    <span class="tasbih-sub" data-tasbih-sub>${esc(tasbihSub(tasbih))}</span>
                </button>

                <div class="segmented" role="group" aria-label="${esc(t('tasbih.target'))}">
                    ${[[33, '33'], [99, '99'], [100, '100'], [0, t('tasbih.noLimit')]].map(([value, label]) => `
                        <button type="button" class="segment ${tasbih.target === value ? 'is-active' : ''}" data-target="${value}" aria-pressed="${tasbih.target === value}">${label}</button>
                    `).join('')}
                </div>

                <div class="button-row">
                    <button type="button" class="button button-ghost" data-tasbih="minus">${icon('minus', { size: 18 })} ${esc(t('tasbih.undo'))}</button>
                    <button type="button" class="button button-ghost" data-tasbih="reset">${icon('refresh', { size: 18 })} ${esc(t('common.reset'))}</button>
                </div>
                <p class="panel-note tnum" data-tasbih-total>${esc(t('tasbih.total', { count: tasbih.total.toLocaleString(locale()) }))}</p>
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

    root.querySelector('[data-tasbih-count]').textContent = tasbih.count;
    root.querySelector('[data-ring]').style.strokeDashoffset = String(circumference * (1 - progress));
    root.querySelector('[data-tasbih-sub]').textContent = tasbihSub(tasbih);
    root.querySelector('[data-tasbih-total]').textContent = t('tasbih.total', { count: tasbih.total.toLocaleString(locale()) });
    root.querySelector('[data-tasbih="add"]').setAttribute('aria-label', t('tasbih.countLabel', { count: tasbih.count }));
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
            ${pageHeader(t('tool.names'), t('names.lead'))}
            <div class="filter-field">
                ${icon('search', { size: 16 })}
                <input type="search" placeholder="${esc(t('names.search'))}" data-names-filter aria-label="${esc(t('names.search'))}">
            </div>
            <div data-names>${spinner()}</div>
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
            <p class="panel-note" data-names-empty hidden>${esc(t('names.noMatch'))}</p>
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
        box.innerHTML = emptyState({ title: t('names.failed'), text: error.message });
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
                <p class="ramadan-day">${t('ramadan.dayOf', { day: `<span class="tnum">${hijri.day}</span>` })}</p>
                <div class="fast-bar" role="img" aria-label="${esc(t('ramadan.fastProgress', { percent: Math.round(progress) }))}">
                    <span style="width:${progress}%" data-fast-bar></span>
                </div>
                <div class="fast-times">
                    <div><span>${esc(t('ramadan.suhoorEnds'))}</span><strong>${fajr ? timeHTML(fajr.hm) : '--:--'}</strong></div>
                    <div><span>${esc(t('ramadan.iftar'))}</span><strong>${maghrib ? timeHTML(maghrib.hm) : '--:--'}</strong></div>
                </div>
                ${hijri.day >= 20 ? `<p class="panel-note">${esc(t('ramadan.lastTen'))}</p>` : ''}
                ${eid ? `<p class="panel-note">${esc(t('ramadan.eidExpected', { date: formatGregorian(eid.date) }))}</p>` : ''}
            </section>
        `;
    } else if (start) {
        const { y, m, d } = keyToParts(start.date);
        const target = zonedDate(y, m, d, 0, 0, prayerState.tz);
        body = `
            <section class="panel ramadan-count" data-ramadan-target="${target.getTime()}">
                <p class="ramadan-lead">${esc(t('ramadan.beginsOn', { year: hijriFor(start.date)?.year || '' }))}</p>
                <p class="ramadan-date">${esc(formatGregorian(start.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</p>
                <div class="countdown" aria-live="off">
                    ${['Days', 'Hours', 'Minutes', 'Seconds'].map(unit => `<div><span class="tnum" data-unit="${unit}">--</span><small>${esc(t(`ramadan.${unit.toLowerCase()}`))}</small></div>`).join('')}
                </div>
                <p class="panel-note">${esc(t('ramadan.note'))}</p>
            </section>
        `;
    } else {
        body = emptyState({ title: t('ramadan.unavailable') });
    }

    return `
        <div class="page tool-page">
            ${backLink()}
            ${pageHeader(t('tool.ramadan'), t(isRamadan ? 'ramadan.leadDuring' : 'ramadan.leadBefore'))}
            ${body}
            ${!isRamadan && fajr && maghrib ? `
                <section class="panel">
                    <h2 class="panel-title">${esc(t('ramadan.ifFast'))}</h2>
                    <div class="fast-times">
                        <div><span>${esc(t('ramadan.suhoorAtFajr'))}</span><strong>${timeHTML(fajr.hm)}</strong></div>
                        <div><span>${esc(t('ramadan.iftarAtMaghrib'))}</span><strong>${timeHTML(maghrib.hm)}</strong></div>
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
            ${pageHeader(t('tool.calendar'), t('calendar.lead'))}

            <section class="panel hijri-today">
                ${hijri ? `
                    <p class="hijri-day tnum">${hijri.day}</p>
                    <div>
                        <p class="hijri-month">${esc(hijriMonthName(hijri.month))} <span class="num">${hijri.year}</span></p>
                        <p class="hijri-month-ar" lang="ar" dir="rtl">${esc(hijriMonthArabic(hijri.month))}</p>
                        <p class="muted">${esc(formatGregorian(key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</p>
                    </div>
                ` : `<p>${esc(t('calendar.unavailable'))}</p>`}
            </section>

            <section class="panel" aria-labelledby="occasions-title">
                <h2 id="occasions-title" class="panel-title">${esc(t('calendar.occasions'))}</h2>
                <ul class="event-list">
                    ${events.map(event => `
                        <li class="event ${event.days === 0 ? 'is-today' : ''}">
                            <span class="event-when tnum">${esc(whenLabel(event.days))}</span>
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
                    <h2 class="panel-title">${esc(t('calendar.whiteDays'))}</h2>
                    <p>${esc(t('calendar.whiteDaysText'))} ${esc(t(daysBetweenKeys(key, whiteStart) <= 0 ? 'calendar.whiteNow' : 'calendar.whiteNext', {
                        from: formatGregorian(whiteStart, { weekday: 'long', day: 'numeric', month: 'long' }),
                        to: formatGregorian(addDaysToKey(whiteStart, 2), { weekday: 'long', day: 'numeric', month: 'long' })
                    }))}</p>
                </section>` : ''}

            <p class="fine-print">${esc(t('calendar.fineprint'))} <a href="#settings/prayer">${esc(t('nav.settings'))}</a></p>
        </div>
    `;
}

/* ---------------------------------------------------------------
 * Page
 * ------------------------------------------------------------- */

function viewFor(tool) {
    switch (tool) {
        case 'adhkar': return adhkarView();
        case 'duas': return duasView();
        case 'tasbih': return tasbihView();
        case 'names': return namesView();
        case 'ramadan': return ramadanView();
        case 'calendar': return calendarView();
        default: return hubView();
    }
}

export const islamicPage = {
    titleKey: 'nav.islamic',

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

            const duaCategory = target.closest('[data-dua-cat]');
            const duaShare = target.closest('[data-dua-share]');

            if (duaCategory) {
                const id = duaCategory.dataset.duaCat;
                root.querySelectorAll('[data-dua-cat]').forEach(chip => {
                    const active = chip === duaCategory;
                    chip.classList.toggle('is-on', active);
                    chip.setAttribute('aria-pressed', String(active));
                });
                root.querySelectorAll('[data-dua-section]').forEach(section => {
                    section.hidden = Boolean(id) && section.dataset.duaSection !== id;
                });
                return;
            }

            if (duaShare) {
                const dua = findDua(duaShare.dataset.duaShare);
                if (dua) {
                    shareText({
                        title: t(`dua.${dua.id}`),
                        text: `${t(`dua.${dua.id}`)}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n${dua.meaning}\n(${dua.reference})`,
                        url: 'https://adhandisplay.com/#islamic/duas'
                    });
                }
                return;
            }

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
                counter.setAttribute('aria-label', t('adhkar.countLabel', { title: t(item.title), count: next, total: item.count }));
                navigator.vibrate?.(done ? [50, 30, 50] : 10);
            } else if (target.closest('[data-adhkar-reset]')) {
                if (await confirmDialog(t('adhkar.resetConfirm'), { confirm: t('common.reset') })) {
                    saveAdhkarProgress({});
                    root.innerHTML = adhkarView();
                }
            } else if (tasbihAction) {
                const action = tasbihAction.dataset.tasbih;
                if (action === 'reset') {
                    if (tasbihState().count && !(await confirmDialog(t('tasbih.resetConfirm'), { confirm: t('common.reset') }))) {
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
                toast(t('tasbih.targetReset'), { duration: 2000 });
            }
        });

    }
};
