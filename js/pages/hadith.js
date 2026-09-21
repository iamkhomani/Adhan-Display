const API_BASE = 'https://ummahapi.com/api/hadith';

const STORAGE_KEY = 'adhan_hadith_bookmarks';

const DEFAULT_COLLECTION = 'bukhari';

const FALLBACK_COLLECTIONS = [
    {
        key: 'bukhari',
        name: 'Sahih al-Bukhari',
        arabic_name: 'صحيح البخاري',
        author: 'Imam Bukhari',
        reliability: 'Sahih',
        total_hadiths: 7580
    },
    {
        key: 'muslim',
        name: 'Sahih Muslim',
        arabic_name: 'صحيح مسلم',
        author: 'Imam Muslim',
        reliability: 'Sahih',
        total_hadiths: 7360
    },
    {
        key: 'abudawud',
        name: 'Sunan Abu Dawud',
        arabic_name: 'سنن أبي داود',
        author: 'Abu Dawud',
        reliability: 'Hasan/Sahih',
        total_hadiths: 5272
    },
    {
        key: 'tirmidhi',
        name: 'Jami at-Tirmidhi',
        arabic_name: 'جامع الترمذي',
        author: 'Imam Tirmidhi',
        reliability: 'Hasan/Sahih',
        total_hadiths: 3926
    },
    {
        key: 'ibnmajah',
        name: 'Sunan Ibn Majah',
        arabic_name: 'سنن ابن ماجه',
        author: 'Ibn Majah',
        reliability: 'Hasan/Sahih',
        total_hadiths: 4340
    },
    {
        key: 'nasai',
        name: "Sunan an-Nasa'i",
        arabic_name: 'سنن النسائي',
        author: "Imam an-Nasa'i",
        reliability: 'Sahih',
        total_hadiths: 5679
    },
    {
        key: 'malik',
        name: 'Muwatta Malik',
        arabic_name: 'موطأ مالك',
        author: 'Imam Malik',
        reliability: 'Sahih',
        total_hadiths: 1829
    }
];

let collections = [...FALLBACK_COLLECTIONS];
let selectedCollection = DEFAULT_COLLECTION;
let currentHadith = null;
let searchResults = [];
let loading = false;
let errorMessage = '';
let searchQuery = '';
let showBookmarks = false;
let goToNumber = '';

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getBookmarks() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || '[]'
        );

        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveBookmarks(items) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
    );
}

function hadithId(hadith) {
    if (!hadith) return '';

    const collection =
        hadith.collection ||
        hadith.collectionKey ||
        selectedCollection;

    let number =
        hadith.hadithNumber ??
        hadith.number ??
        '';

    if (!number) {
        const match =
            String(hadith.id || '').match(/(\\d+)$/);

        number =
            match ? match[1] : (hadith.id || '');
    }

    return `${collection}:${number}`;
}

function isBookmarked(hadith) {
    const id = hadithId(hadith);

    return getBookmarks().some(
        item => item.id === id
    );
}

function toggleBookmark(hadith) {
    if (!hadith) return;

    const id = hadithId(hadith);
    const bookmarks = getBookmarks();

    const existing = bookmarks.findIndex(
        item => item.id === id
    );

    if (existing >= 0) {
        bookmarks.splice(existing, 1);
    } else {
        bookmarks.unshift({
            id,
            collection:
                hadith.collection ||
                hadith.collectionKey ||
                selectedCollection,
            collectionName:
                hadith.collectionName ||
                getCollectionName(
                    hadith.collection ||
                    hadith.collectionKey ||
                    selectedCollection
                ),
            number:
                hadith.hadithNumber ??
                hadith.number ??
                hadith.id ??
                '',
            arabic:
                hadith.arabic ||
                hadith.arabicText ||
                hadith.textArabic ||
                '',
            english:
                hadith.english ||
                hadith.translation ||
                hadith.text ||
                '',
            narrator:
                hadith.narrator ||
                '',
            savedAt:
                new Date().toISOString()
        });
    }

    saveBookmarks(bookmarks);
}

