/*
 * Prayer: today's times, monthly timetable, qibla compass and tracker.
 */

import { esc } from '../core/util.js';
import { icon } from '../core/icons.js';
import { getSettings, setSetting, SALAH } from '../core/storage.js';
import { formatGregorian, addDaysToKey, keyToParts, hijriMonthName, weekdayOfKey } from '../core/time.js';
import { bus } from '../core/bus.js';
import { spinner, toast, emptyState } from '../core/ui.js';
import { prayerState, loadPrayerTimes, monthTimetable, qibla } from '../services/prayer.js';
import { location } from '../services/location.js';
import { tracker } from '../services/tracker.js';
import { methodName, ASR_METHODS, HIGH_LATITUDE_RULES } from '../data/content.js';
import { timeHTML, hijriText, prayerListHTML, bindAlertToggles, pageHeader, tabsHTML, openLocationDialog } from './components.js';

const TABS = [['', 'Today'], ['month', 'Month'], ['qibla', 'Qibla'], ['tracker', 'Tracker']];

let monthOffset = 0;
let trackerKey = null;

/* ---------------------------------------------------------------
 * Today
 * ------------------------------------------------------------- */

function todayView() {
    const { today, night } = prayerState;
    const settings = getSettings();
    const loc = location.get();

    if (!today) {
        return prayerState.status === 'error'
            ? emptyState({
                title: 'Prayer times could not be loaded',
                text: prayerState.error?.message || 'Check your internet connection.',
                action: `<button type="button" class="button button-primary" data-retry>${icon('refresh')} Try again</button>`
            })
            : spinner('Loading prayer times');
    }

    const tuned = Object.entries(settings.tune).filter(([, value]) => value);

    return `
        <div class="prayer-today">
            <section class="panel times-panel" aria-labelledby="today-title">
                <header class="panel-head">
                    <h2 id="today-title" class="panel-title">${esc(formatGregorian(today.key))}</h2>
                    <span class="panel-meta">${esc(hijriText(today.hijri))}</span>
                </header>
                ${prayerListHTML(today.entries)}
                <p class="panel-note">Tap the bell to turn the adhan on or off for a prayer.</p>
            </section>

            <div class="stack">
                ${night ? `
                    <section class="panel night-panel" aria-labelledby="night-title">
                        <header class="panel-head">
                            <h2 id="night-title" class="panel-title">Tonight</h2>
                            ${icon('moon', { size: 18 })}
                        </header>
                        <dl class="facts">
                            <div><dt>Middle of the night</dt><dd>${timeHTML(night.midnight)}</dd></div>
                            <div><dt>Last third begins</dt><dd>${timeHTML(night.lastThird)}</dd></div>
                            <div><dt>Fajr tomorrow</dt><dd>${timeHTML(night.fajrTomorrow)}</dd></div>
                        </dl>
                        <p class="panel-note">The last third of the night is a special time for tahajjud, Quran and du‘a. Witr should be prayed before Fajr.</p>
                        <label class="switch-row">
                            <span>Remind me when the last third begins</span>
                            <input type="checkbox" class="switch" data-setting-toggle="tahajjud" ${settings.tahajjud ? 'checked' : ''}>
                        </label>
                    </section>
                ` : ''}

                <section class="panel" aria-labelledby="calc-title">
                    <header class="panel-head">
                        <h2 id="calc-title" class="panel-title">Calculation</h2>
                        <a class="link-button" href="#settings/prayer">Change</a>
                    </header>
                    <dl class="facts">
                        <div><dt>Location</dt><dd><button type="button" class="link-button" data-action="location">${esc(loc.city)}</button></dd></div>
                        <div><dt>Method</dt><dd>${esc(methodName(settings.method))}</dd></div>
                        <div><dt>Asr</dt><dd>${esc(ASR_METHODS.find(([id]) => id === settings.school)?.[1] || '')}</dd></div>
                        <div><dt>High latitude rule</dt><dd>${esc(HIGH_LATITUDE_RULES.find(([id]) => id === settings.latAdjust)?.[1] || 'Automatic')}</dd></div>
                        <div><dt>Adjustments</dt><dd>${tuned.length ? esc(tuned.map(([name, value]) => `${name} ${value > 0 ? '+' : ''}${value}`).join(', ')) : 'None'}</dd></div>
                    </dl>
                </section>
            </div>
        </div>
    `;
}

/* ---------------------------------------------------------------
 * Month
 * ------------------------------------------------------------- */

