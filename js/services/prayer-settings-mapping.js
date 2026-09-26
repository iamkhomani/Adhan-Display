(function () {
    'use strict';

    const VERSION = '1.0.0';

    /*
     * These mappings deliberately mirror the values supported by
     * Adhan Display's central prayer configuration.
     *
     * Do not add engine values here that are not supported by the
     * central configuration service.
     */

    const MADHAB_DEFINITIONS = Object.freeze({
        shafi: Object.freeze({
            id: 'shafi',
            label: "Shafi'i",
            engineId: 'shafi'
        }),

        hanafi: Object.freeze({
            id: 'hanafi',
            label: 'Hanafi',
            engineId: 'hanafi'
        })
    });

    const HIGH_LATITUDE_DEFINITIONS = Object.freeze({
        auto: Object.freeze({
            id: 'auto',
            label: 'Automatic',
            engineId: null
        }),

        middleOfTheNight: Object.freeze({
            id: 'middleOfTheNight',
            label: 'Middle of the Night',
            engineId: 'middleOfTheNight'
        }),

        oneSeventh: Object.freeze({
            id: 'oneSeventh',
            label: 'One Seventh',
            engineId: 'oneSeventh'
        }),

        angleBased: Object.freeze({
            id: 'angleBased',
            label: 'Angle Based',
            engineId: 'angleBased'
        })
    });

    const MADHAB_ALIASES = Object.freeze({
        shafii: 'shafi',
        shafii_madhab: 'shafi',
        shafii_madhhab: 'shafi'
    });

    const HIGH_LATITUDE_ALIASES = Object.freeze({
        automatic: 'auto',

        middle_of_the_night: 'middleOfTheNight',
        middleofthenight: 'middleOfTheNight',
        middle_of_night: 'middleOfTheNight',
        middleofnight: 'middleOfTheNight',

        one_seventh: 'oneSeventh',
        oneseventh: 'oneSeventh',

        angle_based: 'angleBased',
        anglebased: 'angleBased'
    });

    function normalizeKey(value) {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, '_');
    }

    function normalizeMadhab(value) {
        const key = normalizeKey(value);

        if (MADHAB_DEFINITIONS[key]) {
            return key;
        }

        if (MADHAB_ALIASES[key]) {
            return MADHAB_ALIASES[key];
        }

        const compact = key.replace(/_/g, '');

        if (MADHAB_ALIASES[compact]) {
            return MADHAB_ALIASES[compact];
        }

        return 'shafi';
    }

    function normalizeHighLatitudeRule(value) {
        const raw = String(value ?? '').trim();

        if (HIGH_LATITUDE_DEFINITIONS[raw]) {
            return raw;
        }

        const key = normalizeKey(value);

        if (HIGH_LATITUDE_DEFINITIONS[key]) {
            return key;
        }

        if (HIGH_LATITUDE_ALIASES[key]) {
            return HIGH_LATITUDE_ALIASES[key];
        }

        const compact = key.replace(/_/g, '');

        if (HIGH_LATITUDE_ALIASES[compact]) {
            return HIGH_LATITUDE_ALIASES[compact];
        }

        return 'auto';
    }

    function getMadhabDefinition(value) {
        return {
            ...MADHAB_DEFINITIONS[
                normalizeMadhab(value)
            ]
        };
    }

    function getHighLatitudeDefinition(value) {
        return {
            ...HIGH_LATITUDE_DEFINITIONS[
                normalizeHighLatitudeRule(value)
            ]
        };
    }

    function getAllMadhabs() {
        return Object.values(MADHAB_DEFINITIONS)
            .map(function (item) {
                return {
                    ...item
                };
            });
    }

    function getAllHighLatitudeRules() {
        return Object.values(HIGH_LATITUDE_DEFINITIONS)
            .map(function (item) {
                return {
                    ...item
                };
            });
    }

    function getContext(config) {
        const source = config || {};

        const calculation =
            source.calculation ||
            source.calculationOptions ||
            source;

        const requestedMadhab =
            calculation.madhab || 'shafi';

        const requestedHighLatitudeRule =
            calculation.highLatitudeRule || 'auto';

        const madhab =
            getMadhabDefinition(requestedMadhab);

        const highLatitudeRule =
            getHighLatitudeDefinition(
                requestedHighLatitudeRule
            );

        return {
            requestedMadhab,
            madhab: madhab.id,
            madhabLabel: madhab.label,
            madhabEngine: madhab.engineId,

            requestedHighLatitudeRule,
            highLatitudeRule:
                highLatitudeRule.id,
            highLatitudeRuleLabel:
                highLatitudeRule.label,
            highLatitudeRuleEngine:
                highLatitudeRule.engineId,

            version: VERSION
        };
    }

    function getCurrentContext() {
        const configService =
            window.AdhanPrayerConfig;

        let config = null;

        if (
            configService &&
            typeof configService.get === 'function'
        ) {
            config = configService.get();
        }

        return getContext(config);
    }

    window.AdhanPrayerSettingsMapping =
        Object.freeze({
            version: VERSION,

            getAllMadhabs,
            getAllHighLatitudeRules,

            normalizeMadhab,
            normalizeHighLatitudeRule,

            getMadhabDefinition,
            getHighLatitudeDefinition,

            getContext,
            getCurrentContext
        });
})();
