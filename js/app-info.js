/*
 * App version and the "Install app" prompt.
 */

import { bus } from './core/bus.js';

export const APP_VERSION = '5.2.0';

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    bus.emit('installable');
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    bus.emit('installable');
});

export const install = {
    available() {
        return Boolean(deferredPrompt);
    },

    async prompt() {
        if (!deferredPrompt) {
            return false;
        }
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice.catch(() => null);
        deferredPrompt = null;
        bus.emit('installable');
        return choice?.outcome === 'accepted';
    }
};
