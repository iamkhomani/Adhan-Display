(function () {
    'use strict';

    const VERSION = '1.0.0';

    /*
     * These identifiers intentionally remain application-level identifiers.
     * The service does not assume a specific astronomical library.
     *
     * The mapping layer translates the central configuration into a
     * calculation-engine context. Actual engine integration remains
     * separate and non-destructive.
     */

    const METHOD_DEFINITIONS = Object.freeze({
        auto: Object.freeze({
            id: 'auto',
            label: 'Automatic',
            engineId: null
        }),

        mwl: Object.freeze({
            id: 'mwl',
            label: 'Muslim World League',
            engineId: 'mwl'
        }),

        isna: Object.freeze({
            id: 'isna',
            label: 'Islamic Society of North America',
            engineId: 'isna'
        }),

        egypt: Object.freeze({
            id: 'egypt',
            label: 'Egyptian General Authority of Survey',
            engineId: 'egypt'
        }),

        makkah: Object.freeze({
            id: 'makkah',
            label: 'Umm Al-Qura University, Makkah',
            engineId: 'makkah'
        }),

        karachi: Object.freeze({
            id: 'karachi',
            label: 'University of Islamic Sciences, Karachi',
            engineId: 'karachi'
        }),

        tehran: Object.freeze({
            id: 'tehran',
            label: 'Institute of Geophysics, University of Tehran',
            engineId: 'tehran'
        }),

        jafari: Object.freeze({
            id: 'jafari',
            label: 'Jafari',
            engineId: 'jafari'
        })
    });

    const ALIASES = Object.freeze({
        muslimworldleague: 'mwl',
        muslim_world_league: 'mwl',
        muslimworld: 'mwl',
        northamerica: 'isna',
        islamicsocietyofnorthamerica: 'isna',
        islamic_society_of_north_america: 'isna',
        egyptian: 'egypt',
        egyptian_general: 'egypt',
        ummalqura: 'makkah',
        umm_al_qura: 'makkah',
        mecca: 'makkah',
        universityofislamicscienceskarachi: 'karachi',
        university_islamic_sciences_karachi: 'karachi',
        universityoftehran: 'tehran',
        university_of_tehran: 'tehran',
        shia: 'jafari'
    });

    function normalizeKey(value) {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, '_');
    }

    function normalizeMethodId(value) {
        const key = normalizeKey(value);

        if (METHOD_DEFINITIONS[key]) {
            return key;
        }

        if (ALIASES[key]) {
            return ALIASES[key];
        }

        const compact = key.replace(/_/g, '');

        if (ALIASES[compact]) {
            return ALIASES[compact];
        }

        return 'auto';
    }

    function getDefinition(value) {
        const id = normalizeMethodId(value);

        return {
            ...METHOD_DEFINITIONS[id]
        };
    }

    function getMethodId(value) {
        return getDefinition(value).id;
    }

    function getEngineId(value) {
        return getDefinition(value).engineId;
    }

    function getLabel(value) {
        return getDefinition(value).label;
    }

    function getAll() {
        return Object.values(METHOD_DEFINITIONS)
            .map(function (item) {
                return {
                    ...item
                };
            });
    }

    function resolve(config) {
        const source = config || {};

        const calculation =
            source.calculation ||
            source.calculationOptions ||
            source;

        const requested =
            calculation.calculationMethod ??
            calculation.method ??
            'auto';

        const definition = getDefinition(requested);

        return {
            requestedMethod: requested,
            calculationMethod: definition.id,
            engineMethod: definition.engineId,
            label: definition.label
        };
    }

    function getContext() {
        const configService = window.AdhanPrayerConfig;

        let config = null;

        if (
            configService &&
            typeof configService.get === 'function'
        ) {
            config = configService.get();
        }

        const resolved = resolve(config);

        return {
            ...resolved,
            version: VERSION
        };
    }

    window.AdhanPrayerMethodMapping = Object.freeze({
        version: VERSION,
        getAll,
        getDefinition,
        getMethodId,
        getEngineId,
        getLabel,
        normalizeMethodId,
        resolve,
        getContext
    });
})();
