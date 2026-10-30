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
import { backupDue, downloadBackup, snoozeBackup } from '../services/backup.js';
import { sharePrayerTimesImage, preloadShareImage } from '../services/share-image.js';
import { t, locale, isRtl } from '../core/i18n.js';
import { prayerState, loadPrayerTimes, qibla, hijriFor } from '../services/prayer.js';
import { location } from '../services/location.js';
import { tracker } from '../services/tracker.js';
import { quranPrefs, ayahOfTheDay, ayahWithTranslation } from '../services/quran.js';
import { DAILY_HADITHS, SHAHADA } from '../data/content.js';
import {
    timeHTML, hijriText, prayerListHTML, bindAlertToggles, timelineHTML,
    updateTimelineNow, openLocationDialog, upcomingEvents,
    prayChipsHTML, togglePrayer, bindPrayerHold
} from './components.js';

function weekdayName(key) {
    return formatGregorian(key, { weekday: 'long' });
}


function setupCard() {
    if (location.hasChosen()) {
        return '';
    }

    return `
        <section class="setup" aria-labelledby="setup-title">
            <div>
                <h2 id="setup-title" class="setup-title">${esc(t('home.setupTitle'))}</h2>
                <p>${esc(t('home.setupText'))}</p>
            </div>
            <div class="setup-actions">
                <button type="button" class="button button-primary" data-action="location">${icon('locate')} ${esc(t('home.chooseLocation'))}</button>
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
                    <h1 class="hero-error-title">${esc(t('home.errorTitle'))}</h1>
                    <p class="hero-note">${esc(prayerState.error?.message || t('error.network'))}. ${esc(t('home.errorText'))}</p>
                    <button type="button" class="button button-primary" data-retry>${icon('refresh')} ${esc(t('common.tryAgain'))}</button>
                </section>
            `;
        }

        return `
            <section class="hero hero-empty" aria-busy="true">
                <p class="hero-label">${esc(t('home.loading'))}</p>
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

            <p class="hero-label">${esc(isSunrise ? t('home.sunriseLabel') : next.isTomorrow ? t('home.nextTomorrow') : t('home.next'))}</p>
            <h1 class="hero-name" id="hero-name">
                <span>${esc(next.label)}</span>
                ${isRtl() ? '' : `<span class="hero-arabic" lang="ar" dir="rtl">${esc(next.arabic)}</span>`}
            </h1>
            <p class="hero-time">${timeHTML(next.hm, settings.timeFormat)}</p>
            <p class="hero-countdown">
                <span data-countdown-words>${esc(t('home.inDuration', { duration: formatDuration(remaining) }))}</span>
                <span class="hero-countdown-exact tnum" data-countdown>${formatCountdown(remaining)}</span>
            </p>

            <div class="hero-actions">
                ${isSunrise ? '' : `
                    <button type="button" class="chip ${alertOn ? 'is-on' : ''}" data-hero-alert="${next.name}" aria-pressed="${alertOn}">
                        ${icon(alertOn ? 'bell' : 'bellOff', { size: 16 })} ${esc(t(alertOn ? 'home.adhanOn' : 'home.adhanOff'))}
                    </button>`}
                ${current ? `<span class="chip chip-quiet">${icon('clock', { size: 16 })} ${esc(t('home.now', { prayer: current.label }))}</span>` : ''}
                <a class="chip chip-quiet" href="#display">${icon('monitor', { size: 16 })} ${esc(t('display.title'))}</a>
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
    return t('home.localTime', { place: location.get().city, time: `${clock.time}${clock.suffix ? ` ${clock.suffix}` : ''}` });
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
                <h2 id="times-title" class="panel-title">${esc(t('common.today'))}</h2>
                <span class="panel-head-actions">
                    <button type="button" class="link-button" data-action="location">${icon('pin', { size: 16 })} ${esc(loc.city)}</button>
                    <button type="button" class="icon-button" data-share-times aria-label="${esc(t('share.times'))}" title="${esc(t('share.times'))}">${icon('share', { size: 18 })}</button>
                </span>
            </header>
            ${prayerListHTML(today.entries)}
            <a class="panel-foot" href="#prayer/month">${esc(t('home.monthly'))}</a>
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
                <h2 id="tracker-title" class="panel-title">${esc(t('home.prayedToday'))}</h2>
                <span class="panel-meta tnum">${esc(record.Exempt ? t('tracker.exempt') : t('tracker.countOf5', { count: done }))}</span>
            </header>
            ${prayChipsHTML(record)}
            <a class="panel-foot" href="#prayer/tracker">${esc(t('home.history'))}</a>
        </section>
    `;
}

