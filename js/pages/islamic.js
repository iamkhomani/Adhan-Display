import { state } from '../state.js';
import { Storage } from '../storage.js';
import { Api } from '../services/api.js';
import { ADHKAR, DAILY_DUAS, DAILY_HADITHS, ISLAMIC_EVENTS } from '../services/content.js';

let namesCache = [];
let tasbihCount = 0;

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatTime(raw) {
    if (!raw) {
        return '--:--';
    }

    return String(raw)
        .split(' ')[0]
        .slice(0, 5);
}

function getHijri() {
    return state.prayer.data?.date?.hijri || null;
}

export function getTodayContent() {
    const start = new Date(
        new Date().getFullYear(),
        0,
        0
    );

    const diff =
        new Date() -
        start;

    const day =
        Math.floor(
            diff / 86400000
        );

    return {
        dua:
            DAILY_DUAS[
                day % DAILY_DUAS.length
            ],

        hadith:
            DAILY_HADITHS[
                day % DAILY_HADITHS.length
            ]
    };
}

export function renderIslamicPage() {
    const hijri = getHijri();
    const content = getTodayContent();

    const next = state.prayer.next;

    return `
        <section class="ad2-page islamic-page">

            <div class="islamic-hero">

                <div>
                    <span class="ad2-eyebrow">
                        ISLAMIC LIFE
                    </span>

                    <h1>
                        Worship, remembrance
                        <br>
                        and reflection.
                    </h1>

                    <p>
                        A calm space for dhikr,
                        supplication, reflection
                        and Islamic knowledge.
                    </p>
                </div>

                <div class="islamic-date-panel">

                    <span class="islamic-date-label">
                        HIJRI TODAY
                    </span>

                    <strong>
                        ${
                            hijri
                                ? escapeHtml(hijri.day)
                                : '--'
                        }
                    </strong>

                    <span>
                        ${
                            hijri
                                ? escapeHtml(hijri.month.en)
                                : 'Loading'
                        }
                        ${
                            hijri
                                ? ` ${escapeHtml(hijri.year)}`
                                : ''
                        }
                    </span>

                </div>

            </div>


            <section class="islamic-tools">

                ${renderToolCard(
                    'names',
                    '99 Names',
                    'Explore the beautiful names of Allah.',
                    'Asma ul-Husna'
                )}

                ${renderToolCard(
                    'adhkar',
                    'Adhkar',
                    'Morning and evening remembrance.',
                    'Dhikr'
                )}

                ${renderToolCard(
                    'tasbih',
                    'Digital Tasbih',
                    'Keep count of your dhikr.',
                    'Tasbih'
                )}

                ${renderToolCard(
                    'qiyam',
                    'Qiyam',
                    'Prepare for the night prayer.',
                    'Night worship'
                )}

                ${renderToolCard(
                    'ramadan',
                    'Ramadan',
                    'Fasting, Ramadan and spiritual focus.',
                    'Ramadan'
                )}

                ${renderToolCard(
                    'calendar',
                    'Islamic Calendar',
                    'Follow the Hijri calendar and key dates.',
                    'Hijri'
                )}

            </section>


            <section class="islamic-inspiration-grid">

                <article class="islamic-inspiration-card">

                    <span class="ad2-eyebrow">
                        DU'A
                    </span>

                    <h2>
                        Today's supplication
                    </h2>

                    <p class="islamic-arabic-content">
                        ${escapeHtml(
                            content.dua?.[0] || ''
                        )}
                    </p>

                    <small>
                        ${escapeHtml(
                            content.dua?.[1] || ''
                        )}
                    </small>

                </article>


                <article class="islamic-inspiration-card">

                    <span class="ad2-eyebrow">
                        HADITH
                    </span>

                    <h2>
                        Today's reminder
                    </h2>

                    <p>
                        “${escapeHtml(
                            content.hadith?.[0] || ''
                        )}”
                    </p>

                    <small>
                        ${escapeHtml(
                            content.hadith?.[1] || ''
                        )}
                    </small>

                </article>

            </section>


            <section class="islamic-prayer-context">

                <div>
                    <span class="ad2-eyebrow">
                        PRAYER
                    </span>

                    <h2>
                        Stay connected
                    </h2>

                    <p>
                        ${
                            next
                                ? `Next prayer: ${escapeHtml(next.name)} at ${formatTime(next.time)}`
                                : 'Prayer information is loading.'
                        }
                    </p>
                </div>

                <a
                    href="#prayer"
                    data-route="prayer"
                    class="ad2-button"
                >
                    Open Prayer
                </a>

            </section>

        </section>
    `;
}