function getCollectionName(key) {
    return (
        collections.find(
            item => item.key === key
        )?.name ||
        key
    );
}

function getCollection(key) {
    return (
        collections.find(
            item => item.key === key
        ) ||
        FALLBACK_COLLECTIONS.find(
            item => item.key === key
        )
    );
}

function extractData(payload) {
    if (!payload) return null;

    if (payload.data !== undefined) {
        return payload.data;
    }

    return payload;
}

function normalizeHadith(raw, collectionKey = selectedCollection) {
    if (!raw) return null;

    let source = raw;

    if (raw.hadith) {
        source = raw.hadith;
    }

    if (raw.data && raw.data.hadith) {
        source = raw.data.hadith;
    }

    const collection =
        source.collection ||
        source.collectionKey ||
        raw.collection ||
        collectionKey;

    let number =
        source.hadithNumber ??
        source.hadith_number ??
        source.number ??
        raw.hadithNumber ??
        raw.hadith_number ??
        raw.number ??
        '';

    if (!number) {
        const possibleId =
            source.id ??
            raw.id ??
            '';

        const match =
            String(possibleId).match(/(\\d+)$/);

        number =
            match ? match[1] : possibleId;
    }

    const arabic =
        source.arabic ||
        source.arabicText ||
        source.textArabic ||
        source.text_ar ||
        source.arabic_text ||
        '';

    const english =
        source.english ||
        source.translation ||
        source.englishText ||
        source.textEnglish ||
        source.text_en ||
        source.text ||
        '';

    const narrator =
        source.narrator ||
        source.narratorName ||
        source.rawi ||
        '';

    const book =
        source.book ||
        source.bookName ||
        source.book_name ||
        '';

    const chapter =
        source.chapter ||
        source.chapterName ||
        source.chapter_name ||
        '';

    const sourceName =
        source.source ||
        source.reference ||
        source.grade ||
        '';

    return {
        ...source,
        collection,
        collectionName:
            source.collectionName ||
            getCollectionName(collection),
        hadithNumber: number,
        arabic,
        english,
        narrator,
        book,
        chapter,
        sourceName,
        id:
            source.id ||
            `${collection}:${number}`
    };
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(
            `${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

async function loadCollections() {
    try {
        const payload = await fetchJson(
            `${API_BASE}/collections`
        );

        const data = extractData(payload);

        if (Array.isArray(data?.collections)) {
            collections = data.collections;
        }
    } catch (error) {
        console.warn(
            '[Hadith] Could not load collections',
            error
        );
    }
}

async function loadSpecificHadithNumber(
    collection,
    number
) {
    if (
        !collection ||
        !Number.isInteger(Number(number)) ||
        Number(number) < 1
    ) {
        return;
    }

    const numericNumber =
        Number(number);

    loading = true;
    errorMessage = '';

    renderUpdate();

    try {

        const url =
            `${API_BASE}/${encodeURIComponent(collection)}` +
            `/${encodeURIComponent(numericNumber)}`;

        const payload =
            await fetchJson(url);

        const data =
            extractData(payload);

        const normalized =
            normalizeHadith(
                data,
                collection
            );

        if (!normalized) {
            throw new Error(
                `Hadith ${numericNumber} could not be normalized.`
            );
        }

        currentHadith =
            normalized;

        selectedCollection =
            collection;

        /*
         * We know the actual Hadith number here.
         * It is NOT necessarily the same thing as
         * the pagination position.
         */

        currentHadith._readerHadithNumber =
            numericNumber;

        /*
         * Do not invent a pagination position.
         * Previous/Next will use the known position
         * only when available.
         */

        errorMessage = '';

    } catch (error) {

        console.error(
            '[Hadith] Specific number load failed',
            {
                collection,
                number: numericNumber,
                error
            }
        );

        errorMessage =
            'Deze hadith kon niet worden geladen. Probeer opnieuw.';

    } finally {

        loading = false;

        renderUpdate();
    }
}


async function loadFirst(collection = selectedCollection) {
    await loadByPosition(collection, 1);
}

async function loadRandom(collection = selectedCollection) {
    loading = true;
    errorMessage = '';
    renderUpdate();

    try {
        const payload = await fetchJson(
            `${API_BASE}/random?collection=${encodeURIComponent(collection)}`
        );

        const data = extractData(payload);

        currentHadith = normalizeHadith(
            data,
            collection
        );

        if (!currentHadith) {
            throw new Error(
                'The Hadith API returned no hadith.'
            );
        }

        selectedCollection =
            currentHadith.collection ||
            collection;

    } catch (error) {
        console.error(
            '[Hadith] Random load failed',
            error
        );

        errorMessage =
            'De hadith kon niet worden geladen. Probeer opnieuw.';
    } finally {
        loading = false;
        renderUpdate();
    }
}

async function loadByPosition(
    collection,
    position
) {
    if (!collection || !position || position < 1) {
        return;
    }

    loading = true;
    errorMessage = '';
    renderUpdate();

    try {
        const url =
            `${API_BASE}/${encodeURIComponent(collection)}` +
            `?page=${encodeURIComponent(position)}` +
            `&limit=1`;

        const payload =
            await fetchJson(url);

        const data =
            extractData(payload);

        const items =
            data?.hadiths ||
            data?.results ||
            data?.items ||
            data?.data ||
            (Array.isArray(data) ? data : []);

        const item =
            Array.isArray(items)
                ? items[0]
                : null;

        if (!item) {
            throw new Error(
                `No hadith found at position ${position}`
            );
        }

        currentHadith =
            normalizeHadith(
                item,
                collection
            );

        currentHadith._readerPosition =
            position;

        selectedCollection =
            collection;

        if (!currentHadith) {
            throw new Error(
                'Could not normalize hadith.'
            );
        }

    } catch (error) {

        console.error(
            '[Hadith] Paginated load failed',
            {
                collection,
                position,
                error
            }
        );

        errorMessage =
            'Deze hadith kon niet worden geladen.';

    } finally {

        loading = false;
        renderUpdate();
    }
}

async function loadSpecific(
    collection,
    number
) {
    if (!number || Number(number) < 1) {
        return;
    }

    loading = true;
    errorMessage = '';
    renderUpdate();

    try {
        const payload = await fetchJson(
            `${API_BASE}/${encodeURIComponent(collection)}/${encodeURIComponent(number)}`
        );

        const data = extractData(payload);

        currentHadith = normalizeHadith(
            data,
            collection
        );

        selectedCollection = collection;

        if (!currentHadith) {
            throw new Error(
                'The Hadith API returned no hadith.'
            );
        }
    } catch (error) {
        console.error(
            '[Hadith] Specific hadith failed',
            error
        );

        errorMessage =
            'Deze hadith kon niet worden geladen.';
    } finally {
        loading = false;
        renderUpdate();
    }
}

async function searchHadith(query) {
    const clean = String(query || '').trim();

    if (!clean) {
        searchResults = [];
        searchQuery = '';
        renderUpdate();
        return;
    }

    loading = true;
    errorMessage = '';
    searchQuery = clean;
    renderUpdate();

    try {
        const params = new URLSearchParams({
            q: clean,
            limit: '12'
        });

        if (selectedCollection) {
            params.set(
                'collection',
                selectedCollection
            );
        }

        const payload = await fetchJson(
            `${API_BASE}/search?${params.toString()}`
        );

        const data = extractData(payload);

        const results =
            data?.results ||
            data?.hadiths ||
            data?.items ||
            (Array.isArray(data) ? data : []);

        searchResults = Array.isArray(results)
            ? results
                .map(item =>
                    normalizeHadith(
                        item,
                        selectedCollection
                    )
                )
                .filter(Boolean)
            : [];
    } catch (error) {
        console.error(
            '[Hadith] Search failed',
            error
        );

        errorMessage =
            'Zoeken naar hadiths is mislukt.';
        searchResults = [];
    } finally {
        loading = false;
        renderUpdate();
    }
}

function renderCollections() {
    return collections
        .map(collection => {
            const active =
                collection.key === selectedCollection
                    ? 'is-active'
                    : '';

            const count =
                Number(
                    collection.total_hadiths ||
                    collection.total ||
                    0
                ).toLocaleString();

            return `
                <button
                    class="hadith-collection-chip ${active}"
                    type="button"
                    data-hadith-collection="${escapeHtml(collection.key)}"
                >
                    <span>
                        ${escapeHtml(collection.name)}
                    </span>
                    <small>${count}</small>
                </button>
            `;
        })
        .join('');
}

function renderHadithCard() {
    if (loading) {
        return `
            <section class="hadith-reader-card is-loading">
                <div class="hadith-loading">
                    <span class="hadith-spinner"></span>
                    <strong>Hadith wordt geladen...</strong>
                    <span>Even geduld.</span>
                </div>
            </section>
        `;
    }

    if (errorMessage) {
        return `
            <section class="hadith-reader-card">
                <div class="hadith-empty">
                    <strong>${escapeHtml(errorMessage)}</strong>
                    <button
                        class="hadith-button primary"
                        type="button"
                        data-hadith-random
                    >
                        Probeer opnieuw
                    </button>
                </div>
            </section>
        `;
    }

    if (!currentHadith) {
        return `
            <section class="hadith-reader-card">
                <div class="hadith-empty">
                    <strong>Kies een collectie</strong>
                    <span>
                        Kies hierboven een collectie of laad een willekeurige hadith.
                    </span>
                    <button
                        class="hadith-button primary"
                        type="button"
                        data-hadith-random
                    >
                        Random Hadith
                    </button>
                </div>
            </section>
        `;
    }

    let number =
        currentHadith.hadithNumber ||
        currentHadith.number ||
        '';

    if (!number) {
        const match =
            String(currentHadith.id || '').match(/(\\d+)$/);

        number =
            match
                ? match[1]
                : (currentHadith.id || '');
    }

    const bookmarked =
        isBookmarked(currentHadith);

    const collectionName =
        currentHadith.collectionName ||
        getCollectionName(
            currentHadith.collection
        );

    return `
        <section class="hadith-reader-card">

            <div class="hadith-reader-top">
                <div>
                    <span class="hadith-eyebrow">
                        ${escapeHtml(collectionName)}
                    </span>

                    <h2>
                        Hadith ${escapeHtml(number)}
                    </h2>
                </div>

                <button
                    class="hadith-icon-button ${bookmarked ? 'is-active' : ''}"
                    type="button"
                    title="${bookmarked ? 'Verwijder bookmark' : 'Bewaar hadith'}"
                    aria-label="${bookmarked ? 'Verwijder bookmark' : 'Bewaar hadith'}"
                    data-hadith-bookmark
                >
                    ${bookmarked ? '★' : '☆'}
                </button>
            </div>

            ${
                currentHadith.arabic
                    ? `
                        <div
                            class="hadith-arabic"
                            dir="rtl"
                            lang="ar"
                        >
                            ${escapeHtml(
                                currentHadith.arabic
                            )}
                        </div>
                    `
                    : ''
            }

            ${
                currentHadith.english
                    ? `
                        <div class="hadith-translation">
                            ${escapeHtml(
                                currentHadith.english
                            )}
                        </div>
                    `
                    : ''
            }

            ${
                currentHadith.narrator
                    ? `
                        <div class="hadith-narrator">
                            <span>Narrated by</span>
                            <strong>
                                ${escapeHtml(
                                    currentHadith.narrator
                                )}
                            </strong>
                        </div>
                    `
                    : ''
            }

            ${
                currentHadith.book ||
                currentHadith.chapter ||
                currentHadith.sourceName
                    ? `
                        <div class="hadith-reference">
                            ${
                                currentHadith.book
                                    ? `
                                        <span>
                                            Book:
                                            ${escapeHtml(
                                                currentHadith.book
                                            )}
                                        </span>
                                    `
                                    : ''
                            }

                            ${
                                currentHadith.chapter
                                    ? `
                                        <span>
                                            Chapter:
                                            ${escapeHtml(
                                                currentHadith.chapter
                                            )}
                                        </span>
                                    `
                                    : ''
                            }

                            ${
                                currentHadith.sourceName
                                    ? `
                                        <span>
                                            ${escapeHtml(
                                                currentHadith.sourceName
                                            )}
                                        </span>
                                    `
                                    : ''
                            }
                        </div>
                    `
                    : ''
            }

            <div class="hadith-reader-actions">

                <button
                    class="hadith-button"
                    type="button"
                    data-hadith-previous
                    ${
                        (
                            Number(
                                currentHadith._readerPosition ||
                                0
                            ) > 1
                            ||
                            Number(
                                currentHadith._readerHadithNumber ||
                                currentHadith.hadithNumber ||
                                currentHadith.number ||
                                0
                            ) > 1
                        )
                            ? ''
                            : 'disabled'
                    }
                >
                    ← Previous
                </button>

                <button
                    class="hadith-button"
                    type="button"
                    data-hadith-share
                >
                    Share
                </button>

                <button
                    class="hadith-button"
                    type="button"
                    data-hadith-random
                >
                    Random
                </button>

                <button
                    class="hadith-button"
                    type="button"
                    data-hadith-next
                >
                    Next →
                </button>

            </div>

            <div class="hadith-go-to">
                <span>Go to Hadith</span>

                <div class="hadith-go-to-controls">
                    <input
                        type="number"
                        min="1"
                        inputmode="numeric"
                        placeholder="Hadith number"
                        value="${escapeHtml(goToNumber)}"
                        data-hadith-go-input
                    />

                    <button
                        class="hadith-button"
                        type="button"
                        data-hadith-go
                    >
                        Go
                    </button>
                </div>
            </div>

        </section>
    `;
}



/* ============================================================
 * Search Result Highlighting
 * ============================================================ */

function escapeSearchRegex(value) {
    return String(value || '').replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
}

function highlightSearchText(text, query) {
    const source = String(text || '');
    const cleanQuery = String(query || '').trim();

    if (!source) {
        return '';
    }

    if (!cleanQuery) {
        return escapeHtml(source);
    }

    const regex = new RegExp(
        `(${escapeSearchRegex(cleanQuery)})`,
        'gi'
    );

    let output = '';
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(source)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        output += escapeHtml(
            source.slice(lastIndex, start)
        );

        output += `
            <mark class="adhan-search-highlight">
                ${escapeHtml(match[0])}
            </mark>
        `;

        lastIndex = end;

        if (match[0].length === 0) {
            regex.lastIndex++;
        }
    }

    output += escapeHtml(
        source.slice(lastIndex)
    );

    return output;
}

function renderSearchResults() {
    if (!searchQuery) {
        return '';
    }

    if (loading) {
        return '';
    }

    if (!searchResults.length) {
        return `
            <section class="hadith-search-results">
                <div class="hadith-search-empty">
                    Geen resultaten gevonden voor
                    <strong>
                        "${escapeHtml(searchQuery)}"
                    </strong>
                </div>
            </section>
        `;
    }

    return `
        <section class="hadith-search-results">

            <div class="hadith-section-heading">
                <div>
                    <span>SEARCH RESULTS</span>
                    <h2>
                        ${searchResults.length}
                        resultaten
                    </h2>
                </div>
            </div>

            <div class="hadith-result-list">

                ${searchResults.map((hadith, index) => {
                    let number =
                        hadith.hadithNumber ||
                        hadith.number ||
                        '';

                    if (!number) {
                        const match =
                            String(hadith.id || '').match(/(\\d+)$/);

                        number =
                            match
                                ? match[1]
                                : (hadith.id || '');
                    }

                    return `
                        <button
                            class="hadith-result"
                            type="button"
                            data-hadith-result="${index}"
                        >
                            <div class="hadith-result-top">
                                <strong>
                                    ${escapeHtml(
                                        hadith.collectionName ||
                                        getCollectionName(
                                            hadith.collection
                                        )
                                    )}
                                </strong>

                                <span>
                                    Hadith
                                    ${escapeHtml(number)}
                                </span>
                            </div>

                            ${
                                hadith.english
                                    ? `
                                        <p>
                                            ${escapeHtml(
                                                hadith.english
                                            )}
                                        </p>
                                    `
                                    : ''
                            }
                        </button>
                    `;
                }).join('')}

            </div>
        </section>
    `;
}

function renderBookmarks() {
    const bookmarks = getBookmarks();

    if (!showBookmarks) {
        return '';
    }

    return `
        <section class="hadith-bookmarks">

            <div class="hadith-section-heading">
                <div>
                    <span>SAVED</span>
                    <h2>
                        Mijn bookmarks
                    </h2>
                </div>

                <button
                    class="hadith-button"
                    type="button"
                    data-hadith-close-bookmarks
                >
                    Sluiten
                </button>
            </div>

            ${
                bookmarks.length
                    ? `
                        <div class="hadith-bookmark-list">
                            ${bookmarks.map((item, index) => `
                                <button
                                    class="hadith-bookmark-item"
                                    type="button"
                                    data-hadith-bookmark-result="${index}"
                                >
                                    <strong>
                                        ${escapeHtml(
                                            item.collectionName ||
                                            getCollectionName(
                                                item.collection
                                            )
                                        )}
                                        · ${escapeHtml(
                                            item.number
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            item.english ||
                                            item.arabic ||
                                            ''
                                        )}
                                    </span>
                                </button>
                            `).join('')}
                        </div>
                    `
                    : `
                        <div class="hadith-search-empty">
                            Je hebt nog geen hadiths opgeslagen.
                        </div>
                    `
            }

        </section>
    `;
}

export function renderHadithPage() {
    return `
        <main class="page-shell hadith-page">

            <section class="hadith-hero">

                <div class="hadith-hero-copy">

                    <span class="hadith-eyebrow">
                        HADITH COLLECTIONS
                    </span>

                    <h1>
                        Learn from the Sunnah.
                    </h1>

                    <p>
                        Lees, zoek en bewaar hadiths uit
                        bekende islamitische collecties.
                    </p>

                </div>

                <div class="hadith-hero-actions">

                    <button
                        class="hadith-button primary"
                        type="button"
                        data-hadith-random
                    >
                        Random Hadith
                    </button>

                    <button
                        class="hadith-button"
                        type="button"
                        data-hadith-show-bookmarks
                    >
                        ★ Bookmarks
                        <span class="hadith-button-count">
                            ${getBookmarks().length}
                        </span>
                    </button>

                </div>

            </section>

            <section class="hadith-controls">

                <div class="hadith-search">

                    <input
                        type="search"
                        class="hadith-search-input"
                        placeholder="Search hadith..."
                        value="${escapeHtml(searchQuery)}"
                        data-hadith-search
                        autocomplete="off"
                    />

                    <button
                        class="hadith-button primary"
                        type="button"
                        data-hadith-search-submit
                    >
                        Search
                    </button>

                </div>

                <div class="hadith-collections">

                    <div class="hadith-section-heading">
                        <div>
                            <span>COLLECTIONS</span>
                            <h2>
                                Browse Hadith
                            </h2>
                        </div>
                    </div>

                    <div class="hadith-collection-list">
                        ${renderCollections()}
                    </div>

                </div>

            </section>

            ${renderHadithCard()}

            ${renderSearchResults()}

            ${renderBookmarks()}

            <section class="hadith-note">
                <strong>About the collections</strong>
                <span>
                    Hadith collection names and metadata are
                    provided by the selected API source.
                    Always verify detailed scholarly questions
                    against established hadith references.
                </span>
            </section>

        </main>
    `;
}

function renderUpdate() {
    window.dispatchEvent(
        new CustomEvent(
            'adhan:hadith-update'
        )
    );
}

async function selectCollection(collection) {
    selectedCollection = collection;
    searchResults = [];
    searchQuery = '';
    goToNumber = '';

    await loadByPosition(
        collection,
        1
    );
}

async function goToHadith() {
    const number = Number(goToNumber);

    if (!Number.isInteger(number) || number < 1) {
        return;
    }

    await loadSpecificHadithNumber(
        selectedCollection,
        number
    );

    goToNumber = '';
}

async function goPrevious() {
    if (!currentHadith) {
        return;
    }

    const collection =
        currentHadith.collection ||
        selectedCollection;

    /*
     * Normal sequential browsing uses the pagination
     * position supplied by loadByPosition().
     */

    const readerPosition =
        Number(
            currentHadith._readerPosition || 0
        );

    if (
        Number.isInteger(readerPosition) &&
        readerPosition > 1
    ) {
        await loadByPosition(
            collection,
            readerPosition - 1
        );

        return;
    }

    /*
     * Hadiths loaded through Go To Hadith or search
     * may not have a pagination position.
     *
     * In that case use the actual Hadith number.
     */

    const hadithNumber =
        Number(
            currentHadith._readerHadithNumber ||
            currentHadith.hadithNumber ||
            currentHadith.number ||
            0
        );

    if (
        Number.isInteger(hadithNumber) &&
        hadithNumber > 1
    ) {
        await loadSpecificHadithNumber(
            collection,
            hadithNumber - 1
        );
    }
}


async function goNext() {
    if (!currentHadith) {
        return;
    }

    const collection =
        currentHadith.collection ||
        selectedCollection;

    /*
     * Normal sequential browsing uses the pagination
     * position supplied by loadByPosition().
     */

    const readerPosition =
        Number(
            currentHadith._readerPosition || 0
        );

    if (
        Number.isInteger(readerPosition) &&
        readerPosition >= 1
    ) {
        await loadByPosition(
            collection,
            readerPosition + 1
        );

        return;
    }

    /*
     * Hadiths loaded through Go To Hadith or search
     * do not necessarily have a pagination position.
     *
     * Use the actual Hadith number instead.
     */

    const hadithNumber =
        Number(
            currentHadith._readerHadithNumber ||
            currentHadith.hadithNumber ||
            currentHadith.number ||
            0
        );

    if (
        Number.isInteger(hadithNumber) &&
        hadithNumber >= 1
    ) {
        await loadSpecificHadithNumber(
            collection,
            hadithNumber + 1
        );
    }
}


async function shareCurrentHadith() {
    if (!currentHadith) return;

    const collectionName =
        currentHadith.collectionName ||
        getCollectionName(
            currentHadith.collection
        );

    const number =
        currentHadith.hadithNumber ||
        currentHadith.number ||
        currentHadith.id ||
        '';

    const text = [
        collectionName,
        `Hadith ${number}`,
        '',
        currentHadith.arabic || '',
        '',
        currentHadith.english || ''
    ]
        .filter(Boolean)
        .join('\n');

    try {
        if (navigator.share) {
            await navigator.share({
                title:
                    `${collectionName} · Hadith ${number}`,
                text
            });

            return;
        }

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);

            window.alert(
                'Hadith gekopieerd naar je klembord.'
            );

            return;
        }

        window.alert(text);
    } catch (error) {
        if (error?.name !== 'AbortError') {
            console.warn(
                '[Hadith] Share failed',
                error
            );
        }
    }
}

export function bindHadithPage() {
    const root =
        document.querySelector(
            '.hadith-page'
        );

    if (!root || root.dataset.bound === 'true') {
        return;
    }

    root.dataset.bound = 'true';

    root.addEventListener(
        'click',
        async event => {
            const collectionButton =
                event.target.closest(
                    '[data-hadith-collection]'
                );

            if (collectionButton) {
                await selectCollection(
                    collectionButton.dataset
                        .hadithCollection
                );
                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-random]'
                )
            ) {
                await loadRandom(
                    selectedCollection
                );
                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-search-submit]'
                )
            ) {
                const input =
                    root.querySelector(
                        '[data-hadith-search]'
                    );

                await searchHadith(
                    input?.value || ''
                );

                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-previous]'
                )
            ) {
                await goPrevious();
                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-next]'
                )
            ) {
                await goNext();
                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-go]'
                )
            ) {
                const input =
                    root.querySelector(
                        '[data-hadith-go-input]'
                    );

                goToNumber =
                    input?.value || '';

                await goToHadith();
                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-bookmark]'
                )
            ) {
                toggleBookmark(
                    currentHadith
                );

                renderUpdate();
                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-share]'
                )
            ) {
                await shareCurrentHadith();
                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-show-bookmarks]'
                )
            ) {
                showBookmarks = true;
                renderUpdate();
                return;
            }

            if (
                event.target.closest(
                    '[data-hadith-close-bookmarks]'
                )
            ) {
                showBookmarks = false;
                renderUpdate();
                return;
            }

            const resultButton =
                event.target.closest(
                    '[data-hadith-result]'
                );

            if (resultButton) {
                const index = Number(
                    resultButton.dataset
                        .hadithResult
                );

                const selected =
                    searchResults[index];

                if (selected) {

                    currentHadith =
                        selected;

                    selectedCollection =
                        selected.collection ||
                        selectedCollection;

                    /*
                     * Search results contain the actual
                     * Hadith number. Preserve it separately.
                     */

                    const searchNumber =
                        Number(
                            selected.hadithNumber ||
                            selected.number ||
                            (
                                String(
                                    selected.id || ''
                                ).match(
                                    /(\d+)$/
                                )?.[1]
                            ) ||
                            0
                        );

                    if (
                        Number.isInteger(
                            searchNumber
                        ) &&
                        searchNumber > 0
                    ) {
                        currentHadith
                            ._readerHadithNumber =
                            searchNumber;
                    }

                    /*
                     * A search result does not necessarily
                     * contain its pagination position.
                     * Therefore we intentionally do not
                     * invent _readerPosition here.
                     */

                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                    renderUpdate();
                }

                return;
            }

            const bookmarkButton =
                event.target.closest(
                    '[data-hadith-bookmark-result]'
                );

            if (bookmarkButton) {
                const index = Number(
                    bookmarkButton.dataset
                        .hadithBookmarkResult
                );

                const bookmark =
                    getBookmarks()[index];

                if (bookmark) {
                    currentHadith =
                        normalizeHadith(
                            bookmark,
                            bookmark.collection
                        );

                    selectedCollection =
                        bookmark.collection ||
                        selectedCollection;

                    showBookmarks = false;

                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                    renderUpdate();
                }
            }
        }
    );

    const searchInput =
        root.querySelector(
            '[data-hadith-search]'
        );

    searchInput?.addEventListener(
        'keydown',
        async event => {
            if (event.key === 'Enter') {
                event.preventDefault();

                await searchHadith(
                    searchInput.value
                );
            }
        }
    );

    const goInput =
        root.querySelector(
            '[data-hadith-go-input]'
        );

    goInput?.addEventListener(
        'input',
        event => {
            goToNumber =
                event.target.value;
        }
    );

    goInput?.addEventListener(
        'keydown',
        async event => {
            if (event.key === 'Enter') {
                event.preventDefault();

                goToNumber =
                    goInput.value;

                await goToHadith();
            }
        }
    );

    if (!currentHadith && !loading) {
        loadCollections()
            .then(() =>
                loadByPosition(
                    selectedCollection,
                    1
                )
            );
    }
}
