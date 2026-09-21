import {
    state,
    saveQuranState
} from '../state.js';


const API_BASE =
    'https://api.alquran.cloud/v1';

const CDN_BASE =
    'https://cdn.islamic.network/quran';


let audio = null;

let currentAudioIndex = -1;

let currentAudioMode = 'ayah';

let currentResults = [];

let playerVisible = false;
let playerMinimized = false;
let playerClosed = false;

let playerDuration = 0;

let playerCurrentTime = 0;

let playerPlaying = false;

let playerRepeat = false;


function escapeHtml(value = '') {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function languageName(code) {

    try {

        const names =
            new Intl.DisplayNames(
                ['en'],
                { type: 'language' }
            );

        return names.of(code) || code;

    } catch {

        return code;
    }
}


function saveLastRead(surah, ayah) {

    state.quran.lastRead = {
        surah,
        ayah
    };

    saveQuranState();
}


function isBookmarked(globalAyahNumber) {

    return state.quran.bookmarks
        .some(
            item =>
                Number(item.number) ===
                Number(globalAyahNumber)
        );
}


function toggleBookmark(ayah) {

    const existing =
        state.quran.bookmarks.findIndex(
            item =>
                Number(item.number) ===
                Number(ayah.number)
        );


    if (existing >= 0) {

        state.quran.bookmarks.splice(
            existing,
            1
        );

    } else {

        state.quran.bookmarks.push({

            number:
                ayah.number,

            surah:
                ayah.surah?.number ||
                state.quran.selectedSurah,

            ayah:
                ayah.numberInSurah,

            /*
             * Keep both Arabic and the selected
             * translation so bookmarks remain useful
             * regardless of the reading language.
             */

            text:
                ayah.text,

            translationText:
                ayah.translation?.text || '',

            translationIdentifier:
                state.quran.selectedTranslation || '',

            translationLanguage:
                ayah.translation?.edition?.language ||
                ''
        });
    }


    saveQuranState();

    renderBookmarks();
}


async function fetchJson(url) {

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            `Request failed: ${response.status}`
        );
    }

    const result =
        await response.json();

    if (result.code &&
        result.code !== 200) {

        throw new Error(
            result.status ||
            'API request failed.'
        );
    }

    return result;
}


async function loadSurahList() {

    if (state.quran.surahs.length) {
        return state.quran.surahs;
    }


    const result =
        await fetchJson(
            `${API_BASE}/surah`
        );


    state.quran.surahs =
        result.data || [];


    return state.quran.surahs;
}


async function loadEditions() {

    if (state.quran.editions.length) {
        return state.quran.editions;
    }


    const result =
        await fetchJson(
            `${API_BASE}/edition?format=text&type=translation`
        );


    state.quran.editions =
        (result.data || [])
            .filter(
                edition =>
                    edition.type === 'translation'
            );


    if (!state.quran.editions.length) {

        throw new Error(
            'No Quran translations were returned.'
        );
    }


    if (
        !state.quran.selectedTranslation ||
        !state.quran.editions.some(
            edition =>
                edition.identifier ===
                state.quran.selectedTranslation
        )
    ) {

        const dutch =
            state.quran.editions.find(
                edition =>
                    edition.language === 'nl'
            );


        const english =
            state.quran.editions.find(
                edition =>
                    edition.language === 'en'
            );


        state.quran.selectedTranslation =
            dutch?.identifier ||
            english?.identifier ||
            state.quran.editions[0].identifier;
    }


    state.quran.selectedLanguage =
        state.quran.editions.find(
            edition =>
                edition.identifier ===
                state.quran.selectedTranslation
        )?.language || 'en';


    saveQuranState();


    return state.quran.editions;
}


async function loadAudioEditions() {

    if (state.quran.audioEditions.length) {
        return state.quran.audioEditions;
    }


    try {

        const result =
            await fetchJson(
                `${API_BASE}/edition?format=audio`
            );


        state.quran.audioEditions =
            (result.data || [])
                .filter(
                    edition =>
                        edition.type ===
                            'versebyverse' ||
                        edition.identifier?.startsWith(
                            'ar.'
                        )
                )
                .filter(
                    edition =>
                        edition.identifier?.startsWith(
                            'ar.'
                        )
                );


    } catch (error) {

        console.warn(
            '[Quran] Audio editions unavailable',
            error
        );

        state.quran.audioEditions = [];
    }


    if (
        state.quran.audioEditions.length &&
        !state.quran.audioEditions.some(
            edition =>
                edition.identifier ===
                state.quran.selectedReciter
        )
    ) {

        const alafasy =
            state.quran.audioEditions.find(
                edition =>
                    edition.identifier ===
                    'ar.alafasy'
            );


        state.quran.selectedReciter =
            alafasy?.identifier ||
            state.quran.audioEditions[0].identifier;


        saveQuranState();
    }


    return state.quran.audioEditions;
}


function getLanguages() {

    const languages =
        new Map();


    for (
        const edition of
        state.quran.editions
    ) {

        if (!edition.language) {
            continue;
        }

        if (!languages.has(edition.language)) {

            languages.set(
                edition.language,
                languageName(
                    edition.language
                )
            );
        }
    }


    return [...languages.entries()]
        .sort(
            (a, b) =>
                a[1].localeCompare(b[1])
        );
}


function getTranslationsForLanguage(
    language
) {

    return state.quran.editions
        .filter(
            edition =>
                edition.language === language
        )
        .sort(
            (a, b) =>
                (a.englishName || '')
                    .localeCompare(
                        b.englishName || ''
                    )
        );
}


function renderLanguageOptions() {

    const select =
        document.querySelector(
            '[data-q2-language]'
        );

    if (!select) {
        return;
    }


    const languages =
        getLanguages();


    select.innerHTML = `
        <option value="">
            All languages
        </option>

        ${languages.map(
            ([code, name]) => `
                <option
                    value="${escapeHtml(code)}"
                    ${
                        code ===
                        state.quran.selectedLanguage
                            ? 'selected'
                            : ''
                    }
                >
                    ${escapeHtml(name)}
                </option>
            `
        ).join('')}
    `;
}


