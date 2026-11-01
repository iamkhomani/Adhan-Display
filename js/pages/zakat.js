/*
 * Zakat calculator: a few amounts in, the zakat to pay out.
 *
 * Zakat is 2.5% of the wealth you have held for a lunar year, when it is at
 * least the nisab: the value of 85 g of gold or 595 g of silver. Gold and
 * silver prices are updated daily by a GitHub Action (scripts/update-prices.mjs)
 * and can be overridden. Everything entered stays on this device.
 */

import { esc } from '../core/util.js';
import { icon } from '../core/icons.js';
import { store } from '../core/storage.js';
import { confirmDialog } from '../core/ui.js';
import { cachedJson, fetchJson } from '../services/api.js';
import { pageHeader } from './components.js';
import { t, locale } from '../core/i18n.js';

const PRICES_REMOTE = 'https://raw.githubusercontent.com/iamkhomani/Adhan-Display/main/data/zakat-prices.json';
const PRICES_LOCAL = 'data/zakat-prices.json';
const RATE = 0.025;
const NISAB_GRAMS = { gold: 85, silver: 595 };

/* What you own (+) and what you must pay now (-). */
const FIELDS = [
    ['cash', 'wallet'],
    ['metals', 'coins'],
    ['investments', 'chart'],
    ['owed', 'hand'],
    ['business', 'grid'],
    ['debts', 'minus']
];

/* The currency list in the picker. Currencies without a daily rate need the price per gram entered by hand. */
const CURRENCIES = [
    'EUR', 'USD', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'TRY',
    'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'EGP', 'MAD', 'DZD', 'TND', 'NGN', 'ZAR',
    'INR', 'PKR', 'BDT', 'IDR', 'MYR', 'SGD', 'BRL', 'MXN', 'JPY', 'CNY', 'HKD', 'NZD', 'THB', 'PHP'
];

const REGION_CURRENCY = {
    NL: 'EUR', BE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR',
    GR: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR', HR: 'EUR',
    GB: 'GBP', US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN',
    CZ: 'CZK', HU: 'HUF', RO: 'RON', TR: 'TRY', SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
    JO: 'JOD', EG: 'EGP', MA: 'MAD', DZ: 'DZD', TN: 'TND', NG: 'NGN', ZA: 'ZAR', IN: 'INR', PK: 'PKR', BD: 'BDT',
    ID: 'IDR', MY: 'MYR', SG: 'SGD', BR: 'BRL', MX: 'MXN', JP: 'JPY', CN: 'CNY', HK: 'HKD', TH: 'THB', PH: 'PHP',
    RU: 'USD'
};

let prices = null;

function guessCurrency() {
    for (const tag of navigator.languages || [navigator.language || '']) {
        const region = String(tag).split('-')[1]?.toUpperCase();
        if (REGION_CURRENCY[region]) {
            return REGION_CURRENCY[region];
        }
    }
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return zone.startsWith('Europe/') ? 'EUR' : 'USD';
}

function state() {
    const saved = store.get('zakat', {}) || {};
    return {
        currency: CURRENCIES.includes(saved.currency) ? saved.currency : guessCurrency(),
        standard: saved.standard === 'gold' ? 'gold' : 'silver',
        values: saved.values && typeof saved.values === 'object' ? saved.values : {},
        /* Price per gram typed by the user, per currency and metal: { 'EUR:silver': 1.42 } */
        manual: saved.manual && typeof saved.manual === 'object' ? saved.manual : {}
    };
}

function save(patch) {
    store.set('zakat', { ...state(), ...patch });
}

function commaDecimal() {
    try {
        return new Intl.NumberFormat(locale()).formatToParts(1.5).find(part => part.type === 'decimal')?.value === ',';
    } catch {
        return false;
    }
}

