/*
 * Adhan Tajweed: a beginner's course in reading the Quran.
 *
 * Routes: #tajweed (lessons), #tajweed/letters, #tajweed/games,
 * #tajweed/progress, #tajweed/lesson/<id>, #tajweed/game/<id> and
 * #tajweed/mix. Lessons and games run inside the page; progress (XP,
 * stars, streak) is kept on this device under adhan_tajweed.
 *
 * The section is written in English and Dutch (js/data/tajweed.js); other
 * interface languages show English.
 */

import { esc, reducedMotion } from '../core/util.js';
import { icon } from '../core/icons.js';
import { store } from '../core/storage.js';
import { toast, confirmDialog } from '../core/ui.js';
import { t, lang } from '../core/i18n.js';
import { pageHeader, tabsHTML } from './components.js';
import { playArabic, stopAudio, prepareAudio } from '../services/tajweed-audio.js';
import {
    UI, LETTERS, PLACES, HEAVY, QALQALAH, SUN, NON_JOINING, SUN_MOON, MODS, TRANSLIT, LAB_LETTERS,
    labText, MAKHARIJ, STOP_SIGNS, OPTIONS, LESSONS, WIDGET_DATA, RAA_WORDS, GAMES, DUA
} from '../data/tajweed.js';

const STORE_KEY = 'tajweed';

/* ---------------------------------------------------------------
 * Language and progress
 * ------------------------------------------------------------- */

const code = () => (lang().code === 'nl' ? 'nl' : 'en');

/* Text in the section language; {name} placeholders are filled from params. */
function tr(value, params = {}) {
    const text = value && typeof value === 'object' ? (value[code()] ?? value.en) : String(value ?? '');
    return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? String(params[name]) : match));
}

const DEFAULTS = { xp: 0, done: {}, best: {}, streak: 0, last: null, slow: false, name: '' };

function progress() {
    const saved = store.get(STORE_KEY, {});
    return { ...DEFAULTS, ...(saved && typeof saved === 'object' ? saved : {}) };
}

function saveProgress(update) {
    const next = { ...progress(), ...update };
    store.set(STORE_KEY, next);
    return next;
}