function renderTranslationOptions() {

    const select =
        document.querySelector(
            '[data-q2-translation]'
        );

    if (!select) {
        return;
    }


    const language =
        state.quran.selectedLanguage;


    const editions =
        language
            ? getTranslationsForLanguage(
                language
            )
            : state.quran.editions;


    select.innerHTML =
        editions.map(
            edition => `
                <option
                    value="${escapeHtml(
                        edition.identifier
                    )}"
                    ${
                        edition.identifier ===
                        state.quran.selectedTranslation
                            ? 'selected'
                            : ''
                    }
                >
                    ${escapeHtml(
                        edition.englishName ||
                        edition.name ||
                        edition.identifier
                    )}
                </option>
            `
        ).join('');
}


function renderReciterOptions() {

    const select =
        document.querySelector(
            '[data-q2-reciter]'
        );

    if (!select) {
        return;
    }


    select.innerHTML =
        state.quran.audioEditions
            .map(
                edition => `
                    <option
                        value="${escapeHtml(
                            edition.identifier
                        )}"
                        ${
                            edition.identifier ===
                            state.quran.selectedReciter
                                ? 'selected'
                                : ''
                        }
                    >
                        ${escapeHtml(
                            edition.englishName ||
                            edition.name ||
                            edition.identifier
                        )}
                    </option>
                `
            )
            .join('');
}


function renderSurahList() {

    const container =
        document.querySelector(
            '[data-q2-content]'
        );

    if (!container) {
        return;
    }


    const query =
        document.querySelector(
            '[data-q2-surah-filter]'
        )?.value
        ?.trim()
        .toLowerCase() || '';


    const surahs =
        state.quran.surahs.filter(
            surah =>
                !query ||
                String(
                    surah.number
                ).includes(query) ||
                surah.name
                    ?.toLowerCase()
                    .includes(query) ||
                surah.englishName
                    ?.toLowerCase()
                    .includes(query) ||
                surah.englishNameTranslation
                    ?.toLowerCase()
                    .includes(query)
        );


    container.innerHTML = `

        <div class="q2-surah-grid">

            ${surahs.map(
                surah => `
                    <button
                        class="q2-surah-card"
                        data-q2-surah="${surah.number}"
                    >

                        <span
                            class="q2-surah-number"
                        >
                            ${surah.number}
                        </span>

                        <span
                            class="q2-surah-info"
                        >

                            <strong>
                                ${escapeHtml(
                                    surah.englishName
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    surah.englishNameTranslation
                                )}
                                ·
                                ${surah.numberOfAyahs}
                                verses
                                ·
                                ${escapeHtml(
                                    surah.revelationType
                                )}
                            </small>

                        </span>

                        <span
                            class="q2-surah-arabic"
                            dir="rtl"
                        >
                            ${escapeHtml(
                                surah.name
                            )}
                        </span>

                    </button>
                `
            ).join('')}

        </div>
    `;


    bindSurahCards();
}


