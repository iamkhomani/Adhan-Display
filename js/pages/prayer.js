import { state } from '../state.js';

const GOOGLE_QIBLA_FINDER =
    'https://qiblafinder.withgoogle.com/intl/nl/onboarding/position';


function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function formatTime(value) {
    if (!value) {
        return '--:--';
    }

    if (value instanceof Date) {
        return value.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    const clean = String(value).split(' ')[0];
    const match = clean.match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
        return clean;
    }

    return `${String(match[1]).padStart(2, '0')}:${match[2]}`;
}


function formatCountdown(seconds) {
    const total = Math.max(
        0,
        Math.floor(Number(seconds) || 0)
    );

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hours > 23) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        return `${days}d ${String(remainingHours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    }

    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(secs).padStart(2, '0')
    ].join(':');
}


function getPrayerSource(prayer) {
    if (!prayer) {
        return null;
    }

    return (
        prayer.timings ||
        prayer.times ||
        prayer.data ||
        prayer
    );
}


function getPrayerEntries(prayer) {
    const source = getPrayerSource(prayer);

    if (!source) {
        return [];
    }

    const names = [
        ['Fajr', 'Fajr'],
        ['Sunrise', 'Sunrise'],
        ['Dhuhr', 'Dhuhr'],
        ['Asr', 'Asr'],
        ['Maghrib', 'Maghrib'],
        ['Isha', 'Isha']
    ];

    return names.map(([label, key]) => ({
        label,
        key,
        value:
            source[key] ||
            source[key.toLowerCase()] ||
            '--:--'
    }));
}


function getNextIndex(entries, next) {
    if (!next?.name) {
        return -1;
    }

    return entries.findIndex(
        entry =>
            entry.label.toLowerCase() ===
            String(next.name).toLowerCase()
    );
}


function getPrayerStatus(index, nextIndex) {
    if (index === nextIndex) {
        return 'next';
    }

    if (nextIndex === -1) {
        return 'upcoming';
    }

    if (index < nextIndex) {
        return 'passed';
    }

    return 'upcoming';
}


function getCurrentPrayer(entries) {
    if (!entries.length) {
        return null;
    }

    const now = new Date();

    const prayerEntries = entries.filter(
        entry =>
            entry.key !== 'Sunrise'
    );

    let current = null;

    for (const entry of prayerEntries) {
        const clean =
            String(entry.value || '')
                .split(' ')[0];

        const match =
            clean.match(/^(\d{1,2}):(\d{2})/);

        if (!match) {
            continue;
        }

        const prayerTime = new Date();
        prayerTime.setHours(
            Number(match[1]),
            Number(match[2]),
            0,
            0
        );

        if (prayerTime <= now) {
            current = {
                ...entry,
                time: prayerTime
            };
        }
    }

    /*
     * Before Fajr, the current prayer period is Isha
     * from the previous evening.
     */
    if (!current) {
        const isha =
            prayerEntries.find(
                entry => entry.key === 'Isha'
            );

        if (isha) {
            const clean =
                String(isha.value || '')
                    .split(' ')[0];

            const match =
                clean.match(/^(\d{1,2}):(\d{2})/);

            if (match) {
                const prayerTime = new Date();

                prayerTime.setHours(
                    Number(match[1]),
                    Number(match[2]),
                    0,
                    0
                );

                prayerTime.setDate(
                    prayerTime.getDate() - 1
                );

                current = {
                    ...isha,
                    time: prayerTime
                };
            }
        }
    }

    return current;
}


function getCalculationMethod() {
    const raw =
        localStorage.getItem('method') ||
        '3';

    const methods = [
        {
            id: 3,
            name: 'Muslim World League'
        },
        {
            id: 2,
            name: 'ISNA'
        },
        {
            id: 4,
            name: 'Umm Al-Qura, Makkah'
        },
        {
            id: 5,
            name: 'Egyptian Survey'
        },
        {
            id: 7,
            name: 'Institute of Geophysics, University of Tehran'
        },
        {
            id: 8,
            name: 'Gulf Region'
        },
        {
            id: 9,
            name: 'Kuwait'
        },
        {
            id: 10,
            name: 'Qatar'
        },
        {
            id: 11,
            name: 'Singapore'
        },
        {
            id: 12,
            name: 'France'
        },
        {
            id: 13,
            name: 'Turkey'
        }
    ];

    return (
        methods.find(
            method =>
                method.id === Number(raw)
        ) ||
        methods[0]
    );
}


function calculateQiblaBearing(lat, lon) {
    const kaabaLat = 21.422487;
    const kaabaLon = 39.826206;

    const toRad = value =>
        value * Math.PI / 180;

    const toDeg = value =>
        value * 180 / Math.PI;

    const lat1 = toRad(Number(lat));
    const lon1 = toRad(Number(lon));
    const lat2 = toRad(kaabaLat);
    const lon2 = toRad(kaabaLon);

    const y =
        Math.sin(lon2 - lon1) *
        Math.cos(lat2);

    const x =
        Math.cos(lat1) *
        Math.sin(lat2) -
        Math.sin(lat1) *
        Math.cos(lat2) *
        Math.cos(lon2 - lon1);

    return Math.round(
        (toDeg(Math.atan2(y, x)) + 360) % 360
    );
}


function getLocation() {
    const lat = Number(state.location?.lat);
    const lon = Number(state.location?.lon);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
    ) {
        return null;
    }

    return {
        lat,
        lon
    };
}


function renderPrayerRows(entries, next) {
    const nextIndex = getNextIndex(entries, next);

    return entries.map((entry, index) => {
        const status =
            getPrayerStatus(
                index,
                nextIndex
            );

        return `
            <div
                class="prayer-compact-row ${status === 'next' ? 'is-next' : ''} ${status === 'passed' ? 'is-passed' : ''}"
            >
                <span class="prayer-compact-name">
                    ${escapeHtml(entry.label)}
                </span>

                <span class="prayer-compact-status">
                    ${
                        status === 'next'
                            ? 'NEXT'
                            : status === 'passed'
                                ? 'PASSED'
                                : ''
                    }
                </span>

                <strong class="prayer-compact-time">
                    ${escapeHtml(formatTime(entry.value))}
                </strong>
            </div>
        `;
    }).join('');
}


export function renderQiblaCard() {
    const location = getLocation();

    if (!location) {
        return `
            <section class="prayer-qibla-card">
                <div class="prayer-qibla-heading">
                    <span class="eyebrow">
                        QIBLA
                    </span>

                    <h2>
                        Holy Qibla Alignment
                    </h2>
                </div>

                <div class="prayer-qibla-unavailable">
                    Location coordinates are not available.
                    Enable location access in Settings to calculate
                    the Qibla direction.
                </div>
            </section>
        `;
    }

    const bearing =
        calculateQiblaBearing(
            location.lat,
            location.lon
        );

    return `
        <section
            class="prayer-qibla-card"
            data-qibla-card
            data-qibla-bearing="${bearing}"
        >

            <div class="prayer-qibla-heading">

                <div>
                    <span class="eyebrow">
                        QIBLA
                    </span>

                    <h2>
                        Holy Qibla Alignment
                    </h2>
                </div>

                <span
                    class="prayer-qibla-degree"
                    data-qibla-degree
                >
                    ${bearing}°
                </span>

            </div>


            <p class="prayer-qibla-subtitle">
                from True North
            </p>


            <div
                class="prayer-qibla-compass"
                data-qibla-compass
                style="--qibla-rotation: ${bearing}deg;"
            >

                <span class="qibla-compass-mark qibla-mark-n">
                    N
                </span>

                <span class="qibla-compass-mark qibla-mark-e">
                    E
                </span>

                <span class="qibla-compass-mark qibla-mark-s">
                    S
                </span>

                <span class="qibla-compass-mark qibla-mark-w">
                    W
                </span>

                <span
                    class="prayer-qibla-direction"
                    data-qibla-direction
                ></span>

                <span class="prayer-qibla-center">
                    KAABA
                </span>

            </div>


            <div
                class="prayer-qibla-status"
                data-qibla-status
            >
                Compass ready
            </div>


            <div class="prayer-qibla-actions">

                <button
                    class="prayer-qibla-button primary"
                    type="button"
                    data-qibla-live
                >
                    Enable Live Compass
                </button>

                <a
                    class="prayer-qibla-button secondary"
                    href="${GOOGLE_QIBLA_FINDER}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open Google Qibla Finder ↗
                </a>

            </div>


            <p class="prayer-qibla-help">
                Live Compass uses your device's orientation sensors.
                If your browser does not support them, use Google
                Qibla Finder for GPS and AR guidance.
            </p>

        </section>
    `;
}


function renderTools() {
    return `
        <section class="prayer-tools-compact">

            <div class="section-heading prayer-section-heading">

                <div>
                    <span class="eyebrow">
                        WORSHIP TOOLS
                    </span>

                    <h2>
                        Prayer Tools
                    </h2>
                </div>

            </div>


            <div class="prayer-tools-grid">

                <button
                    class="prayer-tool-button"
                    type="button"
                    data-prayer-action="monthly"
                >
                    <span class="prayer-tool-button-icon">
                        ◷
                    </span>

                    <span>
                        <strong>
                            Monthly Timetable
                        </strong>

                        <small>
                            Full prayer schedule
                        </small>
                    </span>

                    <span class="prayer-tool-arrow">
                        →
                    </span>
                </button>


                <button
                    class="prayer-tool-button"
                    type="button"
                    data-prayer-action="qibla"
                >
                    <span class="prayer-tool-button-icon">
                        ⌖
                    </span>

                    <span>
                        <strong>
                            Qibla
                        </strong>

                        <small>
                            Direction of the Ka'bah
                        </small>
                    </span>

                    <span class="prayer-tool-arrow">
                        →
                    </span>
                </button>


                <button
                    class="prayer-tool-button"
                    type="button"
                    data-prayer-action="tracker"
                >
                    <span class="prayer-tool-button-icon">
                        ✓
                    </span>

                    <span>
                        <strong>
                            Prayer Tracker
                        </strong>

                        <small>
                            Track today's prayers
                        </small>
                    </span>

                    <span class="prayer-tool-arrow">
                        →
                    </span>
                </button>

            </div>

        </section>
    `;
}


export function renderPrayerPage() {
    const prayer = state.prayer.data;
    const entries = getPrayerEntries(prayer);
    const next = state.prayer.next;

    const nextTime =
        next?.time
            ? formatTime(next.time)
            : '--:--';

    const current =
        getCurrentPrayer(entries);

    const currentTime =
        current?.time
            ? formatTime(current.time)
            : '--:--';

    const method =
        getCalculationMethod();

    const location =
        state.location?.city ||
        'Your location';

    const today =
        new Date().toLocaleDateString(
            undefined,
            {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            }
        );

    const nextIndex =
        getNextIndex(
            entries,
            next
        );

    const countdown =
        next?.time
            ? Math.max(
                0,
                Math.floor(
                    (
                        next.time -
                        new Date()
                    ) / 1000
                )
            )
            : 0;

    const offset =
        Number(
            localStorage.getItem('offset') || 0
        );

    const hijriOffset =
        Number(
            localStorage.getItem('hijri_offset') || 0
        );


    return `
        <section class="page prayer-page prayer-compact">

            <header class="prayer-compact-header">

                <div>
                    <span class="eyebrow">
                        PRAYER & ORIENTATION
                    </span>

                    <h1>
                        Prayer
                    </h1>

                    <div class="prayer-location">
                        <span class="prayer-location-dot"></span>

                        <span>
                            ${escapeHtml(location)}
                        </span>

                        <span>
                            ·
                        </span>

                        <span>
                            ${escapeHtml(today)}
                        </span>
                    </div>
                </div>

            </header>


            <div class="prayer-compact-layout">

                <div class="prayer-compact-main">

                    <section class="prayer-next-card">

                        <span class="prayer-next-label">
                            CURRENT PRAYER
                        </span>

                        <div class="prayer-next-name">
                            ${escapeHtml(
                                current?.label ||
                                'Prayer'
                            )}
                        </div>

                        <div class="prayer-next-time">
                            ${escapeHtml(currentTime)}
                        </div>

                        <div
                            class="prayer-next-countdown"
                            data-prayer-countdown
                        >
                            ${
                                next?.name
                                    ? `Next prayer: ${escapeHtml(next.name)} · in ${formatCountdown(countdown)}`
                                    : 'Next prayer unavailable'
                            }
                        </div>

                    </section>


                    <section class="prayer-schedule-section">

                        <div class="prayer-schedule-heading">

                            <div>
                                <span class="eyebrow">
                                    SALAH SCHEDULE
                                </span>

                                <h2>
                                    Today's Prayer Times
                                </h2>
                            </div>

                            ${
                                nextIndex >= 0
                                    ? `
                                        <span class="prayer-next-small">
                                            Next:
                                            ${escapeHtml(
                                                entries[nextIndex].label
                                            )}
                                        </span>
                                    `
                                    : ''
                            }

                        </div>


                        <div class="prayer-compact-times">

                            ${
                                entries.length
                                    ? renderPrayerRows(
                                        entries,
                                        next
                                    )
                                    : `
                                        <div class="prayer-empty">
                                            Prayer times are loading...
                                        </div>
                                    `
                            }

                        </div>

                    </section>

                </div>


                <div class="prayer-compact-side">

                    ${renderQiblaCard()}


                    <section class="prayer-info-strip">

                        <div>
                            <span>
                                CALCULATION
                            </span>

                            <strong>
                                ${escapeHtml(method.name)}
                            </strong>
                        </div>

                        <div>
                            <span>
                                TIME OFFSET
                            </span>

                            <strong>
                                ${
                                    offset >= 0
                                        ? '+'
                                        : ''
                                }${offset} min
                            </strong>
                        </div>

                        <div>
                            <span>
                                HIJRI OFFSET
                            </span>

                            <strong>
                                ${
                                    hijriOffset >= 0
                                        ? '+'
                                        : ''
                                }${hijriOffset}
                            </strong>
                        </div>

                    </section>

                </div>

            </div>


            ${renderTools()}


            <section class="prayer-settings-strip">

                <div>
                    <span class="eyebrow">
                        SETTINGS
                    </span>

                    <strong>
                        Prayer calculation and location
                    </strong>

                    <small>
                        Adjust your calculation method,
                        location and prayer offsets.
                    </small>
                </div>

                <button
                    class="secondary-button"
                    data-route="settings"
                    type="button"
                >
                    Open Prayer Settings
                </button>

            </section>

        </section>
    `;
}


export function bindPrayerPage() {
    document
        .querySelectorAll('[data-prayer-action]')
        .forEach(button => {
            button.addEventListener(
                'click',
                () => {
                    const action =
                        button.dataset.prayerAction;

                    window.dispatchEvent(
                        new CustomEvent(
                            'adhan:prayer-action',
                            {
                                detail: {
                                    action
                                }
                            }
                        )
                    );
                }
            );
        });


    bindQiblaCompass();
    updateCountdown();
}


export function bindQiblaCompass() {
    const button =
        document.querySelector(
            '[data-qibla-live]'
        );

    const card =
        document.querySelector(
            '[data-qibla-card]'
        );

    const direction =
        document.querySelector(
            '[data-qibla-direction]'
        );

    const status =
        document.querySelector(
            '[data-qibla-status]'
        );

    if (
        !button ||
        !card ||
        !direction ||
        !status
    ) {
        return;
    }

    const bearing =
        Number(
            card.dataset.qiblaBearing
        );

    let active = false;


    const updateCompass = event => {
        let heading = null;

        if (
            typeof event.webkitCompassHeading ===
            'number'
        ) {
            heading =
                event.webkitCompassHeading;
        } else if (
            typeof event.alpha ===
            'number'
        ) {
            heading =
                360 - event.alpha;
        }

        if (
            !Number.isFinite(heading)
        ) {
            return;
        }

        const rotation =
            bearing - heading;

        direction.style.setProperty(
            '--qibla-device-rotation',
            `${rotation}deg`
        );

        status.textContent =
            `Live compass · ${Math.round(heading)}° heading`;

        card.classList.add(
            'is-live'
        );
    };


    const startCompass = async () => {
        try {
            if (
                typeof DeviceOrientationEvent ===
                    'undefined'
            ) {
                status.textContent =
                    'Live compass is not supported by this browser.';

                return;
            }


            if (
                typeof DeviceOrientationEvent.requestPermission ===
                    'function'
            ) {
                const permission =
                    await DeviceOrientationEvent.requestPermission();

                if (
                    permission !==
                    'granted'
                ) {
                    status.textContent =
                        'Compass permission was not granted.';

                    return;
                }
            }


            window.addEventListener(
                'deviceorientationabsolute',
                updateCompass,
                true
            );

            window.addEventListener(
                'deviceorientation',
                updateCompass,
                true
            );

            active = true;

            button.textContent =
                'Live Compass Enabled';

            button.disabled = true;

            status.textContent =
                'Move your device to calibrate the compass.';

        } catch (error) {
            console.warn(
                '[Adhan Display] Compass could not be enabled.',
                error
            );

            status.textContent =
                'Compass access is unavailable. Use Google Qibla Finder.';
        }
    };


    button.addEventListener(
        'click',
        startCompass
    );


    direction.style.setProperty(
        '--qibla-device-rotation',
        `${bearing}deg`
    );
}


function updateCountdown() {
    const element =
        document.querySelector(
            '[data-prayer-countdown]'
        );

    if (!element) {
        return;
    }

    const next =
        state.prayer.next;

    if (!next?.time) {
        element.textContent =
            'Next prayer unavailable';

        return;
    }

    const diff =
        Math.max(
            0,
            Math.floor(
                (
                    next.time -
                    new Date()
                ) / 1000
            )
        );

    element.textContent =
        state.prayer.next?.name
            ? `Next prayer: ${state.prayer.next.name} · in ${formatCountdown(diff)}`
            : `Next prayer · in ${formatCountdown(diff)}`;


    window.clearTimeout(
        updateCountdown.timer
    );

    updateCountdown.timer =
        window.setTimeout(
            updateCountdown,
            1000
        );
}
