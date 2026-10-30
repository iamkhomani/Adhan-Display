/*
 * Settings, grouped by what people look for.
 */

import { esc } from '../core/util.js';
import { icon } from '../core/icons.js';
import {
    getSettings, setSetting, exportBackup, importBackup, resetAll, clearCache, PRAYER_KEYS, SALAH
} from '../core/storage.js';
import { bus } from '../core/bus.js';
import { toast, confirmDialog } from '../core/ui.js';
import { location } from '../services/location.js';
import { alerts } from '../services/alerts.js';
import { quranPrefs } from '../services/quran.js';
import { CALCULATION_METHODS, ASR_METHODS, HIGH_LATITUDE_RULES, ADHAN_SOUNDS, SUPPORT_URL } from '../data/content.js';
import { pageHeader, openLocationDialog } from './components.js';
import { fillTranslationSelect, fillReciterSelect } from './quran.js';
import { APP_VERSION, install } from '../app-info.js';

const SECTIONS = [
    ['appearance', 'Appearance'],
    ['location', 'Location'],
    ['prayer', 'Prayer times'],
    ['alerts', 'Adhan and reminders'],
    ['display', 'Display mode'],
    ['quran', 'Quran'],
    ['data', 'Your data'],
    ['about', 'About']
];

function segmented(name, options, value) {
    return `
        <div class="segmented" role="radiogroup" aria-label="${esc(name)}">
            ${options.map(([optionValue, label]) => `
                <button type="button" role="radio" class="segment ${String(optionValue) === String(value) ? 'is-active' : ''}"
                    aria-checked="${String(optionValue) === String(value)}" data-set="${esc(name)}" data-value="${esc(optionValue)}">${esc(label)}</button>
            `).join('')}
        </div>
    `;
}

function select(name, options, value, label) {
    return `
        <select class="select" data-select="${esc(name)}" aria-label="${esc(label)}">
            ${options.map(([optionValue, text]) => `<option value="${esc(optionValue)}" ${String(optionValue) === String(value) ? 'selected' : ''}>${esc(text)}</option>`).join('')}
        </select>
    `;
}

function toggle(name, checked, label, hint = '') {
    return `
        <label class="switch-row">
            <span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ''}</span>
            <input type="checkbox" class="switch" data-toggle="${esc(name)}" ${checked ? 'checked' : ''}>
        </label>
    `;
}

function stepper(name, value, min, max, label) {
    return `
        <div class="stepper" data-stepper="${esc(name)}" data-min="${min}" data-max="${max}">
            <span class="stepper-label">${esc(label)}</span>
            <button type="button" class="icon-button" data-step="-1" aria-label="${esc(label)} minus one">${icon('minus', { size: 16 })}</button>
            <output class="stepper-value tnum" aria-live="polite">${value > 0 ? '+' : ''}${value}</output>
            <button type="button" class="icon-button" data-step="1" aria-label="${esc(label)} plus one">${icon('plus', { size: 16 })}</button>
        </div>
    `;
}

function field(label, control, hint = '') {
    return `
        <div class="field">
            <span class="field-label">${esc(label)}</span>
            ${control}
            ${hint ? `<p class="field-hint">${esc(hint)}</p>` : ''}
        </div>
    `;
}

function sectionHTML(id, title, body) {
    return `
        <section class="panel settings-section" id="set-${id}" aria-labelledby="set-${id}-title">
            <h2 class="panel-title" id="set-${id}-title">${esc(title)}</h2>
            ${body}
        </section>
    `;
}

function notificationControl() {
    const state = alerts.notificationState();
    const settings = getSettings();

    if (state === 'unsupported') {
        return '<p class="field-hint">This browser does not support notifications.</p>';
    }

    if (state === 'denied') {
        return '<p class="field-hint">Notifications are blocked for this site. Allow them in your browser settings to use this option.</p>';
    }

    return toggle('notify', settings.notify && state === 'granted', 'System notifications',
        'Shows a notification at prayer time when this tab is in the background.');
}