function renderJuzList() {

    const container =
        document.querySelector(
            '[data-q2-content]'
        );

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="q2-juz-grid">

            ${Array.from(
                { length: 30 },
                (_, index) => {

                    const number =
                        index + 1;

                    return `
                        <button
                            class="q2-juz-card"
                            data-q2-juz="${number}"
                        >

                            <span>
                                Juz
                                ${number}
                            </span>

                            <strong>
                                ${number}
                            </strong>

                        </button>
                    `;
                }
            ).join('')}

        </div>
    `;


    container
        .querySelectorAll(
            '[data-q2-juz]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    loadJuz(
                        Number(
                            button.dataset.q2Juz
                        )
                    );
                }
            );
        });
}


function renderBookmarks() {

    const container =
        document.querySelector(
            '[data-q2-content]'
        );

    if (!container) {
        return;
    }


    if (!state.quran.bookmarks.length) {

        container.innerHTML = `

            <div class="q2-empty">

                <div class="q2-empty-icon">
                    ☆
                </div>

                <h3>
                    No bookmarks yet
                </h3>

                <p>
                    Save an ayah while reading
                    and it will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="q2-bookmark-list">

            ${state.quran.bookmarks
                .map(
                    bookmark => `
                        <button
                            class="q2-bookmark"
                            data-q2-bookmark-surah="${bookmark.surah}"
                            data-q2-bookmark-ayah="${bookmark.ayah}"
                        >

                            <span>
                                ${bookmark.surah}:${bookmark.ayah}
                            </span>

                            <small>
                                ${escapeHtml(
                                    bookmark.translationText ||
                                    bookmark.text ||
                                    ''
                                )}
                            </small>

                        </button>
                    `
                )
                .join('')}

        </div>
    `;


    container
        .querySelectorAll(
            '[data-q2-bookmark-surah]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    loadSurah(
                        Number(
                            button.dataset.q2BookmarkSurah
                        ),
                        Number(
                            button.dataset.q2BookmarkAyah
                        )
                    );
                }
            );
        });
}


function renderReaderLoading() {

    const reader =
        document.querySelector(
            '[data-q2-reader]'
        );

    if (!reader) {
        return;
    }


    reader.innerHTML = `

        <div class="q2-loading">

            <div class="q2-spinner"></div>

            <p>
                Loading Quran...
            </p>

        </div>
    `;
}


function mergeAyahs(
    arabic,
    translation
) {

    const translations =
        new Map(
            (translation?.ayahs || [])
                .map(
                    ayah => [
                        ayah.number,
                        ayah
                    ]
                )
        );


    return (arabic?.ayahs || [])
        .map(
            ayah => ({
                ...ayah,

                translation:
                    translations.get(
                        ayah.number
                    ) || null
            })
        );
}


async function loadSurah(
    surahNumber,
    focusAyah = null
) {

    state.quran.loading = true;

    const browser =
        document.querySelector(
            '[data-q2-browser]'
        );

    const reader =
        document.querySelector(
            '[data-q2-reader]'
        );

    if (browser) {
        browser.classList.add('is-hidden');
    }

    if (reader) {
        reader.classList.remove('is-hidden');
    }

    renderReaderLoading();

    if (reader) {
        reader.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    try {

        await loadEditions();

        const translation =
            state.quran.selectedTranslation;

        if (!translation) {
            throw new Error(
                'No Quran translation has been selected.'
            );
        }

        const url =
            `${API_BASE}/surah/${surahNumber}/editions/quran-uthmani,${encodeURIComponent(
                translation
            )}`;

        console.log(
            '[Quran] Loading Surah:',
            surahNumber,
            url
        );

        const result =
            await fetchJson(url);

        const editions =
            result.data || [];

        const arabic =
            editions.find(
                edition =>
                    edition.edition?.identifier ===
                    'quran-uthmani'
            );

        const translated =
            editions.find(
                edition =>
                    edition.edition?.identifier ===
                    translation
            );

        if (!arabic) {
            throw new Error(
                'Arabic Quran edition was not returned by the API.'
            );
        }

        if (!translated) {
            console.warn(
                '[Quran] Translation was not returned:',
                translation
            );
        }

        state.quran.selectedSurah =
            Number(surahNumber);

        state.quran.selectedAyah =
            Number(focusAyah) || 1;

        state.quran.juz = null;

        state.quran.ayahs =
            mergeAyahs(
                arabic,
                translated
            );

        state.quran.currentView =
            'reader';

        saveLastRead(
            Number(surahNumber),
            Number(focusAyah) || 1
        );

        renderReader(
            arabic,
            translated
        );

        if (reader) {
            setTimeout(() => {
                reader.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                focusReaderAyah();
            }, 100);
        }

    } catch (error) {

        console.error(
            '[Quran] Surah loading failed:',
            error
        );

        renderReaderError(error);

    } finally {

        state.quran.loading = false;
    }
}


async function loadJuz(
    juzNumber
) {

    state.quran.loading = true;

    const browser =
        document.querySelector(
            '[data-q2-browser]'
        );

    const reader =
        document.querySelector(
            '[data-q2-reader]'
        );

    browser?.classList.add(
        'is-hidden'
    );

    reader?.classList.remove(
        'is-hidden'
    );

    renderReaderLoading();

    reader?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });


    try {

        await loadEditions();


        const translation =
            state.quran.selectedTranslation;


        const [
            arabicResult,
            translationResult
        ] =
            await Promise.all([
                fetchJson(
                    `${API_BASE}/juz/${juzNumber}/quran-uthmani`
                ),
                fetchJson(
                    `${API_BASE}/juz/${juzNumber}/${encodeURIComponent(
                        translation
                    )}`
                )
            ]);


        state.quran.juz =
            juzNumber;


        state.quran.selectedSurah =
            null;


        state.quran.ayahs =
            (arabicResult.data?.ayahs || [])
                .map(
                    ayah => ({
                        ...ayah,

                        translation:
                            (
                                translationResult
                                    .data
                                    ?.ayahs || []
                            ).find(
                                translated =>
                                    translated.number ===
                                    ayah.number
                            ) || null
                    })
                );


        state.quran.currentView =
            'reader';


        renderJuzReader(
            arabicResult.data,
            translationResult.data
        );


    } catch (error) {

        console.error(
            '[Quran] Juz loading failed',
            error
        );

        renderReaderError(
            error
        );

    } finally {

        state.quran.loading = false;
    }
}


function renderReader(
    arabic,
    translated
) {

    const reader =
        document.querySelector(
            '[data-q2-reader]'
        );

    if (!reader) {
        return;
    }


    const surah =
        state.quran.surahs.find(
            item =>
                item.number ===
                state.quran.selectedSurah
        );


    reader.innerHTML = `

        <div class="q2-reader-toolbar">

            <div>

                <span class="q2-eyebrow">
                    SURAH ${state.quran.selectedSurah}
                </span>

                <h2>
                    ${escapeHtml(
                        arabic?.englishName ||
                        surah?.englishName ||
                        ''
                    )}
                </h2>

                <p>
                    ${escapeHtml(
                        arabic?.englishNameTranslation ||
                        surah?.englishNameTranslation ||
                        ''
                    )}
                    ·
                    ${arabic?.numberOfAyahs || 0}
                    verses
                </p>

            </div>


            <div class="q2-reader-actions">

                <button
                    class="q2-icon-button"
                    data-q2-play-surah
                    title="Play Surah"
                >
                    ▶
                </button>

                <button
                    class="q2-icon-button"
                    data-q2-reader-back
                    title="Back"
                >
                    ←
                </button>

            </div>

        </div>


        <div class="q2-surah-title">

            <div>
                ${escapeHtml(
                    arabic?.name || ''
                )}
            </div>

            <small>
                ${escapeHtml(
                    arabic?.revelationType ||
                    surah?.revelationType ||
                    ''
                )}
            </small>

        </div>


        <div
            class="q2-ayah-list"
            style="
                --q2-font-scale:
                ${state.quran.fontSize / 100};
            "
        >

            ${(state.quran.ayahs || [])
                .map(
                    (ayah, index) =>
                        renderAyah(
                            ayah,
                            index
                        )
                )
                .join('')}

        </div>
    `;


    bindReader();

    focusReaderAyah();
}


function renderJuzReader(
    arabic,
    translated
) {

    const reader =
        document.querySelector(
            '[data-q2-reader]'
        );

    if (!reader) {
        return;
    }


    reader.innerHTML = `

        <div class="q2-reader-toolbar">

            <div>

                <span class="q2-eyebrow">
                    JUZ ${state.quran.juz}
                </span>

                <h2>
                    Juz ${state.quran.juz}
                </h2>

                <p>
                    Quran reading section
                </p>

            </div>


            <div class="q2-reader-actions">

                <button
                    class="q2-icon-button"
                    data-q2-reader-back
                >
                    ←
                </button>

            </div>

        </div>


        <div
            class="q2-ayah-list"
            style="
                --q2-font-scale:
                ${state.quran.fontSize / 100};
            "
        >

            ${(state.quran.ayahs || [])
                .map(
                    (ayah, index) =>
                        renderAyah(
                            ayah,
                            index
                        )
                )
                .join('')}

        </div>
    `;


    bindReader();
}


function renderAyah(
    ayah,
    index
) {

    const bookmarked =
        isBookmarked(
            ayah.number
        );


    const active =
        currentAudioMode === 'ayah' &&
        currentAudioIndex === index;


    return `

        <article
            class="
                q2-ayah
                ${active ? 'is-playing' : ''}
            "
            data-q2-ayah="${index}"
        >

            <div class="q2-ayah-top">

                <span class="q2-ayah-number">
                    ${ayah.numberInSurah}
                </span>


                <span class="q2-ayah-reference">
                    ${ayah.surah?.englishName || ''}
                    ${ayah.surah?.number ? ` · ${ayah.surah.number}:${ayah.numberInSurah}` : ''}
                </span>


                <div class="q2-ayah-actions">

                    <button
                        class="q2-ayah-button"
                        data-q2-play="${index}"
                        title="Play ayah"
                    >
                        ${active ? '❚❚' : '▶'}
                    </button>

                    <button
                        class="
                            q2-ayah-button
                            ${bookmarked ? 'is-bookmarked' : ''}
                        "
                        data-q2-bookmark="${index}"
                        title="Bookmark"
                    >
                        ${bookmarked ? '★' : '☆'}
                    </button>

                </div>

            </div>


            <div
                class="q2-arabic"
                dir="rtl"
            >
                ${escapeHtml(
                    ayah.text
                )}
            </div>


            ${
                ayah.translation
                    ? `
                        <div
                            class="q2-translation"
                        >
                            ${escapeHtml(
                                ayah.translation.text
                            )}
                        </div>
                    `
                    : ''
            }

        </article>
    `;
}


function renderReaderError(
    error
) {

    const reader =
        document.querySelector(
            '[data-q2-reader]'
        );

    if (!reader) {
        return;
    }


    reader.innerHTML = `

        <div class="q2-empty q2-error">

            <div class="q2-empty-icon">
                !
            </div>

            <h3>
                Quran could not be loaded
            </h3>

            <p>
                ${escapeHtml(
                    error?.message ||
                    'Please check your connection.'
                )}
            </p>

        </div>
    `;
}


function focusReaderAyah() {

    if (!state.quran.selectedAyah) {
        return;
    }


    const target =
        document.querySelector(
            `[data-q2-ayah]`
        );


    const items =
        document.querySelectorAll(
            '[data-q2-ayah]'
        );


    const index =
        state.quran.ayahs.findIndex(
            ayah =>
                Number(
                    ayah.numberInSurah
                ) ===
                Number(
                    state.quran.selectedAyah
                )
        );


    if (
        index >= 0 &&
        items[index]
    ) {

        items[index].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}


function bindReader() {

    document
        .querySelectorAll(
            '[data-q2-play]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    playAyah(
                        Number(
                            button.dataset.q2Play
                        )
                    );
                }
            );
        });


    document
        .querySelectorAll(
            '[data-q2-bookmark]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const index =
                        Number(
                            button.dataset.q2Bookmark
                        );


                    const ayah =
                        state.quran.ayahs[index];


                    if (ayah) {

                        toggleBookmark(
                            ayah
                        );

                        if (
                            state.quran.currentView ===
                            'reader'
                        ) {

                            if (
                                state.quran.selectedSurah
                            ) {

                                const surah =
                                    state.quran.selectedSurah;

                                const focus =
                                    ayah.numberInSurah;

                                loadSurah(
                                    surah,
                                    focus
                                );

                            }
                        }
                    }
                }
            );
        });


    document
        .querySelector(
            '[data-q2-play-surah]'
        )
        ?.addEventListener(
            'click',
            playSurah
        );


    document
        .querySelector(
            '[data-q2-reader-back]'
        )
        ?.addEventListener(
            'click',
            () => {

                state.quran.currentView =
                    'surahs';

                const reader =
                    document.querySelector(
                        '[data-q2-reader]'
                    );

                const browser =
                    document.querySelector(
                        '[data-q2-browser]'
                    );

                if (reader) {
                    reader.classList.add(
                        'is-hidden'
                    );
                }

                if (browser) {
                    browser.classList.remove(
                        'is-hidden'
                    );
                }

                renderSurahList();

                browser?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        );
}


function createAudio() {

    if (audio) {
        return audio;
    }


    audio =
        document.createElement(
            'audio'
        );


    audio.preload =
        'metadata';

    audio.controls =
        false;

    audio.style.display =
        'none';


    document.body.appendChild(
        audio
    );


    audio.addEventListener(
        'loadedmetadata',
        () => {

            playerDuration =
                audio.duration || 0;

            updateAudioPlayer();
        }
    );


    audio.addEventListener(
        'timeupdate',
        () => {

            playerCurrentTime =
                audio.currentTime || 0;

            updateAudioPlayer();
        }
    );


    audio.addEventListener(
        'play',
        () => {

            playerPlaying =
                true;

            updateAudioPlayer();

            highlightCurrentAyah();
        }
    );


    audio.addEventListener(
        'pause',
        () => {

            playerPlaying =
                false;

            updateAudioPlayer();
        }
    );


    audio.addEventListener(
        'ended',
        () => {

            playerPlaying =
                false;


            if (
                currentAudioMode ===
                'ayah'
            ) {

                if (
                    state.quran.autoPlay
                ) {

                    playNextAyah();

                } else {

                    updateAudioPlayer();
                }

            } else {

                updateAudioPlayer();
            }
        }
    );


    return audio;
}


function playAyah(index) {

    const ayah =
        state.quran.ayahs[index];


    if (!ayah) {
        return;
    }


    const player =
        createAudio();


    openAudioPlayer();


    currentAudioMode =
        'ayah';

    currentAudioIndex =
        index;


    state.quran.selectedAyah =
        ayah.numberInSurah;


    saveLastRead(
        ayah.surah?.number ||
        state.quran.selectedSurah,
        ayah.numberInSurah
    );


    const url =
        `${CDN_BASE}/audio/128/${encodeURIComponent(
            state.quran.selectedReciter
        )}/${ayah.number}.mp3`;


    player.src =
        url;

    player.currentTime =
        0;


    playerPlaying =
        false;

    playerCurrentTime =
        0;

    playerDuration =
        0;


    updatePlayerTrack();

    highlightCurrentAyah();


    player.play()
        .catch(
            error => {

                console.error(
                    '[Quran] Audio playback failed',
                    error
                );

                playerPlaying =
                    false;

                updateAudioPlayer();
            }
        );
}


function playSurah() {

    if (
        !state.quran.selectedSurah ||
        !state.quran.ayahs.length
    ) {
        return;
    }


    currentAudioMode =
        'ayah';


    playAyah(0);
}


function highlightCurrentAyah() {

    document
        .querySelectorAll(
            '.q2-ayah.is-playing'
        )
        .forEach(
            element =>
                element.classList.remove(
                    'is-playing'
                )
        );


    const active =
        document.querySelector(
            `[data-q2-ayah="${currentAudioIndex}"]`
        );


    if (active) {

        active.classList.add(
            'is-playing'
        );

        active.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}


function bindSurahCards() {

    document
        .querySelectorAll(
            '[data-q2-surah]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    loadSurah(
                        Number(
                            button.dataset.q2Surah
                        )
                    );
                }
            );
        });
}


function showBrowser() {

    document
        .querySelector(
            '[data-q2-browser]'
        )
        ?.classList.remove(
            'is-hidden'
        );


    document
        .querySelector(
            '[data-q2-reader]'
        )
        ?.classList.remove(
            'is-hidden'
        );
}


function setView(
    view
) {

    state.quran.currentView =
        view;


    document
        .querySelectorAll(
            '[data-q2-tab]'
        )
        .forEach(button => {

            button.classList.toggle(
                'is-active',
                button.dataset.q2Tab ===
                view
            );
        });


    const reader =
        document.querySelector(
            '[data-q2-reader]'
        );


    if (view === 'reader') {
        return;
    }


    reader
        ?.classList
        .add(
            'is-hidden'
        );


    if (view === 'surahs') {

        renderSurahList();

    } else if (view === 'juz') {

        renderJuzList();

    } else if (view === 'bookmarks') {

        renderBookmarks();
    }
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

async function performSearch() {

    const input =
        document.querySelector(
            '[data-q2-search]'
        );


    const query =
        input?.value
            ?.trim();


    if (!query) {
        return;
    }


    const container =
        document.querySelector(
            '[data-q2-content]'
        );


    container.innerHTML = `

        <div class="q2-loading">

            <div class="q2-spinner"></div>

            <p>
                Searching the Quran...
            </p>

        </div>
    `;


    try {

        const edition =
            state.quran.selectedTranslation ||
            'quran-uthmani';


        const result =
            await fetchJson(
                `${API_BASE}/search/${encodeURIComponent(
                    query
                )}/all/${encodeURIComponent(
                    edition
                )}`
            );


        currentResults =
            result.data?.matches || [];


        if (!currentResults.length) {

            container.innerHTML = `

                <div class="q2-empty">

                    <div class="q2-empty-icon">
                        ?
                    </div>

                    <h3>
                        No results found
                    </h3>

                    <p>
                        Try another word or phrase.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML = `

            <div class="q2-search-results">

                <div class="q2-search-summary">

                    <span>
                        ${result.data.count}
                        result${
                            result.data.count === 1
                                ? ''
                                : 's'
                        }
                    </span>

                    <button
                        class="q2-text-button"
                        data-q2-back-browser
                    >
                        ← Surahs
                    </button>

                </div>


                ${currentResults
                    .map(
                        (match, index) => `

                            <article
                                class="q2-search-result"
                            >

                                <div
                                    class="q2-search-result-top"
                                >

                                    <strong>
                                        ${escapeHtml(
                                            match.surah
                                                ?.englishName ||
                                            ''
                                        )}
                                    </strong>

                                    <span>
                                        ${match.surah?.number || ''}
                                        :
                                        ${match.numberInSurah || ''}
                                    </span>

                                </div>


                                <p>
                                    ${escapeHtml(
                                        match.text
                                    )}
                                </p>


                                <button
                                    class="q2-secondary-button"
                                    data-q2-search-result="${index}"
                                >
                                    Open ayah
                                </button>

                            </article>
                        `
                    )
                    .join('')}

            </div>
        `;


        container
            .querySelectorAll(
                '[data-q2-search-result]'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        const match =
                            currentResults[
                                Number(
                                    button.dataset.q2SearchResult
                                )
                            ];


                        if (!match) {
                            return;
                        }


                        loadSurah(
                            match.surah.number,
                            match.numberInSurah
                        );
                    }
                );
            });


        container
            .querySelector(
                '[data-q2-back-browser]'
            )
            ?.addEventListener(
                'click',
                () => {

                    setView(
                        'surahs'
                    );
                }
            );


    } catch (error) {

        console.error(
            '[Quran] Search failed',
            error
        );


        container.innerHTML = `

            <div class="q2-empty q2-error">

                <div class="q2-empty-icon">
                    !
                </div>

                <h3>
                    Search failed
                </h3>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>
        `;
    }
}


