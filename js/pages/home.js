/*
 * Home: next prayer, today's times, quick tracker, qibla and daily reading.
 */

import { esc, pickOfDay, dayNumber } from '../core/util.js';
import { icon } from '../core/icons.js';
import { getSettings, setSetting, SALAH } from '../core/storage.js';
import {
    formatCountdown, formatDuration, formatGregorian, addDaysToKey, hijriMonthName, zonedParts, formatClock
} from '../core/time.js';
import { bus } from '../core/bus.js';
import { toast } from '../core/ui.js';
import { prayerState, loadPrayerTimes, qibla, hijriFor } from '../services/prayer.js';
import { location } from '../services/location.js';
import { tracker } from '../services/tracker.js';
import { quranPrefs, ayahOfTheDay, ayahWithTranslation } from '../services/quran.js';
import { DAILY_HADITHS, SHAHADA } from '../data/content.js';
import {
    timeHTML, hijriText, prayerListHTML, bindAlertToggles, timelineHTML,
    updateTimelineNow, openLocationDialog, upcomingEvents
} from './components.js';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


function setupCard() {
    if (location.hasChosen()) {
        return '';
    }

    return `
        <section class="setup" aria-labelledby="setup-title">
            <div>
                <h2 id="setup-title" class="setup-title">Set your location</h2>
                <p>Times below are for Utrecht until you choose your own location.</p>
            </div>
            <div class="setup-actions">
                <button type="button" class="button button-primary" data-action="location">${icon('locate')} Choose location</button>
            </div>
        </section>
    `;
}

function heroHTML() {
    const { today, next, current } = prayerState;
    const settings = getSettings();
    const now = new Date();

    if (!today || !next) {
        if (prayerState.status === 'error') {
            return `
                <section class="hero hero-empty hero-error">
                    <h1 class="hero-error-title">Prayer times could not be loaded</h1>
                    <p class="hero-note">${esc(prayerState.error?.message || 'No connection')}. Check your internet connection and try again. Saved times appear automatically once they have been loaded before.</p>
                    <button type="button" class="button button-primary" data-retry>${icon('refresh')} Try again</button>
                </section>
            `;
        }

        return `
            <section class="hero hero-empty" aria-busy="true">
                <p class="hero-label">Loading prayer times</p>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-time"></div>
            </section>
        `;
    }

    const isSunrise = next.name === 'Sunrise';
    const alertOn = !isSunrise && settings.alerts[next.name];
    const remaining = next.date - now;

    return `
        <section class="hero" aria-labelledby="hero-name">
            <div class="hero-meta">
                <span>${esc(formatGregorian(today.key))}</span>
                <span class="hero-hijri">${esc(hijriText(today.hijri))}</span>
                ${otherTimeZone(now) ? `<span class="hero-local" data-local-time>${esc(localTimeText(now))}</span>` : ''}
            </div>

            <p class="hero-label">${isSunrise ? 'Sunrise, end of Fajr time' : next.isTomorrow ? 'Next prayer, tomorrow' : 'Next prayer'}</p>
            <h1 class="hero-name" id="hero-name">
                <span>${esc(next.label)}</span>
                <span class="hero-arabic" lang="ar" dir="rtl">${esc(next.arabic)}</span>
            </h1>
            <p class="hero-time">${timeHTML(next.hm, settings.timeFormat)}</p>
            <p class="hero-countdown">
                <span data-countdown-words>in ${esc(formatDuration(remaining))}</span>
                <span class="hero-countdown-exact tnum" data-countdown>${formatCountdown(remaining)}</span>
            </p>

            <div class="hero-actions">
                ${isSunrise ? '' : `
                    <button type="button" class="chip ${alertOn ? 'is-on' : ''}" data-hero-alert="${next.name}" aria-pressed="${alertOn}">
                        ${icon(alertOn ? 'bell' : 'bellOff', { size: 16 })} Adhan ${alertOn ? 'on' : 'off'}
                    </button>`}
                ${current ? `<span class="chip chip-quiet">${icon('clock', { size: 16 })} Now: ${esc(current.label)}</span>` : ''}
                <a class="chip chip-quiet" href="#display">${icon('monitor', { size: 16 })} Display mode</a>
            </div>

            ${timelineHTML(today.entries, now, prayerState.tz)}
        </section>
    `;
}

