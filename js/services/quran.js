/*
 * Quran data (alquran.cloud), recitation audio (islamic.network CDN),
 * tafsir (quran.com) and the reader's saved preferences.
 */

import { store } from '../core/storage.js';
import { bus } from '../core/bus.js';
import { cachedJson, fetchJson, ENDPOINTS } from './api.js';
import { t, lang } from '../core/i18n.js';

const PREFS_KEY = 'ad2_quran_state';

const LANGUAGE_DEFAULTS = {
    en: 'en.sahih', nl: 'nl.siregar', de: 'de.aburida', fr: 'fr.hamidullah', tr: 'tr.diyanet',
    id: 'id.indonesian', ur: 'ur.jalandhry', es: 'es.cortes', ru: 'ru.kuliev', bn: 'bn.bengali',
    ms: 'ms.basmeih', it: 'it.piccardo', pt: 'pt.elhayek', sq: 'sq.ahmeti', bs: 'bs.korkut', fa: 'fa.makarem',
    zh: 'zh.jian', hi: 'hi.hindi', ar: 'ar.muyassar'
};

const FALLBACK_TRANSLATION = 'en.sahih';

/* The interface language first; for English, the browser language (German, Turkish, ...) still counts. */
function defaultTranslation(language = lang().code) {
    if (language !== 'en' && LANGUAGE_DEFAULTS[language]) {
        return LANGUAGE_DEFAULTS[language];
    }
    const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return LANGUAGE_DEFAULTS[browser] || FALLBACK_TRANSLATION;
}

export const quranPrefs = {
    get() {
        const saved = store.readExternal(PREFS_KEY, {}) || {};

        return {
            selectedTranslation: saved.selectedTranslation || defaultTranslation(),
            selectedReciter: saved.selectedReciter || 'ar.alafasy',
            fontSize: Math.min(160, Math.max(80, Number(saved.fontSize) || 100)),
            autoPlay: saved.autoPlay !== false,
            showTranslation: saved.showTranslation !== false,
            lastRead: saved.lastRead && saved.lastRead.surah ? saved.lastRead : null,
            khatm: saved.khatm && /^\d{4}-\d{2}-\d{2}$/.test(saved.khatm.start) && Number(saved.khatm.days) > 0
                ? { start: saved.khatm.start, days: Number(saved.khatm.days), done: Math.max(0, Number(saved.khatm.done) || 0) }
                : null,
            bookmarks: Array.isArray(saved.bookmarks) ? saved.bookmarks : []
        };
    },

    /* After a language change: switch the translation too, unless the user picked a different one. */
    followLanguage(previous, next) {
        const current = this.get().selectedTranslation;
        if (current === defaultTranslation(previous) || current === FALLBACK_TRANSLATION) {
            this.update({ selectedTranslation: defaultTranslation(next) });
        }
    },

    update(patch) {
        const next = { ...this.get(), ...patch };
        store.writeExternal(PREFS_KEY, next);
        bus.emit('quran-prefs', patch);
        return next;
    },

    isBookmarked(globalNumber) {
        return this.get().bookmarks.some(item => Number(item.number) === Number(globalNumber));
    },

    toggleBookmark(ayah) {
        const bookmarks = this.get().bookmarks;
        const index = bookmarks.findIndex(item => Number(item.number) === Number(ayah.number));

        if (index >= 0) {
            bookmarks.splice(index, 1);
        } else {
            bookmarks.unshift({
                number: ayah.number,
                surah: ayah.surah,
                ayah: ayah.numberInSurah,
                surahName: ayah.surahName || '',
                text: ayah.text,
                translationText: ayah.translation || '',
                savedAt: new Date().toISOString()
            });
        }

        this.update({ bookmarks });
        return index < 0;
    }
};

/* ---------------------------------------------------------------
 * Data
 * ------------------------------------------------------------- */

const memory = new Map();

