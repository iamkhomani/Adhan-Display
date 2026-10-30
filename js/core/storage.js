/*
 * localStorage wrapper.
 *
 * All keys keep the original "adhan_" prefix so existing tracker data,
 * bookmarks, locations and preferences keep working after the update.
 * Every access is wrapped in try/catch: private mode or a full quota must
 * never break the app.
 */

export const PREFIX = 'adhan_';

/* Keys outside the prefix that also belong to the user (kept for compatibility). */
export const EXTRA_KEYS = ['ad2_quran_state', 'ad2_theme'];

function read(fullKey) {
    try {
        return localStorage.getItem(fullKey);
    } catch {
        return null;
    }
}

function write(fullKey, value) {
    try {
        localStorage.setItem(fullKey, value);
        return true;
    } catch (error) {
        console.warn('[Adhan Display] Could not save', fullKey, error?.name);
        return false;
    }
}

export const store = {
    raw(key, fallback = null) {
        const value = read(PREFIX + key);
        return value === null ? fallback : value;
    },

    setRaw(key, value) {
        return write(PREFIX + key, String(value));
    },

    get(key, fallback = null) {
        const value = read(PREFIX + key);

        if (value === null) {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    },

    set(key, value) {
        return write(PREFIX + key, JSON.stringify(value));
    },

    remove(key) {
        try {
            localStorage.removeItem(PREFIX + key);
        } catch {
            /* ignore */
        }
    },

    readExternal(fullKey, fallback = null) {
        const value = read(fullKey);

        if (value === null) {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    },

    writeExternal(fullKey, value) {
        return write(fullKey, typeof value === 'string' ? value : JSON.stringify(value));
    },

    keys() {
        try {
            return Object.keys(localStorage);
        } catch {
            return [];
        }
    }
};

export const PRAYER_KEYS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
export const SALAH = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const DEFAULT_ALERTS = { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };

function bool(key, fallback) {
    const value = store.get(key, fallback);
    return value === true || value === 'true';
}

function number(key, fallback, allowed = null) {
    const value = Number(store.raw(key, fallback));

    if (!Number.isFinite(value)) {
        return fallback;
    }

    if (allowed && !allowed.includes(value)) {
        return fallback;
    }

    return value;
}

function readTune() {
    const tune = store.get('tune', null);
    const result = {};
    const legacyOffset = Number(store.raw('offset', 0)) || 0;

    PRAYER_KEYS.forEach(name => {
        const value = tune && typeof tune === 'object' ? Number(tune[name]) : legacyOffset;
        result[name] = Number.isFinite(value) ? Math.max(-60, Math.min(60, Math.round(value))) : 0;
    });

    return result;
}

function readTheme() {
    const theme = store.raw('theme', null);

    if (['dark', 'light', 'system'].includes(theme)) {
        return theme;
    }

    const legacy = read('ad2_theme');
    return legacy === 'light' ? 'light' : 'dark';
}

export function getSettings() {
    const alerts = store.get('prayer_alerts', null);

    return {
        theme: readTheme(),
        size: ['compact', 'normal', 'large'].includes(store.raw('size')) ? store.raw('size') : 'normal',
        timeFormat: store.raw('time_format') === '12h' ? '12h' : '24h',

        method: number('method', 3),
        school: number('school', 0, [0, 1]),
        latAdjust: number('lat_adjust', 0, [0, 1, 2, 3]),
        tune: readTune(),
        hijriOffset: Math.max(-2, Math.min(2, Math.round(number('hijri_offset', 0)))),

        sound: store.raw('audio', 'default'),
        volume: Math.max(0, Math.min(1, number('volume', 1))),
        alerts: { ...DEFAULT_ALERTS, ...(alerts && typeof alerts === 'object' ? alerts : {}) },
        reminder: number('reminder_min', 0, [0, 5, 10, 15, 20, 30]),
        tahajjud: bool('tahajjud_alarm', false),
        notify: bool('notify', false),

        autoLocation: store.raw('auto_loc', 'true') !== 'false',

        displayDim: bool('display_dim', true),
        displayAwake: bool('display_awake', true),
        displaySeconds: bool('display_seconds', true),

        exemptionMode: bool('tracker_exemption_mode', false)
    };
}

export function setSetting(key, value) {
    const map = {
        theme: ['theme', 'raw'],
        size: ['size', 'raw'],
        timeFormat: ['time_format', 'raw'],
        method: ['method', 'raw'],
        school: ['school', 'raw'],
        latAdjust: ['lat_adjust', 'raw'],
        tune: ['tune', 'json'],
        hijriOffset: ['hijri_offset', 'raw'],
        sound: ['audio', 'raw'],
        volume: ['volume', 'raw'],
        alerts: ['prayer_alerts', 'json'],
        reminder: ['reminder_min', 'raw'],
        tahajjud: ['tahajjud_alarm', 'json'],
        notify: ['notify', 'json'],
        autoLocation: ['auto_loc', 'raw'],
        displayDim: ['display_dim', 'json'],
        displayAwake: ['display_awake', 'json'],
        displaySeconds: ['display_seconds', 'json'],
        exemptionMode: ['tracker_exemption_mode', 'json']
    };

    const entry = map[key];

    if (!entry) {
        console.warn('[Adhan Display] Unknown setting', key);
        return;
    }

    const [storageKey, type] = entry;

    if (type === 'json') {
        store.set(storageKey, value);
    } else {
        store.setRaw(storageKey, value);
    }

    if (key === 'tune') {
        /* The old global offset is now folded into per-prayer adjustments. */
        store.remove('offset');
    }

    if (key === 'theme') {
        store.remove('ad2_theme');
        try {
            localStorage.removeItem('ad2_theme');
        } catch {
            /* ignore */
        }
    }
}

/* ---------------------------------------------------------------
 * Backup
 * ------------------------------------------------------------- */

function isUserKey(key) {
    return (key.startsWith(PREFIX) && !key.startsWith(`${PREFIX}cache_`)) || EXTRA_KEYS.includes(key);
}

export function exportBackup(version) {
    const data = {};

    store.keys().filter(isUserKey).forEach(key => {
        data[key] = read(key);
    });

    /* Same flat format as before, so older backups and this one stay interchangeable. */
    return {
        format: 'adhan-display-backup',
        version,
        createdAt: new Date().toISOString(),
        ...data
    };
}

export function importBackup(backup) {
    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
        throw Object.assign(new Error('This file is not an Adhan Display backup.'), { code: 'notBackup' });
    }

    const source = backup.data && typeof backup.data === 'object' && !Array.isArray(backup.data)
        ? backup.data
        : backup;

    const entries = Object.entries(source).filter(([key]) => isUserKey(key));

    if (!entries.length) {
        throw Object.assign(new Error('No Adhan Display data was found in this file.'), { code: 'noBackupData' });
    }

    if (source[`${PREFIX}auto_loc`] === undefined && source[`${PREFIX}location_auto`] !== undefined) {
        entries.push([`${PREFIX}auto_loc`, source[`${PREFIX}location_auto`]]);
    }

    entries.forEach(([key, value]) => {
        write(key, typeof value === 'string' ? value : JSON.stringify(value));
    });

    return entries.length;
}

export function resetAll() {
    store.keys().filter(key => key.startsWith(PREFIX) || EXTRA_KEYS.includes(key)).forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch {
            /* ignore */
        }
    });
}

export function clearCache() {
    let removed = 0;

    store.keys().filter(key => key.startsWith(`${PREFIX}cache_`)).forEach(key => {
        try {
            localStorage.removeItem(key);
            removed += 1;
        } catch {
            /* ignore */
        }
    });

    return removed;
}