function renderLastRead() {

    const container =
        document.querySelector(
            '[data-q2-last-read]'
        );


    if (!container) {
        return;
    }


    const last =
        state.quran.lastRead;


    if (!last) {

        container.innerHTML = `
            <span>
                No reading position saved yet.
            </span>
        `;

        return;
    }


    const surah =
        state.quran.surahs.find(
            item =>
                item.number ===
                Number(last.surah)
        );


    container.innerHTML = `

        <div>

            <span class="q2-eyebrow">
                LAST READ
            </span>

            <strong>
                ${
                    escapeHtml(
                        surah?.englishName ||
                        `Surah ${last.surah}`
                    )
                }
            </strong>

            <small>
                Ayah ${last.ayah}
            </small>

        </div>

        <button
            class="q2-primary-button"
            data-q2-continue
        >
            Continue
        </button>
    `;


    container
        .querySelector(
            '[data-q2-continue]'
        )
        ?.addEventListener(
            'click',
            () => {

                loadSurah(
                    Number(last.surah),
                    Number(last.ayah)
                );
            }
        );
}


function renderReaderSettings() {

    const font =
        document.querySelector(
            '[data-q2-font]'
        );


    if (font) {

        font.value =
            state.quran.fontSize;
    }


    const autoplay =
        document.querySelector(
            '[data-q2-autoplay]'
        );


    if (autoplay) {

        autoplay.checked =
            state.quran.autoPlay;
    }
}


