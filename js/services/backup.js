/*
 * Backups and the occasional reminder to make one.
 *
 * Everything is stored only in this browser, so a gentle reminder appears on
 * the home page once there is something worth keeping (a week of tracked
 * prayers) and no backup was made in the last 30 days. "Later" hides it for
 * 30 days.
 */

import { store, exportBackup } from '../core/storage.js';
import { APP_VERSION } from '../app-info.js';

const DAY = 86400000;
const REMIND_AFTER_DAYS = 30;
const MIN_TRACKED_DAYS = 7;

/* Saves a Blob as a file through a temporary link. */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBackup() {
    const blob = new Blob([JSON.stringify(exportBackup(APP_VERSION), null, 2)], { type: 'application/json' });
    downloadBlob(blob, `adhan-display-backup-${new Date().toISOString().slice(0, 10)}.json`);
    store.setRaw('last_backup', String(Date.now()));
    store.remove('backup_snooze');
}

/* Time of the last backup in ms, or 0 when none was made on this device. */
export function lastBackup() {
    return Number(store.raw('last_backup', 0)) || 0;
}

export function backupDue(now = Date.now()) {
    const snooze = Number(store.raw('backup_snooze', 0)) || 0;

    if (snooze > now) {
        return false;
    }

    const last = lastBackup();

    if (last && now - last < REMIND_AFTER_DAYS * DAY) {
        return false;
    }

    const tracker = store.get('tracker', {});
    const trackedDays = tracker && typeof tracker === 'object' ? Object.keys(tracker).length : 0;

    return trackedDays >= MIN_TRACKED_DAYS;
}

export function snoozeBackup(now = Date.now()) {
    store.setRaw('backup_snooze', String(now + REMIND_AFTER_DAYS * DAY));
}
