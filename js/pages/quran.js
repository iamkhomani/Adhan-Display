/*
 * Quran: browse surahs and juz, read with translation, listen ayah by ayah,
 * bookmarks, search and tafsir. The audio player keeps playing while you
 * move around the app.
 */

import { esc, highlight, debounce, reducedMotion } from '../core/util.js';
import { icon } from '../core/icons.js';
import { bus } from '../core/bus.js';
import { spinner, emptyState, openDialog, shareText, toast } from '../core/ui.js';
import {
    quranPrefs, surahList, translations, reciters, surah as loadSurahData, juz as loadJuzData,
    searchQuran, audioUrl, tafsir, sanitizeHtml
} from '../services/quran.js';
import { pageHeader } from './components.js';
import { t, locale } from '../core/i18n.js';

const SITE = 'https://adhandisplay.com/';

/* Browse state survives navigation. */
const browse = { tab: 'surahs', filter: '', query: '', results: null, searching: false };

/* Currently open reading section. */
let reading = null; // { kind: 'surah'|'juz', number, info, ayahs }

/* ---------------------------------------------------------------
 * Audio player (module level, so it survives page changes)
 * ------------------------------------------------------------- */

const player = {
    audio: null,
    queue: [],
    index: -1,
    title: '',
    repeat: false,
    attempt: 0,
    visible: false
};

function audioElement() {
    if (player.audio) {
        return player.audio;
    }

    const audio = new Audio();
    audio.preload = 'auto';

    audio.addEventListener('ended', () => {
        if (player.repeat) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        } else if (quranPrefs.get().autoPlay && player.index < player.queue.length - 1) {
            playIndex(player.index + 1);
        } else {
            updatePlayer();
        }
    });

    audio.addEventListener('error', () => {
        const ayah = player.queue[player.index];
        if (!ayah) {
            return;
        }
        player.attempt += 1;
        const next = audioUrl(quranPrefs.get().selectedReciter, ayah.number, player.attempt);
        if (next) {
            audio.src = next;
            audio.play().catch(() => {});
        } else {
            toast(t('quran.recitationFailed'));
            updatePlayer();
        }
    });

    ['play', 'pause', 'timeupdate', 'loadedmetadata'].forEach(type => audio.addEventListener(type, updatePlayerProgress));
    ['play', 'pause'].forEach(type => audio.addEventListener(type, () => {
        updatePlayer();
        markPlaying(false);
    }));

    player.audio = audio;
    return audio;
}

function playIndex(index) {
    const ayah = player.queue[index];

    if (!ayah) {
        return;
    }

    bus.emit('audio-exclusive', { source: 'quran' });

    const audio = audioElement();
    player.index = index;
    player.attempt = 0;
    player.visible = true;
    audio.src = audioUrl(quranPrefs.get().selectedReciter, ayah.number, 0);
    audio.play().catch(error => {
        if (error?.name !== 'AbortError') {
            updatePlayer();
        }
    });

    quranPrefs.update({ lastRead: { surah: ayah.surah, ayah: ayah.numberInSurah } });
    updatePlayer();
    markPlaying(true);
}

export function playFrom(ayahs, index, title) {
    player.queue = ayahs;
    player.title = title;
    playIndex(index);
}

function togglePlay() {
    const audio = audioElement();

    if (!audio.src && player.queue.length) {
        playIndex(Math.max(0, player.index));
    } else if (audio.paused) {
        bus.emit('audio-exclusive', { source: 'quran' });
        audio.play().catch(() => {});
    } else {
        audio.pause();
    }
}

function closePlayer() {
    player.audio?.pause();
    player.visible = false;
    updatePlayer();
    markPlaying(false);
}

function markPlaying(scroll) {
    document.querySelectorAll('.ayah.is-playing').forEach(element => {
        element.classList.remove('is-playing');
        const button = element.querySelector('[data-ayah-play]');
        if (button) {
            button.innerHTML = icon('play', { size: 16 });
        }
    });

    const ayah = player.queue[player.index];

    if (!ayah || !player.visible) {
        return;
    }

    const element = document.getElementById(`ayah-${ayah.number}`);

    if (element) {
        element.classList.add('is-playing');
        const button = element.querySelector('[data-ayah-play]');
        if (button && player.audio && !player.audio.paused) {
            button.innerHTML = icon('pause', { size: 16 });
        }
        if (scroll) {
            element.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
        }
    }
}

