import {
    state,
    toggleTheme,
    saveQuranState
} from '../state.js';

import { Storage } from '../storage.js';
import { APP } from '../config.js';
import { Api } from '../services/api.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function currentSettings() {
    return Storage.getSettings();
}

function optionList(options, selected) {
    return options.map(([value, label]) => `
        <option
            value="${escapeHtml(value)}"
            ${String(value) === String(selected) ? 'selected' : ''}
        >
            ${escapeHtml(label)}
        </option>
    `).join('');
}

function section(title, eyebrow, content) {
    return `


        <section class="settings-section">
            <div class="settings-section-heading">
                <span class="ad2-eyebrow">${escapeHtml(eyebrow)}</span>
                <h2>${escapeHtml(title)}</h2>
            </div>

            <div class="settings-section-body">
                ${content}
            </div>
        </section>
    `;
}

function row(label, description, control) {
    return `
        <div class="settings-row">
            <div class="settings-row-copy">
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(description)}</span>
            </div>

            <div class="settings-control">
                ${control}
            </div>
        </div>
    `;
}

function toggle(key, checked) {
    return `
        <label class="settings-switch">
            <input
                type="checkbox"
                data-setting-toggle="${escapeHtml(key)}"
                ${checked ? 'checked' : ''}
            >
            <span class="settings-switch-track">
                <span class="settings-switch-thumb"></span>
            </span>
        </label>
    `;
}

function select(key, options, value) {
    return `
        <select
            class="settings-select"
            data-setting-select="${escapeHtml(key)}"
        >
            ${optionList(options, value)}
        </select>
    `;
}

function numberInput(key, value, min, max, step = 1) {
    return `
        <input
            class="settings-number"
            type="number"
            data-setting-number="${escapeHtml(key)}"
            value="${escapeHtml(value)}"
            min="${escapeHtml(min)}"
            max="${escapeHtml(max)}"
            step="${escapeHtml(step)}"
        >
    `;
}

function renderAppearance(settings) {
    return section(
        'Appearance',
        'INTERFACE',
        `
            ${row(
                'Theme',
                'Choose the visual appearance of Adhan Display.',
                `
                    <div class="settings-theme-options">
                        <button
                            type="button"
                            class="settings-theme-option ${
                                !state.ui.darkMode ? 'is-active' : ''
                            }"
                            data-settings-theme="light"
                        >
                            <span class="settings-theme-preview light"></span>
                            <span>Light</span>
                        </button>

                        <button
                            type="button"
                            class="settings-theme-option ${
                                state.ui.darkMode ? 'is-active' : ''
                            }"
                            data-settings-theme="dark"
                        >
                            <span class="settings-theme-preview dark"></span>
                            <span>Dark</span>
                        </button>
                    </div>
                `
            )}

            ${row(
                'Display size',
                'Adjust the overall interface scale.',
                select(
                    'size',
                    [
                        ['compact', 'Compact'],
                        ['normal', 'Normal'],
                        ['large', 'Large']
                    ],
                    settings.size
                )
            )}
        `
    );
}

function renderPrayer(settings) {
    return section(
        'Prayer',
        'PRAYER TIMES',
        `
            ${row(
                'Calculation method',
                'Choose how prayer times are calculated.',
                select(
                    'method',
                    APP.methods.map(item => [
                        String(item[0]),
                        item[1]
                    ]),
                    settings.method
                )
            )}

            ${row(
                'Prayer time adjustment',
                'Apply a manual adjustment to calculated prayer times.',
                numberInput('offset', settings.offset, -60, 60)
            )}

            ${row(
                'Hijri date adjustment',
                'Adjust the displayed Hijri date when needed.',
                numberInput(
                    'hijriOffset',
                    settings.hijriOffset,
                    -2,
                    2
                )
            )}

            ${row(
                'Automatic Qada tracking',
                'Automatically account for missed prayers when using the tracker.',
                toggle('autoQada', settings.autoQada)
            )}
        `
    );
}

