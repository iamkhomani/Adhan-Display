/*
 * Prayer: today's times, monthly timetable, qibla compass and tracker.
 */

import { esc } from '../core/util.js';
import { icon } from '../core/icons.js';
import { getSettings, setSetting, SALAH } from '../core/storage.js';
import { formatGregorian, addDaysToKey, keyToParts, hijriMonthName, weekdayOfKey, monthYearLabel } from '../core/time.js';
import { t, locale } from '../core/i18n.js';
import { bus } from '../core/bus.js';
import { spinner, toast, emptyState } from '../core/ui.js';
import { prayerState, loadPrayerTimes, monthTimetable, qibla } from '../services/prayer.js';
import { location } from '../services/location.js';
import { tracker } from '../services/tracker.js';
import { methodName, ASR_METHODS, HIGH_LATITUDE_RULES } from '../data/content.js';
import { timeHTML, hijriText, prayerListHTML, bindAlertToggles, pageHeader, tabsHTML, openLocationDialog, prayChipsHTML, togglePrayer, bindPrayerHold } from './components.js';

const TABS = [['', 'common.today'], ['month', 'prayer.tabMonth'], ['qibla', 'qibla.title'], ['tracker', 'prayer.tabTracker']];

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
                title: t('home.errorTitle'),
                text: prayerState.error?.message || t('error.network'),
                action: `<button type="button" class="button button-primary" data-retry>${icon('refresh')} ${esc(t('common.tryAgain'))}</button>`
            })
            : spinner(t('home.loading'));
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
                <p class="panel-note">${esc(t('prayer.bellHint'))}</p>
            </section>

            <div class="stack">
                ${night ? `
                    <section class="panel night-panel" aria-labelledby="night-title">
                        <header class="panel-head">
                            <h2 id="night-title" class="panel-title">${esc(t('prayer.tonight'))}</h2>
                            ${icon('moon', { size: 18 })}
                        </header>
                        <dl class="facts">
                            <div><dt>${esc(t('prayer.midnight'))}</dt><dd>${timeHTML(night.midnight)}</dd></div>
                            <div><dt>${esc(t('prayer.lastThird'))}</dt><dd>${timeHTML(night.lastThird)}</dd></div>
                            <div><dt>${esc(t('prayer.fajrTomorrow'))}</dt><dd>${timeHTML(night.fajrTomorrow)}</dd></div>
                        </dl>
                        <p class="panel-note">${esc(t('prayer.nightNote'))}</p>
                        <label class="switch-row">
                            <span>${esc(t('prayer.remindLastThird'))}</span>
                            <input type="checkbox" class="switch" data-setting-toggle="tahajjud" ${settings.tahajjud ? 'checked' : ''}>
                        </label>
                    </section>
                ` : ''}

                <section class="panel" aria-labelledby="calc-title">
                    <header class="panel-head">
                        <h2 id="calc-title" class="panel-title">${esc(t('prayer.calculation'))}</h2>
                        <a class="link-button" href="#settings/prayer">${esc(t('common.change'))}</a>
                    </header>
                    <dl class="facts">
                        <div><dt>${esc(t('location.title'))}</dt><dd><button type="button" class="link-button" data-action="location">${esc(loc.city)}</button></dd></div>
                        <div><dt>${esc(t('settings.method'))}</dt><dd>${esc(methodName(settings.method))}</dd></div>
                        <div><dt>${esc(t('settings.asr'))}</dt><dd>${esc(t(ASR_METHODS.find(([id]) => id === settings.school)?.[1] || 'asr.standard'))}</dd></div>
                        <div><dt>${esc(t('settings.latitude'))}</dt><dd>${esc(t(HIGH_LATITUDE_RULES.find(([id]) => id === settings.latAdjust)?.[1] || 'latitude.auto'))}</dd></div>
                        <div><dt>${esc(t('prayer.adjustments'))}</dt><dd>${tuned.length ? esc(tuned.map(([name, value]) => `${t(`prayer.${name}`)} ${value > 0 ? '+' : ''}${value}`).join(', ')) : esc(t('common.none'))}</dd></div>
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
                <button type="button" class="icon-button" data-month="-1" aria-label="${esc(t('prayer.prevMonth'))}">${icon('left')}</button>
                <h2 class="month-title" data-month-title>&nbsp;</h2>
                <button type="button" class="icon-button" data-month="1" aria-label="${esc(t('prayer.nextMonth'))}">${icon('right')}</button>
                <button type="button" class="button button-ghost month-print" data-print aria-label="${esc(t('prayer.print'))}">${icon('printer', { size: 18 })}<span class="print-label">${esc(t('prayer.printShort'))}</span></button>
            </header>
            <div data-month-body>${spinner(t('prayer.loadingMonth'))}</div>
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

    title.textContent = monthYearLabel(year, month);
    body.innerHTML = spinner(t('prayer.loadingMonth'));

    try {
        const days = await monthTimetable(year, month);
        const format = getSettings().timeFormat;
        const today = prayerState.todayKey;

        if (!body.isConnected) {
            return;
        }

        body.innerHTML = `
            <p class="print-only">${esc(t('prayer.printTitle', { place: loc.city, month: title.textContent, method: methodName(getSettings().method) }))}</p>
            <div class="table-wrap">
                <table class="month-table">
                    <thead>
                        <tr>
                            <th scope="col">${esc(t('prayer.date'))}</th>
                            <th scope="col" class="col-hijri">${esc(t('prayer.hijri'))}</th>
                            ${['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(name => `<th scope="col">${esc(t(`prayer.${name}`))}</th>`).join('')}
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
        body.innerHTML = emptyState({ title: t('prayer.monthFailed'), text: error.message });
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
                    <span class="dial-letter dial-n">${esc(t('qibla.n'))}</span>
                    <span class="dial-letter dial-e">${esc(t('qibla.e'))}</span>
                    <span class="dial-letter dial-s">${esc(t('qibla.s'))}</span>
                    <span class="dial-letter dial-w">${esc(t('qibla.w'))}</span>
                    <span class="qibla-pointer" style="transform:rotate(${bearing}deg)">
                        <span class="qibla-pointer-line"></span>
                        <span class="qibla-pointer-head">${kaabaGlyph()}</span>
                    </span>
                </div>
                <span class="compass-top" aria-hidden="true"></span>
            </div>

            <div class="qibla-info">
                <p class="qibla-bearing tnum">${Math.round(bearing)}°</p>
                <p class="qibla-sub">${esc(t('qibla.sub', { km: Math.round(distance).toLocaleString(locale()) }))}</p>
                <p class="qibla-status" data-compass-status>${esc(t('qibla.statusIdle'))}</p>
                <div class="button-row">
                    <button type="button" class="button button-primary" data-live-compass>${icon('compass')} ${esc(t('qibla.live'))}</button>
                    <a class="button button-ghost" href="https://qiblafinder.withgoogle.com/" target="_blank" rel="noopener noreferrer">${icon('external', { size: 18 })} Google Qibla Finder</a>
                </div>
                <p class="panel-note">${esc(t('qibla.note'))}</p>
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
            ? t('qibla.facing')
            : t(((bearing - heading + 360) % 360) < 180 ? 'qibla.turnRight' : 'qibla.turnLeft', { degrees: Math.round(difference) });
    };

    button.addEventListener('click', async () => {
        try {
            if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    status.textContent = t('qibla.denied');
                    return;
                }
            }

            const type = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
            window.addEventListener(type, onOrientation, true);
            ctx.cleanup(() => window.removeEventListener(type, onOrientation, true));

            wrapper.classList.add('is-live');
            button.disabled = true;
            status.textContent = t('qibla.calibrate');

            setTimeout(() => {
                if (!received && wrapper.isConnected) {
                    status.textContent = t('qibla.noSensor');
                    button.disabled = false;
                }
            }, 3000);
        } catch {
            status.textContent = t('qibla.unsupported');
        }
    });
}

/* ---------------------------------------------------------------
 * Tracker
 * ------------------------------------------------------------- */

function trackerView() {
    const todayKey = prayerState.todayKey;

    if (!todayKey) {
        return spinner();
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
    const dayLabel = isToday ? t('common.today') : key === addDaysToKey(todayKey, -1) ? t('common.yesterday') : formatGregorian(key, { weekday: 'long', day: 'numeric', month: 'long' });

    return `
        <div class="tracker">
            <section class="panel day-panel" aria-labelledby="day-title">
                <header class="day-head">
                    <button type="button" class="icon-button" data-day="-1" aria-label="${esc(t('tracker.prevDay'))}">${icon('left')}</button>
                    <div class="day-title-wrap">
                        <h2 id="day-title" class="panel-title">${esc(dayLabel)}</h2>
                        <span class="panel-meta tnum">${esc(record.Exempt ? t('tracker.exempt') : t('tracker.prayedOf5', { count: tracker.count(record) }))}</span>
                    </div>
                    <button type="button" class="icon-button" data-day="1" aria-label="${esc(t('tracker.nextDay'))}" ${isToday ? 'disabled' : ''}>${icon('right')}</button>
                </header>

                ${prayChipsHTML(record, { key, large: true, label: t('tracker.prayersOn', { day: dayLabel }) })}
                ${record.Exempt ? '' : `<p class="chips-hint">${esc(t('tracker.holdHint'))}</p>`}

                <div class="extras">
                    <label class="switch-row"><span>${esc(t('tracker.fasted'))}</span>
                        <input type="checkbox" class="switch" data-track-extra="Fast" data-track-key="${key}" ${record.Fast ? 'checked' : ''}></label>
                    ${isFriday ? `<label class="switch-row"><span>${esc(t('tracker.kahf'))}</span>
                        <input type="checkbox" class="switch" data-track-extra="Kahf" data-track-key="${key}" ${record.Kahf ? 'checked' : ''}></label>` : ''}
                    ${settings.exemptionMode || record.Exempt ? `<label class="switch-row"><span>${esc(t('tracker.exemptDay'))}</span>
                        <input type="checkbox" class="switch" data-track-exempt="${key}" ${record.Exempt ? 'checked' : ''}></label>` : ''}
                </div>
            </section>

            <section class="panel" aria-labelledby="stats-title">
                <header class="panel-head"><h2 id="stats-title" class="panel-title">${esc(t('tracker.consistency'))}</h2></header>
                <div class="stats">
                    <div class="stat"><span class="stat-value tnum">${stats.current}</span><span class="stat-label">${esc(t('tracker.streak'))}</span></div>
                    <div class="stat"><span class="stat-value tnum">${stats.longest}</span><span class="stat-label">${esc(t('tracker.best'))}</span></div>
                    <div class="stat"><span class="stat-value tnum">${percent(stats.week)}%</span><span class="stat-label">${esc(t('tracker.last7'))}</span></div>
                    <div class="stat"><span class="stat-value tnum">${percent(stats.month)}%</span><span class="stat-label">${esc(t('tracker.last30'))}</span></div>
                </div>

                ${stats.month.done ? (() => {
                    const onTime = Math.round((stats.month.onTime / stats.month.done) * 100);
                    return `
                        <div class="ontime">
                            <div class="ontime-head">
                                <span>${esc(t('tracker.onTimeTitle'))}</span>
                                <strong class="tnum">${onTime}%</strong>
                            </div>
                            <span class="bar bar-split" role="img" aria-label="${esc(t('tracker.onTimeCounts', { onTime: stats.month.onTime, late: stats.month.late }))}">
                                <span style="width:${onTime}%"></span><span class="bar-late" style="width:${100 - onTime}%"></span>
                            </span>
                            <p class="ontime-note tnum">${esc(t('tracker.onTimeCounts', { onTime: stats.month.onTime, late: stats.month.late }))}</p>
                        </div>
                    `;
                })() : ''}

                <div class="heatmap" role="list" aria-label="${esc(t('tracker.fourWeeks'))}">
                    ${recent.map(day => `
                        <button type="button" role="listitem" class="heat heat-${day.exempt ? 'x' : day.done} ${day.key === key ? 'is-selected' : ''}"
                            data-goto-day="${day.key}" title="${esc(formatGregorian(day.key, { weekday: 'short', day: 'numeric', month: 'short' }))}: ${esc(day.exempt ? t('tracker.exempt') : t('tracker.countOf5', { count: day.done }))}"
                            aria-label="${esc(formatGregorian(day.key, { weekday: 'long', day: 'numeric', month: 'long' }))}, ${esc(day.exempt ? t('tracker.exempt') : t('tracker.prayedOf5', { count: day.done }))}"></button>
                    `).join('')}
                </div>
                <p class="heat-legend"><span>${esc(t('tracker.fewer'))}</span>${[0, 1, 2, 3, 4, 5].map(n => `<span class="heat heat-${n}"></span>`).join('')}<span>${esc(t('tracker.allFiveShort'))}</span></p>

                <div class="bars">
                    ${stats.perPrayer.map(item => `
                        <div class="bar-row">
                            <span>${esc(t(`prayer.${item.name}`))}</span>
                            <span class="bar bar-split" role="img" aria-label="${item.rate}%${item.late ? `, ${esc(t('tracker.onTimeCounts', { onTime: item.done - item.late, late: item.late }))}` : ''}"><span style="width:${item.total ? ((item.done - item.late) / item.total) * 100 : 0}%"></span>${item.late ? `<span class="bar-late" style="width:${(item.late / item.total) * 100}%"></span>` : ''}</span>
                            <span class="tnum">${item.rate}%</span>
                        </div>
                    `).join('')}
                </div>
                <p class="panel-note">${esc(stats.trackedDays
                    ? [
                        stats.trackedDays === 1 ? t('tracker.summaryOneDay', { count: stats.totalDone }) : t('tracker.summary', { count: stats.totalDone, days: stats.trackedDays }),
                        t('tracker.perfect', { count: stats.perfectDays }),
                        stats.exemptDays ? t('tracker.exemptNotCounted', { count: stats.exemptDays }) : ''
                    ].filter(Boolean).join(' ')
                    : t('tracker.empty'))}</p>
            </section>

            <section class="panel" aria-labelledby="qada-title">
                <header class="panel-head"><h2 id="qada-title" class="panel-title">${esc(t('qada.title'))}</h2>
                    <span class="panel-meta tnum">${esc(t('qada.total', { count: Object.values(qada).reduce((a, b) => a + b, 0) }))}</span></header>
                <p class="panel-note">${esc(t('qada.note'))}</p>
                <ul class="qada">
                    ${SALAH.map(name => `
                        <li>
                            <span>${esc(t(`prayer.${name}`))}</span>
                            <button type="button" class="icon-button" data-qada="${name}" data-delta="-1" aria-label="${esc(t('qada.less', { prayer: t(`prayer.${name}`) }))}" ${qada[name] ? '' : 'disabled'}>${icon('minus', { size: 18 })}</button>
                            <span class="qada-count tnum">${qada[name]}</span>
                            <button type="button" class="icon-button" data-qada="${name}" data-delta="1" aria-label="${esc(t('qada.more', { prayer: t(`prayer.${name}`) }))}">${icon('plus', { size: 18 })}</button>
                        </li>
                    `).join('')}
                </ul>
                <label class="switch-row">
                    <span>${esc(t('tracker.askSetting'))}<small>${esc(t('tracker.askSettingHint'))}</small></span>
                    <input type="checkbox" class="switch" data-setting-toggle="askOnTime" ${settings.askOnTime ? 'checked' : ''}>
                </label>
                <label class="switch-row">
                    <span>${esc(t('tracker.exemptionMode'))}<small>${esc(t('tracker.exemptionHint'))}</small></span>
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
    titleKey: 'nav.prayer',

    render(path) {
        const tab = TABS.some(([id]) => id === path[0]) ? path[0] : '';
        const loc = location.get();

        return `
            <div class="page prayer-page">
                ${pageHeader(t('nav.prayer'), t('prayer.timesFor', { place: `${loc.city}${loc.country ? `, ${loc.country}` : ''}` }))}
                ${tabsHTML('prayer', TABS.map(([id, key]) => [id, t(key)]), tab)}
                <div class="tab-body" data-tab-body data-tab="${tab}">${viewFor(tab)}</div>
            </div>
        `;
    },

    mount(root, path, ctx) {
        bindPrayerHold(root, chip => chip.dataset.trackKey);
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
                lead.textContent = t('prayer.timesFor', { place: `${loc.city}${loc.country ? `, ${loc.country}` : ''}` });
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
                togglePrayer(track.dataset.trackKey, track.dataset.track);
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
                    toast(t('prayer.remindWhileOpen'));
                }
            }
        });
    }
};
