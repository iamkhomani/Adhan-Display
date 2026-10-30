/*
 * Rendering pieces shared by several pages.
 */

import { esc, clamp } from '../core/util.js';
import { icon } from '../core/icons.js';
import { formatHM, hijriMonthName, parseHM, zonedParts, nextHijriDate, daysBetweenKeys } from '../core/time.js';
import { ISLAMIC_EVENTS } from '../data/content.js';
import { getSettings, setSetting } from '../core/storage.js';
import { bus } from '../core/bus.js';
import { openDialog, toast } from '../core/ui.js';
import { location } from '../services/location.js';
import { tracker } from '../services/tracker.js';
import { SALAH } from '../core/storage.js';
import { debounce } from '../core/util.js';
import { t, isRtl } from '../core/i18n.js';

const eventMemo = new Map();

/* Upcoming Islamic occasions from `key`, nearest first (memoised per day). */
export function upcomingEvents(key, offset = 0) {
    const memoKey = `${key}:${offset}`;

    if (!eventMemo.has(memoKey)) {
        eventMemo.clear();
        eventMemo.set(memoKey, ISLAMIC_EVENTS
            .map(([id, month, day]) => {
                const date = nextHijriDate(month, day, key, offset);
                return date ? {
                    id,
                    name: t(`event.${id}`),
                    note: t(`event.${id}.note`),
                    month,
                    day,
                    date,
                    days: daysBetweenKeys(key, date)
                } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.days - b.days));
    }

    return eventMemo.get(memoKey);
}

export function timeHTML(hm, format = getSettings().timeFormat) {
    const { time, suffix } = formatHM(hm, format);
    return `<span class="tnum">${esc(time)}</span>${suffix ? `<span class="ampm">${suffix}</span>` : ''}`;
}

export function hijriText(hijri) {
    if (!hijri) {
        return '';
    }
    return t('hijri.date', { day: hijri.day, month: hijriMonthName(hijri.month), year: hijri.year });
}

/* The list of today's six times with optional per-prayer adhan toggles. */
export function prayerListHTML(entries, { bells = true } = {}) {
    const settings = getSettings();
    const showArabic = !isRtl();

    return `
        <ol class="times">
            ${entries.map(entry => {
                const state = entry.isNext ? 'is-next' : entry.passed ? 'is-passed' : '';
                const canAlert = entry.name !== 'Sunrise';
                const on = canAlert && settings.alerts[entry.name];

                return `
                    <li class="time-row ${state} ${entry.isCurrent ? 'is-current' : ''}" data-prayer-row="${entry.name}">
                        <span class="time-name">
                            <span class="time-label">${esc(entry.label)}</span>
                            ${showArabic ? `<span class="time-arabic" lang="ar" dir="rtl">${esc(entry.arabic)}</span>` : ''}
                        </span>
                        ${entry.isNext ? `<span class="time-flag">${esc(entry.isTomorrow ? t('times.tomorrow') : t('times.next'))}</span>` : entry.isCurrent ? `<span class="time-flag time-flag-now">${esc(t('times.now'))}</span>` : '<span class="time-flag-space"></span>'}
                        <span class="time-value">${timeHTML(entry.hm, settings.timeFormat)}</span>
                        ${bells ? (canAlert ? `
                            <button type="button" class="bell ${on ? 'is-on' : ''}" data-toggle-alert="${entry.name}"
                                aria-pressed="${on}" aria-label="${esc(t(on ? 'times.adhanOn' : 'times.adhanOff', { prayer: entry.label }))}">
                                ${icon(on ? 'bell' : 'bellOff', { size: 18 })}
                            </button>` : '<span class="bell-space" aria-hidden="true"></span>') : ''}
                    </li>
                `;
            }).join('')}
        </ol>
    `;
}

/* Delegated handler for the bell buttons rendered by prayerListHTML. */
export function bindAlertToggles(root) {
    root.addEventListener('click', event => {
        const button = event.target.closest('[data-toggle-alert]');

        if (!button) {
            return;
        }

        const name = button.dataset.toggleAlert;
        const label = button.closest('[data-prayer-row]')?.querySelector('.time-label')?.textContent || t(`prayer.${name}`);
        const alerts = { ...getSettings().alerts };
        alerts[name] = !alerts[name];
        setSetting('alerts', alerts);

        button.classList.toggle('is-on', alerts[name]);
        button.setAttribute('aria-pressed', String(alerts[name]));
        const message = t(alerts[name] ? 'times.adhanOn' : 'times.adhanOff', { prayer: label });
        button.setAttribute('aria-label', message);
        button.innerHTML = icon(alerts[name] ? 'bell' : 'bellOff', { size: 18 });

        toast(message, { duration: 2000 });
        bus.emit('settings', { key: 'alerts' });
    });
}

/* Position of a Date on a 0..100 scale of the location's day. */
function dayPercent(date, tz) {
    if (!date) {
        return null;
    }
    const p = zonedParts(date, tz);
    return clamp(((p.h * 60 + p.min) / 1440) * 100, 0, 100);
}

function hmPercent(hm) {
    const time = parseHM(hm);
    return time ? clamp(((time.h * 60 + time.min) / 1440) * 100, 0, 100) : null;
}

/* Horizontal day line: night, dawn, day and dusk shading with the prayers as marks. */
export function timelineHTML(entries, now, tz) {
    const at = name => hmPercent(entries.find(entry => entry.name === name)?.hm);
    const fajr = at('Fajr');
    const sunrise = at('Sunrise');
    const maghrib = at('Maghrib');
    const isha = at('Isha');

    if ([fajr, sunrise, maghrib, isha].some(value => value === null)) {
        return '';
    }

    const gradient = `linear-gradient(90deg,
        var(--sky-night) 0%, var(--sky-night) ${fajr}%,
        var(--sky-dawn) ${sunrise}%, var(--sky-day) ${(sunrise + maghrib) / 2}%,
        var(--sky-dawn) ${maghrib}%, var(--sky-night) ${isha}%, var(--sky-night) 100%)`;

    const marks = entries.map((entry, index) => {
        const left = hmPercent(entry.hm);
        return `
            <span class="tl-mark ${entry.isNext ? 'is-next' : ''} ${entry.passed ? 'is-passed' : ''} ${index % 2 ? 'is-low' : ''}"
                style="left:${left}%">
                <span class="tl-dot"></span>
                <span class="tl-label">${esc(entry.label)}</span>
            </span>
        `;
    }).join('');

    return `
        <div class="timeline" aria-hidden="true" dir="ltr">
            <div class="tl-track" style="background:${gradient}"></div>
            ${marks}
            <span class="tl-now" data-timeline-now style="left:${dayPercent(now, tz)}%"></span>
        </div>
    `;
}

export function updateTimelineNow(root, now, tz) {
    const marker = root.querySelector('[data-timeline-now]');
    if (marker) {
        marker.style.left = `${dayPercent(now, tz)}%`;
    }
}

/* ---------------------------------------------------------------
 * Prayer tracker chips and the "on time?" question
 * ------------------------------------------------------------- */

/* `key` is set on the tracker page so a click knows which day it belongs to. */
export function prayChipsHTML(record, { key = '', large = false, label = '' } = {}) {
    return `
        <div class="pray-chips ${large ? 'pray-chips-large' : ''}" role="group" aria-label="${esc(label || t('tracker.markLabel'))}">
            ${SALAH.map(name => {
                const late = tracker.isLate(record, name);
                const prayer = t(`prayer.${name}`);
                return `
                    <button type="button" class="pray-chip ${record[name] ? 'is-done' : ''} ${late ? 'is-late' : ''}" ${key ? `data-track-key="${key}"` : ''} data-track="${name}"
                        aria-pressed="${record[name]}" ${late ? `aria-label="${esc(t('tracker.lateLabel', { prayer }))}" title="${esc(t('tracker.lateLabel', { prayer }))}"` : ''} ${record.Exempt ? 'disabled' : ''}>
                        <span class="pray-check">${icon(late ? 'clock' : 'check', { size: 16 })}</span>
                        <span>${esc(prayer)}</span>
                    </button>
                `;
            }).join('')}
        </div>
    `;
}

/*
 * Ticks a prayer on or off. When it is ticked on, a short question asks whether
 * it was on time. Not answering keeps the default: on time.
 */
export function togglePrayer(key, name) {
    const record = tracker.toggle(key, name);

    if (!record[name]) {
        return record;
    }

    const allFive = tracker.count(record) === SALAH.length;

    if (!getSettings().askOnTime) {
        if (allFive) {
            toast(t('tracker.allFive'));
        }
        return record;
    }

    const question = t('tracker.askOnTime', { prayer: t(`prayer.${name}`) });

    toast(allFive ? `${t('tracker.allFive')} ${question}` : question, {
        duration: 10000,
        actions: [
            { label: t('tracker.onTime'), primary: true, run: () => {} },
            { label: t('tracker.late'), run: () => tracker.setLate(key, name, true) }
        ]
    });

    return record;
}

export function pageHeader(title, text = '', actions = '') {
    return `
        <header class="page-head">
            <div>
                <h1 class="page-title">${esc(title)}</h1>
                ${text ? `<p class="page-lead">${esc(text)}</p>` : ''}
            </div>
            ${actions ? `<div class="page-actions">${actions}</div>` : ''}
        </header>
    `;
}

export function tabsHTML(base, tabs, active) {
    return `
        <nav class="tabs" aria-label="${esc(t('common.sections'))}">
            ${tabs.map(([id, label]) => `
                <a class="tab ${id === active ? 'is-active' : ''}" href="#${base}${id ? `/${id}` : ''}"
                    ${id === active ? 'aria-current="page"' : ''}>${esc(label)}</a>
            `).join('')}
        </nav>
    `;
}

/* ---------------------------------------------------------------
 * Location dialog (used from the header, home and settings)
 * ------------------------------------------------------------- */

export function openLocationDialog() {
    const current = location.get();
    const saved = location.saved();

    const { root, close } = openDialog({
        title: t('location.title'),
        body: `
            <p class="dialog-text">${t(current.isDefault ? 'location.currentDefault' : 'location.current', {
                place: `<strong>${esc(current.city)}${current.country ? `, ${esc(current.country)}` : ''}</strong>`
            })}</p>

            <button type="button" class="button button-primary button-block" data-detect>
                ${icon('locate')} ${esc(t('location.useCurrent'))}
            </button>
            <p class="field-error" data-detect-error hidden></p>

            <label class="field-label" for="place-search">${esc(t('location.searchLabel'))}</label>
            <div class="search-field">
                ${icon('search', { size: 18 })}
                <input id="place-search" type="search" autocomplete="off" placeholder="${esc(t('location.searchPlaceholder'))}" data-place-search>
            </div>
            <div class="place-results" data-place-results></div>

            ${saved.length ? `
                <p class="field-label">${esc(t('location.saved'))}</p>
                <ul class="place-list">
                    ${saved.map((place, index) => `
                        <li>
                            <button type="button" class="place-option" data-saved="${index}">
                                ${icon('pin', { size: 18 })}
                                <span><strong>${esc(place.name)}</strong>${place.country ? `<small>${esc(place.country)}</small>` : ''}</span>
                            </button>
                            <button type="button" class="icon-button" data-remove-saved="${index}" aria-label="${esc(t('location.remove', { place: place.name }))}">${icon('close', { size: 16 })}</button>
                        </li>
                    `).join('')}
                </ul>
            ` : ''}
        `
    });

    let results = [];

    const choose = place => {
        location.set(place);
        location.save(place);
        close();
        toast(t('location.set', { place: location.get().city }));
    };

    root.querySelector('[data-detect]').addEventListener('click', async event => {
        const button = event.currentTarget;
        const error = root.querySelector('[data-detect-error]');
        button.disabled = true;
        button.innerHTML = `<span class="spinner spinner-small"></span> ${esc(t('location.finding'))}`;
        error.hidden = true;

        try {
            await location.detect();
            close();
            toast(t('location.set', { place: location.get().city }));
        } catch (failure) {
            error.textContent = failure.message;
            error.hidden = false;
            button.disabled = false;
            button.innerHTML = `${icon('locate')} ${esc(t('location.useCurrent'))}`;
        }
    });

    const resultsBox = root.querySelector('[data-place-results]');

    const search = debounce(async query => {
        if (query.length < 2) {
            resultsBox.innerHTML = '';
            return;
        }

        resultsBox.innerHTML = `<p class="muted small">${esc(t('common.searching'))}</p>`;

        try {
            results = await location.search(query);
            resultsBox.innerHTML = results.length
                ? `<ul class="place-list">${results.map((place, index) => `
                    <li><button type="button" class="place-option" data-result="${index}">
                        ${icon('pin', { size: 18 })}
                        <span><strong>${esc(place.name)}</strong><small>${esc(place.region)}</small></span>
                    </button></li>`).join('')}</ul>`
                : `<p class="muted small">${esc(t('location.noResults'))}</p>`;
        } catch (failure) {
            resultsBox.innerHTML = `<p class="field-error">${esc(failure.message)}</p>`;
        }
    }, 350);

    root.querySelector('[data-place-search]').addEventListener('input', event => search(event.target.value.trim()));

    root.addEventListener('click', event => {
        const result = event.target.closest('[data-result]');
        const savedButton = event.target.closest('[data-saved]');
        const remove = event.target.closest('[data-remove-saved]');

        if (result) {
            const place = results[Number(result.dataset.result)];
            choose({ lat: place.lat, lon: place.lon, city: place.name, country: place.country });
        } else if (savedButton) {
            const place = saved[Number(savedButton.dataset.saved)];
            choose({ lat: Number(place.lat), lon: Number(place.lon), city: place.name, country: place.country || '' });
        } else if (remove) {
            location.removeSaved(saved[Number(remove.dataset.removeSaved)]);
            remove.closest('li')?.remove();
        }
    });

    root.querySelector('[data-place-search]').focus();
}
