import { state } from './state.js';

const routes = new Set([
    'home',
    'quran',
    'hadith',
    'prayer',
    'islamic',
    'discover',
    'settings'
]);

export function getCurrentRoute() {
    const hash = window.location.hash.replace('#', '').trim();

    if (!hash || !routes.has(hash)) {
        return 'home';
    }

    return hash;
}

export function navigate(route) {
    if (!routes.has(route)) {
        route = 'home';
    }

    state.page = route;

    if (window.location.hash !== `#${route}`) {
        window.location.hash = route;
    }

    window.dispatchEvent(
        new CustomEvent('adhan:navigate', {
            detail: { route }
        })
    );
}

export function initializeRouter() {
    state.page = getCurrentRoute();

    window.addEventListener('hashchange', () => {
        state.page = getCurrentRoute();

        window.dispatchEvent(
            new CustomEvent('adhan:navigate', {
                detail: { route: state.page }
            })
        );
    });

    return state.page;
}