function renderToolCard(
    action,
    title,
    description,
    label
) {
    return `
        <button
            class="islamic-tool-card"
            data-islamic-action="${action}"
            type="button"
        >

            <span class="islamic-tool-label">
                ${escapeHtml(label)}
            </span>

            <strong>
                ${escapeHtml(title)}
            </strong>

            <span class="islamic-tool-description">
                ${escapeHtml(description)}
            </span>

            <span class="islamic-tool-arrow">
                →
            </span>

        </button>
    `;
}


async function loadNames() {
    try {
        const result = await Api.names();

        if (result?.data?.length) {
            namesCache = result.data;
        }
    } catch (error) {
        console.warn(
            '[Adhan Display 2.0] Names could not be loaded',
            error
        );
    }
}


function renderNamesTool() {
    const total = namesCache.length;

    return `
        <section class="islamic-tool-view">

            ${toolHeader(
                '99 NAMES',
                'Names of Allah',
                'Reflect on the beautiful names and attributes of Allah.'
            )}

            <div class="names-toolbar">

                <label
                    class="names-search"
                    for="names-search"
                >
                    <span class="names-search-icon">
                        ⌕
                    </span>

                    <input
                        id="names-search"
                        type="search"
                        placeholder="Search a name..."
                        autocomplete="off"
                        spellcheck="false"
                    >
                </label>

                <span
                    class="names-count"
                    data-names-count
                >
                    ${total} names
                </span>

            </div>

            <div
                class="names-grid"
                data-names-grid
            >
                ${
                    namesCache.length
                        ? namesCache.map(
                            (name, index) =>
                                renderNameCard(
                                    name,
                                    index
                                )
                        ).join('')
                        : `
                            <div class="islamic-loading">
                                Loading the Names of Allah...
                            </div>
                        `
                }
            </div>

        </section>
    `;
}


function renderNameCard(name, index) {
    const arabic =
        name.name || '';

    const transliteration =
        name.transliteration || '';

    const meaning =
        name.en?.meaning || '';

    const searchText =
        `${arabic} ${transliteration} ${meaning}`
            .toLowerCase();

    return `
        <article
            class="name-card"
            data-name-index="${index}"
            data-name-search="${escapeHtml(searchText)}"
        >

            <span class="name-number">
                ${String(index + 1).padStart(2, '0')}
            </span>

            <div
                class="name-arabic"
                dir="rtl"
            >
                ${escapeHtml(arabic)}
            </div>

            <strong>
                ${escapeHtml(transliteration)}
            </strong>

            <p>
                ${escapeHtml(meaning)}
            </p>

        </article>
    `;
}

function renderAdhkarTool() {
    return `
        <section class="islamic-tool-view">

            ${toolHeader(
                'DHIKR',
                'Morning & Evening Adhkar',
                'Take your time with remembrance and repeat each dhikr as prescribed.'
            )}

            <div class="adhkar-list">

                ${ADHKAR.map(
                    (item, index) => `
                        <article
                            class="adhkar-card"
                            data-adhkar-index="${String(index + 1).padStart(2, '0')}"
                        >

                            <div class="adhkar-content">

                                <div
                                    class="adhkar-arabic"
                                    dir="rtl"
                                >
                                    ${escapeHtml(item[0])}
                                </div>

                                <p>
                                    ${escapeHtml(item[1])}
                                </p>

                            </div>

                            <button
                                type="button"
                                class="adhkar-count-button"
                                data-adhkar-count="${index}"
                                data-count="0"
                                data-max="${Number(item[2] || 1)}"
                            >
                                <strong>0</strong>
                                <span>
                                    / ${Number(item[2] || 1)}
                                </span>
                            </button>

                        </article>
                    `
                ).join('')}

            </div>

        </section>
    `;
}