function qiblaCard() {
    const loc = location.get();
    const { bearing, distance } = qibla(loc.lat, loc.lon);

    return `
        <a class="panel qibla-panel" href="#prayer/qibla" aria-label="${esc(t('qibla.cardLabel', { degrees: Math.round(bearing) }))}">
            <span class="mini-compass" aria-hidden="true">
                <span class="mini-compass-n">${esc(t('qibla.n'))}</span>
                <span class="mini-compass-needle" style="transform:rotate(${bearing}deg)">${icon('navigation', { size: 22 })}</span>
            </span>
            <span>
                <span class="panel-title">${esc(t('qibla.title'))}</span>
                <span class="qibla-degrees tnum">${Math.round(bearing)}°</span>
                <span class="qibla-distance">${esc(t('qibla.distance', { km: Math.round(distance).toLocaleString(locale()) }))}</span>
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
            title: t('insight.ramadanDay', { day: hijri.day }),
            text: t('insight.ramadanText', { fajr: timings.Fajr, maghrib: timings.Maghrib })
        });
    }

    if (today.weekday === 5) {
        items.push({
            icon: 'book',
            title: t('insight.jumuahToday'),
            text: t('insight.jumuahTodayText'),
            href: '#quran/18'
        });
    } else if (today.weekday === 4) {
        items.push({
            icon: 'book',
            title: t('insight.jumuahTomorrow'),
            text: t('insight.jumuahTomorrowText'),
            href: '#quran/18'
        });
    }

    const tomorrowKey = addDaysToKey(key, 1);
    const tomorrowWeekday = (today.weekday + 1) % 7;
    const tomorrowHijri = hijriFor(tomorrowKey);

    if (hijri?.day >= 13 && hijri?.day <= 15 && hijri.month !== 9) {
        items.push({ icon: 'moon', title: t('insight.whiteDays'), text: t('insight.whiteDaysText', { date: `${hijri.day} ${hijriMonthName(hijri.month)}` }) });
    } else if (tomorrowHijri?.day === 13 && tomorrowHijri.month !== 9) {
        items.push({ icon: 'moon', title: t('insight.whiteDaysTomorrow'), text: t('insight.whiteDaysTomorrowText') });
    } else if ((tomorrowWeekday === 1 || tomorrowWeekday === 4) && hijri?.month !== 9) {
        items.push({ icon: 'sparkle', title: t('insight.tomorrowIs', { day: weekdayName(tomorrowKey) }), text: t('insight.mondayThursday') });
    }

    const upcoming = upcomingEvents(key, offset)[0];

    if (upcoming) {
        items.push({
            icon: 'calendar',
            title: upcoming.days === 0 ? t('insight.eventToday', { name: upcoming.name }) : t('insight.eventIn', { name: upcoming.name, count: upcoming.days }),
            text: `${upcoming.note} ${t('insight.expected', { date: formatGregorian(upcoming.date, { day: 'numeric', month: 'long' }) })}`,
            href: '#islamic/calendar'
        });
    }

    if (next && !items.length) {
        items.push({ icon: 'clock', title: t('insight.consistent'), text: t('insight.consistentText') });
    }

    return items.slice(0, 2);
}

function insightCard() {
    const list = insights();

    if (!list.length) {
        return '';
    }

    return `
        <section class="panel insight-panel" aria-label="${esc(t('common.today'))}">
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

function backupCard() {
    if (!backupDue()) {
        return '';
    }
    return `
        <section class="panel backup-card" aria-labelledby="backup-title">
            <span class="backup-icon">${icon('download', { size: 20 })}</span>
            <div class="backup-text">
                <h2 id="backup-title" class="panel-title">${esc(t('backup.title'))}</h2>
                <p>${esc(t('backup.text'))}</p>
            </div>
            <div class="backup-actions">
                <button type="button" class="button button-primary" data-backup="now">${esc(t('settings.export'))}</button>
                <button type="button" class="button button-ghost" data-backup="later">${esc(t('backup.later'))}</button>
            </div>
        </section>
    `;
}

function readingCards() {
    const [text, reference] = pickOfDay(DAILY_HADITHS) || ['', ''];

    return `
        <section class="reading" aria-label="${esc(t('home.dailyReading'))}">
            <article class="panel ayah-panel" data-ayah-card>
                <h2 class="panel-title">${esc(t('home.ayahOfDay'))}</h2>
                <div data-ayah-body><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div></div>
            </article>
            <article class="panel hadith-panel">
                <h2 class="panel-title">${esc(t('home.hadithOfDay'))}</h2>
                <blockquote class="quote" lang="en">${esc(text)}</blockquote>
                <p class="source">${esc(reference)}</p>
                <a class="panel-foot" href="#hadith">${esc(t('home.moreHadith'))}</a>
            </article>
        </section>
    `;
}

export const homePage = {
    titleKey: 'nav.home',

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
                <div data-backup-slot>${backupCard()}</div>
                ${readingCards()}
                <section class="shahada" aria-label="${esc(t('home.shahada'))}">
                    <p class="shahada-arabic" lang="ar" dir="rtl">${esc(SHAHADA.arabic)}</p>
                    <p class="shahada-meaning">${esc(t('shahada.meaning'))}</p>
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
                    words.textContent = t('home.inDuration', { duration: formatDuration(remaining) });
                }
                updateTimelineNow(root, now, prayerState.tz);
                const local = root.querySelector('[data-local-time]');
                if (local) {
                    local.textContent = localTimeText(now);
                }
            }
        });

        bindAlertToggles(root);
        bindPrayerHold(root, () => prayerState.todayKey);
        preloadShareImage();

        root.addEventListener('click', event => {
            const track = event.target.closest('[data-track]');
            const heroAlert = event.target.closest('[data-hero-alert]');

            const backup = event.target.closest('[data-backup]');

            const shareTimes = event.target.closest('[data-share-times]');

            if (shareTimes) {
                shareTimes.disabled = true;
                sharePrayerTimesImage()
                    .then(result => {
                        if (result === 'downloaded') {
                            toast(t('share.imageSaved'));
                        }
                    })
                    .catch(error => toast(error.message))
                    .finally(() => {
                        shareTimes.disabled = false;
                    });
            } else if (backup) {
                if (backup.dataset.backup === 'now') {
                    downloadBackup();
                    toast(t('settings.backupDone'));
                } else {
                    snoozeBackup();
                }
                root.querySelector('[data-backup-slot]').innerHTML = '';
            } else if (track && prayerState.todayKey) {
                togglePrayer(prayerState.todayKey, track.dataset.track);
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
            <a class="panel-foot" href="#quran/${ayah.surah}:${ayah.numberInSurah}">${esc(t('home.readInContext'))}</a>
        `;
    } catch {
        if (body.isConnected) {
            body.innerHTML = `<p class="muted">${esc(t('home.ayahFailed'))}</p>`;
        }
    }
}
