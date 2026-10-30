/*
 * Today's prayer times as a shareable image (1080 x 1350, fits WhatsApp and
 * Instagram). Uses the share sheet when the browser can share files,
 * otherwise the PNG is downloaded.
 */

import { getSettings } from '../core/storage.js';
import { formatGregorian, formatHMText } from '../core/time.js';
import { t, isRtl } from '../core/i18n.js';
import { prayerState } from './prayer.js';
import { location } from './location.js';
import { downloadBlob } from './backup.js';
import { hijriText } from '../pages/components.js';

const W = 1080;
const H = 1350;
const COLORS = {
    bg: '#14110d',
    panel: '#1d1913',
    line: 'rgba(227, 191, 104, 0.16)',
    gold: '#e3bf68',
    goldSoft: 'rgba(227, 191, 104, 0.12)',
    text: '#f3ead8',
    muted: '#9b8f79'
};

let logo = null;

function loadLogo() {
    if (!logo) {
        logo = new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = 'images/icons/logo-96.png';
        });
    }
    return logo;
}

function fontStack(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

/* Shrinks the font until the text fits in maxWidth. */
function fitText(ctx, text, weight, size, family, maxWidth) {
    let current = size;
    ctx.font = `${weight} ${current}px ${family}`;
    while (current > 20 && ctx.measureText(text).width > maxWidth) {
        current -= 2;
        ctx.font = `${weight} ${current}px ${family}`;
    }
}

export async function renderPrayerTimesImage() {
    const today = prayerState.today;

    if (!today) {
        throw new Error(t('home.loading'));
    }

    const ui = fontStack('--font-ui', 'sans-serif');
    const display = fontStack('--font-display', 'serif');
    await Promise.all([
        document.fonts?.load(`600 40px ${ui}`),
        document.fonts?.load(`300 40px ${ui}`),
        document.fonts?.load(`400 40px ${display}`)
    ].filter(Boolean)).catch(() => {});

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const rtl = isRtl();
    const pad = 96;
    const start = rtl ? W - pad : pad;
    const end = rtl ? pad : W - pad;
    const alignStart = rtl ? 'right' : 'left';
    const alignEnd = rtl ? 'left' : 'right';
    ctx.direction = rtl ? 'rtl' : 'ltr';

    /* Background with a soft glow */
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 760);
    glow.addColorStop(0, 'rgba(227, 191, 104, 0.18)');
    glow.addColorStop(1, 'rgba(227, 191, 104, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    /* Brand */
    const image = await loadLogo();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    if (image) {
        ctx.drawImage(image, W / 2 - 40, 84, 80, 80);
    }
    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 30px ${ui}`;
    ctx.fillText('Adhan Display', W / 2, 200);

    /* Place and dates */
    const loc = location.get();
    ctx.fillStyle = COLORS.text;
    fitText(ctx, loc.city, 400, 76, display, W - pad * 2);
    ctx.fillText(loc.city, W / 2, 292);

    ctx.fillStyle = COLORS.gold;
    ctx.font = `600 32px ${ui}`;
    const dateLine = `${formatGregorian(today.key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
    fitText(ctx, dateLine, 600, 32, ui, W - pad * 2);
    ctx.fillText(dateLine, W / 2, 370);
    ctx.fillStyle = COLORS.muted;
    const hijri = hijriText(today.hijri);
    fitText(ctx, hijri, 600, 30, ui, W - pad * 2);
    ctx.fillText(hijri, W / 2, 418);

    /* Prayer rows */
    const format = getSettings().timeFormat;
    const top = 486;
    const rowHeight = 112;
    const entries = today.entries;

    roundRect(ctx, pad - 32, top - 16, W - (pad - 32) * 2, rowHeight * entries.length + 32, 36);
    ctx.fillStyle = COLORS.panel;
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.stroke();

    entries.forEach((entry, index) => {
        const y = top + index * rowHeight + rowHeight / 2;

        if (entry.isNext) {
            roundRect(ctx, pad - 16, y - rowHeight / 2 + 8, W - (pad - 16) * 2, rowHeight - 16, 26);
            ctx.fillStyle = COLORS.goldSoft;
            ctx.fill();
        } else if (index > 0 && !entries[index - 1].isNext) {
            ctx.fillStyle = COLORS.line;
            ctx.fillRect(pad, y - rowHeight / 2, W - pad * 2, 2);
        }

        const name = entry.isTomorrow ? t('display.tomorrow', { prayer: entry.label }) : entry.label;
        ctx.textAlign = alignStart;
        ctx.fillStyle = entry.isNext ? COLORS.gold : entry.name === 'Sunrise' ? COLORS.muted : COLORS.text;
        fitText(ctx, name, 600, 44, ui, W / 2 - pad);
        ctx.fillText(name, start + (rtl ? -8 : 8), y);

        ctx.textAlign = alignEnd;
        ctx.font = `300 60px ${ui}`;
        ctx.fillText(formatHMText(entry.hm, format), end + (rtl ? 8 : -8), y + 2);
    });

    /* Footer */
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.gold;
    ctx.font = `700 32px ${ui}`;
    ctx.fillText('adhandisplay.com', W / 2, H - 92);

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
    });
}

/* Returns 'shared', 'downloaded' or 'cancelled'. */
export async function sharePrayerTimesImage() {
    const blob = await renderPrayerTimesImage();
    const city = location.get().city.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'prayer-times';
    const filename = `adhan-display-${city}-${prayerState.today.key}.png`;
    const file = typeof File === 'function' ? new File([blob], filename, { type: 'image/png' }) : null;

    if (file && navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: t('share.imageTitle', { place: location.get().city }) });
            return 'shared';
        } catch (error) {
            if (error?.name === 'AbortError') {
                return 'cancelled';
            }
        }
    }

    downloadBlob(blob, filename);
    return 'downloaded';
}

/* Loads the logo early so the share sheet opens without delay. */
export function preloadShareImage() {
    loadLogo();
}
