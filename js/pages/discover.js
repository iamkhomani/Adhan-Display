import { state } from '../state.js';
import {
    DAILY_HADITHS,
    DAILY_DUAS,
    ISLAMIC_EVENTS
} from '../services/content.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function dayIndex(length) {
    if (!length) {
        return 0;
    }

    const start =
        new Date(
            new Date().getFullYear(),
            0,
            0
        );

    const diff =
        Date.now() -
        start.getTime();

    const day =
        Math.floor(
            diff / 86400000
        );

    return day % length;
}

function splitDua(value) {
    const parts =
        String(value || '').split('\n');

    return {
        text: parts[0] || '',
        meaning:
            parts
                .slice(1)
                .join(' ')
                .trim()
    };
}

function islamicToolLink(
    action,
    label,
    description
) {
    return `
        <button
            class="discover-link-card"
            type="button"
            data-discover-islamic-action="${escapeHtml(action)}"
        >
            <span class="discover-link-arrow">↗</span>

            <span>
                <strong>
                    ${escapeHtml(label)}
                </strong>

                <small>
                    ${escapeHtml(description)}
                </small>
            </span>
        </button>
    `;
}

function renderHadith() {
    const hadith =
        DAILY_HADITHS[
            dayIndex(DAILY_HADITHS.length)
        ] || ['', ''];

    return `
        <article
            class="
                discover-feature-card
                discover-hadith-card
            "
        >
            <div class="discover-card-topline">
                <span class="ad2-eyebrow">
                    HADITH
                </span>

                <span class="discover-card-index">
                    01
                </span>
            </div>

            <div class="discover-quote-mark">
                “
            </div>

            <blockquote>
                ${escapeHtml(hadith[0])}
            </blockquote>

            <footer>
                ${escapeHtml(hadith[1])}
            </footer>
        </article>
    `;
}

function renderDua() {
    const dua =
        DAILY_DUAS[
            dayIndex(DAILY_DUAS.length)
        ] || ['', ''];

    const parts =
        splitDua(dua[0]);

    return `
        <article
            class="
                discover-feature-card
                discover-dua-card
            "
        >
            <div class="discover-card-topline">
                <span class="ad2-eyebrow">
                    DUA OF THE DAY
                </span>

                <span class="discover-card-index">
                    02
                </span>
            </div>

            <p class="discover-dua-text">
                ${escapeHtml(parts.text)}
            </p>

            ${
                parts.meaning
                    ? `
                        <p class="discover-dua-meaning">
                            ${escapeHtml(
                                parts.meaning
                            )}
                        </p>
                    `
                    : ''
            }

            <footer>
                ${escapeHtml(dua[1])}
            </footer>
        </article>
    `;
}

function renderKnowledge() {
    return `
        <section class="discover-section">

            <div class="discover-section-heading">

                <div>
                    <span class="ad2-eyebrow">
                        ISLAMIC LIFE
                    </span>

                    <h2>
                        Go deeper
                    </h2>
                </div>

                <p>
                    Tools for remembrance, worship
                    and learning.
                </p>

            </div>

            <div class="discover-knowledge-grid">

                ${islamicToolLink(
                    'names',
                    '99 Names of Allah',
                    'Learn and reflect on the beautiful names.'
                )}

                ${islamicToolLink(
                    'adhkar',
                    'Adhkar',
                    'Keep daily remembrance close.'
                )}

                ${islamicToolLink(
                    'tasbih',
                    'Digital Tasbih',
                    'A focused counter for your dhikr.'
                )}

                ${islamicToolLink(
                    'qiyam',
                    'Qiyam',
                    'Make space for voluntary night prayer.'
                )}

                ${islamicToolLink(
                    'ramadan',
                    'Ramadan',
                    'Fasting, worship and reflection.'
                )}

                ${islamicToolLink(
                    'calendar',
                    'Islamic Calendar',
                    'Follow the Hijri calendar and key dates.'
                )}

            </div>
        </section>
    `;
}

