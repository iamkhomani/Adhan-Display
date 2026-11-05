/* Runs before first paint (classic script in <head>): theme, size, language and direction. */
/* Apply the saved theme before the page paints. Dark is the default. */
(function () {
    try {
        var root = document.documentElement;
        var theme = localStorage.getItem('adhan_theme') || localStorage.getItem('ad2_theme') || 'dark';
        if (theme === 'system') {
            theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
        var size = localStorage.getItem('adhan_size');
        if (size === 'compact' || size === 'large') {
            root.setAttribute('data-size', size);
        }
    } catch (error) {
        /* Storage unavailable: keep the dark default. */
    }

    /* Language and text direction, so Arabic and Urdu start right-to-left without a flash. */
    try {
        var supported = ['en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ru', 'ur', 'nl'];
        var lang = null;
        try {
            lang = localStorage.getItem('adhan_lang');
        } catch (error) {
            lang = null;
        }
        if (supported.indexOf(lang) === -1) {
            lang = 'en';
            var wanted = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
            for (var i = 0; i < wanted.length; i += 1) {
                var code = String(wanted[i]).slice(0, 2).toLowerCase();
                if (supported.indexOf(code) !== -1) {
                    lang = code;
                    break;
                }
            }
        }
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr');
    } catch (error) {
        /* Keep English. */
    }
})();