function renderTasbihTool() {
    return `
        <section class="islamic-tool-view tasbih-view tasbih-v9">

            ${toolHeader(
                'DHIKR',
                'Digital Tasbih',
                'A simple, focused counter for your remembrance.'
            )}

            <div class="tasbih-v9-stage">

                <div class="tasbih-v9-counter">

                    <span class="ad2-eyebrow">
                        CURRENT COUNT
                    </span>

                    <strong
                        class="tasbih-v9-count"
                        data-tasbih-count
                    >
                        ${tasbihCount}
                    </strong>

                    <button
                        type="button"
                        class="tasbih-v9-tap"
                        data-tasbih-increment
                        aria-label="Increment Tasbih count"
                    >
                        <span>Tap</span>
                    </button>

                    <div class="tasbih-v9-actions">

                        <button
                            type="button"
                            class="ad2-button ad2-button-secondary"
                            data-tasbih-reset
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            class="ad2-button ad2-button-secondary"
                            data-tasbih-minus
                        >
                            − 1
                        </button>

                    </div>

                </div>

            </div>

        </section>
    `;
}


function renderQiyamTool() {
    const timings =
        state.prayer.data?.timings || {};

    const next =
        state.prayer.next;

    const midnight =
        timings.Midnight ||
        timings.Isha ||
        '--:--';

    const lastThird =
        timings.Lastthird ||
        timings.Fajr ||
        '--:--';

    const fajr =
        timings.Fajr ||
        '--:--';

    const isFajrNext =
        next?.name === 'Fajr';

    return `
        <section class="islamic-tool-view qiyam-tool">

            ${toolHeader(
                'NIGHT WORSHIP',
                'Qiyam',
                'Make space for voluntary prayer during the night.'
            )}

            <div class="qiyam-intro">

                <div class="qiyam-intro-copy">

                    <span class="ad2-eyebrow">
                        QĀYIM AL-LAYL
                    </span>

                    <h2>
                        A quiet window for worship
                    </h2>

                    <p>
                        The night offers a peaceful opportunity
                        for voluntary prayer, Quran, dhikr and du'a.
                        Use these reference times to understand
                        the night and plan your worship.
                    </p>

                </div>

                <div class="qiyam-intro-symbol">
                    <span>☾</span>
                </div>

            </div>

            <div class="qiyam-timeline">

                <div class="qiyam-timeline-line"></div>

                <article class="qiyam-stage">

                    <div class="qiyam-stage-marker"></div>

                    <div class="qiyam-stage-content">

                        <div class="qiyam-stage-heading">
                            <div>
                                <span class="ad2-eyebrow">
                                    NIGHT BEGINS
                                </span>

                                <h3>
                                    Midnight reference
                                </h3>
                            </div>

                            <strong>
                                ${formatTime(midnight)}
                            </strong>
                        </div>

                        <p>
                            A useful midpoint reference for the
                            night between Isha and Fajr.
                        </p>

                    </div>

                </article>

                <article class="qiyam-stage qiyam-stage-featured">

                    <div class="qiyam-stage-marker"></div>

                    <div class="qiyam-stage-content">

                        <div class="qiyam-stage-heading">
                            <div>
                                <span class="ad2-eyebrow">
                                    LAST THIRD
                                </span>

                                <h3>
                                    A special time for worship
                                </h3>
                            </div>

                            <strong>
                                ${formatTime(lastThird)}
                            </strong>
                        </div>

                        <p>
                            The approximate beginning of the final
                            third of the night. Many Muslims use
                            this quiet period for extra prayer,
                            Quran and sincere du'a.
                        </p>

                        <span class="qiyam-stage-note">
                            Recommended worship window
                        </span>

                    </div>

                </article>

                <article class="qiyam-stage">

                    <div class="qiyam-stage-marker"></div>

                    <div class="qiyam-stage-content">

                        <div class="qiyam-stage-heading">
                            <div>
                                <span class="ad2-eyebrow">
                                    FAJR
                                </span>

                                <h3>
                                    End of the night
                                </h3>
                            </div>

                            <strong>
                                ${formatTime(fajr)}
                            </strong>
                        </div>

                        <p>
                            Fajr marks the end of the night prayer
                            window and the beginning of the dawn prayer.
                            ${
                                isFajrNext
                                    ? ' Fajr is your next prayer.'
                                    : ''
                            }
                        </p>

                    </div>

                </article>

            </div>

            <div class="qiyam-guidance">

                <div>
                    <span class="ad2-eyebrow">
                        TONIGHT
                    </span>

                    <h3>
                        Make a little space for Allah
                    </h3>

                    <p>
                        You do not need a long routine. Even a small
                        amount of voluntary prayer, Quran or dhikr
                        can turn part of the night into a meaningful
                        moment of worship.
                    </p>
                </div>

                <div class="qiyam-guidance-times">

                    <div>
                        <span>Last third</span>
                        <strong>${formatTime(lastThird)}</strong>
                    </div>

                    <div>
                        <span>Fajr</span>
                        <strong>${formatTime(fajr)}</strong>
                    </div>

                </div>

            </div>

        </section>
    `;
}


