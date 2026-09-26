// Adhan Display
// Prayer Configuration Bootstrap
//
// Phase 2 Prayer Engine V4

(function () {
    'use strict';

    function initialize() {
        if (
            window.AdhanPrayerConfigMigration &&
            typeof window.AdhanPrayerConfigMigration.migrate === 'function'
        ) {
            return window.AdhanPrayerConfigMigration.migrate();
        }

        return {
            migrated: false,
            reason: 'migration service unavailable'
        };
    }

    window.AdhanPrayerConfigBootstrap = Object.freeze({
        initialize
    });

    if (
        document.readyState === 'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
