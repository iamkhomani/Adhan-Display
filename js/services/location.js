/*
 * Location: stored coordinates, browser geolocation and saved places.
 *
 * Browser geolocation is only requested automatically when permission was
 * already granted; otherwise the user starts it with a button. IP lookup is
 * deliberately not used (wrong results behind VPNs).
 */

import { store, getSettings, setSetting } from '../core/storage.js';
import { bus } from '../core/bus.js';
import { isFiniteCoord } from '../core/util.js';
import { t } from '../core/i18n.js';
import { reverseGeocode, searchPlaces } from './api.js';

export const DEFAULT_LOCATION = { lat: 52.0907, lon: 5.1214, city: 'Utrecht', country: 'Netherlands' };

export const location = {
    get() {
        const lat = Number(store.raw('lat'));
        const lon = Number(store.raw('lon'));

        if (store.raw('lat') === null || !isFiniteCoord(lat, lon)) {
            return { ...DEFAULT_LOCATION, isDefault: true };
        }

        let city = store.raw('city', '') || '';

        /* Older versions stored placeholder names. */
        if (!city || ['Current location', 'Selected location', 'Your location'].includes(city)) {
            city = t('location.yours');
        }

        return {
            lat,
            lon,
            city,
            country: store.raw('country', '') || '',
            isDefault: false
        };
    },

    hasChosen() {
        return store.raw('lat') !== null;
    },

    set({ lat, lon, city = '', country = '' }, { auto = false } = {}) {
        lat = Number(lat);
        lon = Number(lon);

        if (!isFiniteCoord(lat, lon)) {
            return false;
        }

        const previous = this.get();
        const moved = previous.isDefault ||
            Math.abs(previous.lat - lat) > 0.01 ||
            Math.abs(previous.lon - lon) > 0.01;

        store.setRaw('lat', lat);
        store.setRaw('lon', lon);
        store.setRaw('city', city || '');
        store.setRaw('country', country || '');

        if (!auto) {
            setSetting('autoLocation', 'false');
        }

        if (moved || previous.city !== city) {
            bus.emit('location', { moved });
        }

        return true;
    },

    /* Asks the browser for the position. Resolves with the location or throws a readable error. */
    async detect() {
        if (!navigator.geolocation) {
            throw new Error(t('location.unsupported'));
        }

        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 10 * 60 * 1000
            });
        }).catch(error => {
            const messages = {
                1: t('location.blocked'),
                2: t('location.unavailable'),
                3: t('location.timeout')
            };
            throw new Error(messages[error?.code] || t('location.failed'));
        });

        const lat = Number(position.coords.latitude);
        const lon = Number(position.coords.longitude);
        let place = { city: '', country: '' };

        try {
            place = await reverseGeocode(lat, lon);
        } catch {
            /* The name is optional. */
        }

        setSetting('autoLocation', 'true');
        const result = { lat, lon, city: place.city || '', country: place.country || '' };
        this.set(result, { auto: true });
        return result;
    },

    /* On start-up: refresh the position silently when the user chose automatic location. */
    async refreshIfAllowed() {
        if (!getSettings().autoLocation || !this.hasChosen() || !navigator.geolocation) {
            return;
        }

        try {
            const status = await navigator.permissions?.query({ name: 'geolocation' });
            if (status && status.state !== 'granted') {
                return;
            }
        } catch {
            return;
        }

        try {
            await this.detect();
        } catch (error) {
            console.info('[Adhan Display] Keeping saved location:', error.message);
        }
    },

    search(query) {
        return searchPlaces(query);
    },

    saved() {
        const list = store.get('saved_locs', []);
        return Array.isArray(list)
            ? list.filter(item => isFiniteCoord(Number(item.lat), Number(item.lon)))
            : [];
    },

    save(place) {
        const list = this.saved().filter(item =>
            Math.abs(Number(item.lat) - place.lat) > 0.01 || Math.abs(Number(item.lon) - place.lon) > 0.01
        );
        list.unshift({ name: place.city || place.name, country: place.country || '', lat: place.lat, lon: place.lon });
        store.set('saved_locs', list.slice(0, 8));
    },

    removeSaved(place) {
        if (!place) {
            return;
        }
        store.set('saved_locs', this.saved().filter(item =>
            Math.abs(Number(item.lat) - Number(place.lat)) > 0.0001 ||
            Math.abs(Number(item.lon) - Number(place.lon)) > 0.0001
        ));
    }
};
