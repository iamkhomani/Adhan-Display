/*
 * Prayer times: loading, "today", next/current prayer, day rollover and
 * the events that drive the adhan and reminders.
 */

import { bus } from '../core/bus.js';
import { store, getSettings, PRAYER_KEYS } from '../core/storage.js';
import {
    zonedParts, zonedDate, addDaysToKey, keyToParts, parseHM,
    deviceTimeZone, isValidTimeZone, hijriFromKey, weekdayOfKey
} from '../core/time.js';
import { prayerCalendar } from './api.js';
import { location } from './location.js';
import { PRAYER_INFO, JUMUAH, methodName } from '../data/content.js';

const KAABA = { lat: 21.422487, lon: 39.826206 };

const savedTz = store.raw('tz');

export const prayerState = {
    status: 'idle',
    error: null,
    tz: isValidTimeZone(savedTz) ? savedTz : deviceTimeZone(),
    methodLabel: '',
    todayKey: null,
    today: null,
    next: null,
    current: null,
    night: null
};

const days = new Map();
const months = new Set();
let signature = '';
let loadToken = 0;
let loading = null;

function configSignature() {
    const settings = getSettings();
    const loc = location.get();

    return JSON.stringify([
        loc.lat.toFixed(4), loc.lon.toFixed(4),
        settings.method, settings.school, settings.latAdjust, settings.tune
    ]);
}

function requestOptions() {
    const settings = getSettings();
    const loc = location.get();

    return {
        lat: loc.lat,
        lon: loc.lon,
        method: settings.method,
        school: settings.school,
        latAdjust: settings.latAdjust,
        tune: settings.tune
    };
}

async function ensureMonth(key, token) {
    const { y, m } = keyToParts(key);
    const id = `${y}-${m}`;

    if (months.has(id)) {
        return;
    }

    const data = await prayerCalendar({ ...requestOptions(), year: y, month: m });

    if (token !== loadToken) {
        return;
    }

    if (isValidTimeZone(data.tz)) {
        prayerState.tz = data.tz;
        store.setRaw('tz', data.tz);
    }

    prayerState.methodLabel = data.method || methodName(getSettings().method);
    data.days.forEach(day => days.set(day.key, day));
    months.add(id);
}

/* Loads the month(s) needed for today and tomorrow. Safe to call repeatedly. */
export function loadPrayerTimes({ force = false } = {}) {
    const nextSignature = configSignature();

    if (force || nextSignature !== signature) {
        days.clear();
        months.clear();
        signature = nextSignature;
        loading = null;
    }

    if (loading) {
        return loading;
    }

    const token = ++loadToken;
    lastRetry = Date.now();
    prayerState.status = days.size ? 'refreshing' : 'loading';
    prayerState.error = null;

    loading = (async () => {
        try {
            await ensureMonth(zonedParts(new Date(), prayerState.tz).key, token);

            /* The time zone is known after the first response. */
            const key = zonedParts(new Date(), prayerState.tz).key;
            await ensureMonth(key, token);
            await ensureMonth(addDaysToKey(key, 1), token);

            if (token === loadToken) {
                prayerState.status = 'ready';
            }
        } catch (error) {
            if (token === loadToken) {
                prayerState.error = error;
                prayerState.status = days.size ? 'ready' : 'error';
                console.warn('[Adhan Display] Prayer times could not be loaded:', error.message);
            }
        } finally {
            if (token === loadToken) {
                loading = null;
                computeToday();
                bus.emit('prayer', { reason: 'load' });
            }
        }
    })();

    return loading;
}

function makeDate(key, hm) {
    const time = parseHM(hm);

    if (!time) {
        return null;
    }

    const { y, m, d } = keyToParts(key);
    return zonedDate(y, m, d, time.h, time.min, prayerState.tz);
}

function infoFor(name, key) {
    if (name === 'Dhuhr' && weekdayOfKey(key) === 5) {
        return JUMUAH;
    }
    return PRAYER_INFO[name];
}

export function hijriFor(key) {
    const target = addDaysToKey(key, getSettings().hijriOffset);
    const day = days.get(target);

    if (day?.h?.d && day.h.m && day.h.y) {
        return { day: day.h.d, month: day.h.m, year: day.h.y };
    }

    return hijriFromKey(target);
}

export function entriesFor(key) {
    const day = days.get(key);

    if (!day) {
        return null;
    }

    return PRAYER_KEYS.map(name => ({
        name,
        ...infoFor(name, key),
        hm: day.t[name] || '--:--',
        date: makeDate(key, day.t[name])
    }));
}