function renderEvents() {
    const hijri =
        state.prayer.data?.date?.hijri;

    const currentMonth =
        Number(
            hijri?.month?.number || 0
        );

    const events =
        Array.isArray(ISLAMIC_EVENTS)
            ? ISLAMIC_EVENTS
            : [];

    return `
        <section
            class="
                discover-section
                discover-events-section
            "
        >

            <div class="discover-section-heading">

                <div>
                    <span class="ad2-eyebrow">
                        ISLAMIC CALENDAR
                    </span>

                    <h2>
                        Important occasions
                    </h2>
                </div>

                <p>
                    Key dates throughout the Hijri year.
                </p>

            </div>

            <div class="discover-events">

                ${events.map(
                    ([name, dateLabel, month]) => {

                        const isCurrent =
                            Number(month) ===
                            currentMonth;

                        return `
                            <article
                                class="
                                    discover-event
                                    ${
                                        isCurrent
                                            ? 'is-current'
                                            : ''
                                    }
                                "
                            >

                                <div>
                                    <strong>
                                        ${escapeHtml(name)}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            dateLabel
                                        )}
                                    </span>
                                </div>

                                ${
                                    isCurrent
                                        ? `
                                            <span
                                                class="
                                                    discover-event-badge
                                                "
                                            >
                                                CURRENT MONTH
                                            </span>
                                        `
                                        : ''
                                }

                            </article>
                        `;
                    }
                ).join('')}

            </div>

            <div class="discover-events-footer">

                <span>
                    Today:
                    ${
                        hijri
                            ? `${escapeHtml(
                                hijri.day
                            )} ${escapeHtml(
                                hijri.month?.en || ''
                            )} ${escapeHtml(
                                hijri.year || ''
                            )} AH`
                            : 'Hijri date loading'
                    }
                </span>

                <button
                    class="ad2-button ad2-button-secondary"
                    type="button"
                    data-discover-islamic-action="calendar"
                >
                    Open Islamic Calendar
                </button>

            </div>

        </section>
    `;
}

function renderHolySites() {
    return `
        <section class="discover-section">

            <div class="discover-section-heading">

                <div>
                    <span class="ad2-eyebrow">
                        HOLY SITES
                    </span>

                    <h2>
                        The sacred places
                    </h2>
                </div>

                <p>
                    Three places at the heart of
                    Muslim history and worship.
                </p>

            </div>

            <div class="discover-sites-grid">

                <article class="discover-site-card">
                    <span class="discover-site-number">
                        01
                    </span>

                    <span class="ad2-eyebrow">
                        MAKKAH
                    </span>

                    <h3>
                        Masjid al-Haram
                    </h3>

                    <p>
                        The Sacred Mosque surrounds
                        the Ka'bah, the direction
                        Muslims face in prayer.
                    </p>
                </article>

                <article class="discover-site-card">
                    <span class="discover-site-number">
                        02
                    </span>

                    <span class="ad2-eyebrow">
                        MADINAH
                    </span>

                    <h3>
                        Al-Masjid an-Nabawi
                    </h3>

                    <p>
                        The Prophet's Mosque is one
                        of the most important places
                        of worship in Islam.
                    </p>
                </article>

                <article class="discover-site-card">
                    <span class="discover-site-number">
                        03
                    </span>

                    <span class="ad2-eyebrow">
                        JERUSALEM
                    </span>

                    <h3>
                        Al-Masjid al-Aqsa
                    </h3>

                    <p>
                        A sacred mosque in Jerusalem
                        and an important site in
                        Islamic history.
                    </p>
                </article>

            </div>
        </section>
    `;
}