function updatePlayer() {
    const slot = document.getElementById('player');

    if (!slot) {
        return;
    }

    const ayah = player.queue[player.index];

    if (!player.visible || !ayah) {
        slot.innerHTML = '';
        document.body.classList.remove('has-player');
        return;
    }

    const playing = player.audio && !player.audio.paused;
    const reciterId = quranPrefs.get().selectedReciter;

    document.body.classList.add('has-player');
    slot.innerHTML = `
        <div class="player" role="region" aria-label="${esc(t('quran.audio'))}">
            <div class="player-progress"><span data-player-progress></span></div>
            <a class="player-info" href="#quran/${ayah.surah}:${ayah.numberInSurah}">
                <strong>${esc(ayah.surahName || player.title)} ${ayah.surah}:${ayah.numberInSurah}</strong>
                <small data-player-reciter>${esc(reciterName(reciterId))}</small>
            </a>
            <div class="player-controls">
                <button type="button" class="icon-button" data-player="prev" aria-label="${esc(t('quran.prevAyah'))}" ${player.index <= 0 ? 'disabled' : ''}>${icon('prev')}</button>
                <button type="button" class="icon-button player-play" data-player="toggle" aria-label="${esc(t(playing ? 'common.pause' : 'common.play'))}">${icon(playing ? 'pause' : 'play')}</button>
                <button type="button" class="icon-button" data-player="next" aria-label="${esc(t('quran.nextAyah'))}" ${player.index >= player.queue.length - 1 ? 'disabled' : ''}>${icon('next')}</button>
                <button type="button" class="icon-button ${player.repeat ? 'is-on' : ''}" data-player="repeat" aria-pressed="${player.repeat}" aria-label="${esc(t('quran.repeat'))}">${icon('repeat', { size: 18 })}</button>
                <button type="button" class="icon-button" data-player="close" aria-label="${esc(t('quran.closePlayer'))}">${icon('close', { size: 18 })}</button>
            </div>
        </div>
    `;

    updatePlayerProgress();
}