function renderRamadanTool() {
    const hijri = getHijri();
    const timings = state.prayer.data?.timings || {};

    const isRamadan =
        Number(hijri?.month?.number) === 9;

    const day =
        Number(hijri?.day || 0);

    const fajr =
        formatTime(timings.Fajr);

    const maghrib =
        formatTime(timings.Maghrib);

    let fastingProgress = 0;

    if (isRamadan && fajr !== '--:--' && maghrib !== '--:--') {
        const now = new Date();

        const parsePrayerTime = (value) => {
            const [hours, minutes] =
                value.split(':').map(Number);

            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        };

        const start = parsePrayerTime(fajr);
        const end = parsePrayerTime(maghrib);

        if (now <= start) {
            fastingProgress = 0;
        } else if (now >= end) {
            fastingProgress = 100;
        } else {
            fastingProgress =
                ((now - start) / (end - start)) * 100;
        }
    }

    return `
        <section class="islamic-tool-view">

            ${toolHeader(
                'RAMADAN',
                'Ramadan',
                'A dedicated space for fasting, worship and reflection.'
            )}

            <div class="ramadan-tool">

                <div class="ramadan-intro">

                    <span class="ad2-eyebrow">
                        ${
                            isRamadan
                                ? 'RAMADAN TODAY'
                                : 'CURRENT STATUS'
                        }
                    </span>

                    <h2>
                        ${
                            isRamadan
                                ? `Day ${escapeHtml(day)} of Ramadan`
                                : 'Ramadan is yet to come, in sha Allah.'
                        }
                    </h2>

                    <p>
                        ${
                            isRamadan
                                ? 'May Allah accept your fasting, worship and good deeds.'
                                : hijri
                                    ? `Today is ${escapeHtml(hijri.day)} ${escapeHtml(hijri.month.en)} ${escapeHtml(hijri.year)} AH.`
                                    : 'Hijri information is loading.'
                        }
                    </p>

                </div>

                ${
                    !isRamadan
                        ? `
                            <section
                                class="ramadan-countdown-section"
                                data-ramadan-countdown
                                aria-labelledby="islamic-ramadan-countdown-title"
                            >

                                <div class="ramadan-countdown-header">

                                    <span class="ramadan-countdown-eyebrow">
                                        RAMADAN 1448 AH
                                    </span>

                                    <h2 id="islamic-ramadan-countdown-title">
                                        Preparing for Ramadan
                                    </h2>

                                    <p>
                                        Prepare your heart and your worship.
                                    </p>

                                </div>

                                <div class="ramadan-countdown-grid">

                                    <div class="ramadan-countdown-unit">
                                        <span class="ramadan-countdown-value">00</span>
                                        <span class="ramadan-countdown-label">Days</span>
                                    </div>

                                    <div class="ramadan-countdown-unit">
                                        <span class="ramadan-countdown-value">00</span>
                                        <span class="ramadan-countdown-label">Hours</span>
                                    </div>

                                    <div class="ramadan-countdown-unit">
                                        <span class="ramadan-countdown-value">00</span>
                                        <span class="ramadan-countdown-label">Minutes</span>
                                    </div>

                                    <div class="ramadan-countdown-unit">
                                        <span class="ramadan-countdown-value">00</span>
                                        <span class="ramadan-countdown-label">Seconds</span>
                                    </div>

                                </div>

                                <div class="ramadan-countdown-note">
                                    Expected start: 8 February 2027
                                </div>

                            </section>
                        `
                        : ''
                }

                ${
                    isRamadan
                        ? `
                            <div class="ramadan-progress">

                                <div class="ramadan-progress-label">
                                    <span>
                                        FASTING WINDOW
                                    </span>

                                    <strong>
                                        ${Math.round(fastingProgress)}%
                                    </strong>
                                </div>

                                <div class="ramadan-progress-track">
                                    <span
                                        style="width: ${fastingProgress}%"
                                    ></span>
                                </div>

                                <div class="ramadan-progress-times">
                                    <span>
                                        Fajr ${fajr}
                                    </span>

                                    <span>
                                        Maghrib ${maghrib}
                                    </span>
                                </div>

                            </div>
                        `
                        : ''
                }

                <div class="ramadan-times">

                    <div class="ramadan-time-card">
                        <span>
                            SUHOOR ENDS
                        </span>

                        <strong>
                            ${fajr}
                        </strong>

                        <small>
                            Fajr
                        </small>
                    </div>

                    <div class="ramadan-time-card">
                        <span>
                            IFTAR
                        </span>

                        <strong>
                            ${maghrib}
                        </strong>

                        <small>
                            Maghrib
                        </small>
                    </div>

                </div>

            </div>

        </section>
    `;
}