function remember(key, promiseFactory, limit = 12) {
    if (memory.has(key)) {
        return memory.get(key);
    }

    const promise = promiseFactory().catch(error => {
        memory.delete(key);
        throw error;
    });

    memory.set(key, promise);

    if (memory.size > limit) {
        memory.delete(memory.keys().next().value);
    }

    return promise;
}

async function quranApi(path) {
    const json = await fetchJson(`${ENDPOINTS.quran}${path}`);

    if (json?.code && json.code !== 200) {
        throw new Error(typeof json.data === 'string' ? json.data : t('error.quranService'));
    }

    return json.data;
}

export function surahList() {
    return remember('surahs', () => cachedJson('q_surahs', `${ENDPOINTS.quran}/surah`, 24 * 30, json =>
        (json?.data || []).map(surah => ({
            number: surah.number,
            name: surah.name,
            englishName: surah.englishName,
            meaning: surah.englishNameTranslation,
            ayahs: surah.numberOfAyahs,
            type: surah.revelationType
        }))
    ));
}

export function translations() {
    return remember('translations', () => cachedJson('q_translations', `${ENDPOINTS.quran}/edition?format=text&type=translation`, 24 * 7, json =>
        (json?.data || []).map(edition => ({
            id: edition.identifier,
            language: edition.language,
            name: edition.englishName || edition.name || edition.identifier
        }))
    ));
}

export function reciters() {
    return remember('reciters', () => cachedJson('q_reciters', `${ENDPOINTS.quran}/edition?format=audio&type=versebyverse`, 24 * 7, json =>
        (json?.data || [])
            .filter(edition => edition.language === 'ar')
            .map(edition => ({
                id: edition.identifier,
                name: edition.englishName || edition.name || edition.identifier
            }))
    ));
}

/* ---------------------------------------------------------------
 * Text helpers
 * ------------------------------------------------------------- */

const BASMALA = 'بسم الله الرحمن الرحيم';

function plainArabic(text) {
    return String(text)
        .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ﻿]/g, '')
        .replace(/[ٱأإآ]/g, 'ا')
        .replace(/\s+/g, ' ')
        .trim();
}

/* The API prefixes the first ayah of most surahs with the basmala; it is shown as a heading instead. */
function stripBasmala(text) {
    const clean = String(text).replace(/^﻿/, '');
    const words = clean.split(/\s+/);

    if (words.length > 4 && plainArabic(words.slice(0, 4).join(' ')) === BASMALA) {
        return words.slice(4).join(' ');
    }

    return clean;
}

function mergeEditions(arabic, translated, surahInfo = null) {
    const byNumber = new Map((translated?.ayahs || []).map(ayah => [ayah.number, ayah.text]));

    return (arabic?.ayahs || []).map(ayah => {
        const surah = surahInfo || ayah.surah || {};
        const surahNumber = Number(surah.number);
        let text = ayah.text || '';

        if (ayah.numberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9) {
            text = stripBasmala(text);
        }

        return {
            number: ayah.number,
            numberInSurah: ayah.numberInSurah,
            surah: surahNumber,
            surahName: surah.englishName || '',
            juz: ayah.juz,
            sajda: Boolean(ayah.sajda),
            text,
            translation: byNumber.get(ayah.number) || ''
        };
    });
}

export function surah(number, translation) {
    return remember(`surah:${number}:${translation}`, async () => {
        const data = await quranApi(`/surah/${number}/editions/quran-uthmani,${encodeURIComponent(translation)}`);
        const editions = Array.isArray(data) ? data : [];
        const arabic = editions.find(edition => edition.edition?.identifier === 'quran-uthmani') || editions[0];
        const translated = editions.find(edition => edition.edition?.identifier === translation);

        if (!arabic) {
            throw new Error(t('quran.loadFailed'));
        }

        return {
            info: {
                number: arabic.number,
                name: arabic.name,
                englishName: arabic.englishName,
                meaning: arabic.englishNameTranslation,
                ayahs: arabic.numberOfAyahs,
                type: arabic.revelationType
            },
            ayahs: mergeEditions(arabic, translated, arabic)
        };
    });
}

