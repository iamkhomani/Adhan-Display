/*
 * Translations.
 *
 * English (js/i18n/en.js) is the base and is always loaded. The chosen
 * language is loaded once at start-up; missing keys fall back to English.
 *
 * t('key', { name: 'Fajr' }) replaces {name}. Plural entries are objects
 * ({ one, few, many, other }) and are chosen with Intl.PluralRules using
 * params.count.
 */

import { store } from './storage.js';
import en from '../i18n/en.js';

export const LANGUAGES = [
    { code: 'en', name: 'English', locale: 'en-GB', dir: 'ltr' },
    { code: 'zh', name: '中文', locale: 'zh-CN', dir: 'ltr' },
    { code: 'hi', name: 'हिन्दी', locale: 'hi-IN', dir: 'ltr' },
    { code: 'es', name: 'Español', locale: 'es-ES', dir: 'ltr' },
    { code: 'fr', name: 'Français', locale: 'fr-FR', dir: 'ltr' },
    { code: 'ar', name: 'العربية', locale: 'ar', dir: 'rtl' },
    { code: 'bn', name: 'বাংলা', locale: 'bn-BD', dir: 'ltr' },
    { code: 'pt', name: 'Português', locale: 'pt-BR', dir: 'ltr' },
    { code: 'ru', name: 'Русский', locale: 'ru-RU', dir: 'ltr' },
    { code: 'ur', name: 'اردو', locale: 'ur-PK', dir: 'rtl' },
    { code: 'nl', name: 'Nederlands', locale: 'nl-NL', dir: 'ltr' }
];

let current = LANGUAGES[0];
let dict = en;
let plural = new Intl.PluralRules(current.locale);

function supported(code) {
    return LANGUAGES.find(lang => lang.code === code) || null;
}

/* Saved choice, otherwise the browser language, otherwise English. */
export function detectLanguage() {
    const saved = supported(store.raw('lang'));

    if (saved) {
        return saved.code;
    }

    const wanted = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];

    for (const tag of wanted) {
        const match = supported(String(tag).slice(0, 2).toLowerCase());
        if (match) {
            return match.code;
        }
    }

    return 'en';
}

export async function loadLanguage(code = detectLanguage()) {
    const lang = supported(code) || LANGUAGES[0];

    if (lang.code !== 'en') {
        try {
            dict = (await import(`../i18n/${lang.code}.js`)).default;
        } catch (error) {
            console.warn('[Adhan Display] Language file could not be loaded', lang.code, error);
            dict = en;
        }
    } else {
        dict = en;
    }

    current = dict === en ? LANGUAGES[0] : lang;
    plural = new Intl.PluralRules(current.locale);

    const root = document.documentElement;
    root.lang = current.code;
    root.dir = current.dir;

    return current;
}

export function lang() {
    return current;
}

/* Locale for Intl formatting, always with Latin digits so times and dates match. */
export function locale() {
    return `${current.locale}-u-nu-latn`;
}

export function isRtl() {
    return current.dir === 'rtl';
}

function lookup(key) {
    return dict[key] ?? en[key];
}

export function t(key, params = {}) {
    let value = lookup(key);

    if (value === undefined) {
        console.warn('[Adhan Display] Missing translation', key);
        return key;
    }

    if (value && typeof value === 'object') {
        const category = plural.select(Number(params.count) || 0);
        value = value[category] ?? value.other ?? '';
    }

    return String(value).replace(/\{(\w+)\}/g, (match, name) =>
        params[name] !== undefined ? String(params[name]) : match
    );
}

/* True when the active language has its own text for this key. */
export function has(key) {
    return dict[key] !== undefined || en[key] !== undefined;
}
