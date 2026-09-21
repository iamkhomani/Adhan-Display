import { state } from '../state.js';
import { Storage } from '../storage.js';
import { APP } from '../config.js';
import { Tracker } from '../services/tracker.js';

const tracker = new Tracker();

let trackerHistoryOffset = 0;


function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatRawTime(raw) {
    if (!raw) {
        return '--:--';
    }

    return String(raw)
        .split(' ')[0]
        .slice(0, 5);
}

function formatDate(date) {
    return date.toLocaleDateString([], {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

function getTodayIso() {
    return tracker.iso(new Date());
}

function getPrayerRows() {
    const month = Array.isArray(state.prayer.month)
        ? state.prayer.month
        : [];

    return month.map(day => ({
        date: day.date?.gregorian?.date || '',
        readable: day.date?.readable || '',
        timestamp: day.date?.timestamp || '',
        timings: day.timings || {}
    }));
}

export function renderMonthlyTimetable() {
    const rows = getPrayerRows();

    if (!rows.length) {
        return `
            

        <section class="prayer-tool-view">
                <div class="prayer-tool-empty">
                    Monthly prayer times are not available yet.
                </div>
            </section>
        `;
    }

    const today = new Date();
    const todayKey =
        `${String(today.getDate()).padStart(2, '0')}-` +
        `${String(today.getMonth() + 1).padStart(2, '0')}-` +
        today.getFullYear();

    return `
        <section class="prayer-tool-view">

            <div class="prayer-tool-header">
                <div>
                    <span class="ad2-eyebrow">PRAYER</span>
                    <h2>Monthly Timetable</h2>
                    <p>
                        Complete prayer times for the current month.
                    </p>
                </div>

                <button
                    class="ad2-button ad2-button-secondary"
                    data-prayer-tool-close
                >
                    Back to Prayer
                </button>
            </div>

            <div class="prayer-month-full">
                <div class="prayer-month-full-head">
                    <span>Date</span>
                    <span>Fajr</span>
                    <span>Sunrise</span>
                    <span>Dhuhr</span>
                    <span>Asr</span>
                    <span>Maghrib</span>
                    <span>Isha</span>
                </div>

                ${rows.map(day => {
                    const dateKey = day.date;

                    return `
                        <div
                            class="prayer-month-full-row ${
                                dateKey === todayKey ? 'is-today' : ''
                            }"
                        >
                            <span class="prayer-month-date">
                                ${escapeHtml(day.readable)}
                                ${
                                    dateKey === todayKey
                                        ? '<small>Today</small>'
                                        : ''
                                }
                            </span>

                            <span>${formatRawTime(day.timings.Fajr)}</span>
                            <span>${formatRawTime(day.timings.Sunrise)}</span>
                            <span>${formatRawTime(day.timings.Dhuhr)}</span>
                            <span>${formatRawTime(day.timings.Asr)}</span>
                            <span>${formatRawTime(day.timings.Maghrib)}</span>
                            <span>${formatRawTime(day.timings.Isha)}</span>
                        </div>
                    `;
                }).join('')}
            </div>

        </section>
    `;
}

export function renderQibla() {
    const lat = Number(state.location.lat);
    const lon = Number(state.location.lon);

    const validLocation =
        Number.isFinite(lat) &&
        Number.isFinite(lon);

    let direction = null;

    if (validLocation) {
        const r = Math.PI / 180;

        const lat1 = lat * r;
        const lon1 = lon * r;
        const lat2 = APP.qibla.lat * r;
        const lon2 = APP.qibla.lon * r;

        const y =
            Math.sin(lon2 - lon1) *
            Math.cos(lat2);

        const x =
            Math.cos(lat1) *
                Math.sin(lat2) -
            Math.sin(lat1) *
                Math.cos(lat2) *
                Math.cos(lon2 - lon1);

        direction =
            Math.round(
                (
                    Math.atan2(y, x) / r +
                    360
                ) % 360
            );
    }

    return `
        <section class="prayer-tool-view">

            <div class="prayer-tool-header">
                <div>
                    <span class="ad2-eyebrow">DIRECTION</span>
                    <h2>Qibla</h2>
                    <p>
                        Direction to the Ka'bah from your current location.
                    </p>
                </div>

                <button
                    class="ad2-button ad2-button-secondary"
                    data-prayer-tool-close
                >
                    Back to Prayer
                </button>
            </div>

            <div class="qibla-tool-layout">

                <div class="qibla-compass">
                    <div class="qibla-compass-ring">
                        <span class="qibla-north">N</span>
                        <span class="qibla-east">E</span>
                        <span class="qibla-south">S</span>
                        <span class="qibla-west">W</span>

                        ${
                            direction !== null
                                ? `
                                    <div
                                        class="qibla-needle"
                                        style="transform: rotate(${direction}deg)"
                                    >
                                        <span></span>
                                    </div>
                                `
                                : ''
                        }

                        <div class="qibla-center">
                            <span>KA'BAH</span>
                        </div>
                    </div>
                </div>

                <div class="qibla-info">

                    <span class="ad2-eyebrow">
                        QIBLA DIRECTION
                    </span>

                    <strong class="qibla-degree">
                        ${
                            direction !== null
                                ? `${direction}°`
                                : '--'
                        }
                    </strong>

                    <p>
                        ${
                            direction !== null
                                ? 'Measured clockwise from true North.'
                                : 'Location is not available.'
                        }
                    </p>

                    <div class="qibla-location">
                        <span>Location</span>
                        <strong>
                            ${escapeHtml(
                                state.location.city ||
                                'Current location'
                            )}
                        </strong>
                    </div>

                </div>

            </div>

        </section>
    `;
}

function renderTrackerDay(date, offset, exemptionMode) {
    const iso = tracker.iso(date);
    const record = tracker.record(iso);

    const prayers = APP.trackablePrayers;
    const canShowExemptionAction =
        exemptionMode || record.Exempt;

    return `
        <div class="tracker-day ${
            record.Exempt ? 'is-exempt' : ''
        }">

            <div class="tracker-day-heading">
                <div>
                    <strong>
                        ${
                            offset === 0
                                ? 'Today'
                                : formatDate(date)
                        }
                    </strong>
                    <small>${iso}</small>
                </div>

                <span class="tracker-day-score">
                    ${
                        record.Exempt
                            ? 'Exempt'
                            : `${prayers.filter(
                                prayer => record[prayer]
                            ).length}/5`
                    }
                </span>
            </div>

            ${
                record.Exempt
                    ? `
                        <div class="tracker-exempt-banner">
                            <strong>Prayer exemption</strong>
                            <span>
                                This day is marked as exempt from Salah tracking.
                            </span>
                        </div>
                    `
                    : ''
            }

            <div class="tracker-prayers">

                ${prayers.map(prayer => `
                    <button
                        type="button"
                        class="tracker-prayer ${
                            record[prayer]
                                ? 'is-complete'
                                : ''
                        } ${
                            record.Exempt
                                ? 'is-exempt-disabled'
                                : ''
                        }"
                        data-tracker-date="${iso}"
                        data-tracker-prayer="${prayer}"
                        aria-pressed="${record[prayer] ? 'true' : 'false'}"
                        ${record.Exempt ? 'disabled' : ''}
                    >
                        <span class="tracker-check">
                            ${
                                record.Exempt
                                    ? '•'
                                    : record[prayer]
                                        ? '✓'
                                        : ''
                            }
                        </span>

                        <span>
                            ${escapeHtml(prayer)}
                        </span>
                    </button>
                `).join('')}

            </div>

            ${
                canShowExemptionAction
                    ? `
                        <button
                            type="button"
                            class="tracker-exempt-action"
                            data-tracker-exempt-date="${iso}"
                        >
                            ${
                                record.Exempt
                                    ? 'Restore Salah tracking'
                                    : 'Mark day as Exempt'
                            }
                        </button>
                    `
                    : ''
            }

        </div>
    `;
}


function renderPrayerStatistics() {
    const trackerData = Storage.getTracker();
    const prayers = APP.trackablePrayers;

    const stats = {};

    prayers.forEach(prayer => {
        stats[prayer] = {
            completed: 0,
            eligible: 0
        };
    });

    let trackedDays = 0;
    let perfectDays = 0;
    let exemptDays = 0;
    let totalCompleted = 0;
    let totalEligible = 0;

    Object.entries(trackerData).forEach(([date, record]) => {
        if (!record || typeof record !== 'object') {
            return;
        }

        trackedDays++;

        if (record.Exempt) {
            exemptDays++;
            return;
        }

        let perfect = true;

        prayers.forEach(prayer => {
            stats[prayer].eligible++;
            totalEligible++;

            if (record[prayer]) {
                stats[prayer].completed++;
                totalCompleted++;
            } else {
                perfect = false;
            }
        });

        if (perfect) {
            perfectDays++;
        }
    });

    prayers.forEach(prayer => {
        const item = stats[prayer];

        item.rate = item.eligible
            ? Math.round(
                (item.completed / item.eligible) * 100
            )
            : 0;
    });

    const completeDate = date => {
        const record = trackerData[date];

        if (!record) {
            return false;
        }

        if (record.Exempt) {
            return true;
        }

        return prayers.every(
            prayer => record[prayer]
        );
    };

    const toDate = iso => {
        const parts = iso.split('-').map(Number);

        return new Date(
            parts[0],
            parts[1] - 1,
            parts[2],
            12,
            0,
            0,
            0
        );
    };

    const dates = Object.keys(trackerData)
        .filter(date =>
            /^\\d{4}-\\d{2}-\\d{2}$/.test(date)
        )
        .sort();

    let longestStreak = 0;
    let runningStreak = 0;
    let previousDate = null;

    dates.forEach(date => {
        if (!completeDate(date)) {
            runningStreak = 0;
            previousDate = null;
            return;
        }

        if (previousDate) {
            const difference = Math.round(
                (toDate(date) - toDate(previousDate)) /
                86400000
            );

            if (difference === 1) {
                runningStreak++;
            } else {
                runningStreak = 1;
            }
        } else {
            runningStreak = 1;
        }

        longestStreak = Math.max(
            longestStreak,
            runningStreak
        );

        previousDate = date;
    });

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let currentStreak = 0;

    for (let i = 0; i < 3650; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const iso =
            `${date.getFullYear()}-` +
            `${String(date.getMonth() + 1).padStart(2, '0')}-` +
            `${String(date.getDate()).padStart(2, '0')}`;

        if (!completeDate(iso)) {
            break;
        }

        currentStreak++;
    }

    const ranked = prayers
        .map(prayer => ({
            prayer,
            completed: stats[prayer].completed,
            rate: stats[prayer].rate
        }))
        .sort((a, b) => {
            if (b.completed !== a.completed) {
                return b.completed - a.completed;
            }

            return b.rate - a.rate;
        });

    const mostPrayed = ranked[0] || null;
    const leastPrayed =
        ranked.length
            ? ranked[ranked.length - 1]
            : null;

    const overallRate = totalEligible
        ? Math.round(
            (totalCompleted / totalEligible) * 100
        )
        : 0;

    const prayerRows = prayers.map(prayer => {
        const item = stats[prayer];

        return `
            <div class="prayer-stat-row">
                <div class="prayer-stat-name">
                    <span>${escapeHtml(prayer)}</span>
                    <strong>${item.rate}%</strong>
                </div>

                <div class="prayer-stat-bar">
                    <span style="width:${item.rate}%"></span>
                </div>

                <div class="prayer-stat-meta">
                    ${item.completed} completed
                    ${item.eligible
                        ? `of ${item.eligible}`
                        : ''}
                </div>
            </div>
        `;
    }).join('');

    return `
        <section class="tracker-statistics">

            <div class="tracker-statistics-header">
                <div>
                    <span class="ad2-eyebrow">
                        PRAYER STATISTICS
                    </span>

                    <h2>Your Salah journey</h2>

                    <p>
                        A simple overview of your consistency
                        based on the prayers you have tracked.
                    </p>
                </div>
            </div>

            <div class="tracker-stat-grid">

                <div class="tracker-stat-card tracker-stat-featured">
                    <span class="tracker-stat-label">
                        Longest streak
                    </span>

                    <strong>${longestStreak}</strong>

                    <small>days</small>
                </div>

                <div class="tracker-stat-card">
                    <span class="tracker-stat-label">
                        Current streak
                    </span>

                    <strong>${currentStreak}</strong>

                    <small>days</small>
                </div>

                <div class="tracker-stat-card">
                    <span class="tracker-stat-label">
                        Completion rate
                    </span>

                    <strong>${overallRate}%</strong>

                    <small>tracked prayers</small>
                </div>

                <div class="tracker-stat-card">
                    <span class="tracker-stat-label">
                        Perfect days
                    </span>

                    <strong>${perfectDays}</strong>

                    <small>all 5 prayers</small>
                </div>

            </div>

            <div class="tracker-stat-highlights">

                <div class="tracker-stat-highlight">
                    <span>Most prayed</span>
                    <strong>
                        ${mostPrayed
                            ? escapeHtml(mostPrayed.prayer)
                            : '—'}
                    </strong>
                </div>

                <div class="tracker-stat-highlight">
                    <span>Least prayed</span>
                    <strong>
                        ${leastPrayed
                            ? escapeHtml(leastPrayed.prayer)
                            : '—'}
                    </strong>
                </div>

                <div class="tracker-stat-highlight">
                    <span>Total prayers</span>
                    <strong>${totalCompleted}</strong>
                </div>

                <div class="tracker-stat-highlight">
                    <span>Days tracked</span>
                    <strong>${trackedDays}</strong>
                </div>

            </div>

            <div class="tracker-prayer-breakdown">

                <div class="tracker-breakdown-header">
                    <span class="ad2-eyebrow">
                        BY PRAYER
                    </span>

                    <h3>Where your consistency stands</h3>
                </div>

                <div class="prayer-stat-list">
                    ${prayerRows}
                </div>

            </div>

            <div class="tracker-stat-note">
                ${
                    exemptDays
                        ? `${exemptDays} exempt day${exemptDays === 1 ? '' : 's'} excluded from prayer completion rates.`
                        : 'Exempt days will be excluded from prayer completion rates.'
                }
            </div>

        </section>
    `;
}


function renderTrackerHistoryDay(exemptionMode) {
    const date = tracker.dateAtOffset(trackerHistoryOffset);
    const iso = tracker.iso(date);
    const record = tracker.record(iso);

    const prayers = APP.trackablePrayers;

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(12, 0, 0, 0);

    const difference = Math.round(
        (selected - today) / 86400000
    );

    let relativeLabel = 'Today';

    if (difference === -1) {
        relativeLabel = 'Yesterday';
    } else if (difference === 1) {
        relativeLabel = 'Tomorrow';
    } else if (difference < 0) {
        relativeLabel = `${Math.abs(difference)} days ago`;
    } else if (difference > 0) {
        relativeLabel = `In ${difference} days`;
    }

    const score = record.Exempt
        ? 'Exempt'
        : `${prayers.filter(
            prayer => record[prayer]
        ).length}/${prayers.length}`;

    return `
        <section class="tracker-history">

            <div class="tracker-history-header">

                <div>
                    <span class="ad2-eyebrow">
                        HISTORICAL DAY
                    </span>

                    <h3>
                        ${date.toLocaleDateString([], {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </h3>

                    <span class="tracker-history-relative">
                        ${relativeLabel}
                    </span>
                </div>

                <div class="tracker-history-score">
                    ${score}
                </div>

            </div>

            <div class="tracker-history-navigation">

                <button
                    type="button"
                    class="ad2-button ad2-button-secondary"
                    data-tracker-history-prev
                >
                    ← Previous day
                </button>

                <button
                    type="button"
                    class="tracker-history-today ${
                        trackerHistoryOffset === 0
                            ? 'is-current'
                            : ''
                    }"
                    data-tracker-history-today
                >
                    Today
                </button>

                <button
                    type="button"
                    class="ad2-button ad2-button-secondary"
                    data-tracker-history-next
                    ${trackerHistoryOffset >= 0 ? 'disabled' : ''}
                >
                    Next day →
                </button>

            </div>

            ${
                record.Exempt
                    ? `
                        <div class="tracker-exempt-banner">
                            <strong>Prayer exemption</strong>
                            <span>
                                This day is marked as exempt from Salah tracking.
                            </span>
                        </div>
                    `
                    : ''
            }

            <div class="tracker-history-prayers">

                ${prayers.map(prayer => `
                    <button
                        type="button"
                        class="tracker-prayer ${
                            record[prayer]
                                ? 'is-complete'
                                : ''
                        } ${
                            record.Exempt
                                ? 'is-exempt-disabled'
                                : ''
                        }"
                        data-tracker-history-date="${iso}"
                        data-tracker-history-prayer="${prayer}"
                        aria-pressed="${
                            record[prayer]
                                ? 'true'
                                : 'false'
                        }"
                        ${record.Exempt ? 'disabled' : ''}
                    >
                        <span class="tracker-check">
                            ${
                                record.Exempt
                                    ? '•'
                                    : record[prayer]
                                        ? '✓'
                                        : ''
                            }
                        </span>

                        <span>
                            ${escapeHtml(prayer)}
                        </span>
                    </button>
                `).join('')}

            </div>

            ${
                exemptionMode || record.Exempt
                    ? `
                        <button
                            type="button"
                            class="tracker-exempt-action"
                            data-tracker-history-exempt
                            data-tracker-history-exempt-date="${iso}"
                        >
                            ${
                                record.Exempt
                                    ? 'Restore Salah tracking'
                                    : 'Mark day as Exempt'
                            }
                        </button>
                    `
                    : ''
            }

        </section>
    `;
}