function renderLocation(settings) {
    const location = state.location || {};
    const manual = !settings.autoLocation;

    return section(
        'Location',
        'LOCATION',
        `
            <div class="settings-location-card">
                <div>
                    <span class="ad2-eyebrow">CURRENT LOCATION</span>
                    <strong>
                        ${escapeHtml(location.city || 'Current location')}
                    </strong>
                    <small>
                        ${
                            location.lat != null && location.lon != null
                                ? `${Number(location.lat).toFixed(4)}, ${Number(location.lon).toFixed(4)}`
                                : 'Coordinates unavailable'
                        }
                    </small>
                </div>

                <span class="settings-location-status">
                    ${settings.autoLocation ? 'Automatic' : 'Manual'}
                </span>
            </div>

            ${row(
                'Automatic location',
                'Allow Adhan Display to determine your location automatically.',
                toggle('autoLocation', settings.autoLocation)
            )}

            ${
                manual
                    ? `
                        <div class="settings-manual-location">
                            <label
                                class="settings-field-label"
                                for="manual-location-search"
                            >
                                City or location
                            </label>

                            <input
                                id="manual-location-search"
                                class="settings-text-input"
                                type="text"
                                value=""
                                placeholder="Search for a city..."
                                autocomplete="off"
                                data-location-search
                            >

                            <div
                                class="settings-location-results"
                                data-location-results
                            ></div>

                            <small class="settings-field-help">
                                Search for a city and select the location
                                you want to use for prayer times.
                            </small>
                        </div>
                    `
                    : ''
            }

            <div class="settings-info">
                Prayer times use your current coordinates and the selected
                calculation method.
            </div>
        `
    );
}


const QURAN_SETTINGS_API =
    'https://api.alquran.cloud/v1';


function quranSettingsLanguageName(code) {
    const names = {
        ar: 'Arabic',
        en: 'English',
        nl: 'Dutch',
        fr: 'French',
        de: 'German',
        es: 'Spanish',
        tr: 'Turkish',
        ur: 'Urdu',
        id: 'Indonesian',
        ms: 'Malay',
        bn: 'Bengali',
        hi: 'Hindi',
        fa: 'Persian',
        it: 'Italian',
        pt: 'Portuguese',
        ru: 'Russian'
    };

    return names[code] || code;
}


function getQuranSettingsLanguages() {
    const languages = new Map();

    for (const edition of state.quran.editions) {
        if (!edition.language) {
            continue;
        }

        if (!languages.has(edition.language)) {
            languages.set(
                edition.language,
                quranSettingsLanguageName(
                    edition.language
                )
            );
        }
    }

    return [...languages.entries()]
        .sort((a, b) =>
            a[1].localeCompare(b[1])
        );
}


function getQuranSettingsTranslations(language) {
    let editions =
        state.quran.editions.slice();

    if (language) {
        editions =
            editions.filter(
                edition =>
                    edition.language === language
            );
    }

    return editions.sort((a, b) =>
        (
            a.englishName ||
            a.name ||
            a.identifier ||
            ''
        ).localeCompare(
            b.englishName ||
            b.name ||
            b.identifier ||
            ''
        )
    );
}


