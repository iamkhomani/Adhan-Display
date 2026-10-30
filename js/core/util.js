/*
 * Small shared helpers. No dependencies.
 */

export function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const pad2 = value => String(value).padStart(2, '0');

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function debounce(fn, wait = 300) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* Whole days since 1 Jan 1970 in the device's local calendar. */
export function dayNumber(date = new Date()) {
    return Math.floor(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
    );
}

/* Deterministic "item of the day" that walks through a list without repeating early. */
export function pickOfDay(list, salt = 0, date = new Date()) {
    if (!list?.length) {
        return null;
    }
    return list[(dayNumber(date) + salt) % list.length];
}

/* Highlight a search term inside plain text (returns escaped HTML). */
export function highlight(text, query) {
    const source = String(text ?? '');
    const term = String(query ?? '').trim();

    if (!term) {
        return esc(source);
    }

    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let output = '';
    let last = 0;

    source.replace(pattern, (match, offset) => {
        output += esc(source.slice(last, offset)) + `<mark>${esc(match)}</mark>`;
        last = offset + match.length;
        return match;
    });

    return output + esc(source.slice(last));
}

export function plural(count, one, many = `${one}s`) {
    return `${count} ${count === 1 ? one : many}`;
}

export function isFiniteCoord(lat, lon) {
    return Number.isFinite(lat) && Number.isFinite(lon) &&
        Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export function reducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
