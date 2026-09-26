/*
 * Adhan Display
 * Default Dark Mode Boot
 *
 * Dark mode is the default when no explicit theme preference exists.
 *
 * IMPORTANT:
 * If the user has explicitly selected light mode, that preference
 * remains respected.
 */

(function () {
    'use strict';

    try {
        const root = document.documentElement;

        /*
         * Look for an existing explicit theme preference.
         *
         * The application has used several storage abstractions over
         * its lifetime, so we inspect theme-related localStorage keys
         * rather than assuming a single key name.
         */
        let explicitTheme = null;

        const themeKeys = [];

        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);

            if (!key) {
                continue;
            }

            if (/theme|appearance/i.test(key)) {
                themeKeys.push(key);
            }
        }

        /*
         * Prefer the most obvious direct theme values.
         */
        for (const key of themeKeys) {
            const value = localStorage.getItem(key);

            if (value === 'dark' || value === 'light') {
                explicitTheme = value;
                break;
            }

            /*
             * Also support JSON settings objects containing theme.
             */
            if (value) {
                try {
                    const parsed = JSON.parse(value);

                    if (
                        parsed &&
                        typeof parsed === 'object' &&
                        (parsed.theme === 'dark' || parsed.theme === 'light')
                    ) {
                        explicitTheme = parsed.theme;
                        break;
                    }
                } catch {
                    /* Not JSON. Continue searching. */
                }
            }
        }

        /*
         * Existing DOM preference is also respected.
         */
        const existingTheme =
            root.getAttribute('data-theme');

        if (
            existingTheme === 'dark' ||
            existingTheme === 'light'
        ) {
            explicitTheme = existingTheme;
        }

        /*
         * Dark is the default only when the user has not explicitly
         * selected a theme.
         */
        const theme =
            explicitTheme === 'light'
                ? 'light'
                : 'dark';

        root.setAttribute('data-theme', theme);

        /*
         * Set a lightweight marker so the CSS and application can
         * immediately understand that dark is the default mode.
         */
        root.setAttribute(
            'data-default-theme',
            'dark'
        );

    } catch {
        /*
         * Never prevent the application from loading because of
         * localStorage or browser privacy restrictions.
         */
    }
})();