function renderCalendarTool() {
    const hijri = getHijri();

    const events = ISLAMIC_EVENTS;

    const currentMonth =
        Number(hijri?.month?.number || 0);

    const currentDay =
        Number(hijri?.day || 0);

    return `
        <section class="islamic-tool-view calendar-tool-page">

            ${toolHeader(
                'HIJRI',
                'Islamic Calendar',
                'Keep track of the Hijri date and important Islamic occasions.'
            )}

            <div class="calendar-tool">

                <div class="calendar-current">

                    <span class="ad2-eyebrow">
                        HIJRI TODAY
                    </span>

                    <strong>
                        ${
                            hijri?.day || '--'
                        }
                    </strong>

                    <h2>
                        ${
                            hijri?.month?.en ||
                            'Loading'
                        }
                    </h2>

                    <p>
                        ${
                            hijri?.year
                                ? `${escapeHtml(hijri.year)} AH`
                                : ''
                        }
                    </p>

                </div>

                <div class="calendar-events">

                    <div class="calendar-events-header">

                        <span class="ad2-eyebrow">
                            IMPORTANT OCCASIONS
                        </span>

                        <span>
                            Hijri dates
                        </span>

                    </div>

                    ${events.map(
                        ([name, dateLabel, eventMonth]) => {

                            const eventDay =
                                Number(
                                    String(dateLabel)
                                        .split(' ')[0]
                                );

                            const isToday =
                                eventMonth === currentMonth &&
                                eventDay === currentDay;

                            const isCurrentMonth =
                                eventMonth === currentMonth;

                            return `
                                <div
                                    class="calendar-event ${
                                        isToday
                                            ? 'is-today'
                                            : isCurrentMonth
                                                ? 'is-current'
                                                : ''
                                    }"
                                >

                                    <div class="calendar-event-main">

                                        <div class="calendar-event-title">

                                            ${
                                                isToday
                                                    ? `
                                                        <span class="calendar-event-today">
                                                            TODAY
                                                        </span>
                                                    `
                                                    : ''
                                            }

                                            <strong>
                                                ${escapeHtml(name)}
                                            </strong>

                                        </div>

                                        <span>
                                            ${escapeHtml(dateLabel)}
                                        </span>

                                    </div>

                                    ${
                                        isToday
                                            ? `
                                                <div class="calendar-event-status">
                                                    <strong>
                                                        Today
                                                    </strong>

                                                    <span>
                                                        This occasion falls today
                                                    </span>
                                                </div>
                                            `
                                            : isCurrentMonth
                                                ? `
                                                    <span class="calendar-event-badge">
                                                        CURRENT MONTH
                                                    </span>
                                                `
                                                : ''
                                    }

                                </div>
                            `;
                        }
                    ).join('')}

                </div>

            </div>

            ${
                events.some(
                    ([, dateLabel, eventMonth]) =>
                        eventMonth === currentMonth &&
                        Number(String(dateLabel).split(' ')[0]) === currentDay
                )
                    ? `
                        <div class="calendar-today-message">

                            <span class="ad2-eyebrow">
                                TODAY
                            </span>

                            <strong>
                                ${
                                    events.find(
                                        ([, dateLabel, eventMonth]) =>
                                            eventMonth === currentMonth &&
                                            Number(String(dateLabel).split(' ')[0]) === currentDay
                                    )?.[0]
                                }
                            </strong>

                            <span>
                                ${
                                    hijri?.day || ''
                                }
                                ${
                                    hijri?.month?.en || ''
                                }
                                ${
                                    hijri?.year
                                        ? `${escapeHtml(hijri.year)} AH`
                                        : ''
                                }
                            </span>

                        </div>
                    `
                    : ''
            }

        </section>
    `;
}