function updatePlayerProgress() {
    const bar = document.querySelector('[data-player-progress]');
    const audio = player.audio;

    if (bar && audio?.duration) {
        bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
}

let reciterCache = [];

function reciterName(id) {
    return reciterCache.find(item => item.id === id)?.name || id.replace(/^ar\./, '');
}

export function initQuranPlayer() {
    document.getElementById('player')?.addEventListener('click', event => {
        const button = event.target.closest('[data-player]');

        if (!button) {
            return;
        }

        const action = button.dataset.player;

        if (action === 'toggle') {
            togglePlay();
        } else if (action === 'prev' && player.index > 0) {
            playIndex(player.index - 1);
        } else if (action === 'next' && player.index < player.queue.length - 1) {
            playIndex(player.index + 1);
        } else if (action === 'repeat') {
            player.repeat = !player.repeat;
            updatePlayer();
        } else if (action === 'close') {
            closePlayer();
        }
    });

    bus.on('audio-exclusive', ({ source }) => {
        if (source !== 'quran') {
            player.audio?.pause();
        }
    });

    reciters().then(list => {
        reciterCache = list;
    }).catch(() => {});
}

/* ---------------------------------------------------------------
 * Browse
 * ------------------------------------------------------------- */

function continueCard() {
    const last = quranPrefs.get().lastRead;

    if (!last) {
        return '';
    }

    return `
        <a class="continue" href="#quran/${Number(last.surah)}:${Number(last.ayah)}" data-continue>
            ${icon('book', { size: 22 })}
            <span><span class="continue-label">${esc(t('quran.continue'))}</span>
            <strong data-continue-name>${esc(t('quran.surahAyah', { surah: t('quran.surahN', { n: Number(last.surah) }), ayah: Number(last.ayah) }))}</strong></span>
            ${icon('right')}
        </a>
    `;
}

function browseView() {
    return `
        <div class="page quran-page">
            ${pageHeader(t('nav.quran'), t('quran.lead'))}
            ${continueCard()}
            <form class="search-bar" data-quran-search role="search">
                ${icon('search', { size: 18 })}
                <input type="search" name="q" placeholder="${esc(t('quran.search'))}" value="${esc(browse.query)}" aria-label="${esc(t('quran.search'))}">
                <button type="submit" class="button button-primary">${esc(t('common.search'))}</button>
            </form>
            <div data-search-results></div>
            <div class="segmented" role="tablist" aria-label="${esc(t('quran.browseBy'))}">
                ${[['surahs', t('quran.surahs')], ['juz', t('quran.juz')], ['bookmarks', t('quran.bookmarks')]].map(([id, label]) => `
                    <button type="button" role="tab" class="segment ${browse.tab === id ? 'is-active' : ''}" data-browse-tab="${id}" aria-selected="${browse.tab === id}">${label}</button>
                `).join('')}
            </div>
            <div data-browse-body>${spinner()}</div>
        </div>
    `;
}

async function renderBrowseBody(root) {
    const body = root.querySelector('[data-browse-body]');

    if (!body) {
        return;
    }

    if (browse.tab === 'juz') {
        body.innerHTML = `<div class="juz-grid">${Array.from({ length: 30 }, (_, i) => `
            <a class="juz-card" href="#quran/juz/${i + 1}"><span>${esc(t('quran.juz'))}</span><strong class="tnum">${i + 1}</strong></a>`).join('')}</div>`;
        return;
    }

    if (browse.tab === 'bookmarks') {
        const bookmarks = quranPrefs.get().bookmarks;
        body.innerHTML = bookmarks.length ? `
            <ul class="bookmark-list">
                ${bookmarks.map(item => `
                    <li class="bookmark">
                        <a href="#quran/${Number(item.surah)}:${Number(item.ayah)}">
                            <strong>${esc(item.surahName || t('quran.surahN', { n: item.surah }))} ${Number(item.surah)}:${Number(item.ayah)}</strong>
                            <span class="bookmark-arabic" lang="ar" dir="rtl">${esc(item.text || '')}</span>
                            ${item.translationText ? `<span class="bookmark-text">${esc(item.translationText)}</span>` : ''}
                        </a>
                        <button type="button" class="icon-button" data-remove-bookmark="${Number(item.number)}" aria-label="${esc(t('quran.removeBookmark'))}">${icon('trash', { size: 18 })}</button>
                    </li>
                `).join('')}
            </ul>
        ` : emptyState({ title: t('quran.noBookmarks'), text: t('quran.noBookmarksText') });
        return;
    }

    try {
        const list = await surahList();
        const filter = browse.filter.toLowerCase();
        const items = list.filter(item => !filter ||
            String(item.number) === filter ||
            item.englishName.toLowerCase().includes(filter) ||
            item.meaning.toLowerCase().includes(filter) ||
            item.name.includes(browse.filter));

        if (!body.isConnected) {
            return;
        }

        body.innerHTML = `
            <div class="filter-field">
                ${icon('search', { size: 16 })}
                <input type="search" placeholder="${esc(t('quran.filter'))}" value="${esc(browse.filter)}" data-surah-filter aria-label="${esc(t('quran.filter'))}">
            </div>
            <ol class="surah-grid" data-surah-grid>
                ${items.map(item => `
                    <li><a class="surah-card" href="#quran/${item.number}">
                        <span class="surah-number tnum">${item.number}</span>
                        <span class="surah-names">
                            <strong>${esc(item.englishName)}</strong>
                            <small>${esc(t('quran.surahMeta', { meaning: item.meaning, count: item.ayahs }))}</small>
                        </span>
                        <span class="surah-arabic" lang="ar" dir="rtl">${esc(item.name.replace(/^سُورَةُ\s*/, ''))}</span>
                    </a></li>
                `).join('') || `<li class="muted">${esc(t('quran.noMatch'))}</li>`}
            </ol>
        `;

        const input = body.querySelector('[data-surah-filter]');
        input.addEventListener('input', debounce(() => {
            browse.filter = input.value.trim();
            const position = input.selectionStart;
            renderBrowseBody(root).then(() => {
                const next = root.querySelector('[data-surah-filter]');
                next?.focus();
                next?.setSelectionRange(position, position);
            });
        }, 200));

    } catch (error) {
        body.innerHTML = emptyState({
            title: t('quran.listFailed'),
            text: error.message,
            action: `<button type="button" class="button button-primary" data-reload-browse>${esc(t('common.tryAgain'))}</button>`
        });
    }
}

async function runSearch(root, query) {
    const box = root.querySelector('[data-search-results]');
    browse.query = query;

    if (!query) {
        browse.results = null;
        box.innerHTML = '';
        return;
    }

    box.innerHTML = spinner(t('common.searching'));

    const arabic = /[؀-ۿ]/.test(query);
    const edition = arabic ? 'quran-simple-clean' : quranPrefs.get().selectedTranslation;

    try {
        const result = await searchQuran(query, edition);
        browse.results = result;

        box.innerHTML = `
            <section class="search-results" aria-live="polite">
                <header class="panel-head">
                    <h2 class="panel-title">${esc(result.count ? t('common.results', { count: result.count }) : t('common.noResults'))}</h2>
                    <button type="button" class="link-button" data-clear-search>${esc(t('common.clear'))}</button>
                </header>
                ${result.count ? `<ol class="result-list">
                    ${result.matches.slice(0, 100).map(match => `
                        <li><a class="result" href="#quran/${match.surah}:${match.numberInSurah}">
                            <strong>${esc(match.surahName)} ${match.surah}:${match.numberInSurah}</strong>
                            <span ${arabic ? 'lang="ar" dir="rtl" class="result-arabic"' : ''}>${highlight(match.text, query)}</span>
                        </a></li>`).join('')}
                </ol>${result.count > 100 ? `<p class="panel-note">${esc(t('quran.first100'))}</p>` : ''}` : `<p class="panel-note">${esc(t('quran.tryOther'))}</p>`}
            </section>
        `;
    } catch (error) {
        box.innerHTML = emptyState({ title: t('common.searchFailed'), text: error.message });
    }
}

/* ---------------------------------------------------------------
 * Reader
 * ------------------------------------------------------------- */

function readerShell(kind, number) {
    return `
        <div class="page reader" data-reader>
            <div class="reader-bar">
                <a class="icon-button" href="#quran" aria-label="${esc(t('quran.allSurahs'))}">${icon('left')}</a>
                <div class="reader-bar-title" data-reader-title>${esc(kind === 'juz' ? t('quran.juzN', { n: number }) : t('quran.surahN', { n: number }))}</div>
                <button type="button" class="icon-button" data-reader-play aria-label="${esc(t('quran.playAll'))}">${icon('play', { size: 18 })}</button>
                <button type="button" class="icon-button" data-reader-options aria-label="${esc(t('quran.options'))}">${icon('type', { size: 18 })}</button>
            </div>
            <div class="reader-body" data-reader-body>${spinner()}</div>
        </div>
    `;
}

function ayahHTML(ayah, prefs, showSurahLabel) {
    const bookmarked = prefs.bookmarks.some(item => Number(item.number) === ayah.number);

    return `
        ${showSurahLabel ? `<h3 class="juz-surah">${esc(ayah.surahName)}</h3>` : ''}
        <article class="ayah" id="ayah-${ayah.number}" data-ayah="${ayah.number}" data-key="${ayah.surah}:${ayah.numberInSurah}">
            <p class="ayah-arabic" lang="ar" dir="rtl">${esc(ayah.text)} <span class="ayah-end" aria-label="${esc(t('quran.ayahN', { n: ayah.numberInSurah }))}">\u06DD${toArabicDigits(ayah.numberInSurah)}</span></p>
            ${prefs.showTranslation && ayah.translation ? `<p class="ayah-translation"><span class="ayah-ref tnum">${ayah.surah}:${ayah.numberInSurah}</span> ${esc(ayah.translation)}</p>` : ''}
            <div class="ayah-actions">
                ${prefs.showTranslation && ayah.translation ? '' : `<span class="ayah-ref tnum">${ayah.surah}:${ayah.numberInSurah}</span>`}
                <button type="button" class="icon-button" data-ayah-play="${ayah.number}" aria-label="${esc(t('quran.playAyah', { n: ayah.numberInSurah }))}">${icon('play', { size: 16 })}</button>
                <button type="button" class="icon-button ${bookmarked ? 'is-on' : ''}" data-ayah-bookmark="${ayah.number}" aria-pressed="${bookmarked}" aria-label="${esc(t('quran.bookmarkAyah', { n: ayah.numberInSurah }))}">${icon(bookmarked ? 'bookmarkFilled' : 'bookmark', { size: 16 })}</button>
                <button type="button" class="text-button" data-ayah-tafsir="${ayah.number}">${esc(t('quran.tafsir'))}</button>
                <button type="button" class="icon-button" data-ayah-share="${ayah.number}" aria-label="${esc(t('quran.shareAyah', { n: ayah.numberInSurah }))}">${icon('share', { size: 16 })}</button>
            </div>
        </article>
    `;
}

function toArabicDigits(number) {
    return String(number).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]);
}