/* Accepts "1.250,50", "1,250.50", "1250.5" and "1 250". */
export function parseAmount(raw) {
    let text = String(raw ?? '').replace(/[\s '’]/g, '');
    if (!text) {
        return 0;
    }
    const lastComma = text.lastIndexOf(',');
    const lastDot = text.lastIndexOf('.');
    if (lastComma > -1 && lastDot > -1) {
        const decimal = lastComma > lastDot ? ',' : '.';
        text = text.split(decimal === ',' ? '.' : ',').join('').replace(decimal, '.');
    } else if (lastComma > -1) {
        text = /,\d{1,2}$/.test(text) && text.split(',').length === 2 ? text.replace(',', '.') : text.split(',').join('');
    } else if (lastDot > -1 && (text.split('.').length > 2 || (commaDecimal() && /^\d{1,3}\.\d{3}$/.test(text)))) {
        /* "1.250.000", or "1.250" where a comma is the decimal separator (Dutch, German, French, ...) */
        text = text.split('.').join('');
    }
    const value = Number(text.replace(/[^\d.-]/g, ''));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function money(value, currency) {
    try {
        return new Intl.NumberFormat(locale(), { style: 'currency', currency, maximumFractionDigits: value >= 1000 ? 0 : 2 }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}

/* Price of 1 gram in the chosen currency: typed by the user, otherwise the daily price. */
function gramPrice(current) {
    const manual = Number(current.manual[`${current.currency}:${current.standard}`]);
    if (manual > 0) {
        return { value: manual, manual: true };
    }
    const usd = prices?.gramUSD?.[current.standard];
    const rate = prices?.rates?.[current.currency];
    return usd && rate ? { value: usd * rate, manual: false } : { value: 0, manual: false };
}

export function calculate(current) {
    const total = FIELDS.reduce((sum, [id]) => {
        const amount = parseAmount(current.values[id]);
        return id === 'debts' ? sum - amount : sum + amount;
    }, 0);
    const wealth = Math.max(0, total);
    const price = gramPrice(current);
    const nisab = price.value * NISAB_GRAMS[current.standard];
    const due = nisab > 0 && wealth >= nisab;

    return { wealth, nisab, price, due, zakat: due ? wealth * RATE : 0 };
}

function resultHTML(current) {
    const result = calculate(current);
    const { currency, standard } = current;

    let status;
    if (!result.nisab) {
        status = t('zakat.needPrice');
    } else if (!result.wealth) {
        status = t('zakat.start');
    } else if (result.due) {
        status = t('zakat.due');
    } else {
        status = t('zakat.below');
    }

    return `
        <p class="zakat-label">${esc(t('zakat.toPay'))}</p>
        <p class="zakat-amount tnum">${esc(money(result.zakat, currency))}</p>
        <p class="zakat-status ${result.due ? 'is-due' : ''}">${esc(status)}</p>
        <dl class="zakat-facts tnum">
            <div><dt>${esc(t('zakat.wealth'))}</dt><dd>${esc(money(result.wealth, currency))}</dd></div>
            <div><dt>${esc(t('zakat.nisab', { grams: NISAB_GRAMS[standard], metal: t(`zakat.${standard}`) }))}</dt><dd>${result.nisab ? esc(money(result.nisab, currency)) : '–'}</dd></div>
        </dl>
    `;
}

function miniHTML(current) {
    const result = calculate(current);
    return `<span>${esc(t('zakat.toPay'))}</span><strong class="tnum">${esc(money(result.zakat, current.currency))}</strong>`;
}

function priceLine(current) {
    const price = gramPrice(current);
    const metal = t(`zakat.${current.standard}`);
    if (!price.value) {
        return '';
    }
    return price.manual
        ? t('zakat.priceManual', { metal, price: money(price.value, current.currency) })
        : t('zakat.priceDaily', { metal, price: money(price.value, current.currency), date: prices?.pricesDate || '' });
}

export function zakatView(backLink) {
    const current = state();
    const currencyNames = (() => {
        try {
            return new Intl.DisplayNames([locale(), 'en'], { type: 'currency' });
        } catch {
            return null;
        }
    })();

    return `
        <div class="page tool-page zakat-page">
            ${backLink}
            ${pageHeader(t('tool.zakat'), t('zakat.lead'))}

            <div class="zakat-layout">
                <form class="panel zakat-form" data-zakat-form autocomplete="off">
                    <label class="field zakat-currency">
                        <span class="field-label">${esc(t('zakat.currency'))}</span>
                        <select class="select" data-zakat-currency>
                            ${CURRENCIES.map(code => `<option value="${code}" ${code === current.currency ? 'selected' : ''}>${code} · ${esc(currencyNames?.of(code) || code)}</option>`).join('')}
                        </select>
                    </label>

                    ${FIELDS.map(([id, iconName]) => `
                        <label class="zakat-field ${id === 'debts' ? 'is-minus' : ''}">
                            <span class="zakat-field-icon">${icon(iconName, { size: 18 })}</span>
                            <span class="zakat-field-text">
                                <span class="zakat-field-label">${esc(t(`zakat.${id}`))}</span>
                                <small>${esc(t(`zakat.${id}.hint`))}</small>
                            </span>
                            <input class="input zakat-input tnum" type="text" inputmode="decimal" placeholder="0"
                                value="${esc(current.values[id] ?? '')}" data-zakat-value="${id}" aria-label="${esc(t(`zakat.${id}`))}">
                        </label>
                    `).join('')}

                    <details class="zakat-nisab">
                        <summary>${esc(t('zakat.nisabSettings'))}</summary>
                        <p class="field-hint">${esc(t('zakat.nisabHint'))}</p>
                        <div class="segmented" role="radiogroup" aria-label="${esc(t('zakat.nisabSettings'))}">
                            ${['silver', 'gold'].map(metal => `
                                <button type="button" role="radio" class="segment ${current.standard === metal ? 'is-active' : ''}" aria-checked="${current.standard === metal}" data-zakat-standard="${metal}">
                                    ${esc(t(`zakat.${metal}`))} · ${NISAB_GRAMS[metal]} g
                                </button>
                            `).join('')}
                        </div>
                        <label class="field">
                            <span class="field-label">${esc(t('zakat.pricePerGram', { metal: t(`zakat.${current.standard}`) }))}</span>
                            <input class="input zakat-price tnum" type="text" inputmode="decimal" data-zakat-price
                                placeholder="${esc(gramPrice({ ...current, manual: {} }).value ? gramPrice({ ...current, manual: {} }).value.toFixed(2) : '')}"
                                value="${esc(current.manual[`${current.currency}:${current.standard}`] ?? '')}">
                        </label>
                        <p class="field-hint" data-zakat-price-line>${esc(priceLine(current))}</p>
                    </details>

                    <button type="button" class="link-button zakat-clear" data-zakat-clear>${icon('trash', { size: 16 })} ${esc(t('zakat.clear'))}</button>
                    <div class="zakat-mini" data-zakat-mini aria-hidden="true">${miniHTML(current)}</div>
                </form>

                <aside class="panel zakat-result" aria-live="polite" data-zakat-result>${resultHTML(current)}</aside>
            </div>

            <p class="fine-print">${esc(t('zakat.fineprint'))}</p>
        </div>
    `;
}

async function loadPrices() {
    try {
        prices = await cachedJson('zakat_prices', PRICES_REMOTE, 6, data => data);
    } catch {
        try {
            prices = await fetchJson(PRICES_LOCAL);
        } catch {
            prices = null;
        }
    }
}

export function mountZakat(root, rerender) {
    const refresh = () => {
        const current = state();
        root.querySelector('[data-zakat-result]').innerHTML = resultHTML(current);
        root.querySelector('[data-zakat-mini]').innerHTML = miniHTML(current);
        const line = root.querySelector('[data-zakat-price-line]');
        if (line) {
            line.textContent = priceLine(current);
        }
    };

    if (!prices) {
        loadPrices().then(() => rerender());
    }

    root.addEventListener('input', event => {
        const field = event.target.closest('[data-zakat-value]');
        if (field) {
            save({ values: { ...state().values, [field.dataset.zakatValue]: field.value } });
            refresh();
        } else if (event.target.matches('[data-zakat-price]')) {
            const current = state();
            const value = parseAmount(event.target.value);
            const manual = { ...current.manual };
            const key = `${current.currency}:${current.standard}`;
            if (value > 0) {
                manual[key] = value;
            } else {
                delete manual[key];
            }
            save({ manual });
            refresh();
        }
    });

    root.addEventListener('change', event => {
        if (event.target.matches('[data-zakat-currency]')) {
            save({ currency: event.target.value });
            rerender();
        }
    });

    root.addEventListener('click', async event => {
        const standard = event.target.closest('[data-zakat-standard]');
        if (standard) {
            save({ standard: standard.dataset.zakatStandard });
            rerender({ keepNisabOpen: true });
        } else if (event.target.closest('[data-zakat-clear]')) {
            if (await confirmDialog(t('zakat.clearConfirm'), { confirm: t('zakat.clear') })) {
                save({ values: {} });
                rerender();
            }
        }
    });
}
