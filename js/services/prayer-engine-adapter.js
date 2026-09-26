(function () {
    'use strict';

    function getConfigService() {
        return window.AdhanPrayerConfig || null;
    }

    function getLocationSyncService() {
        return window.AdhanPrayerLocationSync || null;
    }

    function getMethodMappingService() {
        return window.AdhanPrayerMethodMapping || null;
    }

    function getConfig() {
        const service = getConfigService();

        if (!service) {
            return null;
        }

        if (typeof service.get === 'function') {
            return service.get();
        }

        return null;
    }

    function getCalculationOptions() {
        const service = getConfigService();

        if (!service) {
            return {};
        }

        if (typeof service.getCalculationOptions === 'function') {
            return service.getCalculationOptions();
        }

        const config = getConfig();

        return {
            calculationMethod:
                config?.calculationMethod || 'auto',

            madhab:
                config?.madhab || 'shafi',

            highLatitudeRule:
                config?.highLatitudeRule || 'auto'
        };
    }

    function getCalculationMethodMapping() {
        const mapping = getMethodMappingService();

        if (
            mapping &&
            typeof mapping.getContext === 'function'
        ) {
            return mapping.getContext();
        }

        const config = getConfig();

        const calculationMethod =
            config?.calculationMethod || 'auto';

        return {
            requestedMethod: calculationMethod,
            calculationMethod: calculationMethod,
            engineMethod: null,
            label: calculationMethod,
            version: null
        };
    }


    function getPrayerSettingsMapping() {
        const mapping =
            window.AdhanPrayerSettingsMapping;

        if (
            mapping &&
            typeof mapping.getCurrentContext === 'function'
        ) {
            return mapping.getCurrentContext();
        }

        const config = getConfig();

        return {
            requestedMadhab:
                config?.madhab || 'shafi',

            madhab:
                config?.madhab || 'shafi',

            madhabLabel:
                config?.madhab || "Shafi'i",

            madhabEngine:
                config?.madhab || 'shafi',

            requestedHighLatitudeRule:
                config?.highLatitudeRule || 'auto',

            highLatitudeRule:
                config?.highLatitudeRule || 'auto',

            highLatitudeRuleLabel:
                config?.highLatitudeRule || 'Automatic',

            highLatitudeRuleEngine:
                null,

            version:
                null
        };
    }

    function getOffsetEngine() {
        return window.AdhanPrayerOffsetEngine || null;
    }

    function getOffsets() {
        const service = getConfigService();

        if (!service) {
            return {};
        }

        if (typeof service.getOffsets === 'function') {
            return service.getOffsets();
        }

        return getConfig()?.offsets || {};
    }

    function getLocation() {
        const sync = getLocationSyncService();

        if (
            sync &&
            typeof sync.getCentralLocation === 'function'
        ) {
            const location = sync.getCentralLocation();

            if (location) {
                return location;
            }
        }

        const service = getConfigService();

        if (
            service &&
            typeof service.getLocation === 'function'
        ) {
            return service.getLocation();
        }

        return getConfig()?.location || null;
    }

    function getDisplayOptions() {
        const service = getConfigService();

        if (!service) {
            return {};
        }

        if (typeof service.getDisplayOptions === 'function') {
            return service.getDisplayOptions();
        }

        const config = getConfig();

        return {
            timeFormat:
                config?.timeFormat || '24h'
        };
    }

    function getEngineOptions() {
        return {
            calculation: getCalculationOptions(),
            offsets: getOffsets(),
            location: getLocation(),
            display: getDisplayOptions()
        };
    }
    function getCalculationContext() {
        const options = getEngineOptions();

        const method =
            typeof getCalculationMethodMapping === 'function'
                ? getCalculationMethodMapping()
                : {
                    calculationMethod:
                        options.calculation?.calculationMethod ||
                        'auto',
                    engineMethod: null,
                    requestedMethod:
                        options.calculation?.calculationMethod ||
                        'auto',
                    label: 'Automatic'
                };

        const settings =
            getPrayerSettingsMapping();

        return {
            calculationMethod:
                method.calculationMethod ||
                options.calculation?.calculationMethod ||
                'auto',

            engineMethod:
                method.engineMethod || null,

            requestedMethod:
                method.requestedMethod ||
                options.calculation?.calculationMethod ||
                'auto',

            calculationMethodLabel:
                method.label ||
                'Automatic',

            requestedMadhab:
                settings.requestedMadhab,

            madhab:
                settings.madhab,

            madhabLabel:
                settings.madhabLabel,

            madhabEngine:
                settings.madhabEngine,

            requestedHighLatitudeRule:
                settings.requestedHighLatitudeRule,

            highLatitudeRule:
                settings.highLatitudeRule,

            highLatitudeRuleLabel:
                settings.highLatitudeRuleLabel,

            highLatitudeRuleEngine:
                settings.highLatitudeRuleEngine,

            offsets: {
                ...(options.offsets || {})
            },

            location:
                options.location
                    ? {
                        ...options.location
                    }
                    : null,

            timeFormat:
                options.display?.timeFormat ||
                '24h'
        };
    }

    function hasValidCoordinates() {
        const location = getLocation();

        if (!location) {
            return false;
        }

        const latitude = Number(location.latitude);
        const longitude = Number(location.longitude);

        return (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        );
    }

    function syncLocation(options) {
        const sync = getLocationSyncService();

        if (
            !sync ||
            typeof sync.sync !== 'function'
        ) {
            return {
                success: false,
                reason: 'location-sync-unavailable'
            };
        }

        return sync.sync(options);
    }

    function applyOffsets(times, offsets) {
        if (
            !times ||
            typeof times !== 'object'
        ) {
            return times;
        }

        const sourceOffsets = offsets || {};

        const result = {
            ...times
        };

        Object.keys(sourceOffsets).forEach(function (key) {
            const offset = Number(sourceOffsets[key]);

            if (
                !Number.isFinite(offset) ||
                offset === 0
            ) {
                return;
            }

            const value = result[key];

            if (typeof value !== 'string') {
                return;
            }

            const match = value.match(
                /^(\d{1,2}):(\d{2})(?::(\d{2}))?(.*)$/
            );

            if (!match) {
                return;
            }

            const hours = Number(match[1]);
            const minutes = Number(match[2]);
            const seconds = Number(match[3] || 0);
            const suffix = match[4] || '';

            let totalSeconds =
                hours * 3600 +
                minutes * 60 +
                seconds +
                offset * 60;

            const daySeconds = 24 * 60 * 60;

            totalSeconds =
                ((totalSeconds % daySeconds) +
                    daySeconds) %
                daySeconds;

            const outputHours =
                Math.floor(totalSeconds / 3600);

            const outputMinutes =
                Math.floor(
                    (totalSeconds % 3600) / 60
                );

            const outputSeconds =
                Math.floor(totalSeconds % 60);

            result[key] =
                String(outputHours).padStart(2, '0') +
                ':' +
                String(outputMinutes).padStart(2, '0') +
                (
                    match[3]
                        ? ':' +
                          String(outputSeconds).padStart(
                              2,
                              '0'
                          )
                        : ''
                ) +
                suffix;
        });

        return result;
    }

    function addMinutesToTime(time, minutes) {
        if (typeof time !== 'string') {
            return time;
        }

        const amount = Number(minutes);

        if (
            !Number.isFinite(amount) ||
            amount === 0
        ) {
            return time;
        }

        const match = time.match(
            /^(\d{1,2}):(\d{2})(?::(\d{2}))?(.*)$/
        );

        if (!match) {
            return time;
        }

        const hours = Number(match[1]);
        const mins = Number(match[2]);
        const seconds = Number(match[3] || 0);
        const suffix = match[4] || '';

        let totalMinutes =
            hours * 60 +
            mins +
            seconds / 60 +
            amount;

        totalMinutes =
            ((totalMinutes % 1440) + 1440) %
            1440;

        const outputHours =
            Math.floor(totalMinutes / 60);

        const outputMinutes =
            Math.floor(totalMinutes % 60);

        return (
            String(outputHours).padStart(2, '0') +
            ':' +
            String(outputMinutes).padStart(2, '0') +
            suffix
        );
    }

    window.AdhanPrayerEngineAdapter =
        Object.freeze({
            getConfig,
            getCalculationOptions,
            getCalculationMethodMapping,
            getPrayerSettingsMapping,
getOffsetEngine,
getOffsets,
            getLocation,
            getDisplayOptions,
            getEngineOptions,
            getCalculationContext,
            hasValidCoordinates,
            syncLocation,
            applyOffsets,
            addMinutesToTime
        });
})();
