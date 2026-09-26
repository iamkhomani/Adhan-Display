// Adhan Display
// Centralized Prayer Configuration
//
// Phase 2 - Prayer Engine V4
//
// This service is the single configuration source for Prayer.
//
// It does not calculate prayer times.
// Calculation remains the responsibility of the Prayer Engine.

(function () {
    'use strict';

    const STORAGE_KEY = 'adhan-display-prayer-config-v1';

    const PRAYER_NAMES = Object.freeze([
        'fajr',
        'sunrise',
        'dhuhr',
        'asr',
        'maghrib',
        'isha'
    ]);

    const CALCULATION_METHODS = Object.freeze([
        'auto',
        'muslim_world_league',
        'egyptian',
        'karachi',
        'umm_al_qura',
        'dubai',
        'moonsighting_committee',
        'north_america',
        'kuwait',
        'qatar',
        'singapore',
        'turkey',
        'tehran'
    ]);

    const MADHABS = Object.freeze([
        'shafi',
        'hanafi'
    ]);

    const HIGH_LATITUDE_RULES = Object.freeze([
        'auto',
        'middleOfTheNight',
        'oneSeventh',
        'angleBased'
    ]);

    const TIME_FORMATS = Object.freeze([
        '12h',
        '24h'
    ]);

    const DEFAULT_OFFSETS = Object.freeze({
        fajr: 0,
        sunrise: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
    });

    const DEFAULT_LOCATION = Object.freeze({
        latitude: null,
        longitude: null,
        timezone: null,
        city: '',
        country: ''
    });

    const DEFAULT_CONFIG = Object.freeze({
        version: 1,

        calculationMethod: 'auto',

        madhab: 'shafi',

        highLatitudeRule: 'auto',

        offsets: DEFAULT_OFFSETS,

        location: DEFAULT_LOCATION,

        timeFormat: '24h'
    });

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function isValidLatitude(value) {
        const number = Number(value);

        return (
            Number.isFinite(number) &&
            number >= -90 &&
            number <= 90
        );
    }

    function isValidLongitude(value) {
        const number = Number(value);

        return (
            Number.isFinite(number) &&
            number >= -180 &&
            number <= 180
        );
    }

    function normalizeOffset(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return 0;
        }

        return Math.trunc(number);
    }

    function normalizeCalculationMethod(value) {
        const method = String(value || 'auto');

        return CALCULATION_METHODS.includes(method)
            ? method
            : DEFAULT_CONFIG.calculationMethod;
    }

    function normalizeMadhab(value) {
        const madhab = String(value || 'shafi');

        return MADHABS.includes(madhab)
            ? madhab
            : DEFAULT_CONFIG.madhab;
    }

    function normalizeHighLatitudeRule(value) {
        const rule = String(value || 'auto');

        return HIGH_LATITUDE_RULES.includes(rule)
            ? rule
            : DEFAULT_CONFIG.highLatitudeRule;
    }

    function normalizeTimeFormat(value) {
        return value === '12h'
            ? '12h'
            : '24h';
    }

    function normalizeOffsets(input) {
        const source = (
            input &&
            typeof input === 'object'
        )
            ? input
            : {};

        const result = {};

        for (const prayer of PRAYER_NAMES) {
            result[prayer] = normalizeOffset(
                source[prayer]
            );
        }

        return result;
    }

    function normalizeLocation(input) {
        const source = (
            input &&
            typeof input === 'object'
        )
            ? input
            : {};

        return {
            latitude: isValidLatitude(source.latitude)
                ? Number(source.latitude)
                : null,

            longitude: isValidLongitude(source.longitude)
                ? Number(source.longitude)
                : null,

            timezone: source.timezone
                ? String(source.timezone)
                : null,

            city: source.city
                ? String(source.city)
                : '',

            country: source.country
                ? String(source.country)
                : ''
        };
    }

    function normalize(input = {}) {
        const source = (
            input &&
            typeof input === 'object'
        )
            ? input
            : {};

        return {
            version: 1,

            calculationMethod:
                normalizeCalculationMethod(
                    source.calculationMethod
                ),

            madhab:
                normalizeMadhab(
                    source.madhab
                ),

            highLatitudeRule:
                normalizeHighLatitudeRule(
                    source.highLatitudeRule
                ),

            offsets:
                normalizeOffsets(
                    source.offsets
                ),

            location:
                normalizeLocation(
                    source.location
                ),

            timeFormat:
                normalizeTimeFormat(
                    source.timeFormat
                )
        };
    }

    function validate(input = {}) {
        const config = normalize(input);

        const errors = [];

        if (!CALCULATION_METHODS.includes(
            config.calculationMethod
        )) {
            errors.push(
                'Invalid calculation method'
            );
        }

        if (!MADHABS.includes(config.madhab)) {
            errors.push(
                'Invalid madhab'
            );
        }

        if (!HIGH_LATITUDE_RULES.includes(
            config.highLatitudeRule
        )) {
            errors.push(
                'Invalid high latitude rule'
            );
        }

        if (!TIME_FORMATS.includes(
            config.timeFormat
        )) {
            errors.push(
                'Invalid time format'
            );
        }

        for (const prayer of PRAYER_NAMES) {
            if (!Number.isFinite(
                Number(config.offsets[prayer])
            )) {
                errors.push(
                    `Invalid offset: ${prayer}`
                );
            }
        }

        if (
            config.location.latitude !== null &&
            !isValidLatitude(
                config.location.latitude
            )
        ) {
            errors.push(
                'Invalid latitude'
            );
        }

        if (
            config.location.longitude !== null &&
            !isValidLongitude(
                config.location.longitude
            )
        ) {
            errors.push(
                'Invalid longitude'
            );
        }

        return {
            valid: errors.length === 0,
            errors,
            config
        };
    }

    function getDefault() {
        return clone(DEFAULT_CONFIG);
    }

    function get() {
        try {
            const raw =
                window.localStorage.getItem(
                    STORAGE_KEY
                );

            if (!raw) {
                return getDefault();
            }

            return normalize(
                JSON.parse(raw)
            );

        } catch (error) {
            console.warn(
                '[PrayerConfig] Failed to load configuration',
                error
            );

            return getDefault();
        }
    }

    function save(input) {
        const result = validate(input);

        if (!result.valid) {
            console.warn(
                '[PrayerConfig] Invalid configuration',
                result.errors
            );
        }

        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(result.config)
            );
        } catch (error) {
            console.warn(
                '[PrayerConfig] Failed to save configuration',
                error
            );
        }

        return clone(result.config);
    }

    function update(patch = {}) {
        const current = get();

        const merged = {
            ...current,
            ...patch,

            offsets: {
                ...current.offsets,
                ...(patch.offsets || {})
            },

            location: {
                ...current.location,
                ...(patch.location || {})
            }
        };

        return save(merged);
    }

    function reset() {
        try {
            window.localStorage.removeItem(
                STORAGE_KEY
            );
        } catch (error) {
            console.warn(
                '[PrayerConfig] Failed to reset configuration',
                error
            );
        }

        return getDefault();
    }

    function getCalculationOptions() {
        const config = get();

        return {
            calculationMethod:
                config.calculationMethod,

            madhab:
                config.madhab,

            highLatitudeRule:
                config.highLatitudeRule
        };
    }

    function getOffsets() {
        return {
            ...get().offsets
        };
    }

    function getLocation() {
        return {
            ...get().location
        };
    }

    function getTimeFormat() {
        return get().timeFormat;
    }

    function hasLocation() {
        const location = getLocation();

        return (
            location.latitude !== null &&
            location.longitude !== null
        );
    }

    function getStorageKey() {
        return STORAGE_KEY;
    }

    window.AdhanPrayerConfig = Object.freeze({
        PRAYER_NAMES,
        CALCULATION_METHODS,
        MADHABS,
        HIGH_LATITUDE_RULES,
        TIME_FORMATS,

        get,
        getDefault,
        save,
        update,
        reset,
        normalize,
        validate,

        getCalculationOptions,
        getOffsets,
        getLocation,
        getTimeFormat,
        hasLocation,
        getStorageKey
    });
})();
