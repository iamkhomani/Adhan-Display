/*
 * Hadith: browse collections, read one hadith at a time, search, bookmark
 * and share. Data from ummahapi.com.
 */

import { esc, highlight } from '../core/util.js';
import { icon } from '../core/icons.js';
import { store } from '../core/storage.js';
import { spinner, emptyState, shareText, toast } from '../core/ui.js';
import { fetchJson, cachedJson, ENDPOINTS } from '../services/api.js';
import { HADITH_COLLECTIONS } from '../data/content.js';
import { pageHeader } from './components.js';

const SITE = 'https://adhandisplay.com/';

const state = {
    collections: HADITH_COLLECTIONS,
    collection: 'bukhari',
    hadith: null,
    position: null,
    loading: false,
    error: '',
    query: '',
    results: null,
    showSaved: false
};

let requestId = 0;

/* ---------------------------------------------------------------
 * API normalisation (tolerant of small differences in the response)
 * ------------------------------------------------------------- */

function text(...values) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return '';
}

function deepText(object, pattern) {
    if (!object || typeof object !== 'object') {
        return '';
    }
    for (const [key, value] of Object.entries(object)) {
        if (pattern.test(key) && typeof value === 'string' && value.trim().length > 20) {
            return value.trim();
        }
    }
    return '';
}

function unwrap(payload) {
    let data = payload?.data !== undefined ? payload.data : payload;
    if (data?.hadith && typeof data.hadith === 'object' && !Array.isArray(data.hadith)) {
        data = data.hadith;
    }
    return data;
}

function listFrom(payload) {
    const data = payload?.data !== undefined ? payload.data : payload;
    const list = data?.hadiths || data?.results || data?.items || data?.data || (Array.isArray(data) ? data : []);
    return Array.isArray(list) ? list : [];
}

function normalise(raw, fallbackCollection) {
    const source = raw?.hadith && typeof raw.hadith === 'object' ? raw.hadith : raw;

    if (!source || typeof source !== 'object') {
        return null;
    }

    const english = text(
        source.hadith_english, source.english?.text, source.english, source.text_en, source.englishText,
        source.english_text, source.translation, source.text?.en, typeof source.text === 'string' ? source.text : ''
    ) || deepText(source, /english|_en$/i);

    const arabic = text(
        source.hadith_arabic, source.arabic?.text, source.arabic, source.text_ar, source.arabicText,
        source.arabic_text, source.text?.ar
    ) || deepText(source, /arabic|_ar$/i);

    let number = source.hadith_number ?? source.hadithNumber ?? source.number ?? source.hadith_no ?? '';

    if (number === '' && source.id !== undefined) {
        number = String(source.id).match(/(\d+(?:\.\d+)?)$/)?.[1] || '';
    }

    const collection = text(source.collection_key, typeof source.collection === 'string' ? source.collection : '',
        source.collection?.key, source.book_key) || fallbackCollection;

    if (!english && !arabic) {
        return null;
    }

    return {
        collection,
        number: String(number),
        english,
        arabic,
        narrator: text(source.narrator, source.english?.narrator, source.narrator_english, source.narrated_by),
        book: text(source.book_name, typeof source.book === 'string' ? source.book : '', source.book?.name, source.bookName),
        chapter: text(source.chapter_english, source.chapter_name, typeof source.chapter === 'string' ? source.chapter : '', source.chapter?.name, source.chapterName),
        grade: text(source.grade, source.grades?.[0]?.grade, source.status)
    };
}

function collectionName(key) {
    return state.collections.find(item => item.key === key)?.name || key;
}

async function loadCollections() {
    try {
        const payload = await cachedJson('hadith_collections2', `${ENDPOINTS.hadith}/collections`, 24 * 7, json => json);
        const data = payload?.data !== undefined ? payload.data : payload;
        const list = data?.collections || (Array.isArray(data) ? data : []);

        if (list.length) {
            state.collections = list.map(item => {
                const fallback = HADITH_COLLECTIONS.find(entry => entry.key === (item.key || item.slug || item.id));
                return {
                    key: item.key || item.slug || item.id,
                    name: fallback?.name || item.name || item.english_name || item.key,
                    arabic: item.arabic_name || fallback?.arabic || '',
                    total: Number(item.total_hadiths || item.total || item.count) || null
                };
            }).filter(item => item.key);
        }
    } catch {
        /* Keep the built-in list. */
    }
}