function localDay(offset = 0) {
    const date = new Date(Date.now() + offset * 86400000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addXP(amount, extra = {}) {
    const state = progress();
    const today = localDay();
    let streak = state.streak;
    if (state.last !== today) {
        streak = state.last === localDay(-1) ? streak + 1 : 1;
    }
    return saveProgress({ ...extra, xp: state.xp + amount, streak, last: today });
}

const level = xp => Math.floor(Math.sqrt(xp / 40)) + 1;
const doneCount = state => LESSONS.filter(lesson => state.done[lesson.id]).length;

/* ---------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------- */

const shuffle = list => {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};
const pick = (list, count) => shuffle(list).slice(0, count);
const letterRow = letter => LETTERS.find(row => row[0] === letter);

function forms(letter) {
    return NON_JOINING.includes(letter)
        ? [letter, letter, `ـ${letter}`, `ـ${letter}`]
        : [letter, `${letter}ـ`, `ـ${letter}ـ`, `ـ${letter}`];
}

function playButton(say, small = false) {
    return `<button type="button" class="tj-play ${small ? 'is-small' : ''}" data-say="${esc(say)}" aria-label="${esc(tr(UI.listen))}" title="${esc(tr(UI.listen))}">${icon('volume', { size: small ? 16 : 18 })}</button>`;
}

function ar(text, className = '') {
    return `<span class="tj-ar ${className}" lang="ar" dir="rtl">${esc(text)}</span>`;
}

let actx = null;
function beep(ok) {
    try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        const now = actx.currentTime;
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.frequency.setValueAtTime(ok ? 660 : 220, now);
        osc.frequency.setValueAtTime(ok ? 880 : 180, now + 0.09);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
    } catch {
        /* sound effects are optional */
    }
}

function confetti() {
    if (reducedMotion()) {
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.className = 'tj-confetti';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const context = canvas.getContext('2d');
    const colors = ['#e3bf68', '#f6dc98', '#a87b2e', '#f2ead9'];
    const bits = Array.from({ length: 80 }, () => ({
        x: canvas.width / 2, y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 11 - 3,
        r: Math.random() * 4 + 2, color: colors[Math.floor(Math.random() * colors.length)], alpha: 1
    }));
    let frame = 0;
    (function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        bits.forEach(bit => {
            bit.x += bit.vx;
            bit.y += bit.vy;
            bit.vy += 0.35;
            bit.alpha -= 0.012;
            context.globalAlpha = Math.max(bit.alpha, 0);
            context.fillStyle = bit.color;
            context.beginPath();
            context.arc(bit.x, bit.y, bit.r, 0, 7);
            context.fill();
        });
        if (++frame < 90) {
            requestAnimationFrame(draw);
        } else {
            canvas.remove();
        }
    })();
}

async function say(text) {
    const result = await playArabic(text, { slow: progress().slow });
    if (result === 'none') {
        toast(tr(UI.noVoice));
    }
}

/* ---------------------------------------------------------------
 * Shared page parts
 * ------------------------------------------------------------- */

function statsHTML(state) {
    return `
        <div class="tj-stats">
            <span class="tj-pill" title="${esc(tr(UI.streak))}">🔥 <b data-tj-streak>${state.streak}</b></span>
            <span class="tj-pill">✦ <b data-tj-xp>${state.xp}</b> ${esc(tr(UI.xp))}</span>
            <button type="button" class="icon-button tj-slow ${state.slow ? 'is-on' : ''}" data-tj-slow aria-pressed="${state.slow}" aria-label="${esc(tr(UI.slow))}" title="${esc(tr(UI.slow))}">
                <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M3.5 17h12.5a4 4 0 0 0 4-4"/><circle cx="10" cy="12" r="4.5"/><path d="M10 12a1.5 1.5 0 1 1 1.5-1.5"/><path d="M20 13V8.5M18 8.5l2-2"/></svg>
            </button>
        </div>
    `;
}

function frame(active, body) {
    const state = progress();
    const tabs = [['', tr(UI.tabPath)], ['letters', tr(UI.tabLetters)], ['games', tr(UI.tabGames)], ['progress', tr(UI.tabProgress)]];
    return `
        <div class="page tajweed-page" lang="${code()}" dir="ltr">
            ${pageHeader('Adhan Tajweed', tr(UI.lead), statsHTML(state))}
            ${tabsHTML('tajweed', tabs, active)}
            <div data-tj-body>${body}</div>
        </div>
    `;
}

function flowFrame(body) {
    return `
        <div class="page tajweed-page tajweed-flow" lang="${code()}" dir="ltr">
            <div data-tj-body>${body}</div>
        </div>
    `;
}

function exampleList(rows) {
    return `<div class="tj-ex-list">${rows.map(([arabic, translit, meaning, play]) => `
        <div class="tj-ex">
            ${ar(arabic, 'tj-ex-ar')}
            <span class="tj-ex-text"><strong>${esc(translit)}</strong><small>${esc(tr(meaning))}</small></span>
            ${playButton(play || arabic)}
        </div>
    `).join('')}</div>`;
}

function letterList(letters) {
    return exampleList(letters.split('').map(letter => {
        const row = letterRow(letter);
        return [letter, row[1], row[3], row[2]];
    }));
}

function rulesList(rows, kind = 'weight') {
    return `<div class="tj-rules">${rows.map(([mark, text, example]) => `
        <div class="tj-rule">
            <span class="tj-badge ${kind === 'weight' ? `is-${mark}` : 'is-vowel'}">${esc(kind === 'weight' ? tr(mark === 'h' ? UI.heavy : UI.light) : mark)}</span>
            <span class="tj-rule-text">${esc(tr(text))}</span>
            <span class="tj-rule-ex">${ar(example)}${playButton(example, true)}</span>
        </div>
    `).join('')}</div>`;
}

function letterTile(letter, { sub = '', play = '', attr = '', className = '' } = {}) {
    return `<button type="button" class="tj-tile ${HEAVY.includes(letter) ? 'is-heavy' : ''} ${className}" ${play ? `data-say="${esc(play)}"` : ''} ${attr}>
        ${ar(letter)}<small>${esc(sub)}</small>
    </button>`;
}

/* ---------------------------------------------------------------
 * Lesson widgets
 * ------------------------------------------------------------- */

const WIDGETS = {
    alphabet: () => `
        <div class="tj-tiles" dir="rtl">${LETTERS.map(row => letterTile(row[0], { sub: row[1], play: row[2] })).join('')}</div>
        <p class="tj-note">${esc(tr(UI.heavyHint))}</p>`,

    forms: () => `
        <div class="tj-chips" dir="rtl">${LETTERS.filter(row => row[0] !== 'ء').map((row, index) =>
            `<button type="button" class="chip tj-chip-ar ${index === 1 ? 'is-on' : ''}" data-tj-form="${row[0]}">${ar(row[0])}</button>`).join('')}</div>
        <div data-tj-form-out>${formCard('ب')}</div>`,

    nonjoin: () => `<div class="tj-chips tj-center" dir="rtl">${'ادذرزو'.split('').map(letter =>
        `<button type="button" class="chip is-on tj-chip-ar" data-say="${esc(letterRow(letter)[2])}">${ar(letter)}</button>`).join('')}</div>`,

    makharij: () => `<div class="tj-areas">${MAKHARIJ.map(([title, text, path, points], index) => `
        <details class="tj-area" ${index === 1 ? 'open' : ''}>
            <summary>
                <span class="tj-area-icon"><svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg></span>
                <span><strong>${esc(tr(title))}</strong><small>${esc(tr(text))}</small></span>
            </summary>
            ${points.map(([letters, note, sounds]) => `
                <div class="tj-point">
                    <span class="tj-point-letters" dir="rtl">${letters.split(' ').map((letter, i) =>
                        `<button type="button" data-say="${esc(sounds[i] || sounds[0])}">${ar(letter)}</button>`).join('')}</span>
                    <span>${esc(tr(note))}</span>
                </div>
            `).join('')}
        </details>
    `).join('')}</div>`,

    heavyset: () => `<div class="tj-tiles" dir="rtl">${HEAVY.split('').map(letter =>
        letterTile(letter, { sub: letterRow(letter)[1], play: letterRow(letter)[2] })).join('')}</div>`,

    qalqset: () => `<div class="tj-tiles" dir="rtl">${QALQALAH.split('').map(letter =>
        letterTile(`${letter}ْ`, { sub: letterRow(letter)[1], play: `أَ${letter}ْ`, className: 'is-gold' })).join('')}</div>`,

    pairs: () => `<div class="tj-rules">${WIDGET_DATA.PAIRS.map(([lightLetter, heavyLetter]) => `
        <div class="tj-pair">
            <span class="tj-pair-side">${ar(`${lightLetter}َ`, 'is-light')}${playButton(`${lightLetter}َ`, true)}</span>
            <span class="tj-muted">vs</span>
            <span class="tj-pair-side">${ar(`${heavyLetter}َ`, 'is-heavy')}${playButton(`${heavyLetter}َ`, true)}</span>
        </div>`).join('')}</div>`,

    lab: card => `
        <div class="tj-chips" dir="rtl">${LAB_LETTERS.map((letter, index) =>
            `<button type="button" class="chip tj-chip-ar ${index === 0 ? 'is-on' : ''}" data-tj-lab="${letter}">${ar(letter)}</button>`).join('')}</div>
        <div class="tj-lab-out" data-tj-lab-out>${labOut('ب', card.mods[0])}</div>
        <div class="tj-mods">${card.mods.map((mod, index) =>
            `<button type="button" class="tj-mod ${index === 0 ? 'is-on' : ''}" data-tj-mod="${mod}">${esc(tr(MODS[mod][1]))}</button>`).join('')}</div>`,

    wasl: () => rulesList(WIDGET_DATA.WASL_RULES, 'vowel'),

    sunmoon: () => `
        <div class="tj-chips"><span class="tj-tag is-gold">☀ ${esc(tr(UI.sunLam))}</span><span class="tj-tag is-light">☾ ${esc(tr(UI.moonLam))}</span></div>
        <div class="tj-tiles" dir="rtl">${Object.keys(SUN_MOON).map(letter =>
            letterTile(letter, { sub: `${SUN.includes(letter) ? '☀' : '☾'} ${tr(SUN.includes(letter) ? UI.sunShort : UI.moonShort)}`, attr: `data-tj-sm="${letter}"`, className: SUN.includes(letter) ? 'is-sun' : 'is-moon' })).join('')}</div>
        <div data-tj-sm-out></div>`,

    stops: () => `<div class="tj-rules">${STOP_SIGNS.map(([, name, meaning, text]) => `
        <div class="tj-rule tj-stop">
            <span class="tj-stop-sign" lang="ar" dir="rtl">${esc(name)}</span>
            <span><strong>${esc(tr(meaning))}</strong><small>${esc(tr(text))}</small></span>
        </div>`).join('')}</div>`
};

function formCard(letter) {
    const row = letterRow(letter);
    const names = [UI.isolated, UI.initial, UI.medial, UI.final];
    return `
        <div class="tj-form-card">
            <div class="tj-form-head"><strong>${esc(row[1])}</strong><span>${esc(tr(row[3]))}</span>${playButton(row[2], true)}</div>
            <div class="tj-forms" dir="rtl">${forms(letter).map((shape, index) => `<div>${ar(shape)}<small>${esc(tr(names[index]))}</small></div>`).join('')}</div>
            ${NON_JOINING.includes(letter) ? `<p class="tj-note">${esc(tr(UI.nonJoinNote))}</p>` : ''}
        </div>`;
}

function labOut(letter, mod) {
    const shown = mod === 'sukoon' ? `أَ${letter}ْ` : letter + MODS[mod][0];
    const sound = mod === 'sukoon' ? `a${TRANSLIT[letter]}` : TRANSLIT[letter] + MODS[mod][2];
    return `${ar(shown)}<span class="tj-lab-sound">${esc(sound)}</span>${playButton(labText(letter, mod))}`;
}

function bindWidgets(root) {
    root.querySelectorAll('[data-tj-form]').forEach(button => button.addEventListener('click', () => {
        root.querySelectorAll('[data-tj-form]').forEach(item => item.classList.toggle('is-on', item === button));
        root.querySelector('[data-tj-form-out]').innerHTML = formCard(button.dataset.tjForm);
        say(letterRow(button.dataset.tjForm)[2]);
    }));

    const lab = { letter: 'ب', mod: root.querySelector('[data-tj-mod]')?.dataset.tjMod };
    const drawLab = () => {
        const out = root.querySelector('[data-tj-lab-out]');
        if (out) {
            out.innerHTML = labOut(lab.letter, lab.mod);
            say(labText(lab.letter, lab.mod));
        }
    };
    root.querySelectorAll('[data-tj-lab]').forEach(button => button.addEventListener('click', () => {
        root.querySelectorAll('[data-tj-lab]').forEach(item => item.classList.toggle('is-on', item === button));
        lab.letter = button.dataset.tjLab;
        drawLab();
    }));
    root.querySelectorAll('[data-tj-mod]').forEach(button => button.addEventListener('click', () => {
        root.querySelectorAll('[data-tj-mod]').forEach(item => item.classList.toggle('is-on', item === button));
        lab.mod = button.dataset.tjMod;
        drawLab();
    }));

    root.querySelectorAll('[data-tj-sm]').forEach(button => button.addEventListener('click', () => {
        const letter = button.dataset.tjSm;
        const [word, translit, meaning] = SUN_MOON[letter];
        const sun = SUN.includes(letter);
        root.querySelector('[data-tj-sm-out]').innerHTML = exampleList([[word, translit, {
            en: `${tr(meaning)} · ${sun ? tr(UI.sunExplain, { letter }) : tr(UI.moonExplain)}`,
            nl: `${tr(meaning)} · ${sun ? tr(UI.sunExplain, { letter }) : tr(UI.moonExplain)}`
        }]]);
        say(word);
    }));
}

/* ---------------------------------------------------------------
 * Views
 * ------------------------------------------------------------- */

function pathView() {
    const state = progress();
    const done = doneCount(state);
    const next = LESSONS.find(lesson => !state.done[lesson.id]);
    const total = LESSONS.length;
    const title = done === 0 ? UI.heroStart : done === total ? UI.heroDone : UI.heroBack;
    const text = done === 0 ? UI.heroStartText : done === total ? UI.heroDoneText : UI.heroBackText;

    return `
        <section class="tj-hero">
            <span class="tj-hero-bg" aria-hidden="true" lang="ar">تِلَاوَة</span>
            <h2 class="tj-hero-title">${esc(tr(title))}</h2>
            <p>${esc(tr(text, { done, total }))}</p>
            <div class="button-row">
                ${next ? `<a class="button button-primary" href="#tajweed/lesson/${next.id}">${esc(tr(done ? UI.continue : UI.startLesson1))} ${icon('right', { size: 18 })}</a>` : ''}
                ${done ? `<a class="button button-ghost" href="#tajweed/mix">${esc(tr(UI.dailyMix))}</a>` : ''}
            </div>
            <div class="tj-progress"><i style="width:${(done / total) * 100}%"></i></div>
        </section>

        <div class="tj-section-head"><h2 class="section-title">${esc(tr(UI.tabPath))}</h2><span>${esc(tr(UI.completed, { done, total }))}</span></div>
        <div class="tj-path">
            ${LESSONS.map((lesson, index) => {
                const stars = state.done[lesson.id];
                const isNext = next?.id === lesson.id;
                return `
                    <a class="tj-unit ${stars ? 'is-done' : ''} ${isNext ? 'is-next' : ''}" href="#tajweed/lesson/${lesson.id}">
                        <span class="tj-unit-mark">${ar(lesson.ar)}</span>
                        <span class="tj-unit-text"><strong>${index + 1}. ${esc(tr(lesson.t))}</strong><small>${esc(tr(lesson.s))}</small></span>
                        <span class="tj-unit-state">${stars ? `${'★'.repeat(stars)}` : isNext ? esc(tr(UI.next)) : ''}</span>
                    </a>`;
            }).join('')}
            <a class="tj-unit ${done === total ? 'is-next' : ''}" href="#tajweed/progress">
                <span class="tj-unit-mark">${ar('۞')}</span>
                <span class="tj-unit-text"><strong>${esc(tr(UI.certificate))}</strong><small>${esc(tr(UI.certificateNext))}</small></span>
            </a>
        </div>
        <p class="tj-credit">${esc(tr(UI.credit))}</p>
    `;
}

function lettersView() {
    return `
        <div class="tj-section-head"><h2 class="section-title">${esc(tr(UI.allLetters))}</h2><span>${esc(tr(UI.tapForDetails))}</span></div>
        <div data-tj-letter-detail>${letterDetail('ب')}</div>
        <div class="tj-tiles" dir="rtl">${LETTERS.map(row => letterTile(row[0], { sub: row[1], attr: `data-tj-letter="${row[0]}"`, className: row[0] === 'ب' ? 'is-selected' : '' })).join('')}</div>
    `;
}

function letterDetail(letter) {
    const [, translit, name, hint, place] = letterRow(letter);
    const weight = HEAVY.includes(letter) ? UI.heavy : letter === 'ر' ? UI.heavyOrLight : UI.light;
    const names = [UI.isolated, UI.initial, UI.medial, UI.final];
    const vowel = !'اء'.includes(letter);
    return `
        <article class="panel tj-detail">
            <div class="tj-detail-top">
                <div class="tj-big" lang="ar">${esc(letter)}</div>
                <div>
                    <h3 class="tj-detail-title">${esc(translit)} ${ar(name, 'tj-muted')}</h3>
                    <p class="tj-detail-hint">${esc(tr(hint))}</p>
                    <div class="tj-chips">
                        <span class="tj-tag ${HEAVY.includes(letter) ? 'is-heavy' : 'is-light'}">${esc(tr(weight))}</span>
                        <span class="tj-tag">${esc(tr(PLACES[place]))}</span>
                        ${QALQALAH.includes(letter) ? `<span class="tj-tag is-gold">${esc(tr(UI.qalqalah))}</span>` : ''}
                        ${letter !== 'ء' ? `<span class="tj-tag">${SUN.includes(letter) ? '☀' : '☾'} ${esc(tr(SUN.includes(letter) ? UI.sunLetter : UI.moonLetter))}</span>` : ''}
                    </div>
                    <div class="button-row">
                        <button type="button" class="button button-primary" data-say="${esc(name)}">${icon('volume', { size: 18 })} ${esc(tr(UI.name))}</button>
                        ${vowel ? `
                            <button type="button" class="button button-ghost" data-say="${esc(`${letter}َ`)}">${ar(`${letter}َ`)}</button>
                            <button type="button" class="button button-ghost" data-say="${esc(`${letter}ِ`)}">${ar(`${letter}ِ`)}</button>
                            <button type="button" class="button button-ghost" data-say="${esc(`${letter}ُ`)}">${ar(`${letter}ُ`)}</button>
                            <button type="button" class="button button-ghost" data-say="${esc(`أَ${letter}ْ`)}">${ar(`أَ${letter}ْ`)}</button>` : ''}
                    </div>
                </div>
            </div>
            ${letter !== 'ء' ? `<div class="tj-forms" dir="rtl">${forms(letter).map((shape, index) => `<div>${ar(shape)}<small>${esc(tr(names[index]))}</small></div>`).join('')}</div>` : ''}
        </article>`;
}

function gamesView() {
    const state = progress();
    return `
        <div class="tj-section-head"><h2 class="section-title">${esc(tr(UI.tabGames))}</h2><span>${esc(tr(UI.gamesLead))}</span></div>
        <div class="tj-games">${GAMES.map(game => `
            <a class="tj-game" href="#tajweed/game/${game.id}">
                ${ar(game.ar, 'tj-game-ar')}
                <strong>${esc(tr(game.t))}</strong>
                <small>${esc(tr(game.s))}</small>
                ${state.best[game.id] != null ? `<span class="tj-best">${esc(tr(UI.best, { score: state.best[game.id] }))}</span>` : ''}
            </a>`).join('')}
        </div>
        <p class="tj-tip">${icon('volume', { size: 18 })}<span>${esc(tr(UI.soundTip))}</span></p>
    `;
}

function progressView() {
    const state = progress();
    const done = doneCount(state);
    const all = done === LESSONS.length;
    return `
        <div class="tj-kpis">
            <div class="tj-kpi"><b>${state.xp}</b><span>${esc(tr(UI.xp))} · ${esc(tr(UI.level, { n: level(state.xp) }))}</span></div>
            <div class="tj-kpi"><b>${state.streak}</b><span>${esc(tr(UI.streak))}</span></div>
            <div class="tj-kpi"><b>${done}/${LESSONS.length}</b><span>${esc(tr(UI.lessons))}</span></div>
        </div>

        <div class="tj-section-head"><h2 class="section-title">${esc(tr(UI.certificate))}</h2><span>${esc(all ? tr(UI.unlocked) : tr(UI.lessonsLeft, { count: LESSONS.length - done }))}</span></div>
        ${all ? `<label class="field"><span class="field-label">${esc(tr(UI.yourName))}</span><input class="input" type="text" maxlength="40" data-tj-name value="${esc(state.name)}" placeholder="${esc(tr(UI.typeName))}"></label>` : ''}
        <div class="tj-cert ${all ? '' : 'is-locked'}">
            <span class="tj-kicker">Adhan Tajweed</span>
            <h3>${esc(tr(UI.certTitle))}</h3>
            <p class="tj-muted">${esc(tr(UI.certTo))}</p>
            <div class="tj-cert-name" data-tj-cert-name>${esc(state.name) || '&nbsp;'}</div>
            <p class="tj-muted">${esc(tr(UI.certFor))}</p>
            <ul>${UI.certItems.map(item => `<li>${esc(tr(item))}</li>`).join('')}</ul>
            <p class="tj-muted">${all ? esc(new Date().toLocaleDateString(code() === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })) : `🔒 ${esc(tr(UI.certLocked))}`}</p>
        </div>

        <div class="tj-section-head"><h2 class="section-title">${esc(tr(UI.duaTitle))}</h2></div>
        <article class="panel">
            <p class="dua-arabic" lang="ar" dir="rtl">${esc(DUA)}</p>
            <p class="dua-meaning">${esc(tr(UI.duaMeaning))}</p>
        </article>

        <div class="tj-section-head"><h2 class="section-title">${esc(tr(UI.tabPath))}</h2></div>
        <div class="tj-rules">${LESSONS.map((lesson, index) => `
            <a class="tj-rule tj-rule-link" href="#tajweed/lesson/${lesson.id}"><span>${index + 1}. ${esc(tr(lesson.t))}</span><span class="tj-stars">${state.done[lesson.id] ? '★'.repeat(state.done[lesson.id]) : '–'}</span></a>`).join('')}
        </div>
        <div class="button-row tj-center"><button type="button" class="button button-danger-ghost" data-tj-reset>${esc(tr(UI.reset))}</button></div>
    `;
}

/* ---------------------------------------------------------------
 * Lessons, quizzes and games (run inside the page)
 * ------------------------------------------------------------- */

function flowHead(back, step, total, label) {
    return `
        <div class="tj-flow-head">
            <a class="icon-button" href="${back}" aria-label="${esc(tr(UI.back))}">${icon('close')}</a>
            <div class="tj-progress"><i style="width:${(step / total) * 100}%"></i></div>
            <span class="tj-pill">${esc(label)}</span>
        </div>`;
}

function runLesson(body, lesson) {
    let index = 0;
    const total = lesson.cards.length;
    const number = LESSONS.indexOf(lesson) + 1;

    const draw = () => {
        const card = lesson.cards[index];
        body.innerHTML = `
            ${flowHead('#tajweed', index, total + 1, `${index + 1}/${total}`)}
            <article class="panel tj-card">
                <span class="tj-kicker">${esc(tr(UI.lesson, { n: number }))} · ${esc(tr(lesson.t))}</span>
                <h2 class="tj-card-title">${esc(tr(card.h))}</h2>
                <p class="tj-card-text">${tr(card.p)}</p>
                ${card.w ? WIDGETS[card.w](card) : ''}
                ${card.letters ? letterList(card.letters) : ''}
                ${card.rules ? rulesList(card.rules) : ''}
                ${card.ex ? exampleList(card.ex) : ''}
                ${card.tip ? `<p class="tj-tip">${icon('sparkle', { size: 18 })}<span>${tr(card.tip)}</span></p>` : ''}
            </article>
            <div class="tj-foot">
                ${index > 0 ? `<button type="button" class="button button-ghost" data-tj-prev>${icon('left', { size: 18 })} ${esc(tr(UI.previous))}</button>` : '<span></span>'}
                <button type="button" class="button button-primary" data-tj-next>${esc(tr(index < total - 1 ? UI.forward : UI.toQuiz))} ${icon('right', { size: 18 })}</button>
            </div>`;
        bindWidgets(body);
        body.querySelector('[data-tj-prev]')?.addEventListener('click', () => { index--; draw(); scrollTop(); });
        body.querySelector('[data-tj-next]').addEventListener('click', () => {
            if (index < total - 1) {
                index++;
                draw();
            } else {
                quiz();
            }
            scrollTop();
        });
    };

    const quiz = () => runQuiz(body, prepareQuestions(lesson.quiz), {
        label: `${tr(UI.quiz)} · ${tr(lesson.t)}`,
        back: '#tajweed',
        onDone: (score, count) => {
            const stars = starsFor(score, count);
            const state = progress();
            const first = !state.done[lesson.id];
            const gained = score * 10 + (first ? 20 : 0);
            addXP(gained, { done: { ...state.done, [lesson.id]: Math.max(state.done[lesson.id] || 0, stars) } });
            const nextLesson = LESSONS[number];
            resultView(body, { score, count, gained, title: tr(lesson.t), again: quiz,
                next: nextLesson && !progress().done[nextLesson.id] ? `#tajweed/lesson/${nextLesson.id}` : '#tajweed' });
        }
    });

    draw();
}

const starsFor = (score, count) => (score / count >= 0.9 ? 3 : score / count >= 0.6 ? 2 : 1);

function scrollTop() {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

function prepareQuestions(questions) {
    return shuffle(questions).map(question => {
        if (question.fixed || question.opts.length <= 2) {
            return question;
        }
        const order = shuffle(question.opts.map((_, i) => i));
        return { ...question, opts: order.map(i => question.opts[i]), a: order.indexOf(question.a) };
    });
}

function runQuiz(body, questions, { label, back, onDone }) {
    let index = 0;
    let score = 0;

    const draw = () => {
        const question = questions[index];
        const grid = question.ar && question.opts.length === 4;
        body.innerHTML = `
            ${flowHead(back, index, questions.length, `${index + 1}/${questions.length}`)}
            <article class="panel tj-card">
                <span class="tj-kicker">${esc(label)}</span>
                <h2 class="tj-card-title">${esc(tr(question.q))}</h2>
                ${question.big ? `<div class="tj-q-big" lang="ar" dir="rtl">${esc(question.big)}</div>` : ''}
                ${question.say ? `<div class="tj-q-listen"><button type="button" class="tj-play is-large" data-say="${esc(question.say)}" aria-label="${esc(tr(UI.listen))}">${icon('volume', { size: 30 })}</button></div>` : ''}
                <div class="tj-opts ${grid ? 'is-grid' : ''}">${question.opts.map((option, i) => `
                    <button type="button" class="tj-opt ${question.ar ? 'is-ar' : ''}" data-tj-opt="${i}" ${question.ar ? 'lang="ar"' : ''}>${esc(tr(option))}</button>`).join('')}
                </div>
                <div class="tj-feedback" data-tj-feedback aria-live="polite"></div>
            </article>
            <div class="tj-foot"><span></span><button type="button" class="button button-primary" data-tj-next disabled>${esc(tr(UI.forward))} ${icon('right', { size: 18 })}</button></div>`;

        if (question.say) {
            setTimeout(() => say(question.say), 250);
        }

        let answered = false;
        body.querySelectorAll('[data-tj-opt]').forEach(button => button.addEventListener('click', () => {
            if (answered) {
                return;
            }
            answered = true;
            const chosen = Number(button.dataset.tjOpt);
            const ok = chosen === question.a;
            if (ok) {
                score++;
            }
            beep(ok);
            body.querySelectorAll('[data-tj-opt]').forEach(item => {
                const i = Number(item.dataset.tjOpt);
                item.classList.add(i === question.a ? 'is-right' : i === chosen ? 'is-wrong' : 'is-dim');
                item.disabled = true;
            });
            const feedback = body.querySelector('[data-tj-feedback]');
            const praise = UI.right[Math.floor(Math.random() * UI.right.length)];
            feedback.className = `tj-feedback is-shown ${ok ? 'is-right' : 'is-wrong'}`;
            feedback.innerHTML = `<strong>${esc(tr(ok ? praise : UI.wrong))}</strong>
                ${ok ? '' : `<span>${esc(tr(UI.rightAnswer, { answer: tr(question.opts[question.a]) }))}</span>`}
                ${question.why ? `<span>${esc(tr(question.why))}</span>` : ''}`;
            const next = body.querySelector('[data-tj-next]');
            next.disabled = false;
            next.focus();
        }));

        body.querySelector('[data-tj-next]').addEventListener('click', () => {
            index++;
            if (index < questions.length) {
                draw();
            } else {
                onDone(score, questions.length);
            }
            scrollTop();
        });
    };

    draw();
}

function resultView(body, { score, count, gained, title, again, next }) {
    const ratio = score / count;
    const stars = starsFor(score, count);
    body.innerHTML = `
        <article class="panel tj-result">
            <div class="tj-result-stars" aria-label="${stars}/3">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>
            <h2 class="tj-card-title">${esc(tr(ratio >= 0.9 ? UI.excellent : ratio >= 0.6 ? UI.good : UI.keepGoing))}</h2>
            <p>${esc(tr(UI.score, { title, score, total: count }))}</p>
            <span class="tj-xp-gain">+${gained} ${esc(tr(UI.xp))}</span>
            <div class="button-row tj-center">
                <button type="button" class="button button-ghost" data-tj-again>${icon('repeat', { size: 18 })} ${esc(tr(UI.again))}</button>
                <a class="button button-primary" href="${next}">${esc(tr(UI.forward))} ${icon('right', { size: 18 })}</a>
            </div>
        </article>`;
    if (ratio >= 0.6) {
        confetti();
    }
    body.querySelector('[data-tj-again]').addEventListener('click', again);
}

/* Game rounds, built fresh for every play. */
const otherLetters = (letter, count) => pick(LETTERS.map(row => row[0]).filter(item => item !== letter && item !== 'ء'), count);

const ROUNDS = {
    ear: () => pick(LETTERS.filter(row => row[0] !== 'ء'), 10).map(row => {
        const opts = shuffle([row[0], ...otherLetters(row[0], 3)]);
        return { q: { en: 'Which letter do you hear?', nl: 'Welke letter hoor je?' }, say: row[2], opts, ar: true, a: opts.indexOf(row[0]), why: { en: `${row[1]}: ${row[3].en}`, nl: `${row[1]}: ${row[3].nl}` } };
    }),
    sunmoon: () => pick(Object.entries(SUN_MOON), 10).map(([letter, [word, translit, meaning]]) => ({
        q: { en: 'Is this a sun or a moon letter?', nl: 'Is dit een zon- of maanletter?' }, big: word, say: word,
        opts: [OPTIONS.sunGame, OPTIONS.moonGame], a: SUN.includes(letter) ? 0 : 1, fixed: true,
        why: { en: `${translit}: ${meaning.en}`, nl: `${translit}: ${meaning.nl}` }
    })),
    heavy: () => {
        const light = pick(LETTERS.map(row => row[0]).filter(letter => !HEAVY.includes(letter) && !'رءا'.includes(letter)), 5);
        return shuffle([...pick(HEAVY.split(''), 5), ...light]).map(letter => {
            const row = letterRow(letter);
            return { q: { en: 'Is this letter heavy or light?', nl: 'Is deze letter zwaar of licht?' }, big: letter, say: row[2],
                opts: [OPTIONS.heavy, OPTIONS.light], a: HEAVY.includes(letter) ? 0 : 1, fixed: true,
                why: { en: `${row[1]}: ${row[3].en}`, nl: `${row[1]}: ${row[3].nl}` } };
        });
    },
    raa: () => pick(RAA_WORDS, 10).map(([word, heavy, reason]) => ({
        q: { en: 'Is the ر heavy or light here?', nl: 'Is de ر hier zwaar of licht?' }, big: word, say: word,
        opts: [OPTIONS.heavy, OPTIONS.light], a: heavy ? 0 : 1, fixed: true, why: reason
    })),
    vowels: () => pick(LAB_LETTERS, 10).map(letter => {
        const all = ['a', 'i', 'u', 'aa', 'ii', 'uu', 'an', 'in', 'un'];
        const mod = pick(all, 1)[0];
        const opts = shuffle([mod, ...pick(all.filter(item => item !== mod), 3)]);
        return { q: { en: 'How do you read this?', nl: 'Hoe lees je dit?' }, big: letter + MODS[mod][0], say: labText(letter, mod),
            opts: opts.map(item => TRANSLIT[letter] + MODS[item][2]), a: opts.indexOf(mod), fixed: true };
    })
};

function runGame(body, game) {
    if (game.id === 'cards') {
        runCards(body);
        return;
    }
    const play = () => runQuiz(body, ROUNDS[game.id](), {
        label: tr(game.t),
        back: '#tajweed/games',
        onDone: (score, count) => {
            const gained = score * 5;
            const state = progress();
            addXP(gained, { best: { ...state.best, [game.id]: Math.max(state.best[game.id] || 0, score) } });
            resultView(body, { score, count, gained, title: tr(game.t), again: play, next: '#tajweed/games' });
        }
    });
    play();
}

function runCards(body) {
    const deck = shuffle(LETTERS);
    const limit = LETTERS.length * 2;
    let index = 0;
    let known = 0;

    const draw = () => {
        if (index >= deck.length) {
            const gained = 10;
            addXP(gained);
            resultView(body, { score: known, count: LETTERS.length, gained, title: tr(GAMES.find(game => game.id === 'cards').t),
                again: () => runCards(body), next: '#tajweed/games' });
            return;
        }
        const [letter, translit, name, hint] = deck[index];
        body.innerHTML = `
            ${flowHead('#tajweed/games', index, deck.length, `${index + 1}/${deck.length}`)}
            <button type="button" class="tj-flip" data-tj-flip aria-pressed="false">
                <span class="tj-face">${ar(letter, 'tj-face-ar')}<small>${esc(tr(UI.tapToFlip))}</small></span>
                <span class="tj-face is-back"><strong>${esc(translit)}</strong>${ar(name, 'tj-muted')}<small>${esc(tr(hint))}</small></span>
            </button>
            <div class="button-row tj-center">
                <button type="button" class="button button-ghost" data-tj-no>${esc(tr(UI.practiseMore))}</button>
                <button type="button" class="button button-primary" data-tj-yes>${icon('check', { size: 18 })} ${esc(tr(UI.knewIt))}</button>
            </div>`;
        const card = body.querySelector('[data-tj-flip]');
        card.addEventListener('click', () => {
            const on = card.classList.toggle('is-flipped');
            card.setAttribute('aria-pressed', String(on));
            if (on) {
                say(name);
            }
        });
        body.querySelector('[data-tj-yes]').addEventListener('click', () => { known++; index++; draw(); });
        body.querySelector('[data-tj-no]').addEventListener('click', () => {
            if (deck.length < limit) {
                deck.push(deck[index]);
            }
            index++;
            draw();
        });
    };
    draw();
}

function runMix(body) {
    const state = progress();
    const pool = LESSONS.filter(lesson => state.done[lesson.id]).flatMap(lesson => lesson.quiz);
    const extra = ['ear', 'sunmoon', 'heavy', 'raa', 'vowels'].flatMap(id => ROUNDS[id]().slice(0, 2));
    const play = () => runQuiz(body, prepareQuestions(pick([...pool, ...extra], 10)), {
        label: tr(UI.dailyMix),
        back: '#tajweed',
        onDone: (score, count) => {
            const gained = score * 6;
            addXP(gained);
            resultView(body, { score, count, gained, title: tr(UI.dailyMix), again: play, next: '#tajweed' });
        }
    });
    play();
}

/* ---------------------------------------------------------------
 * Page
 * ------------------------------------------------------------- */

function route(path) {
    const [section = '', id = ''] = path;
    return { section, id };
}

export const tajweedPage = {
    titleKey: 'nav.tajweed',

    render(path) {
        const { section } = route(path);
        if (['lesson', 'game', 'mix'].includes(section)) {
            return flowFrame('');
        }
        const views = { letters: lettersView, games: gamesView, progress: progressView };
        return frame(views[section] ? section : '', (views[section] || pathView)());
    },

    mount(root, path, ctx) {
        const { section, id } = route(path);
        const body = root.querySelector('[data-tj-body]');
        prepareAudio();
        ctx.cleanup(stopAudio);

        root.addEventListener('click', event => {
            const sayButton = event.target.closest('[data-say]');
            if (sayButton) {
                say(sayButton.dataset.say);
                sayButton.classList.remove('is-playing');
                void sayButton.offsetWidth;
                sayButton.classList.add('is-playing');
            }

            const slow = event.target.closest('[data-tj-slow]');
            if (slow) {
                const state = saveProgress({ slow: !progress().slow });
                slow.classList.toggle('is-on', state.slow);
                slow.setAttribute('aria-pressed', String(state.slow));
                toast(tr(state.slow ? UI.slowOn : UI.slowOff));
            }

            const letter = event.target.closest('[data-tj-letter]');
            if (letter) {
                const value = letter.dataset.tjLetter;
                root.querySelectorAll('[data-tj-letter]').forEach(item => item.classList.toggle('is-selected', item === letter));
                root.querySelector('[data-tj-letter-detail]').innerHTML = letterDetail(value);
                say(letterRow(value)[2]);
                root.querySelector('[data-tj-letter-detail]').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
            }
        });

        root.querySelector('[data-tj-reset]')?.addEventListener('click', async () => {
            if (await confirmDialog(tr(UI.resetConfirm), { confirm: tr(UI.reset), danger: true })) {
                const { slow, name } = progress();
                store.set(STORE_KEY, { ...DEFAULTS, slow, name });
                body.innerHTML = progressView();
                root.querySelector('[data-tj-xp]').textContent = '0';
                root.querySelector('[data-tj-streak]').textContent = '0';
                toast(tr(UI.resetDone));
            }
        });

        root.querySelector('[data-tj-name]')?.addEventListener('input', event => {
            const name = event.target.value.slice(0, 40);
            saveProgress({ name });
            root.querySelector('[data-tj-cert-name]').textContent = name || ' ';
        });

        if (section === 'lesson') {
            const lesson = LESSONS.find(item => item.id === id);
            if (lesson) {
                runLesson(body, lesson);
            } else {
                window.location.hash = '#tajweed';
            }
        } else if (section === 'game') {
            const game = GAMES.find(item => item.id === id);
            if (game) {
                runGame(body, game);
            } else {
                window.location.hash = '#tajweed/games';
            }
        } else if (section === 'mix') {
            runMix(body);
        }
    }
};
