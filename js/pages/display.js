/*
 * Display mode: a full-screen clock for a wall screen or tablet.
 * Keeps the screen awake, dims at night and hides the cursor when idle.
 */

import { esc } from '../core/util.js';
import { icon } from '../core/icons.js';
import { getSettings } from '../core/storage.js';
import { formatClock, formatDuration, formatGregorian } from '../core/time.js';
import { prayerState } from '../services/prayer.js';
import { location } from '../services/location.js';
import { alerts } from '../services/alerts.js';
import { hijriText, timeHTML } from './components.js';

const PRAYER_WINDOW_MS = 10 * 60 * 1000;

let wakeLock = null;

async function keepAwake() {
    if (!getSettings().displayAwake || !('wakeLock' in navigator) || document.visibilityState !== 'visible') {
        return;
    }
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
            wakeLock = null;
        });
    } catch {
        /* Not allowed (for example on battery saver); the display still works. */
    }
}

function releaseAwake() {
    wakeLock?.release().catch(() => {});
    wakeLock = null;
}

function clockHTML(now) {
    const settings = getSettings();
    const clock = formatClock(now, prayerState.tz, settings.timeFormat, settings.displaySeconds);
    return `<span class="tnum">${clock.time}</span>${clock.suffix ? `<span class="ampm">${clock.suffix}</span>` : ''}`;
}

function statusHTML(now) {
    const { next, current } = prayerState;

    if (!next) {
        return prayerState.status === 'error' ? 'Prayer times are not available' : 'Loading prayer times';
    }

    if (current?.date && !current.fromYesterday && now - current.date < PRAYER_WINDOW_MS) {
        return `<strong>It is time for ${esc(current.label)}</strong>`;
    }

    return `${esc(next.label)} in <strong data-display-remaining>${esc(formatDuration(next.date - now))}</strong>`;
}

function tilesHTML() {
    const entries = prayerState.today?.entries || [];
    return entries.map(entry => `
        <div class="display-tile ${entry.isNext ? 'is-next' : ''} ${entry.isCurrent ? 'is-current' : ''} ${entry.passed && !entry.isNext ? 'is-passed' : ''}">
            <span class="display-tile-name">${esc(entry.label)}${entry.isTomorrow ? ' tomorrow' : ''}</span>
            <span class="display-tile-arabic" lang="ar" dir="rtl">${esc(entry.arabic)}</span>
            <span class="display-tile-time">${timeHTML(entry.hm)}</span>
        </div>
    `).join('');
}

function isNight(now) {
    const today = prayerState.today?.entries;
    if (!today) {
        return false;
    }
    const fajr = today[0]?.date;
    const isha = today[5]?.date;
    if (!fajr || !isha) {
        return false;
    }
    /* Dim from 30 minutes after Isha until 20 minutes before Fajr. */
    return now > new Date(isha.getTime() + 30 * 60000) || now < new Date(fajr.getTime() - 20 * 60000);
}

export const displayPage = {
    title: 'Display',

    render() {
        const now = new Date();
        const loc = location.get();
        const today = prayerState.today;

        return `
            <div class="display" data-display>
                <header class="display-top">
                    <span class="display-place">${icon('pin', { size: 18 })} ${esc(loc.city)}</span>
                    <span class="display-actions">
                        <button type="button" class="icon-button" data-fullscreen aria-label="Full screen">${icon('expand')}</button>
                        <a class="icon-button" href="#home" aria-label="Close display mode">${icon('close')}</a>
                    </span>
                </header>

                <div class="display-main">
                    <p class="display-date" data-display-date>${today ? `${esc(formatGregorian(today.key))}<span>${esc(hijriText(today.hijri))}</span>` : ''}</p>
                    <p class="display-clock ${getSettings().displaySeconds ? '' : 'no-seconds'}" data-display-clock>${clockHTML(now)}</p>
                    <p class="display-status" data-display-status>${statusHTML(now)}</p>
                </div>

                <div class="display-tiles" data-display-tiles>${tilesHTML()}</div>
                <p class="display-hint" data-display-hint hidden>Tap anywhere to allow the adhan sound</p>
                <div class="display-dim" aria-hidden="true"></div>
            </div>
        `;
    },

    mount(root, _path, ctx) {
        const display = root.querySelector('[data-display]');
        let cursorTimer = null;

        keepAwake();

        const onVisible = () => {
            if (document.visibilityState === 'visible' && !wakeLock) {
                keepAwake();
            }
        };

        const onMove = () => {
            display.classList.remove('hide-cursor');
            clearTimeout(cursorTimer);
            cursorTimer = setTimeout(() => display.classList.add('hide-cursor'), 3000);
        };

        const onKey = event => {
            if (event.key === 'Escape' && !document.fullscreenElement) {
                window.location.hash = '#home';
            }
        };

        document.addEventListener('visibilitychange', onVisible);
        document.addEventListener('pointermove', onMove);
        document.addEventListener('keydown', onKey);
        onMove();

        ctx.cleanup(() => {
            releaseAwake();
            clearTimeout(cursorTimer);
            document.removeEventListener('visibilitychange', onVisible);
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('keydown', onKey);
            if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
            }
        });

        const refreshDay = () => {
            const today = prayerState.today;
            root.querySelector('[data-display-tiles]').innerHTML = tilesHTML();
            root.querySelector('[data-display-date]').innerHTML = today
                ? `${esc(formatGregorian(today.key))}<span>${esc(hijriText(today.hijri))}</span>`
                : '';
        };

        const update = now => {
            const clock = root.querySelector('[data-display-clock]');
            clock.innerHTML = clockHTML(now);
            clock.classList.toggle('no-seconds', !getSettings().displaySeconds);
            root.querySelector('[data-display-status]').innerHTML = statusHTML(now);
            const settings = getSettings();
            display.classList.toggle('is-dim', settings.displayDim && isNight(now) && !alerts.playing);
            root.querySelector('[data-display-hint]').hidden = !alerts.needsUnlock();
        };

        update(new Date());
        ctx.on('tick', ({ now }) => update(now));
        ctx.on('prayer', refreshDay);
        ctx.on('settings', () => {
            refreshDay();
            update(new Date());
        });

        root.querySelector('[data-fullscreen]').addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen?.();
            } else {
                document.documentElement.requestFullscreen?.().catch(() => {});
            }
        });
    }
};
