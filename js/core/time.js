/*
 * Date and time helpers.
 *
 * Prayer times are returned by the API as local wall-clock times of the
 * selected location ("05:12"). To count down correctly when the device is in
 * another time zone, every time is converted to a real Date using the
 * location's IANA time zone.
 */

import { pad2 } from './util.js';

const formatterCache = new Map();

function formatter(key, factory) {
    if (!formatterCache.has(key)) {
        formatterCache.set(key, factory());
    }
    return formatterCache.get(key);
}

export function deviceTimeZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
        return null;
    }
}

export function isValidTimeZone(tz) {
    if (!tz) {
        return false;
    }
    try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/* Wall-clock parts of `date` in time zone `tz`. */
export function zonedParts(date = new Date(), tz = null) {
    const zone = isValidTimeZone(tz) ? tz : undefined;
    const fmt = formatter(`parts:${zone || 'local'}`, () => new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hourCycle: 'h23',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }));

    const parts = {};
    fmt.formatToParts(date).forEach(part => {
        parts[part.type] = part.value;
    });

    const y = Number(parts.year);
    const m = Number(parts.month);
    const d = Number(parts.day);

    return {
        y,
        m,
        d,
        h: Number(parts.hour) % 24,
        min: Number(parts.minute),
        s: Number(parts.second),
        weekday: WEEKDAYS[parts.weekday] ?? new Date(Date.UTC(y, m - 1, d)).getUTCDay(),
        key: `${y}-${pad2(m)}-${pad2(d)}`
    };
}

function offsetMinutes(date, tz) {
    const p = zonedParts(date, tz);
    const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
    return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/* A Date for wall-clock time h:min on y-m-d in time zone tz. */
export function zonedDate(y, m, d, h, min, tz) {
    if (!isValidTimeZone(tz)) {
        return new Date(y, m - 1, d, h, min, 0, 0);
    }

    const guess = Date.UTC(y, m - 1, d, h, min);
    let result = guess - offsetMinutes(new Date(guess), tz) * 60000;
    const corrected = guess - offsetMinutes(new Date(result), tz) * 60000;

    if (corrected !== result) {
        result = corrected;
    }

    return new Date(result);
}

export function keyToParts(key) {
    const [y, m, d] = String(key).split('-').map(Number);
    return { y, m, d };
}

export function addDaysToKey(key, days) {
    const { y, m, d } = keyToParts(key);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function weekdayOfKey(key) {
    const { y, m, d } = keyToParts(key);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function daysBetweenKeys(fromKey, toKey) {
    const a = keyToParts(fromKey);
    const b = keyToParts(toKey);
    return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

/* "05:12 (CET)" -> { h: 5, min: 12 } */
export function parseHM(raw) {
    const match = String(raw ?? '').match(/(\d{1,2}):(\d{2})/);

    if (!match) {
        return null;
    }

    return { h: Number(match[1]), min: Number(match[2]) };
}

export function cleanHM(raw) {
    const value = parseHM(raw);
    return value ? `${pad2(value.h)}:${pad2(value.min)}` : '--:--';
}

/* Format "HH:MM" for display. Returns { time, suffix } so the suffix can be styled. */
export function formatHM(raw, format = '24h') {
    const value = parseHM(raw);

    if (!value) {
        return { time: '--:--', suffix: '' };
    }

    if (format === '12h') {
        const suffix = value.h < 12 ? 'AM' : 'PM';
        const hour = value.h % 12 || 12;
        return { time: `${hour}:${pad2(value.min)}`, suffix };
    }

    return { time: `${pad2(value.h)}:${pad2(value.min)}`, suffix: '' };
}

export function formatHMText(raw, format = '24h') {
    const { time, suffix } = formatHM(raw, format);
    return suffix ? `${time} ${suffix}` : time;
}

export function formatClock(date, tz, format = '24h', seconds = false) {
    const p = zonedParts(date, tz);
    const base = formatHM(`${p.h}:${pad2(p.min)}`, format);
    return {
        time: base.time + (seconds ? `:${pad2(p.s)}` : ''),
        suffix: base.suffix
    };
}

/* 4512000 -> "1:15:12" */
export function formatCountdown(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}

/* 4512000 -> "1 h 15 min" */
export function formatDuration(ms) {
    const totalMinutes = Math.max(0, Math.ceil(ms / 60000));

    if (totalMinutes < 1) {
        return 'less than a minute';
    }

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (!h) {
        return `${m} min`;
    }

    return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatGregorian(key, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
    const { y, m, d } = keyToParts(key);
    const cacheKey = `greg:${JSON.stringify(options)}`;
    const fmt = formatter(cacheKey, () => new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }));
    return fmt.format(new Date(Date.UTC(y, m - 1, d, 12)));
}

/* ---------------------------------------------------------------
 * Hijri calendar
 * ------------------------------------------------------------- */

export const HIJRI_MONTHS = [
    ['Muharram', 'مُحَرَّم'],
    ['Safar', 'صَفَر'],
    ['Rabi al-Awwal', 'رَبِيع الأَوَّل'],
    ['Rabi al-Thani', 'رَبِيع الآخِر'],
    ['Jumada al-Ula', 'جُمَادَى الأُولَى'],
    ['Jumada al-Akhirah', 'جُمَادَى الآخِرَة'],
    ['Rajab', 'رَجَب'],
    ['Sha’ban', 'شَعْبَان'],
    ['Ramadan', 'رَمَضَان'],
    ['Shawwal', 'شَوَّال'],
    ['Dhu al-Qa’dah', 'ذُو القَعْدَة'],
    ['Dhu al-Hijjah', 'ذُو الحِجَّة']
];

export function hijriMonthName(month) {
    return HIJRI_MONTHS[(Number(month) - 1 + 12) % 12]?.[0] || '';
}

export function hijriMonthArabic(month) {
    return HIJRI_MONTHS[(Number(month) - 1 + 12) % 12]?.[1] || '';
}

function hijriFormatter() {
    return formatter('hijri', () => {
        for (const calendar of ['islamic-umalqura', 'islamic-civil', 'islamic']) {
            try {
                const fmt = new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC'
                });
                if (fmt.resolvedOptions().calendar.startsWith('islamic')) {
                    return fmt;
                }
            } catch {
                /* try next */
            }
        }
        return null;
    });
}

/* Hijri date for a Gregorian date key, using the browser's Umm al-Qura calendar. */
export function hijriFromKey(key) {
    const fmt = hijriFormatter();

    if (!fmt) {
        return null;
    }

    const { y, m, d } = keyToParts(key);
    const parts = {};
    fmt.formatToParts(new Date(Date.UTC(y, m - 1, d, 12))).forEach(part => {
        parts[part.type] = part.value;
    });

    const day = Number(parts.day);
    const month = Number(parts.month);
    const year = Number(String(parts.year || parts.relatedYear || '').replace(/\D/g, ''));

    if (!day || !month || !year) {
        return null;
    }

    return { day, month, year };
}

/* First date (from `fromKey`, inclusive) whose Hijri date is month/day. */
export function nextHijriDate(month, day, fromKey, hijriOffset = 0, maxDays = 400) {
    for (let i = 0; i <= maxDays; i += 1) {
        const key = addDaysToKey(fromKey, i);
        const hijri = hijriFromKey(addDaysToKey(key, hijriOffset));

        if (hijri && hijri.month === month && hijri.day === day) {
            return key;
        }
    }

    return null;
}
