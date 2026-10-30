/*
 * Inline SVG icon set (24x24, stroked with currentColor).
 */

const PATHS = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11.5h13V9"/><path d="M10 20.5v-6h4v6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    book: '<path d="M12 7.5c-1.6-1.6-4.2-2.5-8.5-2.5v13c4.3 0 6.9.9 8.5 2.5 1.6-1.6 4.2-2.5 8.5-2.5V5c-4.3 0-6.9.9-8.5 2.5z"/><path d="M12 7.5v13"/>',
    scroll: '<path d="M7 20.5h11a2.5 2.5 0 0 0 2.5-2.5v-1H10v1a2.5 2.5 0 0 1-5 0V6a2.5 2.5 0 0 0-2.5-2.5"/><path d="M2.5 3.5H16A2.5 2.5 0 0 1 18.5 6v11"/><path d="M9 8.5h6M9 12h6"/>',
    crescent: '<path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z"/><path d="m17.5 3.5.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
    sliders: '<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9"/><path d="M10.2 20.5a2 2 0 0 0 3.6 0"/>',
    bellOff: '<path d="M8.7 3.9A6 6 0 0 1 18 9c0 2.6.4 4.4 1 5.6"/><path d="M17 17H3.5S6 15.5 6 9c0-.6.1-1.2.3-1.8"/><path d="M10.2 20.5a2 2 0 0 0 3.6 0"/><path d="m3 3 18 18"/>',
    pin: '<path d="M19.5 10c0 5.5-7.5 11.5-7.5 11.5S4.5 15.5 4.5 10a7.5 7.5 0 0 1 15 0z"/><circle cx="12" cy="10" r="2.5"/>',
    locate: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    play: '<path d="M8 5.2v13.6a.6.6 0 0 0 .9.5l10.6-6.8a.6.6 0 0 0 0-1L8.9 4.7a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none"/>',
    prev: '<path d="M18 5.5 9.5 12l8.5 6.5z"/><path d="M6 5.5v13"/>',
    next: '<path d="M6 5.5 14.5 12 6 18.5z"/><path d="M18 5.5v13"/>',
    repeat: '<path d="m16.5 2.5 3.5 3.5-3.5 3.5"/><path d="M4 11.5v-1A4.5 4.5 0 0 1 8.5 6H20"/><path d="M7.5 21.5 4 18l3.5-3.5"/><path d="M20 12.5v1a4.5 4.5 0 0 1-4.5 4.5H4"/>',
    bookmark: '<path d="M18.5 20.5 12 16.5l-6.5 4V5a1.5 1.5 0 0 1 1.5-1.5h10A1.5 1.5 0 0 1 18.5 5z"/>',
    bookmarkFilled: '<path d="M18.5 20.5 12 16.5l-6.5 4V5a1.5 1.5 0 0 1 1.5-1.5h10A1.5 1.5 0 0 1 18.5 5z" fill="currentColor"/>',
    share: '<circle cx="17.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="m8.7 13.3 6.6 3.9M15.3 6.8l-6.6 3.9"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    left: '<path d="m14.5 6-6 6 6 6"/>',
    right: '<path d="m9.5 6 6 6-6 6"/>',
    down: '<path d="m6 9.5 6 6 6-6"/>',
    up: '<path d="m6 14.5 6-6 6 6"/>',
    arrowUp: '<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>',
    monitor: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>',
    expand: '<path d="M8.5 3.5h-3a2 2 0 0 0-2 2v3M20.5 8.5v-3a2 2 0 0 0-2-2h-3M3.5 15.5v3a2 2 0 0 0 2 2h3M15.5 20.5h3a2 2 0 0 0 2-2v-3"/>',
    volume: '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6a8.5 8.5 0 0 1 0 12"/>',
    external: '<path d="M14.5 3.5h6v6M10 14 20.5 3.5M18 13.5v5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    refresh: '<path d="M20.5 12A8.5 8.5 0 1 1 18 6l2.5 2.5"/><path d="M20.5 3.5v5h-5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    printer: '<path d="M6.5 9V3.5h11V9"/><path d="M6.5 17.5h-2a2 2 0 0 1-2-2v-4.5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-2"/><rect x="6.5" y="14" width="11" height="6.5" rx="1"/>',
    download: '<path d="M12 3.5v12M7 10.5l5 5 5-5M4 20.5h16"/>',
    upload: '<path d="M12 15.5v-12M7 8.5l5-5 5 5M4 20.5h16"/>',
    trash: '<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20z"/>',
    navigation: '<path d="M12 2.5 18.5 20 12 16.5 5.5 20z"/>',
    sparkle: '<path d="M12 3.5c.6 4.4 2.3 6.1 6.5 6.5-4.2.4-5.9 2.1-6.5 6.5-.6-4.4-2.3-6.1-6.5-6.5 4.2-.4 5.9-2.1 6.5-6.5z"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="17.5" r=".8"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    type: '<path d="M4 7V5h16v2M12 5v14M9 19h6"/>',
    mosque: '<path d="M12 3.5c-3 2-5 4-5 6.5h10c0-2.5-2-4.5-5-6.5z"/><path d="M5 20.5V10h14v10.5"/><path d="M10 20.5V16a2 2 0 0 1 4 0v4.5"/><path d="M3 20.5h18M2.5 20.5V8.5M21.5 20.5V8.5"/>',
    food: '<path d="M6 3.5V11a2 2 0 0 0 2 2v7.5M10 3.5V11a2 2 0 0 1-2 2M8 3.5v5"/><path d="M17.5 20.5V3.5c-2 1-3.5 3-3.5 6.5v3.5h3.5"/>',
    video: '<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
    hand: '<path d="M7 11.5V6a1.5 1.5 0 0 1 3 0v4.5M10 10.5V4.5a1.5 1.5 0 0 1 3 0v6M13 10.5V5.5a1.5 1.5 0 0 1 3 0v6M16 11V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 6.5c-3.5 0-5-1.5-7-4.5l-1.5-2.5a1.5 1.5 0 0 1 2.6-1.5L7 13.5"/>'
};

export function icon(name, { size = 20, label = '', className = '' } = {}) {
    const body = PATHS[name] || PATHS.info;
    const a11y = label
        ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"`
        : 'aria-hidden="true" focusable="false"';

    return `<svg class="icon icon-${name} ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`;
}
