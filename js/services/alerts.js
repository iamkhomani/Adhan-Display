/*
 * Adhan playback, reminders and system notifications.
 *
 * Browsers block sound until the visitor has interacted with the page, so
 * the first tap or key press "unlocks" the audio element. Alerts that are
 * more than two minutes late (for example after the device slept) are
 * skipped instead of playing at an unexpected moment.
 */

import { bus } from '../core/bus.js';
import { getSettings } from '../core/storage.js';
import { ADHAN_SOUNDS } from '../data/content.js';
import { formatHMText } from '../core/time.js';
import { toast } from '../core/ui.js';
import { t } from '../core/i18n.js';

const MAX_LATE_MS = 2 * 60 * 1000;
const CHIME = 'audio/chime.mp3';

let player = null;
let unlocked = false;
let nowPlaying = null;
let previewTimer = null;

export function soundSource(sound) {
    const entry = ADHAN_SOUNDS.find(([key]) => key === sound) || ADHAN_SOUNDS[0];
    return entry[2];
}

function audio() {
    if (!player) {
        player = new Audio();
        player.preload = 'none';
        player.addEventListener('ended', () => setPlaying(null));
        player.addEventListener('error', () => {
            if (nowPlaying) {
                toast(t('alert.soundFailed'));
                setPlaying(null);
            }
        });
    }
    return player;
}

function setPlaying(value) {
    nowPlaying = value;
    clearTimeout(previewTimer);
    bus.emit('alert-audio', { playing: value });
}

function unlock() {
    if (unlocked) {
        return;
    }

    if (getSettings().sound === 'none') {
        return;
    }

    /* A short, muted play of the small chime file is enough to unlock the element. */
    const element = audio();
    element.src = CHIME;
    element.muted = true;

    const attempt = element.play();

    if (attempt?.then) {
        attempt.then(() => {
            /* Another sound may have started in the meantime; leave it playing. */
            if (element.src.endsWith(CHIME)) {
                element.pause();
                element.currentTime = 0;
            }
            element.muted = false;
            unlocked = true;
            bus.emit('audio-unlocked');
        }).catch(() => {
            element.muted = false;
        });
    }
}

async function play(source, label, kind) {
    if (!source) {
        return false;
    }

    const element = audio();
    bus.emit('audio-exclusive', { source: 'alerts' });

    element.pause();
    element.muted = false;
    element.src = source;
    element.volume = getSettings().volume;
    element.currentTime = 0;

    try {
        await element.play();
        unlocked = true;
        setPlaying({ label, kind });
        return true;
    } catch {
        setPlaying(null);
        return false;
    }
}

async function notify(title, body) {
    const settings = getSettings();

    if (!settings.notify || !('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const options = {
        body,
        icon: 'images/icons/icon-192.png',
        badge: 'images/icons/icon-192.png',
        tag: 'adhan-display',
        renotify: true
    };

    try {
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration?.showNotification) {
            await registration.showNotification(title, options);
        } else {
            new Notification(title, options);
        }
    } catch {
        /* Notifications are optional. */
    }
}

function onPrayerTime({ prayer, late }) {
    if (late > MAX_LATE_MS || prayer.name === 'Sunrise') {
        return;
    }

    const settings = getSettings();

    if (!settings.alerts[prayer.name]) {
        return;
    }

    const time = formatHMText(prayer.hm, settings.timeFormat);
    const title = `${prayer.label} ${time}`;
    const message = t('alert.timeFor', { prayer: prayer.label });

    if (settings.sound !== 'none') {
        play(soundSource(settings.sound), message, 'adhan').then(started => {
            if (!started) {
                toast(`${message}. ${t('alert.tapToAllow')}`, { duration: 15000 });
            }
        });
    } else {
        toast(message, { duration: 15000 });
    }

    notify(title, message);
}

function onReminder({ prayer, minutes, late }) {
    if (late > MAX_LATE_MS || !getSettings().alerts[prayer.name]) {
        return;
    }

    const message = t('alert.reminder', { prayer: prayer.label, count: minutes });
    toast(message, { duration: 20000 });
    play(CHIME, message, 'reminder');
    notify(message, t('alert.prepare'));
}

function onTahajjud() {
    const message = t('alert.lastThird');
    toast(message, { duration: 20000 });
    play(CHIME, message, 'reminder');
    notify(message, t('alert.lastThirdBody'));
}

export const alerts = {
    init() {
        ['pointerdown', 'keydown', 'touchstart'].forEach(type => {
            document.addEventListener(type, unlock, { capture: true, passive: true });
        });

        if (navigator.userActivation?.hasBeenActive) {
            unlocked = true;
        }

        bus.on('prayer-time', onPrayerTime);
        bus.on('prayer-reminder', onReminder);
        bus.on('tahajjud', onTahajjud);
    },

    get unlocked() {
        return unlocked;
    },

    needsUnlock() {
        const settings = getSettings();
        return !unlocked && settings.sound !== 'none' &&
            Object.values(settings.alerts).some(Boolean);
    },

    get playing() {
        return nowPlaying;
    },

    stop() {
        if (player) {
            player.pause();
            player.currentTime = 0;
        }
        setPlaying(null);
    },

    async preview(sound) {
        const source = soundSource(sound);

        if (!source) {
            toast(t('alert.silent'));
            return;
        }

        const started = await play(source, t('alert.preview'), 'preview');

        if (started) {
            previewTimer = setTimeout(() => this.stop(), 15000);
        } else {
            toast(t('alert.previewFailed'));
        }
    },

    async requestNotifications() {
        if (!('Notification' in window)) {
            throw new Error(t('alert.noNotifications'));
        }

        const result = await Notification.requestPermission();

        if (result !== 'granted') {
            throw new Error(t('alert.notificationsBlocked'));
        }

        return true;
    },

    notificationState() {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    }
};