function readerContent() {
    const prefs = quranPrefs.get();

    if (reading.kind === 'juz') {
        let lastSurah = null;
        return `
            <header class="surah-head">
                <h1 class="surah-title">${esc(t('quran.juzN', { n: reading.number }))}</h1>
            </header>
            <div class="ayahs" style="--quran-scale:${prefs.fontSize / 100}">
                ${reading.ayahs.map(ayah => {
                    const label = ayah.surah !== lastSurah;
                    lastSurah = ayah.surah;
                    return ayahHTML(ayah, prefs, label);
                }).join('')}
            </div>
            <nav class="reader-nav">
                ${reading.number > 1 ? `<a class="button button-ghost" href="#quran/juz/${reading.number - 1}">${icon('left', { size: 18 })} ${esc(t('quran.juzN', { n: reading.number - 1 }))}</a>` : '<span></span>'}
                ${reading.number < 30 ? `<a class="button button-ghost" href="#quran/juz/${reading.number + 1}">${esc(t('quran.juzN', { n: reading.number + 1 }))} ${icon('right', { size: 18 })}</a>` : ''}
            </nav>
        `;
    }

    const info = reading.info;
    const hasBasmala = info.number !== 1 && info.number !== 9;

    return `
        <header class="surah-head">
            <p class="surah-arabic-name" lang="ar" dir="rtl">${esc(info.name)}</p>
            <h1 class="surah-title">${esc(info.englishName)}</h1>
            <p class="surah-meta">${esc(t('quran.surahInfo', { meaning: info.meaning, type: t(info.type === 'Medinan' ? 'quran.medinan' : 'quran.meccan'), count: info.ayahs }))}</p>
        </header>
        ${hasBasmala ? '<p class="basmala" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>' : ''}
        <div class="ayahs" style="--quran-scale:${prefs.fontSize / 100}">
            ${reading.ayahs.map(ayah => ayahHTML(ayah, prefs, false)).join('')}
        </div>
        <nav class="reader-nav">
            ${info.number > 1 ? `<a class="button button-ghost" href="#quran/${info.number - 1}">${icon('left', { size: 18 })} ${esc(t('quran.prevSurah'))}</a>` : '<span></span>'}
            ${info.number < 114 ? `<a class="button button-primary" href="#quran/${info.number + 1}">${esc(t('quran.nextSurah'))} ${icon('right', { size: 18 })}</a>` : ''}
        </nav>
    `;
}