async function initializeQuran() {

    try {

        await Promise.all([
            loadSurahList(),
            loadEditions(),
            loadAudioEditions()
        ]);


        renderLanguageOptions();

        renderTranslationOptions();

        renderReciterOptions();

        renderSurahList();

        renderLastRead();

        renderReaderSettings();


    } catch (error) {

        console.error(
            '[Quran] Initialization failed',
            error
        );


        const container =
            document.querySelector(
                '[data-q2-content]'
            );


        if (container) {

            container.innerHTML = `

                <div class="q2-empty q2-error">

                    <div class="q2-empty-icon">
                        !
                    </div>

                    <h3>
                        Quran data could not be loaded
                    </h3>

                    <p>
                        ${escapeHtml(
                            error.message
                        )}
                    </p>

                </div>
            `;
        }
    }
}



function renderAudioPlayer() {

    let player =
        document.querySelector(
            '[data-q2-player]'
        );

    if (player) {

        player.classList.toggle(
            'is-minimized',
            playerMinimized
        );

        player.classList.toggle(
            'is-closed',
            playerClosed
        );

        return;
    }


    player =
        document.createElement('aside');


    player.className =
        'q2-audio-player';


    player.dataset.q2Player =
        'true';


    player.innerHTML = `

        <div class="q2-player-main">

            <div class="q2-player-info">

                <span
                    class="q2-player-eyebrow"
                    data-q2-player-label
                >
                    QURAN AUDIO
                </span>


                <strong
                    data-q2-player-title
                >
                    Ready to listen
                </strong>


                <small
                    data-q2-player-reciter
                >
                    ${escapeHtml(
                        state.quran.selectedReciter
                    )}
                </small>

            </div>


            <div class="q2-player-controls">

                <button
                    class="q2-player-button"
                    data-q2-player-prev
                    title="Previous ayah"
                    aria-label="Previous ayah"
                    type="button"
                >
                    ‹
                </button>


                <button
                    class="q2-player-play"
                    data-q2-player-play
                    title="Play"
                    aria-label="Play"
                    type="button"
                >
                    ▶
                </button>


                <button
                    class="q2-player-button"
                    data-q2-player-next
                    title="Next ayah"
                    aria-label="Next ayah"
                    type="button"
                >
                    ›
                </button>

            </div>


            <button
                class="q2-player-repeat"
                data-q2-player-repeat
                title="Repeat"
                aria-label="Repeat"
                type="button"
            >
                ↻
            </button>


            <div
                class="q2-player-window-actions"
                aria-label="Audio player options"
            >

                <button
                    class="q2-player-window-button"
                    data-q2-player-minimize
                    title="Minimize player"
                    aria-label="Minimize player"
                    type="button"
                >
                    −
                </button>


                <button
                    class="q2-player-window-button q2-player-close"
                    data-q2-player-close
                    title="Close player"
                    aria-label="Close player"
                    type="button"
                >
                    ×
                </button>

            </div>

        </div>


        <div class="q2-player-progress">

            <span
                data-q2-player-current
            >
                0:00
            </span>


            <input
                type="range"
                min="0"
                max="0"
                value="0"
                step="0.1"
                data-q2-player-seek
                aria-label="Audio progress"
            >


            <span
                data-q2-player-duration
            >
                0:00
            </span>

        </div>
    `;


    document.body.appendChild(
        player
    );


    player.classList.toggle(
        'is-minimized',
        playerMinimized
    );


    player.classList.toggle(
        'is-closed',
        playerClosed
    );


    bindAudioPlayer();
}


function formatAudioTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return '0:00';
    }

    const minutes =
        Math.floor(seconds / 60);

    const remaining =
        Math.floor(seconds % 60);

    return `${minutes}:${String(
        remaining
    ).padStart(2, '0')}`;
}


function updateAudioPlayer() {

    const player =
        document.querySelector(
            '[data-q2-player]'
        );

    if (!player) {
        return;
    }

    const playButton =
        player.querySelector(
            '[data-q2-player-play]'
        );

    const seek =
        player.querySelector(
            '[data-q2-player-seek]'
        );

    const current =
        player.querySelector(
            '[data-q2-player-current]'
        );

    const duration =
        player.querySelector(
            '[data-q2-player-duration]'
        );


    if (playButton) {

        playButton.textContent =
            playerPlaying
                ? '❚❚'
                : '▶';

        playButton.title =
            playerPlaying
                ? 'Pause'
                : 'Play';
    }


    if (seek) {

        seek.max =
            String(
                playerDuration || 0
            );

        seek.value =
            String(
                playerCurrentTime || 0
            );
    }


    if (current) {

        current.textContent =
            formatAudioTime(
                playerCurrentTime
            );
    }


    if (duration) {

        duration.textContent =
            formatAudioTime(
                playerDuration
            );
    }


    const reciter =
        player.querySelector(
            '[data-q2-player-reciter]'
        );

    if (reciter) {

        const edition =
            state.quran.audioEditions
                .find(
                    item =>
                        item.identifier ===
                        state.quran.selectedReciter
                );

        reciter.textContent =
            edition?.englishName ||
            edition?.name ||
            state.quran.selectedReciter;
    }
}


