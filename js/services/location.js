import { APP } from '../config.js';
import { Storage } from '../storage.js';
import { Api } from './api.js';

export class LocationService {
    constructor(onChange) {
        this.onChange = onChange;
        this.interval = null;
        this.lastLocation = null;
    }

    current() {
        return {
            lat: Number(Storage.getRaw('lat', APP.coordinates.lat)),
            lon: Number(Storage.getRaw('lon', APP.coordinates.lon)),
            city: Storage.getRaw('city', APP.coordinates.city)
        };
    }

    async init() {
        const settings = Storage.getSettings();

        /*
         * Keep the existing location immediately.
         * Automatic location is attempted in the background.
         */
        if (settings.autoLocation) {
            await this.auto();

            this.interval = setInterval(() => {
                this.auto().catch(error => {
                    console.warn(
                        '[Adhan Display 2.0] Automatic location update failed',
                        error
                    );
                });
            }, 2 * 60 * 60 * 1000);
        } else if (Storage.getLocations().length) {
            const loc = Storage.getLocations()[0];
            this.set(loc);
        }
    }

    async auto() {
        /*
         * IMPORTANT:
         * Do not use IP geolocation here.
         *
         * IP location is especially unreliable when the user uses:
         * - a VPN
         * - mobile networks
         * - corporate networks
         * - privacy relays
         *
         * Browser geolocation is independent of the public IP address.
         */

        if (!navigator.geolocation) {
            console.warn(
                '[Adhan Display 2.0] Browser geolocation is not available. Keeping current location.'
            );
            return this.current();
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 15 * 60 * 1000
                    }
                );
            });

            const lat = Number(position.coords.latitude);
            const lon = Number(position.coords.longitude);

            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon) ||
                Math.abs(lat) > 90 ||
                Math.abs(lon) > 180
            ) {
                throw new Error('Invalid browser geolocation coordinates');
            }

            const location = {
                lat,
                lon,
                city: 'Current location'
            };

            this.lastLocation = location;
            this.set(location);

            console.log(
                '[Adhan Display 2.0] Browser location detected:',
                lat,
                lon
            );

            return location;
        } catch (error) {
            /*
             * Do NOT fall back to IP location.
             *
             * The current stored/default location remains active.
             * This prevents VPN users from suddenly being moved to
             * Amsterdam, Rotterdam or another IP-based location.
             */
            console.warn(
                '[Adhan Display 2.0] Browser geolocation unavailable or denied. Keeping current location.',
                error?.message || error
            );

            return this.current();
        }
    }

    set(loc) {
        if (!loc) return;

        const lat = Number(loc.lat);
        const lon = Number(loc.lon);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
        ) {
            console.warn(
                '[Adhan Display 2.0] Ignoring invalid location:',
                loc
            );
            return;
        }

        const city = loc.city || loc.name || 'Current location';

        Storage.setRaw('lat', lat);
        Storage.setRaw('lon', lon);
        Storage.setRaw('city', city);

        this.lastLocation = {
            lat,
            lon,
            city
        };

        this.onChange(this.lastLocation);
    }

    async add(name) {
        const data = await Api.geocode(name);
        const result = data.results?.[0];

        if (!result) {
            throw new Error('Location not found');
        }

        const loc = {
            name: result.name,
            lat: Number(result.latitude),
            lon: Number(result.longitude)
        };

        const locations = Storage.getLocations();

        locations.push(loc);
        Storage.setLocations(locations);

        this.set({
            lat: loc.lat,
            lon: loc.lon,
            city: loc.name
        });

        return loc;
    }

    select(index) {
        const locations = Storage.getLocations();
        const loc = locations[index];

        if (!loc) return;

        Storage.setRaw('auto_loc', 'false');

        this.set({
            lat: loc.lat,
            lon: loc.lon,
            city: loc.name
        });
    }

    remove(index) {
        const locations = Storage.getLocations();

        locations.splice(index, 1);

        Storage.setLocations(locations);
    }

    useAuto() {
        Storage.setRaw('auto_loc', 'true');

        this.auto().catch(error => {
            console.warn(
                '[Adhan Display 2.0] Automatic location failed',
                error
            );
        });
    }
}
