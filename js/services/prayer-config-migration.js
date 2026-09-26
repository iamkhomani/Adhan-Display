// Adhan Display
// Prayer Configuration Migration
//
// Phase 2 Prayer Engine V4

(function () {
    'use strict';

    const LEGACY_KEYS = [
        'prayer-settings',
        'prayerSettings',
        'adhan-prayer-settings',
        'adhan-display-prayer-settings'
    ];

    function getCurrent() {
        if (
            window.AdhanPrayerConfig &&
            typeof window.AdhanPrayerConfig.get === 'function'
        ) {
            return window.AdhanPrayerConfig.get();
        }

        return null;
    }

    function findLegacyConfig() {
        for (const key of LEGACY_KEYS) {
            try {
                const raw =
                    window.localStorage.getItem(key);

                if (raw) {
                    return {
                        key,
                        value: JSON.parse(raw)
                    };
                }
            } catch (error) {
                console.warn(
                    '[PrayerConfigMigration] Invalid legacy value',
                    key
                );
            }
        }

        return null;
    }

    function migrate() {
        if (
            !window.AdhanPrayerConfig ||
            typeof window.AdhanPrayerConfig.save !== 'function'
        ) {
            return {
                migrated: false,
                reason: 'configuration service unavailable'
            };
        }

        const current = getCurrent();

        const legacy = findLegacyConfig();

        if (!legacy) {
            return {
                migrated: false,
                reason: 'no legacy configuration found',
                config: current
            };
        }

        try {
            const saved =
                window.AdhanPrayerConfig.save(
                    legacy.value
                );

            return {
                migrated: true,
                source: legacy.key,
                config: saved
            };

        } catch (error) {
            console.warn(
                '[PrayerConfigMigration] Migration failed',
                error
            );

            return {
                migrated: false,
                reason: 'migration error',
                error
            };
        }
    }

    window.AdhanPrayerConfigMigration = Object.freeze({
        migrate
    });
})();