async function load(kind, value, rerender) {
    const id = ++requestId;
    state.loading = true;
    state.error = '';
    rerender();

    const collection = state.collection;
    let url;

    if (kind === 'random') {
        url = `${ENDPOINTS.hadith}/random?collection=${encodeURIComponent(collection)}`;
    } else if (kind === 'position') {
        url = `${ENDPOINTS.hadith}/${encodeURIComponent(collection)}?page=${value}&limit=1`;
    } else {
        url = `${ENDPOINTS.hadith}/${encodeURIComponent(collection)}/${encodeURIComponent(value)}`;
    }

    try {
        const payload = await fetchJson(url);

        if (id !== requestId) {
            return;
        }

        const raw = kind === 'position' ? listFrom(payload)[0] : unwrap(payload);
        const hadith = normalise(raw, collection);

        if (!hadith) {
            throw new Error(kind === 'position' ? 'There are no more hadith in this collection.' : 'This hadith was not found.');
        }

        state.hadith = hadith;
        state.collection = hadith.collection || collection;
        state.position = kind === 'position' ? Number(value) : null;

        const hash = `#hadith/${state.collection}/${hadith.number}`;
        if (hadith.number && location.hash !== hash) {
            history.replaceState(null, '', hash);
        }
    } catch (error) {
        if (id === requestId) {
            state.error = error.status === 404 ? 'This hadith was not found. Try another number.' : error.message;
        }
    } finally {
        if (id === requestId) {
            state.loading = false;
            rerender();
        }
    }
}

async function search(query, rerender) {
    state.query = query;

    if (!query) {
        state.results = null;
        rerender();
        return;
    }

    state.results = 'loading';
    rerender();

    try {
        const params = new URLSearchParams({ q: query, limit: '25' });
        if (state.collection) {
            params.set('collection', state.collection);
        }
        const payload = await fetchJson(`${ENDPOINTS.hadith}/search?${params}`);
        state.results = listFrom(payload).map(item => normalise(item, state.collection)).filter(Boolean);
    } catch (error) {
        state.results = { error: error.message };
    }

    rerender();
}

/* ---------------------------------------------------------------
 * Bookmarks (same key as before: adhan_hadith_bookmarks)
 * ------------------------------------------------------------- */

function bookmarks() {
    const list = store.get('hadith_bookmarks', []);
    return Array.isArray(list) ? list : [];
}

function bookmarkId(hadith) {
    return `${hadith.collection}:${hadith.number}`;
}

function isSaved(hadith) {
    return bookmarks().some(item => item.id === bookmarkId(hadith));
}

function toggleSaved(hadith) {
    const list = bookmarks();
    const id = bookmarkId(hadith);
    const index = list.findIndex(item => item.id === id);

    if (index >= 0) {
        list.splice(index, 1);
    } else {
        list.unshift({
            id,
            collection: hadith.collection,
            collectionName: collectionName(hadith.collection),
            number: hadith.number,
            arabic: hadith.arabic,
            english: hadith.english,
            narrator: hadith.narrator,
            savedAt: new Date().toISOString()
        });
    }

    store.set('hadith_bookmarks', list);
    return index < 0;
}

/* ---------------------------------------------------------------
 * Rendering
 * ------------------------------------------------------------- */

function readerHTML() {
    if (state.loading) {
        return `<article class="panel hadith-card">${spinner('Loading hadith')}</article>`;
    }

    if (state.error) {
        return `<article class="panel hadith-card">${emptyState({
            title: state.error,
            action: `<button type="button" class="button button-primary" data-hadith="random">${icon('refresh')} Show a random hadith</button>`
        })}</article>`;
    }

    const hadith = state.hadith;

    if (!hadith) {
        return `<article class="panel hadith-card">${spinner('Loading hadith')}</article>`;
    }

    const saved = isSaved(hadith);
    const meta = [hadith.book, hadith.chapter].filter(Boolean);

    return `
        <article class="panel hadith-card" aria-labelledby="hadith-title">
            <header class="hadith-head">
                <div>
                    <p class="hadith-collection">${esc(collectionName(hadith.collection))}</p>
                    <h2 id="hadith-title" class="hadith-number">Hadith ${esc(hadith.number)}</h2>
                </div>
                <div class="hadith-tools">
                    <button type="button" class="icon-button ${saved ? 'is-on' : ''}" data-hadith="save" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save hadith'}">${icon(saved ? 'bookmarkFilled' : 'bookmark')}</button>
                    <button type="button" class="icon-button" data-hadith="share" aria-label="Share hadith">${icon('share')}</button>
                </div>
            </header>

            ${hadith.narrator ? `<p class="hadith-narrator">${esc(hadith.narrator)}</p>` : ''}
            ${hadith.arabic ? `<p class="hadith-arabic" lang="ar" dir="rtl">${esc(hadith.arabic)}</p>` : ''}
            ${hadith.english ? `<div class="hadith-english">${esc(hadith.english).replace(/\n+/g, '<br>')}</div>` : ''}

            <footer class="hadith-foot">
                ${meta.length ? `<p class="hadith-meta">${meta.map(esc).join('<br>')}</p>` : ''}
                ${hadith.grade ? `<span class="badge">${esc(hadith.grade)}</span>` : ''}
            </footer>

            <nav class="hadith-nav" aria-label="Browse hadith">
                <button type="button" class="button button-ghost" data-hadith="prev" ${canGoBack() ? '' : 'disabled'}>${icon('left', { size: 18 })} Previous</button>
                <button type="button" class="button button-ghost" data-hadith="random">${icon('refresh', { size: 18 })} Random</button>
                <button type="button" class="button button-ghost" data-hadith="next">Next ${icon('right', { size: 18 })}</button>
            </nav>

            <form class="goto" data-hadith-goto>
                <label for="hadith-number">Go to number</label>
                <input id="hadith-number" name="number" inputmode="decimal" autocomplete="off" placeholder="e.g. 52">
                <button type="submit" class="button button-ghost">Go</button>
            </form>
        </article>
    `;
}