export function renderTracker() {
    const stats = tracker.stats();
    const prayerStatistics = renderPrayerStatistics();
    const today = new Date();
    const settings = Storage.getSettings();
    const exemptionMode = !!settings.trackerExemptionMode;

    return `
        ${prayerStatistics}

        <section class="prayer-tool-view">

            <div class="prayer-tool-header">
                <div>
                    <span class="ad2-eyebrow">WORSHIP</span>
                    <h2>Prayer Tracker</h2>
                    <p>
                        Keep a simple record of your five daily prayers.
                    </p>
                </div>

                <button
                    class="ad2-button ad2-button-secondary"
                    data-prayer-tool-close
                >
                    Back to Prayer
                </button>
            </div>

            <div class="tracker-exemption-panel">
                <div class="tracker-exemption-copy">
                    <span class="ad2-eyebrow">PRAYER EXEMPTION</span>
                    <strong>Exemption mode</strong>
                    <p>
                        Use this when Salah is temporarily exempt,
                        for example during menstruation or nifas.
                        Exempt days remain in your history without
                        being treated as missed prayers.
                    </p>
                </div>

                <label class="tracker-exemption-control">
                    <input
                        type="checkbox"
                        data-tracker-exemption-mode
                        ${exemptionMode ? 'checked' : ''}
                    >
                    <span class="tracker-exemption-switch"></span>
                    <span>
                        ${exemptionMode ? 'Enabled' : 'Disabled'}
                    </span>
                </label>
            </div>

            <div class="tracker-summary">

                <div class="tracker-stat">
                    <span>7 DAY</span>
                    <strong>
                        ${stats.weekScore}/${stats.weekTotal}
                    </strong>
                </div>

                <div class="tracker-stat">
                    <span>30 DAY</span>
                    <strong>
                        ${stats.monthScore}/${stats.monthTotal}
                    </strong>
                </div>

                <div class="tracker-stat">
                    <span>STREAK</span>
                    <strong>
                        ${stats.streak}
                    </strong>
                </div>

            </div>

            <div class="tracker-list">

                ${Array.from(
                    { length: 7 },
                    (_, index) => {
                        const date = new Date(today);
                        date.setDate(
                            today.getDate() - index
                        );

                        return renderTrackerDay(
                            date,
                            index,
                            exemptionMode
                        );
                    }
                ).join('')}

            </div>

        </section>

        ${renderTrackerHistoryDay(exemptionMode)}
    `;
}