/* AD2_RAMADAN_DISCOVER_START */
const AD2_RAMADAN_DISCOVER_HTML = `
  <section class="ramadan-countdown-section" aria-labelledby="ramadan-countdown-title">

    <div class="ramadan-countdown-header">

      <span class="ramadan-countdown-eyebrow">
        RAMADAN 1448 AH
      </span>

      <h2 id="ramadan-countdown-title">
        Preparing for Ramadan
      </h2>

      <p>
        Ramadan is expected to begin on 8 February 2027,
        subject to moon sighting.
      </p>

    </div>

    <div class="ramadan-countdown-grid">

      <div class="ramadan-countdown-unit">
        <span
          id="ramadan-countdown-days"
          class="ramadan-countdown-value"
        >00</span>

        <span class="ramadan-countdown-label">
          Days
        </span>
      </div>

      <div class="ramadan-countdown-unit">
        <span
          id="ramadan-countdown-hours"
          class="ramadan-countdown-value"
        >00</span>

        <span class="ramadan-countdown-label">
          Hours
        </span>
      </div>

      <div class="ramadan-countdown-unit">
        <span
          id="ramadan-countdown-minutes"
          class="ramadan-countdown-value"
        >00</span>

        <span class="ramadan-countdown-label">
          Minutes
        </span>
      </div>

      <div class="ramadan-countdown-unit">
        <span
          id="ramadan-countdown-seconds"
          class="ramadan-countdown-value"
        >00</span>

        <span class="ramadan-countdown-label">
          Seconds
        </span>
      </div>

    </div>

    <div class="ramadan-countdown-note">
      Expected start: 8 February 2027
    </div>

  </section>
`;
/* AD2_RAMADAN_DISCOVER_END */

/* AD2_NEARBY_TOOLS_START */
const AD2_NEARBY_TOOLS_HTML = `
  <section class="ad2-nearby-section" aria-labelledby="nearby-title">

    <div class="ad2-nearby-heading">
      <span class="ad2-nearby-eyebrow">NEARBY</span>

      <h2 id="nearby-title">
        Find what you need around you
      </h2>

      <p>
        Quickly find a mosque or halal food nearby using Google Maps.
      </p>
    </div>

    <div class="ad2-nearby-grid">

      <a
        class="ad2-nearby-card"
        href="https://www.google.com/maps/search/mosques+near+me/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Find mosques near me"
      >
        <div class="ad2-nearby-icon" aria-hidden="true">
          <span>🕌</span>
        </div>

        <div class="ad2-nearby-card-content">
          <span class="ad2-nearby-card-eyebrow">
            PRAYER
          </span>

          <h3>
            Find a Mosque
          </h3>

          <p>
            Discover mosques near your current location.
          </p>
        </div>

        <span class="ad2-nearby-arrow" aria-hidden="true">
          ↗
        </span>
      </a>

      <a
        class="ad2-nearby-card"
        href="https://www.google.com/maps/search/halal+food+near+me/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Find halal food near me"
      >
        <div class="ad2-nearby-icon" aria-hidden="true">
          <span>🍽️</span>
        </div>

        <div class="ad2-nearby-card-content">
          <span class="ad2-nearby-card-eyebrow">
            FOOD
          </span>

          <h3>
            Halal Food
          </h3>

          <p>
            Find halal restaurants and food nearby.
          </p>
        </div>

        <span class="ad2-nearby-arrow" aria-hidden="true">
          ↗
        </span>
      </a>

    </div>
  </section>
`;
/* AD2_NEARBY_TOOLS_END */

/* AD2_SALAH_LEARNING_START */

const AD2_SALAH_LEARNING_HTML = [
    '<section class="salah-learning-section">',
    '  <div class="salah-learning-header">',
    '    <div class="salah-learning-eyebrow">LEARN SALAH</div>',
    '    <h2>Learn how to pray</h2>',
    '    <p>Step-by-step resources to learn and improve your Salah.</p>',
    '  </div>',

    '  <div class="salah-learning-grid">',

    '    <a class="salah-learning-item" href="https://www.myprayer.org/pages/my-prayer-book" target="_blank" rel="noopener noreferrer">',
    '      <div class="salah-learning-icon">📖</div>',
    '      <div class="salah-learning-content">',
    '        <span class="salah-learning-type">WEB</span>',
    '        <strong>My Prayer Book</strong>',
    '        <span>Learn Salah step by step in your browser.</span>',
    '      </div>',
    '      <span class="salah-learning-arrow">↗</span>',
    '    </a>',

    '    <a class="salah-learning-item" href="https://apps.apple.com/us/app/namaz-app-learn-salah-prayer/id1447056625" target="_blank" rel="noopener noreferrer">',
    '      <div class="salah-learning-icon"></div>',
    '      <div class="salah-learning-content">',
    '        <span class="salah-learning-type">IOS</span>',
    '        <strong>Namaz App</strong>',
    '        <span>Learn Salah with the Namaz App on iPhone and iPad.</span>',
    '      </div>',
    '      <span class="salah-learning-arrow">↗</span>',
    '    </a>',

    '    <a class="salah-learning-item" href="https://play.google.com/store/apps/details?id=com.nurios.namazapp" target="_blank" rel="noopener noreferrer">',
    '      <div class="salah-learning-icon">▶</div>',
    '      <div class="salah-learning-content">',
    '        <span class="salah-learning-type">ANDROID</span>',
    '        <strong>Namaz App</strong>',
    '        <span>Learn Salah with the Namaz App on Android.</span>',
    '      </div>',
    '      <span class="salah-learning-arrow">↗</span>',
    '    </a>',

    '  </div>',
    '</section>'
].join("\n");

