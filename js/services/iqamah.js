/*
 * Iqamah (start of the congregational prayer) for display mode.
 * Off by default; set per prayer as minutes after the adhan, with an
 * optional fixed time for Jumu'ah on Fridays.
 */

import { getSettings } from '../core/storage.js';
import { parseHM, keyToParts, zonedDate, weekdayOfKey, addDaysToKey } from '../core/time.js';
import { pad2 } from '../core/util.js';

/*
 * entry: a prayer entry ({ name, hm, date, isTomorrow }), dayKey: the day it belongs to.
 * Returns { hm, date } or null when iqamah is off or does not apply (Sunrise).
 */
export function iqamahFor(entry, dayKey, tz) {
    const { iqamah } = getSettings();

    if (!iqamah.on || !entry?.date || !(entry.name in iqamah.offsets)) {
        return null;
    }

    const key = entry.isTomorrow ? addDaysToKey(dayKey, 1) : dayKey;

    if (entry.name === 'Dhuhr' && iqamah.jumuah && weekdayOfKey(key) === 5) {
        const fixed = parseHM(iqamah.jumuah);
        if (fixed) {
            const { y, m, d } = keyToParts(key);
            return { hm: `${pad2(fixed.h)}:${pad2(fixed.min)}`, date: zonedDate(y, m, d, fixed.h, fixed.min, tz) };
        }
    }

    const start = parseHM(entry.hm);

    if (!start) {
        return null;
    }

    const offset = iqamah.offsets[entry.name];
    const total = start.h * 60 + start.min + offset;

    return {
        hm: `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`,
        date: new Date(entry.date.getTime() + offset * 60000)
    };
}