function monthShell() {
    return `
        <section class="month" aria-live="polite">
            <header class="month-head">
                <button type="button" class="icon-button" data-month="-1" aria-label="Previous month">${icon('left')}</button>
                <h2 class="month-title" data-month-title>&nbsp;</h2>
                <button type="button" class="icon-button" data-month="1" aria-label="Next month">${icon('right')}</button>
                <button type="button" class="button button-ghost month-print" data-print aria-label="Print timetable">${icon('printer', { size: 18 })}<span class="print-label">Print</span></button>
            </header>
            <div data-month-body>${spinner('Loading timetable')}</div>
        </section>
    `;
}

async function loadMonth(root) {
    const body = root.querySelector('[data-month-body]');
    const title = root.querySelector('[data-month-title]');

    if (!body) {
        return;
    }

    const baseKey = prayerState.todayKey || new Date().toISOString().slice(0, 10);
    const { y, m } = keyToParts(baseKey);
    const date = new Date(Date.UTC(y, m - 1 + monthOffset, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const loc = location.get();

    title.textContent = `${date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`;
    body.innerHTML = spinner('Loading timetable');

    try {
        const days = await monthTimetable(year, month);
        const format = getSettings().timeFormat;
        const today = prayerState.todayKey;

        if (!body.isConnected) {
            return;
        }

        body.innerHTML = `
            <p class="print-only">Prayer times for ${esc(loc.city)}, ${esc(title.textContent)}. ${esc(methodName(getSettings().method))}.</p>
            <div class="table-wrap">
                <table class="month-table">
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col" class="col-hijri">Hijri</th>
                            <th scope="col">Fajr</th>
                            <th scope="col">Sunrise</th>
                            <th scope="col">Dhuhr</th>
                            <th scope="col">Asr</th>
                            <th scope="col">Maghrib</th>
                            <th scope="col">Isha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${days.map((day, index) => {
                            const weekday = weekdayOfKey(day.key);
                            const hijriLabel = day.hijri?.d
                                ? (day.hijri.d === 1 || index === 0 ? `${day.hijri.d} ${hijriMonthName(day.hijri.m)}` : String(day.hijri.d))
                                : '';
                            const classes = [day.key === today ? 'is-today' : '', weekday === 5 ? 'is-friday' : ''].join(' ');
                            return `
                                <tr class="${classes}" ${day.key === today ? 'aria-current="date"' : ''}>
                                    <th scope="row">${esc(formatGregorian(day.key, { weekday: 'short', day: 'numeric' }))}</th>
                                    <td class="col-hijri">${esc(hijriLabel)}</td>
                                    ${['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(name => `<td>${timeHTML(day.times[name], format)}</td>`).join('')}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        body.innerHTML = emptyState({ title: 'The timetable could not be loaded', text: error.message });
    }
}

/* ---------------------------------------------------------------
 * Qibla
 * ------------------------------------------------------------- */

function qiblaView() {
    const loc = location.get();
    const { bearing, distance } = qibla(loc.lat, loc.lon);
    const ticks = Array.from({ length: 72 }, (_, i) => `<span class="dial-tick ${i % 18 === 0 ? 'is-major' : i % 2 === 0 ? 'is-mid' : ''}" style="transform:rotate(${i * 5}deg)"></span>`).join('');

    return `
        <div class="qibla" data-qibla data-bearing="${bearing.toFixed(1)}">
            <div class="compass" data-compass>
                <div class="dial" data-dial>
                    ${ticks}
                    <span class="dial-letter dial-n">N</span>
                    <span class="dial-letter dial-e">E</span>
                    <span class="dial-letter dial-s">S</span>
                    <span class="dial-letter dial-w">W</span>
                    <span class="qibla-pointer" style="transform:rotate(${bearing}deg)">
                        <span class="qibla-pointer-line"></span>
                        <span class="qibla-pointer-head">${kaabaGlyph()}</span>
                    </span>
                </div>
                <span class="compass-top" aria-hidden="true"></span>
            </div>

            <div class="qibla-info">
                <p class="qibla-bearing tnum">${Math.round(bearing)}°</p>
                <p class="qibla-sub">from true north, ${Math.round(distance).toLocaleString('en')} km to the Ka‘bah</p>
                <p class="qibla-status" data-compass-status>The compass shows north at the top. Turn on the live compass on a phone or tablet to point the dial at the Qibla.</p>
                <div class="button-row">
                    <button type="button" class="button button-primary" data-live-compass>${icon('compass')} Live compass</button>
                    <a class="button button-ghost" href="https://qiblafinder.withgoogle.com/" target="_blank" rel="noopener noreferrer">${icon('external', { size: 18 })} Google Qibla Finder</a>
                </div>
                <p class="panel-note">Hold your device flat and away from metal and magnets. Compass sensors can be several degrees off, so use the bearing as a guide.</p>
            </div>
        </div>
    `;
}

function kaabaGlyph() {
    return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 8.5 12 5l8 3.5v9L12 21l-8-3.5z" fill="currentColor" opacity=".95"/><path d="M4 10.5 12 14l8-3.5" stroke="var(--gold)" stroke-width="1.6" fill="none"/></svg>`;
}

function bindCompass(root, ctx) {
    const wrapper = root.querySelector('[data-qibla]');
    const button = root.querySelector('[data-live-compass]');

    if (!wrapper || !button) {
        return;
    }

    const dial = wrapper.querySelector('[data-dial]');
    const status = wrapper.querySelector('[data-compass-status]');
    const bearing = Number(wrapper.dataset.bearing);
    let received = false;

    const onOrientation = event => {
        let heading = null;

        if (typeof event.webkitCompassHeading === 'number') {
            heading = event.webkitCompassHeading;
        } else if (event.absolute && typeof event.alpha === 'number') {
            heading = 360 - event.alpha;
        }

        if (heading === null || !Number.isFinite(heading)) {
            return;
        }

        received = true;
        const screenAngle = screen.orientation?.angle || window.orientation || 0;
        heading = (heading + screenAngle + 360) % 360;
        dial.style.transform = `rotate(${-heading}deg)`;

        const difference = Math.abs(((bearing - heading + 540) % 360) - 180);
        wrapper.classList.toggle('is-aligned', difference < 4);
        status.textContent = difference < 4
            ? 'You are facing the Qibla.'
            : `Turn ${((bearing - heading + 360) % 360) < 180 ? 'right' : 'left'} ${Math.round(difference)}°`;
    };

    button.addEventListener('click', async () => {
        try {
            if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    status.textContent = 'Motion and orientation access was not allowed.';
                    return;
                }
            }

            const type = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
            window.addEventListener(type, onOrientation, true);
            ctx.cleanup(() => window.removeEventListener(type, onOrientation, true));

            wrapper.classList.add('is-live');
            button.disabled = true;
            status.textContent = 'Move your device in a figure eight to calibrate.';

            setTimeout(() => {
                if (!received && wrapper.isConnected) {
                    status.textContent = 'This device does not report a compass direction. Use the bearing above or Google Qibla Finder.';
                    button.disabled = false;
                }
            }, 3000);
        } catch {
            status.textContent = 'The compass is not available in this browser.';
        }
    });
}

/* ---------------------------------------------------------------
 * Tracker
 * ------------------------------------------------------------- */

function trackerView() {
    const todayKey = prayerState.todayKey;

    if (!todayKey) {
        return spinner('Loading');
    }

    const key = trackerKey && trackerKey <= todayKey ? trackerKey : todayKey;
    const record = tracker.record(key);
    const stats = tracker.stats(todayKey);
    const recent = tracker.recent(todayKey, 28);
    const qada = tracker.qada();
    const settings = getSettings();
    const isToday = key === todayKey;
    const isFriday = weekdayOfKey(key) === 5;
    const percent = ({ done, total }) => (total ? Math.round((done / total) * 100) : 0);
    const dayLabel = isToday ? 'Today' : key === addDaysToKey(todayKey, -1) ? 'Yesterday' : formatGregorian(key, { weekday: 'long', day: 'numeric', month: 'long' });

    return `
        <div class="tracker">
            <section class="panel day-panel" aria-labelledby="day-title">
                <header class="day-head">
                    <button type="button" class="icon-button" data-day="-1" aria-label="Previous day">${icon('left')}</button>
                    <div class="day-title-wrap">
                        <h2 id="day-title" class="panel-title">${esc(dayLabel)}</h2>
                        <span class="panel-meta tnum">${record.Exempt ? 'Exempt' : `${tracker.count(record)} of 5 prayed`}</span>
                    </div>
                    <button type="button" class="icon-button" data-day="1" aria-label="Next day" ${isToday ? 'disabled' : ''}>${icon('right')}</button>
                </header>

                <div class="pray-chips pray-chips-large" role="group" aria-label="Prayers on ${esc(dayLabel)}">
                    ${SALAH.map(name => `
                        <button type="button" class="pray-chip ${record[name] ? 'is-done' : ''}" data-track-key="${key}" data-track="${name}"
                            aria-pressed="${record[name]}" ${record.Exempt ? 'disabled' : ''}>
                            <span class="pray-check">${icon('check', { size: 16 })}</span>
                            <span>${name}</span>
                        </button>
                    `).join('')}
                </div>

                <div class="extras">
                    <label class="switch-row"><span>Fasted</span>
                        <input type="checkbox" class="switch" data-track-extra="Fast" data-track-key="${key}" ${record.Fast ? 'checked' : ''}></label>
                    ${isFriday ? `<label class="switch-row"><span>Read Surah Al-Kahf</span>
                        <input type="checkbox" class="switch" data-track-extra="Kahf" data-track-key="${key}" ${record.Kahf ? 'checked' : ''}></label>` : ''}
                    ${settings.exemptionMode || record.Exempt ? `<label class="switch-row"><span>Exempt from salah on this day</span>
                        <input type="checkbox" class="switch" data-track-exempt="${key}" ${record.Exempt ? 'checked' : ''}></label>` : ''}
                </div>
            </section>

            <section class="panel" aria-labelledby="stats-title">
                <header class="panel-head"><h2 id="stats-title" class="panel-title">Consistency</h2></header>
                <div class="stats">
                    <div class="stat"><span class="stat-value tnum">${stats.current}</span><span class="stat-label">Day streak</span></div>
                    <div class="stat"><span class="stat-value tnum">${stats.longest}</span><span class="stat-label">Best streak</span></div>
                    <div class="stat"><span class="stat-value tnum">${percent(stats.week)}%</span><span class="stat-label">Last 7 days</span></div>
                    <div class="stat"><span class="stat-value tnum">${percent(stats.month)}%</span><span class="stat-label">Last 30 days</span></div>
                </div>

                <div class="heatmap" role="list" aria-label="Last four weeks">
                    ${recent.map(day => `
                        <button type="button" role="listitem" class="heat heat-${day.exempt ? 'x' : day.done} ${day.key === key ? 'is-selected' : ''}"
                            data-goto-day="${day.key}" title="${esc(formatGregorian(day.key, { weekday: 'short', day: 'numeric', month: 'short' }))}: ${day.exempt ? 'exempt' : `${day.done} of 5`}"
                            aria-label="${esc(formatGregorian(day.key, { weekday: 'long', day: 'numeric', month: 'long' }))}, ${day.exempt ? 'exempt' : `${day.done} of 5 prayers`}"></button>
                    `).join('')}
                </div>
                <p class="heat-legend"><span>Fewer</span>${[0, 1, 2, 3, 4, 5].map(n => `<span class="heat heat-${n}"></span>`).join('')}<span>All five</span></p>

                <div class="bars">
                    ${stats.perPrayer.map(item => `
                        <div class="bar-row">
                            <span>${item.name}</span>
                            <span class="bar" role="img" aria-label="${item.rate}%"><span style="width:${item.rate}%"></span></span>
                            <span class="tnum">${item.rate}%</span>
                        </div>
                    `).join('')}
                </div>
                <p class="panel-note">${stats.trackedDays ? `${stats.totalDone} prayers recorded over ${stats.trackedDays} days. ${stats.perfectDays} days with all five.${stats.exemptDays ? ` ${stats.exemptDays} exempt days are not counted.` : ''}` : 'Mark your prayers each day to see your progress here.'}</p>
            </section>

            <section class="panel" aria-labelledby="qada-title">
                <header class="panel-head"><h2 id="qada-title" class="panel-title">Make-up prayers</h2>
                    <span class="panel-meta tnum">${Object.values(qada).reduce((a, b) => a + b, 0)} to make up</span></header>
                <p class="panel-note">Keep count of missed prayers you still want to make up (qada).</p>
                <ul class="qada">
                    ${SALAH.map(name => `
                        <li>
                            <span>${name}</span>
                            <button type="button" class="icon-button" data-qada="${name}" data-delta="-1" aria-label="One less ${name}" ${qada[name] ? '' : 'disabled'}>${icon('minus', { size: 18 })}</button>
                            <span class="qada-count tnum">${qada[name]}</span>
                            <button type="button" class="icon-button" data-qada="${name}" data-delta="1" aria-label="One more ${name}">${icon('plus', { size: 18 })}</button>
                        </li>
                    `).join('')}
                </ul>
                <label class="switch-row">
                    <span>Exemption mode<small>Shows an option to mark days without salah, for example during menstruation or nifas, so they are not counted as missed.</small></span>
                    <input type="checkbox" class="switch" data-setting-toggle="exemptionMode" ${settings.exemptionMode ? 'checked' : ''}>
                </label>
            </section>
        </div>
    `;
}

/* ---------------------------------------------------------------
 * Page
 * ------------------------------------------------------------- */

function viewFor(tab) {
    switch (tab) {
        case 'month': return monthShell();
        case 'qibla': return qiblaView();
        case 'tracker': return trackerView();
        default: return todayView();
    }
}

export const prayerPage = {
    title: 'Prayer',

    render(path) {
        const tab = TABS.some(([id]) => id === path[0]) ? path[0] : '';
        const loc = location.get();

        return `
            <div class="page prayer-page">
                ${pageHeader('Prayer', `Times for ${loc.city}${loc.country ? `, ${loc.country}` : ''}`)}
                ${tabsHTML('prayer', TABS, tab)}
                <div class="tab-body" data-tab-body data-tab="${tab}">${viewFor(tab)}</div>
            </div>
        `;
    },

    mount(root, path, ctx) {
        const tab = TABS.some(([id]) => id === path[0]) ? path[0] : '';
        const body = root.querySelector('[data-tab-body]');
        const rerender = () => {
            body.innerHTML = viewFor(tab);
            if (tab === 'qibla') {
                bindCompass(root, ctx);
            }
        };

        if (tab === 'month') {
            loadMonth(root);
        }
        if (tab === 'qibla') {
            bindCompass(root, ctx);
        }

        ctx.on('prayer', ({ reason }) => {
            if (tab === 'month') {
                if (reason === 'load') {
                    loadMonth(root);
                }
            } else if (tab !== 'qibla') {
                rerender();
            }
        });
        ctx.on('location', () => {
            monthOffset = 0;
            const lead = root.querySelector('.page-lead');
            const loc = location.get();
            if (lead) {
                lead.textContent = `Times for ${loc.city}${loc.country ? `, ${loc.country}` : ''}`;
            }
            if (tab === 'qibla') {
                rerender();
            }
        });
        ctx.on('settings', () => {
            if (tab !== 'qibla' && tab !== 'month') {
                rerender();
            }
        });
        ctx.on('tracker', () => {
            if (tab === 'tracker') {
                rerender();
            }
        });

        if (tab !== 'month' && tab !== 'qibla') {
            bindAlertToggles(root);
        }

        root.addEventListener('click', event => {
            const target = event.target;
            const month = target.closest('[data-month]');
            const day = target.closest('[data-day]');
            const goto = target.closest('[data-goto-day]');
            const track = target.closest('[data-track]');
            const qada = target.closest('[data-qada]');

            if (month) {
                monthOffset += Number(month.dataset.month);
                loadMonth(root);
            } else if (target.closest('[data-print]')) {
                window.print();
            } else if (day) {
                const todayKey = prayerState.todayKey;
                const current = trackerKey && trackerKey <= todayKey ? trackerKey : todayKey;
                const nextKey = addDaysToKey(current, Number(day.dataset.day));
                trackerKey = nextKey > todayKey ? todayKey : nextKey;
                rerender();
            } else if (goto) {
                trackerKey = goto.dataset.gotoDay;
                rerender();
            } else if (track && track.dataset.trackKey) {
                tracker.toggle(track.dataset.trackKey, track.dataset.track);
            } else if (qada) {
                tracker.adjustQada(qada.dataset.qada, Number(qada.dataset.delta));
            } else if (target.closest('[data-retry]')) {
                loadPrayerTimes({ force: true });
            } else if (target.closest('[data-action="location"]')) {
                openLocationDialog();
            }
        });

        root.addEventListener('change', event => {
            const target = event.target;

            if (target.matches('[data-track-extra]')) {
                tracker.toggle(target.dataset.trackKey, target.dataset.trackExtra);
            } else if (target.matches('[data-track-exempt]')) {
                tracker.setExempt(target.dataset.trackExempt, target.checked);
            } else if (target.matches('[data-setting-toggle]')) {
                const key = target.dataset.settingToggle;
                setSetting(key, target.checked);
                bus.emit('settings', { key });
                if (key === 'tahajjud' && target.checked) {
                    toast('You will be reminded while Adhan Display is open');
                }
            }
        });
    }
};