/* AD2_SALAH_LEARNING_END */


export function renderDiscoverPage() {
    const next =
        state.prayer.next;

    const hijri =
        state.prayer.data?.date?.hijri;

    return `
        <main class="ad2-page discover-page">

            <section class="discover-hero">

                <div class="discover-hero-copy">

                    <span class="ad2-eyebrow">
                        DISCOVER
                    </span>

                    <h1>
                        Words, places and knowledge
                        that shape Islamic life.
                    </h1>

                    <p>
                        Explore the Quran, Hadith, Duas,
                        remembrance and the sacred places
                        of Islam.
                    </p>

                    <div class="discover-hero-actions">

                        <a
                            class="ad2-button"
                            href="#quran"
                        >
                            Open Quran
                        </a>

                        <a
                            class="
                                ad2-button
                                ad2-button-secondary
                            "
                            href="#islamic"
                        >
                            Explore Islamic Life
                        </a>

                    </div>

                </div>

                <aside class="discover-context">

                    <span class="ad2-eyebrow">
                        TODAY
                    </span>

                    <strong>
                        ${
                            escapeHtml(
                                hijri?.day || '--'
                            )
                        }
                        ${
                            escapeHtml(
                                hijri?.month?.en || ''
                            )
                        }
                    </strong>

                    <span>
                        ${
                            next
                                ? `Next prayer · ${escapeHtml(
                                    next.name
                                )}`
                                : 'Prayer times loading'
                        }
                    </span>

                </aside>

            </section>

            <section
                class="
                    discover-section
                    discover-content-section
                "
            >

                <div class="discover-section-heading">

                    <div>
                        <span class="ad2-eyebrow">
                            DAILY REFLECTION
                        </span>

                        <h2>
                            Take something with you today.
                        </h2>
                    </div>

                    <p>
                        A small reminder can become part
                        of a lasting practice.
                    </p>

                </div>

                <div class="discover-feature-grid">
                    ${renderHadith()}
                    ${renderDua()}
                </div>

            </section>

            <section
                class="discover-section discover-quran-strip"
            >

                <div>
                    <span class="ad2-eyebrow">
                        QURAN
                    </span>

                    <h2>
                        Keep the Quran close.
                    </h2>

                    <p>
                        Continue reading, revisit your
                        bookmarks, listen to recitation
                        or explore the Surahs.
                    </p>
                </div>

                <a
                    class="ad2-button"
                    href="#quran"
                >
                    Open Quran
                </a>

            </section>

            ${renderKnowledge()}

            ${renderEvents()}

            ${renderHolySites()}

        </main>
    

${AD2_RAMADAN_DISCOVER_HTML}

${AD2_NEARBY_TOOLS_HTML}
${AD2_SALAH_LEARNING_HTML}
`;
}

export function bindDiscoverPage() {
    document
        .querySelectorAll(
            '[data-discover-islamic-action]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const action =
                        button.dataset
                            .discoverIslamicAction;

                    if (!action) {
                        return;
                    }

                    window.dispatchEvent(
                        new CustomEvent(
                            'adhan:islamic-action',
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
}