export function juz(number, translation) {
    return remember(`juz:${number}:${translation}`, async () => {
        const [arabic, translated] = await Promise.all([
            quranApi(`/juz/${number}/quran-uthmani`),
            quranApi(`/juz/${number}/${encodeURIComponent(translation)}`).catch(() => null)
        ]);

        return { number, ayahs: mergeEditions(arabic, translated) };
    });
}

export async function searchQuran(query, edition) {
    const data = await quranApi(`/search/${encodeURIComponent(query)}/all/${encodeURIComponent(edition)}`)
        .catch(error => {
            if (error.status === 404) {
                return { count: 0, matches: [] };
            }
            throw error;
        });

    return {
        count: Number(data?.count) || 0,
        matches: (data?.matches || []).map(match => ({
            number: match.number,
            surah: match.surah?.number,
            surahName: match.surah?.englishName || '',
            numberInSurah: match.numberInSurah,
            text: match.text
        }))
    };
}

/* One ayah (by global number 1-6236) with translation, cached for a week. */
export function ayahWithTranslation(globalNumber, translation) {
    const key = `q_ayah_${globalNumber}_${translation}`;
    const url = `${ENDPOINTS.quran}/ayah/${globalNumber}/editions/quran-uthmani,${encodeURIComponent(translation)}`;

    return cachedJson(key, url, 24 * 7, json => {
        const list = Array.isArray(json?.data) ? json.data : [];
        const arabic = list[0];
        const translated = list[1];

        if (!arabic) {
            throw new Error(t('quran.ayahNotFound'));
        }

        let text = arabic.text || '';
        if (arabic.numberInSurah === 1 && arabic.surah?.number !== 1 && arabic.surah?.number !== 9) {
            text = stripBasmala(text);
        }

        return {
            number: arabic.number,
            text,
            translation: translated?.text || '',
            surah: arabic.surah?.number,
            surahName: arabic.surah?.englishName || '',
            numberInSurah: arabic.numberInSurah
        };
    });
}

export function ayahOfTheDay(dayNumber) {
    /* 2003 and 6236 share no factor, so this visits every ayah before repeating. */
    return ((dayNumber * 2003) % 6236 + 6236) % 6236 + 1;
}

const BITRATES = ['128', '64', '192', '48', '40', '32'];

export function audioUrl(reciter, globalNumber, attempt = 0) {
    const bitrate = BITRATES[attempt];
    return bitrate ? `${ENDPOINTS.quranAudio}/${bitrate}/${encodeURIComponent(reciter)}/${globalNumber}.mp3` : null;
}

export async function tafsir(surahNumber, ayahNumber) {
    const json = await fetchJson(`${ENDPOINTS.tafsir}/${surahNumber}:${ayahNumber}`);
    return {
        name: json?.tafsir?.resource_name || json?.tafsir?.translated_name?.name || t('quran.tafsirName'),
        html: json?.tafsir?.text || ''
    };
}

/* Allow only simple formatting tags in tafsir HTML from the API. */
export function sanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html);
    const allowed = new Set(['P', 'BR', 'STRONG', 'EM', 'B', 'I', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'SPAN']);

    template.content.querySelectorAll('script, style, iframe, object, embed, noscript, template, img, svg, video, audio, form').forEach(element => element.remove());

    [...template.content.querySelectorAll('*')].forEach(element => {
        if (!element.isConnected && !template.content.contains(element)) {
            return;
        }
        if (!allowed.has(element.tagName)) {
            element.replaceWith(document.createTextNode(element.textContent || ''));
            return;
        }
        [...element.attributes].forEach(attribute => {
            if (!(element.tagName === 'SPAN' && attribute.name === 'lang')) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    return template.innerHTML;
}