function canGoBack() {
    if (state.position) {
        return state.position > 1;
    }
    return Number(state.hadith?.number) > 1;
}

function resultsHTML() {
    if (!state.query || state.results === null) {
        return '';
    }

    if (state.results === 'loading') {
        return `<section class="panel">${spinner('Searching')}</section>`;
    }

    if (state.results.error) {
        return `<section class="panel">${emptyState({ title: 'Search failed', text: state.results.error })}</section>`;
    }

    return `
        <section class="panel search-results" aria-live="polite">
            <header class="panel-head">
                <h2 class="panel-title">${state.results.length ? `${state.results.length} results in ${esc(collectionName(state.collection))}` : 'No results'}</h2>
                <button type="button" class="link-button" data-hadith="clear-search">Clear</button>
            </header>
            ${state.results.length ? `<ol class="result-list">
                ${state.results.map((item, index) => `
                    <li><button type="button" class="result" data-result="${index}">
                        <strong>${esc(collectionName(item.collection))} ${esc(item.number)}</strong>
                        <span>${highlight(item.english.slice(0, 320) + (item.english.length > 320 ? '…' : ''), state.query)}</span>
                    </button></li>`).join('')}
            </ol>` : '<p class="panel-note">Search works in English. Try a single key word such as "patience" or "prayer", or choose another collection.</p>'}
        </section>
    `;
}

function savedHTML() {
    if (!state.showSaved) {
        return '';
    }

    const list = bookmarks();

    return `
        <section class="panel saved" aria-labelledby="saved-title">
            <header class="panel-head">
                <h2 id="saved-title" class="panel-title">Saved hadith</h2>
                <button type="button" class="link-button" data-hadith="hide-saved">Close</button>
            </header>
            ${list.length ? `<ol class="result-list">
                ${list.map((item, index) => `
                    <li><button type="button" class="result" data-saved="${index}">
                        <strong>${esc(item.collectionName || collectionName(item.collection))} ${esc(item.number)}</strong>
                        <span>${esc((item.english || item.arabic || '').slice(0, 220))}${(item.english || '').length > 220 ? '…' : ''}</span>
                    </button></li>`).join('')}
            </ol>` : '<p class="panel-note">Tap the bookmark icon on a hadith to save it here.</p>'}
        </section>
    `;
}

function bodyHTML() {
    return `
        ${savedHTML()}
        ${resultsHTML()}
        ${readerHTML()}
        <p class="fine-print">Texts and gradings come from UmmahAPI. For detailed questions, consult a qualified scholar and the printed collections.</p>
    `;
}

function collectionsHTML() {
    return `
        <div class="chips-scroll" role="list" aria-label="Collections">
            ${state.collections.map(item => `
                <button type="button" role="listitem" class="chip ${item.key === state.collection ? 'is-on' : ''}" data-collection="${esc(item.key)}" aria-pressed="${item.key === state.collection}">
                    ${esc(item.name)}
                </button>
            `).join('')}
        </div>
    `;
}