function updatePlayerTrack() {

    const title =
        document.querySelector(
            '[data-q2-player-title]'
        );

    if (!title) {
        return;
    }


    if (
        state.quran.selectedSurah &&
        state.quran.selectedAyah
    ) {

        const surah =
            state.quran.surahs.find(
                item =>
                    item.number ===
                    Number(
                        state.quran.selectedSurah
                    )
            );


        title.textContent =
            `${surah?.englishName || `Surah ${state.quran.selectedSurah}`} · Ayah ${state.quran.selectedAyah}`;

    } else {

        title.textContent =
            'Ready to listen';
    }


    updateAudioPlayer();
}


function bindAudioPlayerWindowControls() {

    const player =
        document.querySelector(
            '[data-q2-player]'
        );

    if (!player) {
        return;
    }


    const minimizeButton =
        player.querySelector(
            '[data-q2-player-minimize]'
        );


    const closeButton =
        player.querySelector(
            '[data-q2-player-close]'
        );


    minimizeButton?.addEventListener(
        'click',
        () => {

            playerMinimized =
                !playerMinimized;


            player.classList.toggle(
                'is-minimized',
                playerMinimized
            );


            minimizeButton.textContent =
                playerMinimized
                    ? '＋'
                    : '−';


            minimizeButton.title =
                playerMinimized
                    ? 'Expand player'
                    : 'Minimize player';


            minimizeButton.setAttribute(
                'aria-label',
                playerMinimized
                    ? 'Expand player'
                    : 'Minimize player'
            );
        }
    );


    closeButton?.addEventListener(
        'click',
        () => {

            closeAudioPlayer();
        }
    );
}


function closeAudioPlayer() {

    if (audio) {

        audio.pause();

        audio.currentTime = 0;
    }


    playerPlaying = false;

    playerCurrentTime = 0;

    playerDuration = 0;

    playerClosed = true;

    playerVisible = false;


    document
        .querySelectorAll(
            '.q2-ayah.is-playing'
        )
        .forEach(
            element =>
                element.classList.remove(
                    'is-playing'
                )
        );


    const player =
        document.querySelector(
            '[data-q2-player]'
        );


    if (player) {

        player.classList.add(
            'is-closed'
        );

        player.classList.remove(
            'is-minimized'
        );
    }
}


function openAudioPlayer() {

    playerClosed = false;

    playerVisible = true;


    const player =
        document.querySelector(
            '[data-q2-player]'
        );


    if (!player) {

        renderAudioPlayer();

        return;
    }


    player.classList.remove(
        'is-closed'
    );


    player.classList.toggle(
        'is-minimized',
        playerMinimized
    );


    updateAudioPlayer();

    updatePlayerTrack();
}


function bindAudioPlayer() {

    const player =
        document.querySelector(
            '[data-q2-player]'
        );

    if (!player) {
        return;
    }


    player
        .querySelector(
            '[data-q2-player-play]'
        )
        ?.addEventListener(
            'click',
            () => {

                if (!audio) {
                    return;
                }

                if (audio.paused) {

                    audio.play()
                        .catch(
                            error =>
                                console.error(
                                    '[Quran] Player play failed',
                                    error
                                )
                        );

                } else {

                    audio.pause();
                }
            }
        );


    player
        .querySelector(
            '[data-q2-player-prev]'
        )
        ?.addEventListener(
            'click',
            playPreviousAyah
        );


    player
        .querySelector(
            '[data-q2-player-next]'
        )
        ?.addEventListener(
            'click',
            playNextAyah
        );


    player
        .querySelector(
            '[data-q2-player-repeat]'
        )
        ?.addEventListener(
            'click',
            () => {

                playerRepeat =
                    !playerRepeat;

                player.classList.toggle(
                    'is-repeat',
                    playerRepeat
                );
            }
        );


    player
        .querySelector(
            '[data-q2-player-seek]'
        )
        ?.addEventListener(
            'input',
            event => {

                if (!audio) {
                    return;
                }

                audio.currentTime =
                    Number(
                        event.target.value
                    );
            }
        );


    bindAudioPlayerWindowControls();

    updateAudioPlayer();

    updatePlayerTrack();
}


function playPreviousAyah() {

    if (
        !state.quran.ayahs.length ||
        currentAudioIndex <= 0
    ) {
        return;
    }

    playAyah(
        currentAudioIndex - 1
    );
}


function playNextAyah() {

    if (
        !state.quran.ayahs.length
    ) {
        return;
    }

    const next =
        currentAudioIndex + 1;

    if (
        next >=
        state.quran.ayahs.length
    ) {

        if (playerRepeat) {

            playAyah(0);

        } else {

            stopAudioPlayer();
        }

        return;
    }

    playAyah(next);
}


function stopAudioPlayer() {

    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    playerPlaying = false;
    playerCurrentTime = 0;

    updateAudioPlayer();
}