function bodyHTML() {
    const settings = getSettings();
    const loc = location.get();
    const prefs = quranPrefs.get();

    return [
        sectionHTML('appearance', 'Appearance', `
            ${field('Theme', segmented('theme', [['dark', 'Dark'], ['light', 'Light'], ['system', 'Match device']], settings.theme))}
            ${field('Text size', segmented('size', [['compact', 'Small'], ['normal', 'Normal'], ['large', 'Large']], settings.size))}
            ${field('Time format', segmented('timeFormat', [['24h', '24-hour'], ['12h', '12-hour']], settings.timeFormat))}
        `),

        sectionHTML('location', 'Location', `
            <div class="location-card">
                ${icon('pin')}
                <span><strong>${esc(loc.city)}${loc.country ? `, ${esc(loc.country)}` : ''}</strong>
                <small class="tnum">${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}${loc.isDefault ? ' (default)' : ''}</small></span>
                <button type="button" class="button button-ghost" data-action="location">Change</button>
            </div>
            ${toggle('autoLocation', settings.autoLocation, 'Update automatically',
                'When location access is allowed, your position is refreshed each time you open the app.')}
        `),

        sectionHTML('prayer', 'Prayer times', `
            ${field('Calculation method', select('method', CALCULATION_METHODS, settings.method, 'Calculation method'),
                'Choose the method used by your local mosque.')}
            ${field('Asr time', select('school', ASR_METHODS, settings.school, 'Asr time'))}
            ${field('High latitude rule', select('latAdjust', HIGH_LATITUDE_RULES, settings.latAdjust, 'High latitude rule'),
                'Used where Fajr and Isha are hard to determine, such as summer in northern Europe.')}
            <div class="field">
                <span class="field-label">Adjust times (minutes)</span>
                <div class="steppers">
                    ${PRAYER_KEYS.map(name => stepper(`tune:${name}`, settings.tune[name], -60, 60, name)).join('')}
                </div>
                <p class="field-hint">Match the times of your local mosque. Adjustments are applied to every day.</p>
            </div>
            <div class="field">
                <span class="field-label">Hijri date (days)</span>
                <div class="steppers">${stepper('hijriOffset', settings.hijriOffset, -2, 2, 'Hijri date')}</div>
                <p class="field-hint">Shift the Hijri date when your community follows a local moon sighting.</p>
            </div>
        `),

        sectionHTML('alerts', 'Adhan and reminders', `
            <div class="field">
                <span class="field-label">Adhan sound</span>
                <div class="inline-controls">
                    ${select('sound', ADHAN_SOUNDS.map(([key, label]) => [key, label]), settings.sound, 'Adhan sound')}
                    <button type="button" class="button button-ghost" data-preview>${icon(alerts.playing ? 'stop' : 'play', { size: 16 })} ${alerts.playing ? 'Stop' : 'Preview'}</button>
                </div>
            </div>
            ${field('Volume', `<input type="range" class="range" min="0" max="1" step="0.05" value="${settings.volume}" data-range="volume" aria-label="Volume">`)}
            <div class="field">
                <span class="field-label">Play the adhan for</span>
                <div class="check-grid">
                    ${SALAH.map(name => `
                        <label class="check"><input type="checkbox" data-alert="${name}" ${settings.alerts[name] ? 'checked' : ''}><span>${name}</span></label>
                    `).join('')}
                </div>
            </div>
            ${field('Reminder before the adhan', select('reminder', [[0, 'Off'], [5, '5 minutes before'], [10, '10 minutes before'], [15, '15 minutes before'], [20, '20 minutes before'], [30, '30 minutes before']], settings.reminder, 'Reminder before the adhan'),
                'Plays a soft chime, for example as a reminder to make wudu.')}
            ${toggle('tahajjud', settings.tahajjud, 'Remind me at the last third of the night', 'A soft chime for tahajjud.')}
            <div data-notify>${notificationControl()}</div>
            <p class="note">${icon('info', { size: 16 })} Sounds and notifications work while Adhan Display is open, also in a background tab or as an installed app. A sleeping device cannot play them. Browsers only allow sound after you have tapped the page once.</p>
        `),

        sectionHTML('display', 'Display mode', `
            <p class="field-hint">A full-screen clock for a tablet or screen at home or in the mosque.</p>
            ${toggle('displayAwake', settings.displayAwake, 'Keep the screen on', 'Prevents the screen from turning off while display mode is open.')}
            ${toggle('displayDim', settings.displayDim, 'Dim at night', 'Lowers the brightness between Isha and Fajr.')}
            ${toggle('displaySeconds', settings.displaySeconds, 'Show seconds')}
            <a class="button button-primary" href="#display">${icon('monitor', { size: 18 })} Open display mode</a>
        `),

        sectionHTML('quran', 'Quran', `
            ${field('Translation', '<select class="select" data-quran="translation" aria-label="Translation"><option>Loading</option></select>')}
            ${field('Reciter', '<select class="select" data-quran="reciter" aria-label="Reciter"><option>Loading</option></select>')}
            ${field('Arabic text size', `<input type="range" class="range" min="80" max="160" step="10" value="${prefs.fontSize}" data-quran="size" aria-label="Arabic text size">`)}
            <label class="switch-row"><span>Show translation</span><input type="checkbox" class="switch" data-quran="showTranslation" ${prefs.showTranslation ? 'checked' : ''}></label>
            <label class="switch-row"><span>Play the next ayah automatically</span><input type="checkbox" class="switch" data-quran="autoPlay" ${prefs.autoPlay ? 'checked' : ''}></label>
        `),

        sectionHTML('data', 'Your data', `
            <p class="field-hint">Everything is stored only in this browser. Make a backup to move your tracker, bookmarks and settings to another device.</p>
            <div class="button-row">
                <button type="button" class="button button-ghost" data-data="export">${icon('download', { size: 18 })} Download backup</button>
                <button type="button" class="button button-ghost" data-data="import">${icon('upload', { size: 18 })} Restore backup</button>
                <input type="file" accept="application/json,.json" data-import-file hidden>
            </div>
            <div class="button-row">
                <button type="button" class="button button-ghost" data-data="cache">${icon('refresh', { size: 18 })} Clear cached data</button>
                <button type="button" class="button button-danger-ghost" data-data="reset">${icon('trash', { size: 18 })} Reset everything</button>
            </div>
        `),

        sectionHTML('about', 'About', `
            <div class="about">
                <img src="images/icons/icon-192.png" width="56" height="56" alt="" loading="lazy">
                <div>
                    <strong>Adhan Display</strong>
                    <span class="muted">Version ${esc(APP_VERSION)}</span>
                </div>
            </div>
            <p>Free prayer times, Quran and hadith, made as sadaqah jariyah. No account and no ads.</p>
            <div class="button-row">
                <button type="button" class="button button-primary" data-install hidden>${icon('download', { size: 18 })} Install app</button>
                <a class="button button-ghost" href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer">${icon('heart', { size: 18 })} Support the project</a>
            </div>
            <p class="fine-print">Prayer times by AlAdhan. Quran text and audio by Al Quran Cloud and Islamic Network. Tafsir by Quran.com. Hadith by UmmahAPI. Place search by Open-Meteo and BigDataCloud.</p>
        `)
    ].join('');
}