export const hadithPage = {
    title: 'Hadith',

    render() {
        return `
            <div class="page hadith-page">
                ${pageHeader('Hadith', 'Read, search and save hadith from the major collections.',
                    `<button type="button" class="button button-ghost" data-hadith="show-saved">${icon('bookmark', { size: 18 })} Saved <span class="count tnum" data-saved-count>${bookmarks().length}</span></button>`)}
                <form class="search-bar" data-hadith-search role="search">
                    ${icon('search', { size: 18 })}
                    <input type="search" name="q" placeholder="Search in English" value="${esc(state.query)}" aria-label="Search hadith">
                    <button type="submit" class="button button-primary">Search</button>
                </form>
                <div data-collections>${collectionsHTML()}</div>
                <div class="hadith-body" data-hadith-body>${bodyHTML()}</div>
            </div>
        `;
    },

    mount(root, path) {
        const body = root.querySelector('[data-hadith-body]');
        const rerender = () => {
            if (!body.isConnected) {
                return;
            }
            body.innerHTML = bodyHTML();
            const count = root.querySelector('[data-saved-count]');
            if (count) {
                count.textContent = bookmarks().length;
            }
        };

        const [collection, number] = path;

        loadCollections().then(() => {
            const box = root.querySelector('[data-collections]');
            if (box) {
                box.innerHTML = collectionsHTML();
            }
        });

        if (collection && number && state.collections.some(item => item.key === collection)) {
            state.collection = collection;
            if (state.hadith?.collection !== collection || state.hadith?.number !== number) {
                load('number', number, rerender);
            }
        } else if (!state.hadith && !state.loading) {
            load('position', 1, rerender);
        }

        root.addEventListener('submit', event => {
            event.preventDefault();

            if (event.target.matches('[data-hadith-search]')) {
                search(new FormData(event.target).get('q').toString().trim(), rerender);
            } else if (event.target.matches('[data-hadith-goto]')) {
                const value = new FormData(event.target).get('number').toString().trim();
                if (/^\d+(\.\d+)?$/.test(value)) {
                    load('number', value, rerender);
                } else {
                    toast('Enter a hadith number, for example 52');
                }
            }
        });

        root.addEventListener('click', event => {
            const chip = event.target.closest('[data-collection]');
            const action = event.target.closest('[data-hadith]')?.dataset.hadith;
            const result = event.target.closest('[data-result]');
            const saved = event.target.closest('[data-saved]');

            if (chip) {
                state.collection = chip.dataset.collection;
                root.querySelector('[data-collections]').innerHTML = collectionsHTML();
                if (state.query) {
                    search(state.query, rerender);
                }
                load('position', 1, rerender);
                return;
            }

            if (result && Array.isArray(state.results)) {
                state.hadith = state.results[Number(result.dataset.result)];
                state.position = null;
                state.error = '';
                rerender();
                body.querySelector('.hadith-card')?.scrollIntoView({ block: 'start' });
                return;
            }

            if (saved) {
                const item = bookmarks()[Number(saved.dataset.saved)];
                if (item) {
                    state.collection = item.collection;
                    state.hadith = { ...item, number: String(item.number), book: '', chapter: '', grade: '' };
                    state.position = null;
                    state.error = '';
                    state.showSaved = false;
                    root.querySelector('[data-collections]').innerHTML = collectionsHTML();
                    rerender();
                }
                return;
            }

            switch (action) {
                case 'random':
                    load('random', null, rerender);
                    break;
                case 'next':
                    if (state.position) {
                        load('position', state.position + 1, rerender);
                    } else if (state.hadith) {
                        load('number', Math.floor(Number(state.hadith.number)) + 1, rerender);
                    }
                    break;
                case 'prev':
                    if (state.position > 1) {
                        load('position', state.position - 1, rerender);
                    } else if (Number(state.hadith?.number) > 1) {
                        load('number', Math.ceil(Number(state.hadith.number)) - 1, rerender);
                    }
                    break;
                case 'save': {
                    const added = toggleSaved(state.hadith);
                    toast(added ? 'Hadith saved' : 'Removed from saved', { duration: 2000 });
                    rerender();
                    break;
                }
                case 'share': {
                    const hadith = state.hadith;
                    shareText({
                        title: `${collectionName(hadith.collection)} ${hadith.number}`,
                        text: [hadith.arabic, hadith.english, `${collectionName(hadith.collection)} ${hadith.number}`].filter(Boolean).join('\n\n'),
                        url: `${SITE}#hadith/${hadith.collection}/${hadith.number}`
                    });
                    break;
                }
                case 'show-saved':
                    state.showSaved = !state.showSaved;
                    rerender();
                    break;
                case 'hide-saved':
                    state.showSaved = false;
                    rerender();
                    break;
                case 'clear-search':
                    state.query = '';
                    state.results = null;
                    root.querySelector('[data-hadith-search] input').value = '';
                    rerender();
                    break;
                default:
                    break;
            }
        });
    }
};