export function renderQuranPage() {

    document
        .querySelector(
            '[data-q2-player]'
        )
        ?.remove();

    return `

        <section class="q2-page">

            <div class="q2-heading">

                <div>

                    <span class="q2-eyebrow">
                        THE QURAN
                    </span>

                    <h1>
                        Read the Quran
                    </h1>

                    <p>
                        Read, listen, search and continue
                        your journey through the Quran.
                    </p>

                </div>

            </div>


            <div
                class="q2-last-read"
                data-q2-last-read
            >
                <span>
                    Loading your reading position...
                </span>
            </div>


            <div class="q2-controls">

                <div class="q2-search-box">

                    <input
                        type="search"
                        placeholder="Search the Quran..."
                        data-q2-search
                    >

                    <button
                        class="q2-primary-button"
                        data-q2-search-submit
                    >
                        Search
                    </button>

                </div>


                <div class="q2-select-row">

                    <label>

                        <span>
                            Language
                        </span>

                        <select
                            data-q2-language
                        >
                            <option>
                                Loading...
                            </option>
                        </select>

                    </label>


                    <label>

                        <span>
                            Translation
                        </span>

                        <select
                            data-q2-translation
                        >
                            <option>
                                Loading...
                            </option>
                        </select>

                    </label>


                    <label>

                        <span>
                            Reciter
                        </span>

                        <select
                            data-q2-reciter
                        >
                            <option>
                                Loading...
                            </option>
                        </select>

                    </label>

                </div>


                <div class="q2-reader-settings">

                    <label>

                        <span>
                            Text size
                        </span>

                        <input
                            type="range"
                            min="80"
                            max="140"
                            step="5"
                            value="100"
                            data-q2-font
                        >

                    </label>


                    <label class="q2-checkbox">

                        <input
                            type="checkbox"
                            checked
                            data-q2-autoplay
                        >

                        <span>
                            Auto-play next ayah
                        </span>

                    </label>

                </div>

            </div>


            <div class="q2-tabs">

                <button
                    class="q2-tab is-active"
                    data-q2-tab="surahs"
                >
                    Surahs
                </button>

                <button
                    class="q2-tab"
                    data-q2-tab="juz"
                >
                    Juz
                </button>

                <button
                    class="q2-tab"
                    data-q2-tab="bookmarks"
                >
                    Bookmarks
                </button>

            </div>


            <div
                class="q2-browser"
                data-q2-browser
            >

                <div
                    class="q2-browser-heading"
                >

                    <div>

                        <span class="q2-eyebrow">
                            BROWSE
                        </span>

                        <h2>
                            All 114 Surahs
                        </h2>

                    </div>

                    <input
                        type="search"
                        placeholder="Filter Surahs..."
                        data-q2-surah-filter
                    >

                </div>


                <div
                    data-q2-content
                >

                    <div class="q2-loading">

                        <div class="q2-spinner"></div>

                        <p>
                            Loading Surahs...
                        </p>

                    </div>

                </div>

            </div>


            <div
                class="q2-reader is-hidden"
                data-q2-reader
            ></div>

        </section>
    `;
}


export function bindQuranPage() {

    createAudio();

    renderAudioPlayer();


    document
        .querySelector(
            '[data-q2-search-submit]'
        )
        ?.addEventListener(
            'click',
            performSearch
        );


    document
        .querySelector(
            '[data-q2-search]'
        )
        ?.addEventListener(
            'keydown',
            event => {

                if (
                    event.key ===
                    'Enter'
                ) {

                    performSearch();
                }
            }
        );


    document
        .querySelector(
            '[data-q2-language]'
        )
        ?.addEventListener(
            'change',
            event => {

                const language =
                    event.target.value;


                state.quran.selectedLanguage =
                    language;


                const editions =
                    language
                        ? getTranslationsForLanguage(
                            language
                        )
                        : state.quran.editions;


                const preferred =
                    editions.find(
                        edition =>
                            edition.identifier ===
                            state.quran.selectedTranslation
                    );


                state.quran.selectedTranslation =
                    preferred?.identifier ||
                    editions[0]?.identifier ||
                    state.quran.selectedTranslation;


                renderTranslationOptions();

                saveQuranState();


                if (
                    state.quran.selectedSurah
                ) {

                    loadSurah(
                        state.quran.selectedSurah,
                        state.quran.selectedAyah
                    );
                }
            }
        );


    document
        .querySelector(
            '[data-q2-translation]'
        )
        ?.addEventListener(
            'change',
            event => {

                state.quran.selectedTranslation =
                    event.target.value;


                const edition =
                    state.quran.editions.find(
                        item =>
                            item.identifier ===
                            state.quran.selectedTranslation
                    );


                state.quran.selectedLanguage =
                    edition?.language ||
                    state.quran.selectedLanguage;


                renderLanguageOptions();

                saveQuranState();


                if (
                    state.quran.selectedSurah
                ) {

                    loadSurah(
                        state.quran.selectedSurah,
                        state.quran.selectedAyah
                    );
                }
            }
        );


    document
        .querySelector(
            '[data-q2-reciter]'
        )
        ?.addEventListener(
            'change',
            event => {

                state.quran.selectedReciter =
                    event.target.value;

                saveQuranState();
            }
        );


    document
        .querySelector(
            '[data-q2-font]'
        )
        ?.addEventListener(
            'input',
            event => {

                state.quran.fontSize =
                    Number(
                        event.target.value
                    );

                saveQuranState();


                document
                    .querySelector(
                        '.q2-ayah-list'
                    )
                    ?.style
                    .setProperty(
                        '--q2-font-scale',
                        state.quran.fontSize /
                            100
                    );
            }
        );


    document
        .querySelector(
            '[data-q2-autoplay]'
        )
        ?.addEventListener(
            'change',
            event => {

                state.quran.autoPlay =
                    event.target.checked;

                saveQuranState();
            }
        );


    document
        .querySelectorAll(
            '[data-q2-tab]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    setView(
                        button.dataset.q2Tab
                    );
                }
            );
        });


    document
        .querySelector(
            '[data-q2-surah-filter]'
        )
        ?.addEventListener(
            'input',
            renderSurahList
        );


    initializeQuran();
}
