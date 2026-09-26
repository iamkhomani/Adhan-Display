(function () {
    'use strict';

    const VERSION = '1.0.0';

    const PRAYER_KEYS = Object.freeze([
        'fajr',
        'sunrise',
        'dhuhr',
        'asr',
        'maghrib',
        'isha'
    ]);

    function getOffsets() {
        const adapter =
            window.AdhanPrayerEngineAdapter ||
            window.AdhanPrayerEngine;

        if (
            adapter &&
            typeof adapter.getOffsets === 'function'
        ) {
            return {
                ...(
                    adapter.getOffsets() || {}
                )
            };
        }

        const config =
            window.AdhanPrayerConfig;

        if (
            config &&
            typeof config.getOffsets === 'function'
        ) {
            return {
                ...(
                    config.getOffsets() || {}
                )
            };
        }

        return {
            fajr: 0,
            sunrise: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0
        };
    }

    function normalizeOffset(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return 0;
        }

        return Math.trunc(number);
    }

    function parseTime(value) {
        if (typeof value !== 'string') {
            return null;
        }

        const match =
            value
                .trim()
                .match(
                    /^(\d{1,2}):(\d{2})(?::(\d{2}))?(.*)$/
                );

        if (!match) {
            return null;
        }

        const hours =
            Number(match[1]);

        const minutes =
            Number(match[2]);

        const seconds =
            Number(match[3] || 0);

        if (
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59 ||
            seconds < 0 ||
            seconds > 59
        ) {
            return null;
        }

        return {
            hours,
            minutes,
            seconds,
            suffix: match[4] || '',
            raw: value
        };
    }

    function formatTime(
        totalSeconds,
        original
    ) {
        const day =
            24 * 60 * 60;

        totalSeconds =
            (
                (
                    totalSeconds % day
                ) +
                day
            ) % day;

        const hours =
            Math.floor(
                totalSeconds / 3600
            );

        const minutes =
            Math.floor(
                (
                    totalSeconds % 3600
                ) / 60
            );

        const seconds =
            Math.floor(
                totalSeconds % 60
            );

        /*
         * Only preserve seconds when the original input explicitly
         * contained a seconds component.
         *
         * Example:
         *   05:00      -> 05:10
         *   05:00:00   -> 05:10:00
         */
        const hasExplicitSeconds =
            typeof original?.raw === 'string' &&
            /^\\d{1,2}:\\d{2}:\\d{2}/.test(
                original.raw.trim()
            );

        let result =
            String(hours).padStart(2, '0') +
            ':' +
            String(minutes).padStart(2, '0');

        if (hasExplicitSeconds) {
            result +=
                ':' +
                String(seconds).padStart(2, '0');
        }

        if (original) {
            result += original.suffix || '';
        }

        return result;
    }

    function addMinutes(value, minutes) {
        const parsed =
            parseTime(value);

        if (!parsed) {
            return value;
        }

        const offset =
            normalizeOffset(minutes);

        if (offset === 0) {
            return value;
        }

        const totalSeconds =
            parsed.hours * 3600 +
            parsed.minutes * 60 +
            parsed.seconds +
            offset * 60;

        return formatTime(
            totalSeconds,
            parsed
        );
    }

    function applyToObject(
        prayerTimes,
        offsets
    ) {
        if (
            !prayerTimes ||
            typeof prayerTimes !== 'object'
        ) {
            return prayerTimes;
        }

        const sourceOffsets =
            offsets || getOffsets();

        const result = {
            ...prayerTimes
        };

        PRAYER_KEYS.forEach(
            function (key) {
                if (
                    !Object.prototype.hasOwnProperty
                        .call(
                            result,
                            key
                        )
                ) {
                    return;
                }

                const offset =
                    normalizeOffset(
                        sourceOffsets[key]
                    );

                if (offset === 0) {
                    return;
                }

                result[key] =
                    addMinutes(
                        result[key],
                        offset
                    );
            }
        );

        return result;
    }

    function apply(
        prayerTimes
    ) {
        return applyToObject(
            prayerTimes,
            getOffsets()
        );
    }

    function getContext() {
        const offsets =
            getOffsets();

        return {
            version: VERSION,
            offsets: {
                fajr:
                    normalizeOffset(
                        offsets.fajr
                    ),
                sunrise:
                    normalizeOffset(
                        offsets.sunrise
                    ),
                dhuhr:
                    normalizeOffset(
                        offsets.dhuhr
                    ),
                asr:
                    normalizeOffset(
                        offsets.asr
                    ),
                maghrib:
                    normalizeOffset(
                        offsets.maghrib
                    ),
                isha:
                    normalizeOffset(
                        offsets.isha
                    )
            }
        };
    }

    window.AdhanPrayerOffsetEngine =
        Object.freeze({
            version: VERSION,
            prayerKeys: PRAYER_KEYS,
            getOffsets,
            normalizeOffset,
            parseTime,
            addMinutes,
            applyToObject,
            apply,
            getContext
        });
})();
