(function () {
    'use strict';

    const SERVICE_VERSION = '1.0.0';

    function getPrayerConfigService() {
        return window.AdhanPrayerConfig || null;
    }

    function isFiniteNumber(value) {
        return Number.isFinite(Number(value));
    }

    function normalizeCoordinate(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function normalizeLocation(location) {
        if (!location || typeof location !== 'object') {
            return null;
        }

        const latitude = normalizeCoordinate(
            location.latitude ??
            location.lat ??
            location.coords?.latitude
        );

        const longitude = normalizeCoordinate(
            location.longitude ??
            location.lng ??
            location.lon ??
            location.coords?.longitude
        );

        if (
            latitude === null ||
            longitude === null ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return null;
        }

        return {
            latitude,
            longitude,
            timezone:
                location.timezone ??
                location.timeZone ??
                location.time_zone ??
                null,
            city:
                location.city ??
                location.name ??
                '',
            country:
                location.country ??
                location.countryName ??
                ''
        };
    }

    function getCandidateServices() {
        return [
            window.AdhanLocationService,
            window.LocationService,
            window.locationService,
            window.adhanLocationService
        ].filter(Boolean);
    }

    function readFromService(service) {
        if (!service) {
            return null;
        }

        const methods = [
            'getLocation',
            'getCurrentLocation',
            'getStoredLocation',
            'get',
            'getCurrent'
        ];

        for (const method of methods) {
            if (typeof service[method] !== 'function') {
                continue;
            }

            try {
                const result = service[method]();

                if (result && typeof result.then === 'function') {
                    continue;
                }

                const normalized = normalizeLocation(result);

                if (normalized) {
                    return normalized;
                }
            } catch (error) {
                // Keep trying other known APIs.
            }
        }

        const directCandidates = [
            service.location,
            service.currentLocation,
            service.current,
            service.position
        ];

        for (const candidate of directCandidates) {
            const normalized = normalizeLocation(candidate);

            if (normalized) {
                return normalized;
            }
        }

        return null;
    }

    function readFromGlobalCoordinates() {
        const candidates = [
            window.locationData,
            window.currentLocation,
            window.userLocation,
            window.adhanLocation,
            window.userCoordinates
        ];

        for (const candidate of candidates) {
            const normalized = normalizeLocation(candidate);

            if (normalized) {
                return normalized;
            }
        }

        return null;
    }

    function readExistingLocation() {
        for (const service of getCandidateServices()) {
            const location = readFromService(service);

            if (location) {
                return location;
            }
        }

        return readFromGlobalCoordinates();
    }

    function getCentralLocation() {
        const config = getPrayerConfigService();

        if (!config) {
            return null;
        }

        if (typeof config.getLocation === 'function') {
            try {
                return config.getLocation();
            } catch (error) {
                return null;
            }
        }

        return null;
    }

    function hasValidLocation(location) {
        return Boolean(
            location &&
            isFiniteNumber(location.latitude) &&
            isFiniteNumber(location.longitude) &&
            Number(location.latitude) >= -90 &&
            Number(location.latitude) <= 90 &&
            Number(location.longitude) >= -180 &&
            Number(location.longitude) <= 180
        );
    }

    function sync(options) {
        const config = getPrayerConfigService();

        if (!config) {
            return {
                success: false,
                reason: 'prayer-config-unavailable'
            };
        }

        const settings = options || {};
        const existing = getCentralLocation();

        /*
         * Central configuration remains authoritative once valid
         * coordinates are already stored.
         */
        if (
            !settings.force &&
            hasValidLocation(existing)
        ) {
            return {
                success: true,
                source: 'central-config',
                location: existing,
                changed: false
            };
        }

        const discovered = readExistingLocation();

        if (!hasValidLocation(discovered)) {
            return {
                success: false,
                reason: 'location-not-available',
                location: existing || null,
                changed: false
            };
        }

        const merged = {
            ...(existing || {}),
            ...discovered
        };

        if (typeof config.update === 'function') {
            config.update({
                location: merged
            });
        } else if (typeof config.save === 'function') {
            const current =
                typeof config.get === 'function'
                    ? config.get()
                    : {};

            config.save({
                ...current,
                location: merged
            });
        } else {
            return {
                success: false,
                reason: 'prayer-config-write-api-unavailable',
                location: existing || null,
                changed: false
            };
        }

        return {
            success: true,
            source: 'location-service',
            location: merged,
            changed: true
        };
    }

    function getStatus() {
        const central = getCentralLocation();

        return {
            version: SERVICE_VERSION,
            centralLocation: central,
            hasValidCentralLocation: hasValidLocation(central),
            discoveredLocation: readExistingLocation()
        };
    }

    window.AdhanPrayerLocationSync = Object.freeze({
        version: SERVICE_VERSION,
        sync,
        getStatus,
        getCentralLocation,
        readExistingLocation,
        normalizeLocation,
        hasValidLocation
    });
})();
