/*
 * Prayer tracker and make-up (qada) counter.
 * Storage format is unchanged from earlier versions, with one optional addition:
 *   adhan_tracker = { "YYYY-MM-DD": { Fajr, Dhuhr, Asr, Maghrib, Isha, Fast, Kahf, Exempt, Late } }
 *   Late = { Asr: true } lists prayers that were prayed late. A prayed prayer
 *   without an entry in Late counts as on time.
 *   adhan_qada    = { Fajr: 0, ... }
 */

import { store, SALAH } from '../core/storage.js';
import { bus } from '../core/bus.js';
import { addDaysToKey, daysBetweenKeys } from '../core/time.js';

const EMPTY = { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false, Fast: false, Kahf: false, Exempt: false };

function all() {
    const data = store.get('tracker', {});
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

function saveAll(data) {
    store.set('tracker', data);
    bus.emit('tracker');
}

function lateOf(record) {
    const late = record?.Late && typeof record.Late === 'object' && !Array.isArray(record.Late) ? record.Late : {};
    return Object.fromEntries(SALAH.filter(name => late[name] && record[name]).map(name => [name, true]));
}

/* Leaves out an empty Late object so stored records stay as small as before. */
function tidy(record) {
    const copy = { ...record, Late: lateOf(record) };
    if (!Object.keys(copy.Late).length) {
        delete copy.Late;
    }
    return copy;
}

function isComplete(record) {
    return Boolean(record && (record.Exempt || SALAH.every(name => record[name])));
}

export const tracker = {
    record(key) {
        const value = all()[key];
        const record = { ...EMPTY, ...(value && typeof value === 'object' ? value : {}) };
        record.Late = lateOf(record);
        return record;
    },

    isLate(record, name) {
        return Boolean(record?.[name] && record.Late?.[name]);
    },

    /* status: 'onTime' | 'late' | 'none' */
    setStatus(key, name, status) {
        const data = all();
        const record = this.record(key);

        if (!SALAH.includes(name) || record.Exempt) {
            return record;
        }

        record[name] = status !== 'none';
        if (status === 'late') {
            record.Late[name] = true;
        } else {
            delete record.Late[name];
        }

        data[key] = tidy(record);
        saveAll(data);
        return record;
    },

    /* Marks a prayed prayer as late (true) or on time (false). */
    setLate(key, name, late) {
        const data = all();
        const record = this.record(key);

        if (!SALAH.includes(name) || !record[name]) {
            return record;
        }

        if (late) {
            record.Late[name] = true;
        } else {
            delete record.Late[name];
        }

        data[key] = tidy(record);
        saveAll(data);
        return record;
    },

    toggle(key, field) {
        const data = all();
        const record = this.record(key);

        if (record.Exempt && SALAH.includes(field)) {
            return record;
        }

        record[field] = !record[field];

        if (!record[field] && record.Late[field]) {
            delete record.Late[field];
        }

        data[key] = tidy(record);
        saveAll(data);
        return record;
    },

    setExempt(key, value) {
        const data = all();
        const record = this.record(key);

        record.Exempt = Boolean(value);

        if (record.Exempt) {
            SALAH.forEach(name => {
                record[name] = false;
            });
            record.Late = {};
        }

        data[key] = tidy(record);
        saveAll(data);
    },

    count(record) {
        return SALAH.filter(name => record[name]).length;
    },

    /* Statistics up to and including todayKey. */
    stats(todayKey) {
        const data = all();
        const keys = Object.keys(data)
            .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key) && key <= todayKey)
            .sort();

        const perPrayer = Object.fromEntries(SALAH.map(name => [name, { done: 0, late: 0, total: 0 }]));
        let perfectDays = 0;
        let trackedDays = 0;
        let exemptDays = 0;
        let longest = 0;
        let run = 0;
        let previous = null;

        keys.forEach(key => {
            const record = { ...EMPTY, ...data[key] };
            const done = this.count(record);

            if (!record.Exempt && done === 0 && !record.Fast && !record.Kahf) {
                return;
            }

            trackedDays += 1;

            if (record.Exempt) {
                exemptDays += 1;
            } else {
                SALAH.forEach(name => {
                    perPrayer[name].total += 1;
                    if (record[name]) {
                        perPrayer[name].done += 1;
                        if (lateOf(record)[name]) {
                            perPrayer[name].late += 1;
                        }
                    }
                });
                if (done === SALAH.length) {
                    perfectDays += 1;
                }
            }

            if (isComplete(record)) {
                run = previous && daysBetweenKeys(previous, key) === 1 ? run + 1 : 1;
                previous = key;
                longest = Math.max(longest, run);
            } else {
                run = 0;
                previous = null;
            }
        });

        /* Current streak: consecutive complete days ending today (or yesterday if today is not finished yet). */
        let current = 0;
        let cursor = isComplete(data[todayKey]) ? todayKey : addDaysToKey(todayKey, -1);

        while (isComplete(data[cursor]) && current < 5000) {
            current += 1;
            cursor = addDaysToKey(cursor, -1);
        }

        /* Only count days since the first day something was tracked. */
        const firstKey = keys.find(key => {
            const record = { ...EMPTY, ...data[key] };
            return record.Exempt || this.count(record) > 0 || record.Fast || record.Kahf;
        }) || todayKey;

        const windowScore = length => {
            let done = 0;
            let late = 0;
            let total = 0;
            for (let i = 0; i < length; i += 1) {
                const key = addDaysToKey(todayKey, -i);
                if (key < firstKey) {
                    break;
                }
                const record = { ...EMPTY, ...(data[key] || {}) };
                if (record.Exempt) {
                    continue;
                }
                total += SALAH.length;
                done += this.count(record);
                late += Object.keys(lateOf(record)).length;
            }
            return { done, late, onTime: done - late, total };
        };

        const totalDone = SALAH.reduce((sum, name) => sum + perPrayer[name].done, 0);
        const totalPossible = SALAH.reduce((sum, name) => sum + perPrayer[name].total, 0);

        return {
            week: windowScore(7),
            month: windowScore(30),
            current,
            longest,
            perfectDays,
            trackedDays,
            exemptDays,
            totalDone,
            rate: totalPossible ? Math.round((totalDone / totalPossible) * 100) : 0,
            perPrayer: SALAH.map(name => ({
                name,
                ...perPrayer[name],
                rate: perPrayer[name].total ? Math.round((perPrayer[name].done / perPrayer[name].total) * 100) : 0
            }))
        };
    },

    /* Last `length` days ending today: [{ key, done, exempt }] */
    recent(todayKey, length = 28) {
        const data = all();
        return Array.from({ length }, (_, index) => {
            const key = addDaysToKey(todayKey, index - length + 1);
            const record = { ...EMPTY, ...(data[key] || {}) };
            return { key, done: this.count(record), exempt: record.Exempt };
        });
    },

    qada() {
        const value = store.get('qada', {});
        return Object.fromEntries(SALAH.map(name => [name, Math.max(0, Number(value?.[name]) || 0)]));
    },

    adjustQada(name, delta) {
        const qada = this.qada();
        qada[name] = Math.max(0, (qada[name] || 0) + delta);
        store.set('qada', qada);
        bus.emit('tracker');
        return qada;
    }
};
