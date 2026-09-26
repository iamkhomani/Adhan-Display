(function () {
    'use strict';

    const VERSION = '1.0.0';

    function getMappingContext() {
        const mapping =
            window.AdhanPrayerSettingsMapping;

        if (
            mapping &&
            typeof mapping.getCurrentContext ===
                'function'
        ) {
            return mapping.getCurrentContext();
        }

        return {
            requestedMadhab: 'shafi',
            madhab: 'shafi',
            madhabLabel: "Shafi'i",
            madhabEngine: 'shafi',

            requestedHighLatitudeRule: 'auto',
            highLatitudeRule: 'auto',
            highLatitudeRuleLabel: 'Automatic',
            highLatitudeRuleEngine: null,

            version: VERSION
        };
    }

    function normalizeContext(base) {
        const source =
            base && typeof base === 'object'
                ? base
                : {};

        const mapping =
            getMappingContext();

        const madhab =
            source.madhab ||
            mapping.madhab ||
            'shafi';

        const highLatitudeRule =
            source.highLatitudeRule ||
            mapping.highLatitudeRule ||
            'auto';

        /*
         * Use an explicit fallback for the engine identifiers.
         *
         * Madhab is always represented by the normalized madhab ID.
         *
         * "auto" for high latitude intentionally maps to null because
         * the final astronomical engine is expected to decide the rule.
         */
        const madhabEngine =
            source.madhabEngine ||
            mapping.madhabEngine ||
            madhab;

        let highLatitudeRuleEngine;

        if (
            source.highLatitudeRuleEngine !== undefined
        ) {
            highLatitudeRuleEngine =
                source.highLatitudeRuleEngine;
        } else if (
            mapping.highLatitudeRuleEngine !== undefined
        ) {
            highLatitudeRuleEngine =
                mapping.highLatitudeRuleEngine;
        } else if (
            highLatitudeRule === 'auto'
        ) {
            highLatitudeRuleEngine = null;
        } else {
            highLatitudeRuleEngine =
                highLatitudeRule;
        }

        return {
            ...source,

            requestedMadhab:
                source.requestedMadhab ||
                mapping.requestedMadhab ||
                madhab,

            madhab,
            madhabLabel:
                source.madhabLabel ||
                mapping.madhabLabel ||
                "Shafi'i",

            madhabEngine,

            requestedHighLatitudeRule:
                source.requestedHighLatitudeRule ||
                mapping.requestedHighLatitudeRule ||
                highLatitudeRule,

            highLatitudeRule,

            highLatitudeRuleLabel:
                source.highLatitudeRuleLabel ||
                mapping.highLatitudeRuleLabel ||
                'Automatic',

            highLatitudeRuleEngine,

            version: VERSION
        };
    }

    function getContext() {
        const adapter =
            window.AdhanPrayerEngineAdapter ||
            window.AdhanPrayerEngine;

        let base = {};

        if (
            adapter &&
            typeof adapter.getCalculationContext ===
                'function'
        ) {
            try {
                base =
                    adapter.getCalculationContext() ||
                    {};
            } catch (error) {
                base = {
                    error:
                        error &&
                        error.message
                            ? error.message
                            : String(error)
                };
            }
        }

        return normalizeContext(base);
    }

    window.AdhanPrayerEngineV8Context =
        Object.freeze({
            version: VERSION,
            getMappingContext,
            normalizeContext,
            getContext
        });
})();