async function loadReader(root, kind, number, focusAyah) {
    const body = root.querySelector('[data-reader-body]');
    const title = root.querySelector('[data-reader-title]');
    const translation = quranPrefs.get().selectedTranslation;

    try {
        const data = kind === 'juz'
            ? await loadJuzData(number, translation).catch(() => loadJuzData(number, 'en.sahih'))
            : await loadSurahData(number, translation).catch(() => loadSurahData(number, 'en.sahih'));

        if (!body.isConnected) {
            return;
        }

        reading = { kind, number, info: data.info || null, ayahs: data.ayahs };
        title.textContent = kind === 'juz' ? t('quran.juzN', { n: number }) : `${data.info.englishName}`;
        document.title = `${title.textContent} | Adhan Display`;
        body.innerHTML = readerContent();
        markPlaying(false);

        if (focusAyah) {
            const target = body.querySelector(`[data-key="${number}:${focusAyah}"]`);
            if (target) {
                target.classList.add('is-target');
                requestAnimationFrame(() => target.scrollIntoView({ block: 'center' }));
                setTimeout(() => target.classList.remove('is-target'), 2500);
            }
        } else {
            window.scrollTo(0, 0);
        }

        if (kind === 'surah') {
            quranPrefs.update({ lastRead: { surah: number, ayah: focusAyah || 1 } });
        }

        trackReading(root);
    } catch (error) {
        body.innerHTML = emptyState({
            title: t('quran.sectionFailed'),
            text: error.message,
            action: `<button type="button" class="button button-primary" data-reader-retry>${icon('refresh')} ${esc(t('common.tryAgain'))}</button>`
        });
    }
}

