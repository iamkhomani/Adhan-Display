/*
 * Network helpers with a small localStorage cache.
 *
 * Cached entries are stored as { t: timestamp, d: data } under
 * "adhan_cache_<key>". When the network fails, a stale entry is used so the
 * display keeps working offline.
 */

import { PREFIX } from '../core/storage.js';
import { PRAYER_KEYS } from '../core/storage.js';
import { cleanHM } from '../core/time.js';

export const ENDPOINTS = {
    aladhan: 'https://api.aladhan.com/v1',
    quran: 'https://api.alquran.cloud/v1',
    quranAudio: 'https://cdn.islamic.network/quran/audio',
    tafsir: 'https://api.quran.com/api/v4/tafsirs/169/by_ayah',
    hadith: 'https://ummahapi.com/api/hadith',
    geocode: 'https://geocoding-api.open-meteo.com/v1/search',
    reverse: 'https://api.bigdatacloud.net/data/reverse-geocode-client'
};

const CACHE_PREFIX = `${PREFIX}cache_`;
const MAX_CACHE_ENTRIES = 40;

export class HttpError extends Error {
    constructor(status, message) {
        super(message || `Request failed (${status})`);
        this.status = status;
    }
}

export async function fetchJson(url, { timeout = 15000, signal } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    signal?.addEventListener('abort', () => controller.abort(), { once: true });

    try {
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new HttpError(response.status);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(signal?.aborted ? 'Request cancelled' : 'The server took too long to respond');
        }
        if (error instanceof HttpError) {
            throw error;
        }
        throw new Error(navigator.onLine === false ? 'You are offline' : 'Could not reach the server');
    } finally {
        clearTimeout(timer);
    }
}

function readCache(key) {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) {
            return null;
        }
        const entry = JSON.parse(raw);
        return entry && typeof entry.t === 'number' ? entry : null;
    } catch {
        return null;
    }
}

function pruneCache(keep = MAX_CACHE_ENTRIES) {
    try {
        const entries = Object.keys(localStorage)
            .filter(key => key.startsWith(CACHE_PREFIX))
            .map(key => {
                let t = 0;
                try {
                    t = JSON.parse(localStorage.getItem(key))?.t || 0;
                } catch {
                    t = 0;
                }
                return { key, t };
            })
            .sort((a, b) => b.t - a.t);

        entries.slice(keep).forEach(({ key }) => localStorage.removeItem(key));
    } catch {
        /* ignore */
    }
}

function writeCache(key, data) {
    const value = JSON.stringify({ t: Date.now(), d: data });

    try {
        localStorage.setItem(CACHE_PREFIX + key, value);
    } catch {
        pruneCache(10);
        try {
            localStorage.setItem(CACHE_PREFIX + key, value);
        } catch {
            /* storage full: continue without caching */
        }
    }
}

/*
 * Returns cached data when fresh; otherwise fetches, transforms and stores it.
 * Falls back to stale data when offline.
 */
export async function cachedJson(key, url, ttlHours, transform = data => data) {
    const entry = readCache(key);

    if (entry && Date.now() - entry.t < ttlHours * 3600000) {
        return entry.d;
    }

    try {
        const data = transform(await fetchJson(url));
        writeCache(key, data);
        return data;
    } catch (error) {
        if (entry) {
            return entry.d;
        }
        throw error;
    }
}

let pruned = false;

function pruneOnce() {
    if (!pruned) {
        pruned = true;
        pruneCache();
    }
}

/* ---------------------------------------------------------------
 * Prayer times (Aladhan)
 * ------------------------------------------------------------- */

const TIMING_KEYS = [...PRAYER_KEYS, 'Imsak', 'Midnight', 'Firstthird', 'Lastthird'];

function compactCalendar(json) {
    const list = Array.isArray(json?.data) ? json.data : [];

    if (!list.length) {
        throw new Error('No prayer times were returned for this location');
    }

    const days = list.map(day => {
        const timings = {};
        TIMING_KEYS.forEach(name => {
            if (day.timings?.[name]) {
                timings[name] = cleanHM(day.timings[name]);
            }
        });

        const [dd, mm, yyyy] = String(day.date?.gregorian?.date || '').split('-');
        const hijri = day.date?.hijri || {};

        return {
            key: `${yyyy}-${mm}-${dd}`,
            t: timings,
            h: {
                d: Number(hijri.day) || null,
                m: Number(hijri.month?.number) || null,
                y: Number(hijri.year) || null
            }
        };
    });

    const meta = list[0]?.meta || {};

    return {
        tz: meta.timezone || null,
        method: meta.method?.name || null,
        days
    };
}

export function prayerCalendar({ lat, lon, year, month, method, school, latAdjust, tune }) {
    pruneOnce();

    const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        method: String(method),
        school: String(school)
    });

    if (latAdjust) {
        params.set('latitudeAdjustmentMethod', String(latAdjust));
    }

    const tuneValues = tune ? PRAYER_KEYS.map(name => Number(tune[name]) || 0) : [];

    if (tuneValues.some(Boolean)) {
        /* Order: Imsak, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Sunset, Isha, Midnight */
        const [fajr, sunrise, dhuhr, asr, maghrib, isha] = tuneValues;
        params.set('tune', [0, fajr, sunrise, dhuhr, asr, maghrib, 0, isha, 0].join(','));
    }

    const key = `cal2_${params.toString()}_${year}_${month}`.replace(/[^\w.,=-]/g, '');
    const url = `${ENDPOINTS.aladhan}/calendar/${year}/${month}?${params.toString()}`;

    return cachedJson(key, url, 72, compactCalendar);
}

export function namesOfAllah() {
    return cachedJson('names2', `${ENDPOINTS.aladhan}/asmaAlHusna`, 24 * 60, json => {
        const list = Array.isArray(json?.data) ? json.data : [];
        return list.map((item, index) => ({
            n: Number(item.number) || index + 1,
            ar: item.name || '',
            tr: item.transliteration || '',
            en: item.en?.meaning || ''
        }));
    });
}

/* ---------------------------------------------------------------
 * Places
 * ------------------------------------------------------------- */

export async function searchPlaces(query) {
    const params = new URLSearchParams({ name: query, count: '6', language: 'en', format: 'json' });
    const json = await fetchJson(`${ENDPOINTS.geocode}?${params}`);

    return (json?.results || []).map(item => ({
        name: item.name,
        region: [item.admin1, item.country].filter(Boolean).join(', '),
        country: item.country || '',
        lat: Number(item.latitude),
        lon: Number(item.longitude)
    })).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lon));
}

export async function reverseGeocode(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat.toFixed(3),
        longitude: lon.toFixed(3),
        localityLanguage: 'en'
    });

    const key = `rev_${lat.toFixed(2)}_${lon.toFixed(2)}`;

    return cachedJson(key, `${ENDPOINTS.reverse}?${params}`, 24 * 30, json => ({
        city: json?.city || json?.locality || json?.principalSubdivision || '',
        country: json?.countryName || ''
    }));
}
