import { Storage } from './storage.js';

export const state = {
    page: 'home',

    prayer: {
        data: null,
        month: [],
        next: null,
        previous: null,
        loading: false,
        error: null
    },

    location: {
        lat: null,
        lon: null,
        city: null
    },

    quran: {
        surahs: [],
        editions: [],
        audioEditions: [],

        selectedSurah: null,
        selectedAyah: null,

        selectedTranslation: '',
        selectedLanguage: '',

        selectedReciter: 'ar.alafasy',

        currentView: 'surahs',

        ayahs: [],
        juz: null,

        bookmarks: [],
        lastRead: null,

        fontSize: 100,
        autoPlay: true,

        loading: false,
        error: null
    },

    ui: {
        sidebarOpen: false,
        settingsOpen: false,
        darkMode: false,
        displaySize: 'normal'
    }
};


export function initializeState() {

    const location = {
        lat: Number(Storage.getRaw('lat', 52.0907)),
        lon: Number(Storage.getRaw('lon', 5.1214)),
        city: Storage.getRaw('city', 'Netherlands')
    };

    state.location = location;


    const settings = Storage.getSettings();

    state.ui.darkMode =
        localStorage.getItem('ad2_theme') === 'dark' ||
        settings.theme === 'dark';

    state.ui.displaySize =
        ['compact', 'normal', 'large'].includes(settings.size)
            ? settings.size
            : 'normal';


    try {
        const quranStorage =
            JSON.parse(
                localStorage.getItem('ad2_quran_state') || '{}'
            );

        state.quran.selectedTranslation =
            quranStorage.selectedTranslation || '';

        state.quran.selectedLanguage =
            quranStorage.selectedLanguage || '';

        state.quran.selectedReciter =
            quranStorage.selectedReciter || 'ar.alafasy';

        state.quran.fontSize =
            Number(quranStorage.fontSize || 100);

        state.quran.autoPlay =
            quranStorage.autoPlay !== false;

        state.quran.lastRead =
            quranStorage.lastRead || null;

        state.quran.bookmarks =
            Array.isArray(quranStorage.bookmarks)
                ? quranStorage.bookmarks
                : [];

    } catch {
        console.warn(
            '[Adhan Display 2.0] Quran state could not be restored.'
        );
    }


    applyTheme();
    applyDisplaySize(state.ui.displaySize);

    return state;
}


export function saveQuranState() {

    localStorage.setItem(
        'ad2_quran_state',
        JSON.stringify({
            selectedTranslation:
                state.quran.selectedTranslation,

            selectedLanguage:
                state.quran.selectedLanguage,

            selectedReciter:
                state.quran.selectedReciter,

            fontSize:
                state.quran.fontSize,

            autoPlay:
                state.quran.autoPlay,

            lastRead:
                state.quran.lastRead,

            bookmarks:
                state.quran.bookmarks
        })
    );
}


export function applyTheme() {

    document.documentElement.dataset.theme =
        state.ui.darkMode
            ? 'dark'
            : 'light';

    localStorage.setItem(
        'ad2_theme',
        state.ui.darkMode
            ? 'dark'
            : 'light'
    );
}


export function applyDisplaySize(size = state.ui.displaySize) {

    const allowedSizes = [
        'compact',
        'normal',
        'large'
    ];

    const normalizedSize = allowedSizes.includes(size)
        ? size
        : 'normal';

    state.ui.displaySize = normalizedSize;

    document.documentElement.dataset.size =
        normalizedSize;

    return normalizedSize;
}


export function toggleTheme() {

    state.ui.darkMode =
        !state.ui.darkMode;

    applyTheme();

    return state.ui.darkMode;
}
