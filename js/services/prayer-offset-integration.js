(function () {
    'use strict';

    const VERSION = '1.0.0';

    function getEngine() {
        return window.AdhanPrayerOffsetEngine || null;
    }

    function isPrayerResult(value) {
        if (
            !value ||
            typeof value !== 'object'
        ) {
            return false;
        }

        const keys = [
            'fajr',
            'sunrise',
            'dhuhr',
            'asr',
            'maghrib',
            'isha'
        ];

        let matches = 0;

        keys.forEach(
            function (key) {
                if (
                    Object.prototype.hasOwnProperty
                        .call(
                            value,
                            key
                        )
                ) {
                    matches += 1;
                }
            }
        );

        return matches >= 3;
    }

    function apply(
        prayerResult
    ) {
        const engine =
            getEngine();

        if (!engine) {
            return prayerResult;
        }

        if (
            !isPrayerResult(
                prayerResult
            )
        ) {
            return prayerResult;
        }

        return engine.apply(
            prayerResult
        );
    }

    function createIntegrationResult(
        original,
        adjusted
    ) {
        return {
            version: VERSION,
            applied:
                original !== adjusted,
            original,
            adjusted
        };
    }

    window.AdhanPrayerOffsetIntegration =
        Object.freeze({
            version: VERSION,
            isPrayerResult,
            apply,
            createIntegrationResult
        });
})();