/* True when the chosen location's clock differs from this device's clock. */
function otherTimeZone(now) {
    const there = zonedParts(now, prayerState.tz);
    return there.h !== now.getHours() || there.min !== now.getMinutes();
}

function localTimeText(now) {
    const clock = formatClock(now, prayerState.tz, getSettings().timeFormat);
    return `Local time in ${location.get().city}: ${clock.time}${clock.suffix ? ` ${clock.suffix}` : ''}`;
}

function timesCard() {
    const { today } = prayerState;

    if (!today) {
        return prayerState.status === 'error'
            ? ''
            : `<section class="panel times-panel">${'<div class="skeleton skeleton-row"></div>'.repeat(6)}</section>`;
    }

    const loc = location.get();

    return `
        <section class="panel times-panel" aria-labelledby="times-title">
            <header class="panel-head">
                <h2 id="times-title" class="panel-title">Today</h2>
                <button type="button" class="link-button" data-action="location">${icon('pin', { size: 16 })} ${esc(loc.city)}</button>
            </header>
            ${prayerListHTML(today.entries)}
            <a class="panel-foot" href="#prayer/month">Monthly timetable</a>
        </section>
    `;
}

function trackerCard() {
    const key = prayerState.todayKey;

    if (!key) {
        return '';
    }

    const record = tracker.record(key);
    const done = tracker.count(record);

    return `
        <section class="panel tracker-panel" aria-labelledby="tracker-title">
            <header class="panel-head">
                <h2 id="tracker-title" class="panel-title">Prayed today</h2>
                <span class="panel-meta tnum">${record.Exempt ? 'Exempt' : `${done} of 5`}</span>
            </header>
            <div class="pray-chips" role="group" aria-label="Mark prayers as prayed">
                ${SALAH.map(name => `
                    <button type="button" class="pray-chip ${record[name] ? 'is-done' : ''}" data-track="${name}"
                        aria-pressed="${record[name]}" ${record.Exempt ? 'disabled' : ''}>
                        <span class="pray-check">${icon('check', { size: 16 })}</span>
                        <span>${name}</span>
                    </button>
                `).join('')}
            </div>
            <a class="panel-foot" href="#prayer/tracker">History and statistics</a>
        </section>
    `;
}

function qiblaCard() {
    const loc = location.get();
    const { bearing, distance } = qibla(loc.lat, loc.lon);

    return `
        <a class="panel qibla-panel" href="#prayer/qibla" aria-label="Qibla direction ${Math.round(bearing)} degrees, open compass">
            <span class="mini-compass" aria-hidden="true">
                <span class="mini-compass-n">N</span>
                <span class="mini-compass-needle" style="transform:rotate(${bearing}deg)">${icon('navigation', { size: 22 })}</span>
            </span>
            <span>
                <span class="panel-title">Qibla</span>
                <span class="qibla-degrees tnum">${Math.round(bearing)}°</span>
                <span class="qibla-distance">${Math.round(distance).toLocaleString('en')} km to Makkah</span>
            </span>
        </a>
    `;
}