export const settingsPage = {
    title: 'Settings',

    render() {
        return `
            <div class="page settings-page">
                ${pageHeader('Settings')}
                <div class="settings-layout">
                    <nav class="settings-nav" aria-label="Settings sections">
                        ${SECTIONS.map(([id, label]) => `<a href="#settings/${id}" data-section-link="${id}">${esc(label)}</a>`).join('')}
                    </nav>
                    <div class="settings-body" data-settings-body>${bodyHTML()}</div>
                </div>
            </div>
        `;
    },

    mount(root, path, ctx) {
        const body = root.querySelector('[data-settings-body]');

        const changed = key => {
            bus.emit('settings', { key });
        };

        const loadQuranSelects = () => {
            const prefs = quranPrefs.get();
            fillTranslationSelect(root.querySelector('[data-quran="translation"]'), prefs.selectedTranslation);
            fillReciterSelect(root.querySelector('[data-quran="reciter"]'), prefs.selectedReciter);
        };

        const rerender = () => {
            const scroll = window.scrollY;
            body.innerHTML = bodyHTML();
            loadQuranSelects();
            showInstall();
            window.scrollTo(0, scroll);
        };

        const showInstall = () => {
            const button = root.querySelector('[data-install]');
            if (button) {
                button.hidden = !install.available();
            }
        };

        loadQuranSelects();
        showInstall();
        ctx.on('installable', showInstall);
        ctx.on('location', rerender);
        ctx.on('alert-audio', () => {
            const button = root.querySelector('[data-preview]');
            if (button) {
                button.innerHTML = `${icon(alerts.playing ? 'stop' : 'play', { size: 16 })} ${alerts.playing ? 'Stop' : 'Preview'}`;
            }
        });

        if (path[0]) {
            requestAnimationFrame(() => root.querySelector(`#set-${path[0]}`)?.scrollIntoView({ block: 'start' }));
        }

        root.addEventListener('click', async event => {
            const target = event.target;
            const segment = target.closest('[data-set]');
            const step = target.closest('[data-step]');
            const dataAction = target.closest('[data-data]')?.dataset.data;
            const sectionLink = target.closest('[data-section-link]');

            if (sectionLink) {
                event.preventDefault();
                root.querySelector(`#set-${sectionLink.dataset.sectionLink}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `#settings/${sectionLink.dataset.sectionLink}`);
                return;
            }

            if (segment) {
                setSetting(segment.dataset.set, segment.dataset.value);
                segment.parentElement.querySelectorAll('[data-set]').forEach(button => {
                    const active = button === segment;
                    button.classList.toggle('is-active', active);
                    button.setAttribute('aria-checked', String(active));
                });
                changed(segment.dataset.set);
                return;
            }

            if (step) {
                const wrapper = step.closest('[data-stepper]');
                const name = wrapper.dataset.stepper;
                const settings = getSettings();
                const current = name.startsWith('tune:') ? settings.tune[name.slice(5)] : settings[name];
                const next = Math.min(Number(wrapper.dataset.max), Math.max(Number(wrapper.dataset.min), current + Number(step.dataset.step)));

                if (next === current) {
                    return;
                }

                if (name.startsWith('tune:')) {
                    setSetting('tune', { ...settings.tune, [name.slice(5)]: next });
                    changed('tune');
                } else {
                    setSetting(name, next);
                    changed(name);
                }

                wrapper.querySelector('output').textContent = `${next > 0 ? '+' : ''}${next}`;
                return;
            }

            if (target.closest('[data-action="location"]')) {
                openLocationDialog();
            } else if (target.closest('[data-preview]')) {
                if (alerts.playing) {
                    alerts.stop();
                } else {
                    alerts.preview(getSettings().sound);
                }
            } else if (target.closest('[data-install]')) {
                install.prompt();
            } else if (dataAction === 'export') {
                const blob = new Blob([JSON.stringify(exportBackup(APP_VERSION), null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `adhan-display-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                toast('Backup downloaded');
            } else if (dataAction === 'import') {
                root.querySelector('[data-import-file]').click();
            } else if (dataAction === 'cache') {
                const removed = clearCache();
                toast(`Cleared ${removed} cached ${removed === 1 ? 'item' : 'items'}. Fresh data will load when needed.`);
                changed('cache');
            } else if (dataAction === 'reset') {
                const confirmed = await confirmDialog(
                    'This deletes your settings, prayer tracker, bookmarks and saved places from this browser. Download a backup first if you want to keep them.',
                    { confirm: 'Delete everything', danger: true }
                );
                if (confirmed) {
                    resetAll();
                    window.location.reload();
                }
            }
        });

        root.addEventListener('change', async event => {
            const target = event.target;

            if (target.matches('[data-select]')) {
                const name = target.dataset.select;
                const numeric = ['method', 'school', 'latAdjust', 'reminder'].includes(name);
                setSetting(name, numeric ? Number(target.value) : target.value);
                changed(name);
                if (name === 'sound' && alerts.playing) {
                    alerts.preview(target.value);
                }
            } else if (target.matches('[data-toggle]')) {
                const name = target.dataset.toggle;

                if (name === 'notify' && target.checked) {
                    try {
                        await alerts.requestNotifications();
                    } catch (error) {
                        target.checked = false;
                        toast(error.message);
                        root.querySelector('[data-notify]').innerHTML = notificationControl();
                        return;
                    }
                }

                if (name === 'autoLocation') {
                    setSetting('autoLocation', target.checked ? 'true' : 'false');
                    if (target.checked) {
                        location.detect().catch(error => toast(error.message));
                    }
                } else {
                    setSetting(name, target.checked);
                }
                changed(name);
            } else if (target.matches('[data-alert]')) {
                setSetting('alerts', { ...getSettings().alerts, [target.dataset.alert]: target.checked });
                changed('alerts');
            } else if (target.matches('[data-quran]')) {
                const key = target.dataset.quran;
                const patch = {
                    translation: { selectedTranslation: target.value },
                    reciter: { selectedReciter: target.value },
                    showTranslation: { showTranslation: target.checked },
                    autoPlay: { autoPlay: target.checked }
                }[key];
                if (patch) {
                    quranPrefs.update(patch);
                    toast('Saved', { duration: 1500 });
                }
            } else if (target.matches('[data-import-file]')) {
                const file = target.files?.[0];
                if (!file) {
                    return;
                }
                try {
                    const count = importBackup(JSON.parse(await file.text()));
                    toast(`Restored ${count} items. Reloading`);
                    setTimeout(() => window.location.reload(), 1200);
                } catch (error) {
                    toast(error instanceof SyntaxError ? 'This file is not a valid backup.' : error.message);
                }
                target.value = '';
            }
        });

        root.addEventListener('input', event => {
            const target = event.target;

            if (target.matches('[data-range="volume"]')) {
                setSetting('volume', Number(target.value));
            } else if (target.matches('[data-quran="size"]')) {
                quranPrefs.update({ fontSize: Number(target.value) });
            }
        });
    }
};