export function renderPrayerTool(action) {
    switch (action) {
        case 'monthly':
            return renderMonthlyTimetable();

        case 'qibla':
            return renderQibla();

        case 'tracker':
            return renderTracker();

        default:
            return null;
    }
}

export function bindPrayerTools() {

    document
        .querySelectorAll('[data-tracker-history-prev]')
        .forEach(button => {
            button.addEventListener('click', () => {
                trackerHistoryOffset--;

                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tracker-update'
                    )
                );
            });
        });

    document
        .querySelectorAll('[data-tracker-history-next]')
        .forEach(button => {
            button.addEventListener('click', () => {
                trackerHistoryOffset++;

                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tracker-update'
                    )
                );
            });
        });

    document
        .querySelectorAll('[data-tracker-history-today]')
        .forEach(button => {
            button.addEventListener('click', () => {
                trackerHistoryOffset = 0;

                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tracker-update'
                    )
                );
            });
        });

    document
        .querySelectorAll('[data-tracker-history-date]')
        .forEach(button => {
            button.addEventListener('click', () => {
                if (button.disabled) {
                    return;
                }

                const date =
                    button.dataset.trackerHistoryDate;

                const prayer =
                    button.dataset.trackerHistoryPrayer;

                const current =
                    tracker.record(date)[prayer];

                tracker.toggle(
                    date,
                    prayer,
                    !current
                );

                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tracker-update'
                    )
                );
            });
        });

    document
        .querySelectorAll('[data-tracker-history-exempt]')
        .forEach(button => {
            button.addEventListener('click', () => {
                const date =
                    button.dataset.trackerHistoryExemptDate;

                const current =
                    tracker.record(date).Exempt;

                tracker.setExempt(
                    date,
                    !current
                );

                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tracker-update'
                    )
                );
            });
        });


    document
        .querySelectorAll('[data-prayer-tool-close]')
        .forEach(button => {
            button.addEventListener('click', () => {
                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tool-close'
                    )
                );
            });
        });

    document
        .querySelectorAll('[data-tracker-exemption-mode]')
        .forEach(input => {
            input.addEventListener('change', () => {
                Storage.setSetting(
                    'tracker_exemption_mode',
                    input.checked
                );

                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tracker-update'
                    )
                );
            });
        });

    document
        .querySelectorAll('[data-tracker-exempt-date]')
        .forEach(button => {
            button.addEventListener('click', () => {
                const date =
                    button.dataset.trackerExemptDate;

                const current =
                    tracker.record(date).Exempt;

                tracker.setExempt(
                    date,
                    !current
                );

                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tracker-update'
                    )
                );
            });
        });

    document
        .querySelectorAll('[data-tracker-date]')
        .forEach(button => {
            button.addEventListener('click', () => {
                if (button.disabled) {
                    return;
                }

                const date =
                    button.dataset.trackerDate;

                const prayer =
                    button.dataset.trackerPrayer;

                const current =
                    tracker.record(date)[prayer];

                tracker.toggle(
                    date,
                    prayer,
                    !current
                );

                window.dispatchEvent(
                    new CustomEvent(
                        'adhan:prayer-tracker-update'
                    )
                );
            });
        });
}