async function loadQuranSettingsEditions() {
    if (state.quran.editions.length) {
        return state.quran.editions;
    }

    try {
        const response =
            await fetch(
                `${QURAN_SETTINGS_API}/edition?format=text&type=translation`,
                {
                    headers: {
                        Accept:
                            'application/json'
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                `Quran translation request failed: ${response.status}`
            );
        }

        const result =
            await response.json();

        state.quran.editions =
            (result.data || [])
                .filter(
                    edition =>
                        edition.type ===
                        'translation'
                );

        if (!state.quran.editions.length) {
            throw new Error(
                'No Quran translations were returned.'
            );
        }

        const current =
            state.quran.editions.find(
                edition =>
                    edition.identifier ===
                    state.quran.selectedTranslation
            );

        if (current) {
            state.quran.selectedLanguage =
                current.language;
        } else {
            const preferred =
                state.quran.editions.find(
                    edition =>
                        edition.language === 'nl'
                ) ||
                state.quran.editions.find(
                    edition =>
                        edition.language === 'en'
                ) ||
                state.quran.editions[0];

            state.quran.selectedTranslation =
                preferred?.identifier || '';

            state.quran.selectedLanguage =
                preferred?.language || '';
        }

        saveQuranState();

        return state.quran.editions;

    } catch (error) {
        console.error(
            '[Settings] Failed to load Quran translations.',
            error
        );

        return [];
    }
}


function refreshQuranSettings() {
    window.dispatchEvent(
        new CustomEvent(
            'adhan:settings-render'
        )
    );
}


function renderQuran(settings) {
    const quran = state.quran;

    return section(
        'Quran',
        'QURAN',
        `
            ${row(
                'Translation language',
                'Choose the language of the Quran translation shown beneath the Arabic text.',
                select(
                    'quranLanguage',
                    getQuranSettingsLanguages(),
                    quran.selectedLanguage || settings.lang
                )
            )}

            ${row(
                'Translation',
                'Choose the specific Quran translation used beneath the Arabic text.',
                select(
                    'quranTranslation',
                    getQuranSettingsTranslations(
                        quran.selectedLanguage
                    ).map(
                        edition => [
                            edition.identifier,
                            edition.englishName ||
                                edition.name ||
                                edition.identifier
                        ]
                    ),
                    quran.selectedTranslation
                )
            )}

            ${row(
                'Reciter',
                'Choose the Quran audio recitation.',
                select(
                    'quranReciter',
                    [
                        ['ar.alafasy', 'Mishary Alafasy'],
                        ['ar.muhammadayyoub', 'Muhammad Ayyub'],
                        ['ar.husary', 'Mahmoud Al-Husary'],
                        ['ar.muhammadjibreel', 'Muhammad Jibreel']
                    ],
                    quran.selectedReciter
                )
            )}

            ${row(
                'Reader font size',
                'Adjust the Quran reader text size.',
                select(
                    'quranFontSize',
                    [
                        ['85', 'Small'],
                        ['100', 'Normal'],
                        ['115', 'Large'],
                        ['130', 'Extra large']
                    ],
                    String(quran.fontSize)
                )
            )}

            ${row(
                'Automatic audio playback',
                'Continue automatically to the next ayah during playback.',
                toggle('quranAutoPlay', quran.autoPlay)
            )}
        `
    );
}

function renderAudio(settings) {
    return section(
        'Audio & notifications',
        'AUDIO',
        `
            ${row(
                'Adhan sound',
                'Choose the sound used for prayer notifications.',
                select(
                    'audio',
                    [
                        ['default', 'Default Adhan'],
                        ['alafasy', 'Alafasy'],
                        ['madinah', 'Madinah'],
                        ['makkah', 'Makkah']
                    ],
                    settings.audio
                )
            )}

            ${row(
                'Volume',
                'Set the default audio volume.',
                `
                    <input
                        class="settings-range"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value="${escapeHtml(settings.volume)}"
                        data-setting-range="volume"
                    >
                    <span class="settings-range-value" data-volume-value>
                        ${Math.round(settings.volume * 100)}%
                    </span>
                `
            )}

            ${row(
                'Daily reminder',
                'Enable the daily reminder notification.',
                toggle('dailyAlert', settings.dailyAlert)
            )}

            ${row(
                'Tahajjud alarm',
                'Enable the stored Tahajjud reminder preference.',
                toggle('tahajjudAlarm', settings.tahajjudAlarm)
            )}

            ${row(
                'Wudu reminder',
                'Enable the stored Wudu reminder preference.',
                toggle('wudu', settings.wudu)
            )}
        `
    );
}

function renderDisplay(settings) {
    return section(
        'Display & focus',
        'FOCUS DISPLAY',
        `
            ${row(
                'Automatic dimming',
                'Allow the display to use the stored auto-dim preference.',
                toggle('autodim', settings.autodim)
            )}

            ${row(
                'Screensaver',
                'Enable the stored screensaver preference.',
                toggle('screensaver', settings.screensaver)
            )}
        `
    );
}

function renderData() {
    return section(
        'Data & privacy',
        'DATA',
        `
            <div class="settings-data-grid">
                <button
                    type="button"
                    class="settings-action"
                    data-settings-action="clear-cache"
                >
                    <strong>Clear cache</strong>
                    <span>Remove cached API and content data.</span>
                </button>

                <button
                    type="button"
                    class="settings-action"
                    data-settings-action="export"
                >
                    <strong>Export backup</strong>
                    <span>Save your Adhan Display preferences locally.</span>
                </button>

                <button
                    type="button"
                    class="settings-action"
                    data-settings-action="import"
                >
                    <strong>Import backup</strong>
                    <span>Restore a previously exported backup.</span>
                </button>

                <button
                    type="button"
                    class="settings-action settings-action-danger"
                    data-settings-action="reset"
                >
                    <strong>Reset preferences</strong>
                    <span>Return Adhan Display preferences to defaults.</span>
                </button>
            </div>

            <input
                type="file"
                accept="application/json,.json"
                data-settings-import-file
                hidden
            >
        `
    );
}

function renderAbout() {
    return section(
        'About',
        'ADHAN DISPLAY',
        `
            <div class="settings-about">
                <div>
                    <span class="settings-about-mark">
                    <img
                        src="/images/adhan%20display%20muslim%20prayer%20times%20dashboard%20logo.png"
                        alt="Adhan Display"
                    >
                </span>
                    <div>
                        <strong>Adhan Display</strong>
                        <span>Modern prayer, Quran and Islamic life.</span>
                    </div>
                </div>

                <span class="settings-version">
                    Version ${escapeHtml(APP.version)}
                </span>
            </div>
        `
    );
}







/* AD2_BUY_ME_A_COFFEE_START */
const BUY_ME_A_COFFEE_HTML = `
  <div class="ad2-support-footer">
    <span class="ad2-support-label">SADAQAH • SUPPORT</span>

    <span class="ad2-support-text">
      Help keep Adhan Display free and online.
    </span>

    <a
      class="ad2-support-link"
      href="https://buymeacoffee.com/kmni"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Support Adhan Display via Buy Me a Coffee"
    >
      Support the project ↗
    </a>
  </div>
`;
/* AD2_BUY_ME_A_COFFEE_END */

export function renderSettingsPage() {
    const settings = currentSettings();

    return `


        <main class="ad2-page settings-page">

            <section class="settings-hero">
                <div>
                    <span class="ad2-eyebrow">SETTINGS</span>

                    <h1>
                        Your Adhan Display.
                        <span>Your preferences.</span>
                    </h1>

                    <p>
                        Shape the experience around your prayer,
                        Quran reading and daily worship.
                    </p>
                </div>

                <div class="settings-hero-meta">
                    <span>ADHAN DISPLAY 2.0</span>
                    <strong>${escapeHtml(APP.version)}</strong>
                </div>
            </section>

            ${renderAppearance(settings)}
            ${renderPrayer(settings)}
            ${renderLocation(settings)}
            ${renderQuran(settings)}
            ${renderAudio(settings)}
            ${renderDisplay(settings)}
            ${renderData()}
            ${renderAbout()}

        </main>
    
${BUY_ME_A_COFFEE_HTML}
`;
}

function saveSetting(key, value) {
    Storage.setRaw(key, String(value));
}

function refreshPrayer() {
    window.dispatchEvent(
        new CustomEvent('adhan:settings-changed')
    );
}

function saveQuranPreference(key, value) {
    if (key === 'language') {
        state.quran.selectedLanguage = value;
    }

    if (key === 'translation') {
        state.quran.selectedTranslation = value;
    }

    if (key === 'reciter') {
        state.quran.selectedReciter = value;
    }

    if (key === 'fontSize') {
        state.quran.fontSize = Number(value);
    }

    if (key === 'autoPlay') {
        state.quran.autoPlay = Boolean(value);
    }

    saveQuranState();
}

function downloadBackup() {
    const backup = Storage.exportBackup();

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download =
        `adhan-display-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
}

function resetPreferences() {
    const confirmed = window.confirm(
        'Reset Adhan Display preferences to their defaults? Your Quran bookmarks and tracker data will also be cleared.'
    );

    if (!confirmed) {
        return;
    }

    Object.keys(localStorage)
        .filter(key => key.startsWith('adhan_'))
        .forEach(key => localStorage.removeItem(key));

    window.location.reload();
}

export function bindSettingsPage() {
    const page = document.querySelector('.settings-page');

    if (!page) {
        return;
    }

    if (!state.quran.editions.length) {
        loadQuranSettingsEditions()
            .then(() => {
                refreshQuranSettings();
            });
    }

    page.querySelectorAll('[data-settings-theme]').forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.settingsTheme;

            if (
                (theme === 'dark' && !state.ui.darkMode) ||
                (theme === 'light' && state.ui.darkMode)
            ) {
                toggleTheme();
            }

            renderSettingsPage();
            window.dispatchEvent(
                new CustomEvent('adhan:settings-render')
            );
        });
    });

    page.querySelectorAll('[data-setting-select]').forEach(selectElement => {
        selectElement.addEventListener('change', () => {
            const key = selectElement.dataset.settingSelect;
            const value = selectElement.value;

            const mapping = {
                size: 'size',
                method: 'method',
                audio: 'audio'
            };

            if (mapping[key]) {
                saveSetting(mapping[key], value);
            }

            if (key === 'quranLanguage') {
                state.quran.selectedLanguage =
                    value;

                const translations =
                    getQuranSettingsTranslations(
                        value
                    );

                if (translations.length) {
                    const currentStillValid =
                        translations.some(
                            edition =>
                                edition.identifier ===
                                state.quran.selectedTranslation
                        );

                    if (!currentStillValid) {
                        state.quran.selectedTranslation =
                            translations[0].identifier;
                    }
                }

                saveQuranState();

                refreshQuranSettings();

                return;
            }


            if (key === 'quranTranslation') {
                state.quran.selectedTranslation =
                    value;

                const edition =
                    state.quran.editions.find(
                        item =>
                            item.identifier ===
                            value
                    );

                if (edition?.language) {
                    state.quran.selectedLanguage =
                        edition.language;
                }

                saveQuranState();

                refreshQuranSettings();

                return;
            }

            if (key === 'quranReciter') {
                saveQuranPreference('reciter', value);
            }

            if (key === 'quranFontSize') {
                saveQuranPreference('fontSize', value);
            }

            if (key === 'method') {
                refreshPrayer();
            }

            window.dispatchEvent(
                new CustomEvent('adhan:settings-render')
            );
        });
    });

    page.querySelectorAll('[data-setting-number]').forEach(input => {
        input.addEventListener('change', () => {
            const key = input.dataset.settingNumber;
            const value = Number(input.value);

            if (key === 'offset') {
                saveSetting('offset', value);
                refreshPrayer();
            }

            if (key === 'hijriOffset') {
                saveSetting('hijri_offset', value);
                refreshPrayer();
            }
        });
    });

    page.querySelectorAll('[data-setting-toggle]').forEach(input => {
        input.addEventListener('change', () => {
            const key = input.dataset.settingToggle;
            const value = input.checked;

            const mapping = {
                autoQada: 'auto_qada',
                autoLocation: 'auto_loc',
                dailyAlert: 'daily_alert',
                tahajjudAlarm: 'tahajjud_alarm',
                wudu: 'wudu',
                autodim: 'autodim',
                screensaver: 'screensaver'
            };

            if (mapping[key]) {
                Storage.set(mapping[key], value);
            }

            if (key === 'quranAutoPlay') {
                saveQuranPreference(
                    'autoPlay',
                    value
                );
            }

            if (key === 'autoLocation') {
                refreshPrayer();
            }

            window.dispatchEvent(
                new CustomEvent('adhan:settings-render')
            );
        });
    });

    const locationSearch =
        page.querySelector('[data-location-search]');

    const locationResults =
        page.querySelector('[data-location-results]');

    let locationSearchTimer = null;

    locationSearch?.addEventListener(
        'input',
        event => {
            const query =
                event.target.value.trim();

            clearTimeout(locationSearchTimer);

            if (!locationResults) {
                return;
            }

            if (query.length < 2) {
                locationResults.innerHTML = '';
                return;
            }

            locationResults.innerHTML =
                '<div class="settings-location-loading">Searching...</div>';

            locationSearchTimer = setTimeout(
                async () => {
                    try {
                        const result =
                            await Api.geocode(query);

                        const results =
                            Array.isArray(result.results)
                                ? result.results.slice(0, 5)
                                : [];

                        if (!results.length) {
                            locationResults.innerHTML =
                                '<div class="settings-location-empty">No locations found.</div>';
                            return;
                        }

                        locationResults.innerHTML =
                            results.map((item, index) => `
                                <button
                                    type="button"
                                    class="settings-location-result"
                                    data-location-result="${index}"
                                >
                                    <strong>
                                        ${escapeHtml(
                                            item.name || 'Unknown location'
                                        )}
                                    </strong>
                                    <span>
                                        ${escapeHtml(
                                            [
                                                item.admin1,
                                                item.country
                                            ]
                                                .filter(Boolean)
                                                .join(', ')
                                        )}
                                    </span>
                                </button>
                            `).join('');

                        locationResults
                            .querySelectorAll('[data-location-result]')
                            .forEach(button => {
                                button.addEventListener(
                                    'click',
                                    () => {
                                        const item =
                                            results[
                                                Number(
                                                    button.dataset.locationResult
                                                )
                                            ];

                                        if (!item) {
                                            return;
                                        }

                                        const location = {
                                            lat: Number(item.latitude),
                                            lon: Number(item.longitude),
                                            city:
                                                item.name ||
                                                query
                                        };

                                        Storage.setRaw(
                                            'auto_loc',
                                            'false'
                                        );

                                        window.dispatchEvent(
                                            new CustomEvent(
                                                'adhan:manual-location',
                                                {
                                                    detail: location
                                                }
                                            )
                                        );
                                    }
                                );
                            });
                    } catch (error) {
                        console.error(
                            '[Settings] Location search failed',
                            error
                        );

                        locationResults.innerHTML =
                            '<div class="settings-location-empty">Location search failed.</div>';
                    }
                },
                350
            );
        }
    );

    page.querySelector('[data-setting-range="volume"]')
        ?.addEventListener('input', event => {
            const value = Number(event.target.value);

            saveSetting('volume', value);

            const label =
                page.querySelector('[data-volume-value]');

            if (label) {
                label.textContent =
                    `${Math.round(value * 100)}%`;
            }
        });

    page.querySelectorAll('[data-settings-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.settingsAction;

            if (action === 'clear-cache') {
                Storage.clearCache();

                window.alert(
                    'Cached data has been cleared.'
                );

                window.dispatchEvent(
                    new CustomEvent('adhan:settings-render')
                );
            }

            if (action === 'export') {
                downloadBackup();
            }

            if (action === 'import') {
                page.querySelector(
                    '[data-settings-import-file]'
                )?.click();
            }

            if (action === 'reset') {
                resetPreferences();
            }
        });
    });

    page.querySelector('[data-settings-import-file]')
        ?.addEventListener('change', async event => {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            try {
                const text = await file.text();
                const backup = JSON.parse(text);

                Storage.importBackup(backup);

                window.alert(
                    'Backup imported successfully. The page will reload.'
                );

                window.location.reload();
            } catch (error) {
                console.error(
                    '[Adhan Display 2.0] Backup import failed',
                    error
                );

                window.alert(
                    'The selected backup could not be imported.'
                );
            }
        });
}