/* Remember the ayah at the top of the screen as the reading position. */
let observer = null;

function trackReading(root) {
    observer?.disconnect();

    if (!('IntersectionObserver' in window) || reading?.kind !== 'surah') {
        return;
    }

    const save = debounce(key => {
        const [surah, ayah] = key.split(':').map(Number);
        quranPrefs.update({ lastRead: { surah, ayah } });
    }, 1500);

    observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
            save(visible.target.dataset.key);
        }
    }, { rootMargin: '-20% 0px -60% 0px' });

    root.querySelectorAll('.ayah').forEach(element => observer.observe(element));
}

async function openOptions(root) {
    const prefs = quranPrefs.get();
    const { root: dialog, close } = openDialog({
        title: t('quran.options'),
        body: `
            <label class="field-label" for="opt-translation">${esc(t('quran.translation'))}</label>
            <select id="opt-translation" class="select" data-opt="translation"><option>${esc(t('common.loading'))}</option></select>

            <label class="field-label" for="opt-reciter">${esc(t('quran.reciter'))}</label>
            <select id="opt-reciter" class="select" data-opt="reciter"><option>${esc(t('common.loading'))}</option></select>

            <label class="field-label" for="opt-size">${esc(t('quran.arabicSize'))}</label>
            <div class="range-row">
                <span class="range-small" lang="ar">ع</span>
                <input id="opt-size" type="range" min="80" max="160" step="10" value="${prefs.fontSize}" data-opt="size">
                <span class="range-large" lang="ar">ع</span>
            </div>

            <label class="switch-row"><span>${esc(t('quran.showTranslation'))}</span>
                <input type="checkbox" class="switch" data-opt="showTranslation" ${prefs.showTranslation ? 'checked' : ''}></label>
            <label class="switch-row"><span>${esc(t('quran.autoPlay'))}</span>
                <input type="checkbox" class="switch" data-opt="autoPlay" ${prefs.autoPlay ? 'checked' : ''}></label>
        `,
        onClose: () => {
            if (reading && root.isConnected) {
                const translation = quranPrefs.get().selectedTranslation;
                if (translation !== prefs.selectedTranslation) {
                    root.querySelector('[data-reader-body]').innerHTML = spinner();
                    loadReader(root, reading.kind, reading.number, null);
                } else {
                    root.querySelector('[data-reader-body]').innerHTML = readerContent();
                    markPlaying(false);
                    trackReading(root);
                }
            }
        }
    });

    fillTranslationSelect(dialog.querySelector('[data-opt="translation"]'), prefs.selectedTranslation);
    fillReciterSelect(dialog.querySelector('[data-opt="reciter"]'), prefs.selectedReciter);

    dialog.addEventListener('change', event => {
        const option = event.target.dataset.opt;
        if (option === 'translation') {
            quranPrefs.update({ selectedTranslation: event.target.value });
        } else if (option === 'reciter') {
            quranPrefs.update({ selectedReciter: event.target.value });
            updatePlayer();
        } else if (option === 'showTranslation' || option === 'autoPlay') {
            quranPrefs.update({ [option]: event.target.checked });
        }
    });

    dialog.querySelector('[data-opt="size"]').addEventListener('input', event => {
        quranPrefs.update({ fontSize: Number(event.target.value) });
        root.querySelector('.ayahs')?.style.setProperty('--quran-scale', Number(event.target.value) / 100);
    });

    return close;
}