export function computeToday(now = new Date()) {
    const key = zonedParts(now, prayerState.tz).key;
    const entries = entriesFor(key);

    prayerState.todayKey = key;

    if (!entries) {
        prayerState.today = null;
        prayerState.next = null;
        prayerState.current = null;
        prayerState.night = null;
        return;
    }

    const tomorrowKey = addDaysToKey(key, 1);
    const yesterdayKey = addDaysToKey(key, -1);
    const tomorrow = entriesFor(tomorrowKey);
    const yesterday = entriesFor(yesterdayKey);
    const byName = Object.fromEntries(entries.map(entry => [entry.name, entry]));

    let next = entries.find(entry => entry.date && entry.date > now) || null;

    if (!next) {
        const fajr = tomorrow?.[0] || {
            ...entries[0],
            date: entries[0].date ? new Date(entries[0].date.getTime() + 86400000) : null
        };
        next = { ...fajr, isTomorrow: true };
    }

    /* The prayer whose time window is active right now. */
    const windows = [
        ['Fajr', byName.Fajr?.date, byName.Sunrise?.date],
        ['Dhuhr', byName.Dhuhr?.date, byName.Asr?.date],
        ['Asr', byName.Asr?.date, byName.Maghrib?.date],
        ['Maghrib', byName.Maghrib?.date, byName.Isha?.date],
        ['Isha', byName.Isha?.date, tomorrow?.[0]?.date || next.date]
    ];

    let current = null;

    windows.forEach(([name, start, end]) => {
        if (start && end && now >= start && now < end) {
            current = { ...byName[name], end };
        }
    });

    if (!current && byName.Fajr?.date && now < byName.Fajr.date) {
        const isha = yesterday?.[5];
        current = {
            ...(isha || byName.Isha),
            date: isha?.date || (byName.Isha?.date ? new Date(byName.Isha.date.getTime() - 86400000) : null),
            end: byName.Fajr.date,
            fromYesterday: true
        };
    }

    const day = days.get(key);
    const maghribDate = byName.Maghrib?.date;

    /* Night times belong to the night after today's Maghrib (they usually fall after midnight). */
    const nightDate = hm => {
        const date = makeDate(key, hm);
        if (date && maghribDate && date < maghribDate) {
            return makeDate(tomorrowKey, hm);
        }
        return date;
    };

    const todayEntries = entries.map(entry => ({
        ...entry,
        passed: Boolean(entry.date && entry.date <= now),
        isNext: !next.isTomorrow && entry.name === next.name,
        isCurrent: Boolean(current && !current.fromYesterday && current.name === entry.name)
    }));

    /* After Isha, show tomorrow's Fajr in the list as the next prayer. */
    if (next.isTomorrow) {
        todayEntries[0] = { ...todayEntries[0], hm: next.hm, date: next.date, passed: false, isNext: true, isTomorrow: true };
    }

    prayerState.today = {
        key,
        weekday: weekdayOfKey(key),
        entries: todayEntries,
        hijri: hijriFor(key)
    };

    prayerState.next = next;
    prayerState.current = current;
    prayerState.night = day ? {
        midnight: day.t.Midnight || null,
        midnightDate: nightDate(day.t.Midnight),
        firstThird: day.t.Firstthird || null,
        lastThird: day.t.Lastthird || null,
        lastThirdDate: nightDate(day.t.Lastthird),
        fajrTomorrow: tomorrow?.[0]?.hm || entries[0].hm
    } : null;
}

const fired = new Set();

function once(id) {
    if (fired.has(id)) {
        return false;
    }
    fired.add(id);
    if (fired.size > 50) {
        fired.delete(fired.values().next().value);
    }
    return true;
}

let lastRetry = 0;

/* Called every second by the app. */
export function tickPrayer(now = new Date()) {
    const key = zonedParts(now, prayerState.tz).key;

    /* Retry quietly every two minutes while there is no data (offline start-up). */
    if (!prayerState.today && !loading && now - lastRetry > 120000) {
        lastRetry = now.getTime();
        loadPrayerTimes();
        return;
    }

    if (key !== prayerState.todayKey) {
        if (days.has(key) && days.has(addDaysToKey(key, 1))) {
            computeToday(now);
            bus.emit('prayer', { reason: 'day' });
        } else {
            prayerState.todayKey = key;
            loadPrayerTimes();
        }
        return;
    }

    const next = prayerState.next;

    if (next?.date && now >= next.date) {
        computeToday(now);
        bus.emit('prayer', { reason: 'next' });

        if (once(`time:${next.date.getTime()}`)) {
            bus.emit('prayer-time', { prayer: next, late: now - next.date });
        }
        return;
    }

    const settings = getSettings();

    if (next?.date && settings.reminder > 0 && next.name !== 'Sunrise') {
        const remindAt = next.date.getTime() - settings.reminder * 60000;
        if (now.getTime() >= remindAt && now < next.date && once(`remind:${next.date.getTime()}`)) {
            bus.emit('prayer-reminder', { prayer: next, minutes: settings.reminder, late: now.getTime() - remindAt });
        }
    }

    const lastThird = prayerState.night?.lastThirdDate;

    if (settings.tahajjud && lastThird && now >= lastThird && now - lastThird < 5 * 60000 &&
        once(`tahajjud:${lastThird.getTime()}`)) {
        bus.emit('tahajjud', { time: prayerState.night.lastThird });
    }
}

/* Days of any month with the current settings (used by the monthly timetable). */
export async function monthTimetable(year, month) {
    const data = await prayerCalendar({ ...requestOptions(), year, month });

    return data.days.map(day => ({
        key: day.key,
        times: day.t,
        hijri: day.h
    }));
}

export function qibla(lat, lon) {
    const rad = Math.PI / 180;
    const phi1 = lat * rad;
    const phi2 = KAABA.lat * rad;
    const delta = (KAABA.lon - lon) * rad;

    const y = Math.sin(delta) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(delta);
    const bearing = (Math.atan2(y, x) / rad + 360) % 360;

    const dPhi = (KAABA.lat - lat) * rad;
    const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(delta / 2) ** 2;
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return { bearing, distance };
}