/* Short, timely notes: Jumu'ah, Sunnah fasts, white days, Ramadan and upcoming occasions. */
function insights() {
    const { today, next } = prayerState;

    if (!today) {
        return [];
    }

    const key = today.key;
    const hijri = today.hijri;
    const offset = getSettings().hijriOffset;
    const items = [];
    const timings = Object.fromEntries(today.entries.map(entry => [entry.name, entry.hm]));

    if (hijri?.month === 9) {
        items.push({
            icon: 'crescent',
            title: `Ramadan, day ${hijri.day}`,
            text: `Suhoor ends at Fajr (${timings.Fajr}). Iftar at Maghrib (${timings.Maghrib}).`
        });
    }

    if (today.weekday === 5) {
        items.push({
            icon: 'book',
            title: 'Jumu’ah today',
            text: 'Reading Surah Al-Kahf on Friday is recommended.',
            href: '#quran/18'
        });
    } else if (today.weekday === 4) {
        items.push({
            icon: 'book',
            title: 'Jumu’ah is tomorrow',
            text: 'Surah Al-Kahf may be read from Maghrib tonight until sunset on Friday.',
            href: '#quran/18'
        });
    }

    const tomorrowKey = addDaysToKey(key, 1);
    const tomorrowWeekday = (today.weekday + 1) % 7;
    const tomorrowHijri = hijriFor(tomorrowKey);

    if (hijri?.day >= 13 && hijri?.day <= 15 && hijri.month !== 9) {
        items.push({ icon: 'moon', title: 'The white days', text: `Today is ${hijri.day} ${hijriMonthName(hijri.month)}, one of the three recommended fasting days.` });
    } else if (tomorrowHijri?.day === 13 && tomorrowHijri.month !== 9) {
        items.push({ icon: 'moon', title: 'White days start tomorrow', text: 'Fasting on the 13th, 14th and 15th of the month is a Sunnah.' });
    } else if ((tomorrowWeekday === 1 || tomorrowWeekday === 4) && hijri?.month !== 9) {
        items.push({ icon: 'sparkle', title: `Tomorrow is ${WEEKDAY_NAMES[tomorrowWeekday]}`, text: 'Fasting on Mondays and Thursdays is a Sunnah.' });
    }

    const upcoming = upcomingEvents(key, offset)[0];

    if (upcoming) {
        items.push({
            icon: 'calendar',
            title: upcoming.days === 0 ? `${upcoming.name} is today` : `${upcoming.name} in ${upcoming.days} ${upcoming.days === 1 ? 'day' : 'days'}`,
            text: `${upcoming.note} Expected ${formatGregorian(upcoming.date, { day: 'numeric', month: 'long' })}, subject to moon sighting.`,
            href: '#islamic/calendar'
        });
    }

    if (next && !items.length) {
        items.push({ icon: 'clock', title: 'Stay consistent', text: 'Small deeds done regularly are the most beloved to Allah.' });
    }

    return items.slice(0, 2);
}

function insightCard() {
    const list = insights();

    if (!list.length) {
        return '';
    }

    return `
        <section class="panel insight-panel" aria-label="Today">
            ${list.map(item => {
                const inner = `
                    <span class="insight-icon">${icon(item.icon, { size: 18 })}</span>
                    <span><strong>${esc(item.title)}</strong><span class="insight-text">${esc(item.text)}</span></span>
                `;
                return item.href
                    ? `<a class="insight" href="${item.href}">${inner}</a>`
                    : `<div class="insight">${inner}</div>`;
            }).join('')}
        </section>
    `;
}

function readingCards() {
    const [text, reference] = pickOfDay(DAILY_HADITHS) || ['', ''];

    return `
        <section class="reading" aria-label="Daily reading">
            <article class="panel ayah-panel" data-ayah-card>
                <h2 class="panel-title">Ayah of the day</h2>
                <div data-ayah-body><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div></div>
            </article>
            <article class="panel hadith-panel">
                <h2 class="panel-title">Hadith of the day</h2>
                <blockquote class="quote">${esc(text)}</blockquote>
                <p class="source">${esc(reference)}</p>
                <a class="panel-foot" href="#hadith">Read more hadith</a>
            </article>
        </section>
    `;
}

