import { state } from './state.js';

const routes = new Set([
    'home',
    'dashboard',
    'quran',
    'hadith',
    'prayer',
    'islamic',
    'discover',
    'settings'
]);

function normalizeRoute(route) {
    if (route === 'dashboard') {
        return 'home';
    }

    return route;
}

export function getCurrentRoute() {
    const hash = window.location.hash
        .replace('#', '')
        .trim();

    if (!hash || !routes.has(hash)) {
        return 'home';
    }

    return normalizeRoute(hash);
}

export function navigate(route) {
    if (!routes.has(route)) {
        route = 'home';
    }

    const normalizedRoute = normalizeRoute(route);

    state.page = normalizedRoute;

    const publicRoute =
        normalizedRoute === 'home'
            ? 'dashboard'
            : normalizedRoute;

    if (window.location.hash !== `#${publicRoute}`) {
        window.location.hash = publicRoute;
    }

    window.dispatchEvent(
        new CustomEvent('adhan:navigate', {
            detail: { route: normalizedRoute }
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