export async function fillTranslationSelect(select, selected) {
    try {
        const list = await translations();
        const languageNames = new Intl.DisplayNames([locale(), 'en'], { type: 'language' });
        const groups = new Map();

        list.forEach(item => {
            if (!groups.has(item.language)) {
                groups.set(item.language, []);
            }
            groups.get(item.language).push(item);
        });

        const name = code => {
            try {
                return languageNames.of(code) || code;
            } catch {
                return code;
            }
        };

        select.innerHTML = [...groups.entries()]
            .sort((a, b) => name(a[0]).localeCompare(name(b[0])))
            .map(([language, items]) => `
                <optgroup label="${esc(name(language))}">
                    ${items.map(item => `<option value="${esc(item.id)}" ${item.id === selected ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}
                </optgroup>
            `).join('');
    } catch {
        select.innerHTML = `<option value="${esc(selected)}">${esc(selected)}</option>`;
    }
}

export async function fillReciterSelect(select, selected) {
    try {
        const list = await reciters();
        reciterCache = list;
        select.innerHTML = list.map(item => `<option value="${esc(item.id)}" ${item.id === selected ? 'selected' : ''}>${esc(item.name)}</option>`).join('');
    } catch {
        select.innerHTML = `<option value="${esc(selected)}">${esc(reciterName(selected))}</option>`;
    }
}

async function openTafsir(ayah) {
    const { root } = openDialog({
        title: t('quran.tafsirTitle', { ref: `${ayah.surahName} ${ayah.surah}:${ayah.numberInSurah}` }),
        wide: true,
        body: `
            <p class="ayah-arabic dialog-arabic" lang="ar" dir="rtl">${esc(ayah.text)}</p>
            ${ayah.translation ? `<p class="ayah-translation">${esc(ayah.translation)}</p>` : ''}
            <div class="tafsir" data-tafsir lang="en">${spinner()}</div>
        `
    });

    const box = root.querySelector('[data-tafsir]');

    try {
        const result = await tafsir(ayah.surah, ayah.numberInSurah);
        box.innerHTML = `
            <p class="source">${esc(result.name)}</p>
            ${sanitizeHtml(result.html) || `<p>${esc(t('quran.noTafsir'))}</p>`}
            <p><a class="link-button" href="https://quran.com/${ayah.surah}:${ayah.numberInSurah}" target="_blank" rel="noopener noreferrer">${icon('external', { size: 16 })} ${esc(t('quran.openQuranCom'))}</a></p>
        `;
    } catch (error) {
        box.innerHTML = `
            <p class="field-error">${esc(t('quran.tafsirFailed'))} ${esc(error.message)}</p>
            <p><a class="link-button" href="https://quran.com/${ayah.surah}:${ayah.numberInSurah}" target="_blank" rel="noopener noreferrer">${icon('external', { size: 16 })} ${esc(t('quran.openQuranCom'))}</a></p>
        `;
    }
}

function findAyah(number) {
    return reading?.ayahs.find(ayah => ayah.number === Number(number)) || null;
}

/* ---------------------------------------------------------------
 * Page
 * ------------------------------------------------------------- */

function parsePath(path) {
    const [first, second] = path;

    if (first === 'juz' && Number(second) >= 1 && Number(second) <= 30) {
        return { view: 'juz', number: Number(second) };
    }

    if (first === 'juz' || first === 'bookmarks') {
        return { view: 'browse', tab: first === 'juz' ? 'juz' : 'bookmarks' };
    }

    const match = String(first || '').match(/^(\d{1,3})(?::(\d{1,3}))?$/);

    if (match && Number(match[1]) >= 1 && Number(match[1]) <= 114) {
        return { view: 'surah', number: Number(match[1]), ayah: match[2] ? Number(match[2]) : null };
    }

    return { view: 'browse' };
}

export const quranPage = {
    titleKey: 'nav.quran',

    render(path) {
        const route = parsePath(path);

        if (route.view === 'browse') {
            if (route.tab) {
                browse.tab = route.tab;
            }
            return browseView();
        }

        return readerShell(route.view === 'juz' ? 'juz' : 'surah', route.number);
    },

    mount(root, path, ctx) {
        const route = parsePath(path);
        ctx.cleanup(() => observer?.disconnect());

        if (route.view === 'browse') {
            renderBrowseBody(root);

            const last = quranPrefs.get().lastRead;
            surahList().then(list => {
                const name = root.querySelector('[data-continue-name]');
                const info = last && list.find(item => item.number === Number(last.surah));
                if (name && info) {
                    name.textContent = t('quran.surahAyah', { surah: info.englishName, ayah: last.ayah });
                }
            }).catch(() => {});

            if (browse.query) {
                runSearch(root, browse.query);
            }

            root.addEventListener('submit', event => {
                if (event.target.matches('[data-quran-search]')) {
                    event.preventDefault();
                    runSearch(root, new FormData(event.target).get('q').toString().trim());
                }
            });

            root.addEventListener('click', event => {
                const tab = event.target.closest('[data-browse-tab]');
                const remove = event.target.closest('[data-remove-bookmark]');

                if (tab) {
                    browse.tab = tab.dataset.browseTab;
                    root.querySelectorAll('[data-browse-tab]').forEach(button => {
                        const active = button === tab;
                        button.classList.toggle('is-active', active);
                        button.setAttribute('aria-selected', String(active));
                    });
                    renderBrowseBody(root);
                } else if (remove) {
                    const bookmarks = quranPrefs.get().bookmarks.filter(item => Number(item.number) !== Number(remove.dataset.removeBookmark));
                    quranPrefs.update({ bookmarks });
                    renderBrowseBody(root);
                } else if (event.target.closest('[data-clear-search]')) {
                    browse.query = '';
                    browse.results = null;
                    root.querySelector('[data-search-results]').innerHTML = '';
                    root.querySelector('[data-quran-search] input').value = '';
                } else if (event.target.closest('[data-reload-browse]')) {
                    renderBrowseBody(root);
                }
            });

            return;
        }

        const kind = route.view === 'juz' ? 'juz' : 'surah';
        loadReader(root, kind, route.number, route.ayah);

        root.addEventListener('click', event => {
            const target = event.target;
            const play = target.closest('[data-ayah-play]');
            const bookmark = target.closest('[data-ayah-bookmark]');
            const tafsirButton = target.closest('[data-ayah-tafsir]');
            const share = target.closest('[data-ayah-share]');

            if (play) {
                const index = reading.ayahs.findIndex(ayah => ayah.number === Number(play.dataset.ayahPlay));
                const current = player.queue[player.index];
                if (current && current.number === Number(play.dataset.ayahPlay) && player.visible) {
                    togglePlay();
                } else {
                    playFrom(reading.ayahs, index, reading.info?.englishName || t('quran.juzN', { n: reading.number }));
                }
            } else if (bookmark) {
                const ayah = findAyah(bookmark.dataset.ayahBookmark);
                if (ayah) {
                    const added = quranPrefs.toggleBookmark(ayah);
                    bookmark.classList.toggle('is-on', added);
                    bookmark.setAttribute('aria-pressed', String(added));
                    bookmark.innerHTML = icon(added ? 'bookmarkFilled' : 'bookmark', { size: 16 });
                    toast(t(added ? 'quran.bookmarkSaved' : 'quran.bookmarkRemoved'), { duration: 2000 });
                }
            } else if (tafsirButton) {
                const ayah = findAyah(tafsirButton.dataset.ayahTafsir);
                if (ayah) {
                    openTafsir(ayah);
                }
            } else if (share) {
                const ayah = findAyah(share.dataset.ayahShare);
                if (ayah) {
                    shareText({
                        title: `${t('nav.quran')} ${ayah.surah}:${ayah.numberInSurah}`,
                        text: `${ayah.text}\n\n${ayah.translation}\n\n${ayah.surahName} ${ayah.surah}:${ayah.numberInSurah}`,
                        url: `${SITE}#quran/${ayah.surah}:${ayah.numberInSurah}`
                    });
                }
            } else if (target.closest('[data-reader-play]') && reading) {
                playFrom(reading.ayahs, 0, reading.info?.englishName || t('quran.juzN', { n: reading.number }));
            } else if (target.closest('[data-reader-options]')) {
                openOptions(root);
            } else if (target.closest('[data-reader-retry]')) {
                loadReader(root, kind, route.number, route.ayah);
            }
        });
    }
};