export const homePage = {
    title: 'Prayer times',

    render() {
        return `
            <div class="home">
                ${setupCard()}
                <div class="home-top" data-home-top>
                    ${heroHTML()}
                    ${timesCard()}
                </div>
                <div class="home-row" data-home-row>
                    ${trackerCard()}
                    ${qiblaCard()}
                    ${insightCard()}
                </div>
                ${readingCards()}
                <section class="shahada" aria-label="Shahada">
                    <p class="shahada-arabic" lang="ar" dir="rtl">${esc(SHAHADA.arabic)}</p>
                    <p class="shahada-meaning">${esc(SHAHADA.meaning)}</p>
                </section>
            </div>
        `;
    },

    mount(root, _path, ctx) {
        const refreshTop = () => {
            const top = root.querySelector('[data-home-top]');
            const row = root.querySelector('[data-home-row]');
            if (top) {
                top.innerHTML = heroHTML() + timesCard();
            }
            if (row) {
                row.innerHTML = trackerCard() + qiblaCard() + insightCard();
            }
        };

        ctx.on('prayer', refreshTop);
        ctx.on('location', () => {
            root.querySelector('.setup')?.remove();
            refreshTop();
        });
        ctx.on('settings', refreshTop);
        ctx.on('tracker', () => {
            const row = root.querySelector('[data-home-row]');
            if (row) {
                row.innerHTML = trackerCard() + qiblaCard() + insightCard();
            }
        });

        let lastMinute = -1;

        ctx.on('tick', ({ now }) => {
            const next = prayerState.next;

            if (!next?.date) {
                return;
            }

            const remaining = next.date - now;
            const exact = root.querySelector('[data-countdown]');
            const words = root.querySelector('[data-countdown-words]');

            if (exact) {
                exact.textContent = formatCountdown(remaining);
            }

            if (now.getMinutes() !== lastMinute) {
                lastMinute = now.getMinutes();
                if (words) {
                    words.textContent = `in ${formatDuration(remaining)}`;
                }
                updateTimelineNow(root, now, prayerState.tz);
                const local = root.querySelector('[data-local-time]');
                if (local) {
                    local.textContent = localTimeText(now);
                }
            }
        });

        bindAlertToggles(root);

        root.addEventListener('click', event => {
            const track = event.target.closest('[data-track]');
            const heroAlert = event.target.closest('[data-hero-alert]');

            if (track && prayerState.todayKey) {
                const record = tracker.toggle(prayerState.todayKey, track.dataset.track);
                if (record[track.dataset.track] && tracker.count(record) === 5) {
                    toast('All five prayers done today. Alhamdulillah.');
                }
            } else if (heroAlert) {
                const name = heroAlert.dataset.heroAlert;
                const alerts = { ...getSettings().alerts, [name]: !getSettings().alerts[name] };
                setSetting('alerts', alerts);
                bus.emit('settings', { key: 'alerts' });
            } else if (event.target.closest('[data-retry]')) {
                loadPrayerTimes({ force: true });
            } else if (event.target.closest('[data-action="location"]')) {
                openLocationDialog();
            }
        });

        loadAyah(root);
    }
};

async function loadAyah(root) {
    const body = root.querySelector('[data-ayah-body]');

    if (!body) {
        return;
    }

    const prefs = quranPrefs.get();
    const number = ayahOfTheDay(dayNumber());

    try {
        let ayah;
        try {
            ayah = await ayahWithTranslation(number, prefs.selectedTranslation);
        } catch {
            ayah = await ayahWithTranslation(number, 'en.sahih');
        }

        if (!body.isConnected) {
            return;
        }

        body.innerHTML = `
            <p class="ayah-arabic" lang="ar" dir="rtl">${esc(ayah.text)}</p>
            ${ayah.translation ? `<p class="ayah-translation">${esc(ayah.translation)}</p>` : ''}
            <p class="source">${esc(ayah.surahName)} ${ayah.surah}:${ayah.numberInSurah}</p>
            <a class="panel-foot" href="#quran/${ayah.surah}:${ayah.numberInSurah}">Read in context</a>
        `;
    } catch {
        if (body.isConnected) {
            body.innerHTML = '<p class="muted">The ayah of the day could not be loaded. It will appear when you are online.</p>';
        }
    }
}