function toolHeader(
    eyebrow,
    title,
    description
) {
    return `
        <div class="islamic-tool-header">

            <div>
                <span class="ad2-eyebrow">
                    ${escapeHtml(eyebrow)}
                </span>

                <h2>
                    ${escapeHtml(title)}
                </h2>

                <p>
                    ${escapeHtml(description)}
                </p>
            </div>

            <button
                type="button"
                class="ad2-button ad2-button-secondary"
                data-islamic-tool-close
            >
                Back to Islamic
            </button>

        </div>
    `;
}


export function renderIslamicTool(action) {
    switch (action) {

        case 'names':
            return renderNamesTool();

        case 'adhkar':
            return renderAdhkarTool();

        case 'tasbih':
            return renderTasbihTool();

        case 'qiyam':
            return renderQiyamTool();

        case 'ramadan':
            return renderRamadanTool();

        case 'calendar':
            return renderCalendarTool();

        default:
            return null;
    }
}


export async function prepareIslamicTool(action) {
    if (action === 'names') {
        await loadNames();
    }
}


function bindNamesSearch() {
    const input =
        document.querySelector('#names-search');

    const grid =
        document.querySelector('[data-names-grid]');

    const count =
        document.querySelector('[data-names-count]');

    if (!input || !grid) {
        return;
    }

    input.addEventListener('input', () => {
        const query =
            input.value
                .trim()
                .toLowerCase();

        const cards =
            [...grid.querySelectorAll('.name-card')];

        let visible = 0;

        cards.forEach((card) => {
            const haystack =
                card.dataset.nameSearch || '';

            const matches =
                !query ||
                haystack.includes(query);

            card.hidden = !matches;

            if (matches) {
                visible += 1;
            }
        });

        if (count) {
            count.textContent =
                query
                    ? `${visible} of ${cards.length} names`
                    : `${cards.length} names`;
        }
    });
}


export function bindIslamicPage() {

    bindNamesSearch();

    document
        .querySelectorAll('[data-islamic-action]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    window.dispatchEvent(
                        new CustomEvent(
                            'adhan:islamic-action',
                            {
                                detail: {
                                    action:
                                        button.dataset
                                            .islamicAction
                                }
                            }
                        )
                    );

                }
            );

        });


    document
        .querySelectorAll('[data-islamic-tool-close]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    window.dispatchEvent(
                        new CustomEvent(
                            'adhan:islamic-tool-close'
                        )
                    );

                }
            );

        });


    document
        .querySelectorAll('[data-adhkar-count]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const max =
                        Number(
                            button.dataset.max || 1
                        );

                    const current =
                        Math.min(
                            max,
                            Number(
                                button.dataset.count ||
                                0
                            ) + 1
                        );

                    button.dataset.count =
                        String(current);

                    button.innerHTML = `
                        <strong>${current}</strong>
                        <span>/ ${max}</span>
                    `;

                    if (current >= max) {
                        button.classList.add(
                            'is-complete'
                        );
                    }

                    navigator.vibrate?.(40);

                }
            );

        });


    const increment =
        document.querySelector(
            '[data-tasbih-increment]'
        );

    increment?.addEventListener(
        'click',
        () => {

            tasbihCount++;

            updateTasbih();

            if (tasbihCount % 33 === 0) {
                navigator.vibrate?.(80);
            }

        }
    );


    document
        .querySelector(
            '[data-tasbih-reset]'
        )
        ?.addEventListener(
            'click',
            () => {

                tasbihCount = 0;

                updateTasbih();

            }
        );


    document
        .querySelector(
            '[data-tasbih-minus]'
        )
        ?.addEventListener(
            'click',
            () => {

                tasbihCount =
                    Math.max(
                        0,
                        tasbihCount - 1
                    );

                updateTasbih();

            }
        );

}


function updateTasbih() {

    const element =
        document.querySelector(
            '[data-tasbih-count]'
        );

    if (element) {
        element.textContent =
            String(tasbihCount);
    }

}
