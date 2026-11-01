/*
 * Daily gold and silver prices for the zakat calculator.
 *
 * Runs on GitHub Actions (.github/workflows/prices.yml) and writes data/zakat-prices.json:
 *   gramUSD: price of 1 gram of gold and silver in US dollars (gold-api.com)
 *   rates:   1 USD in other currencies (European Central Bank rates via frankfurter.dev,
 *            plus the fixed rates of currencies pegged to the dollar)
 * If a source fails, the previous values are kept.
 *
 * Usage: node scripts/update-prices.mjs [--dry]
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'data/zakat-prices.json');
const DRY = process.argv.includes('--dry');
const TROY_OUNCE_GRAMS = 31.1034768;

/* Currencies with a fixed exchange rate to the US dollar. */
const PEGGED = { SAR: 3.75, AED: 3.6725, QAR: 3.64, BHD: 0.376, OMR: 0.3845, JOD: 0.709 };

async function json(target) {
    const response = await fetch(target, { headers: { Accept: 'application/json', 'User-Agent': 'adhandisplay.com price update' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
        throw new Error(`${target}: HTTP ${response.status}`);
    }
    return response.json();
}

const before = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, 'utf8')) : {};
const next = { ...before, gramUSD: { ...(before.gramUSD || {}) }, rates: { ...(before.rates || {}) } };

try {
    const [gold, silver] = await Promise.all([json('https://api.gold-api.com/price/XAU'), json('https://api.gold-api.com/price/XAG')]);
    if (!(gold.price > 0) || !(silver.price > 0)) {
        throw new Error('missing price');
    }
    next.gramUSD = {
        gold: Math.round((gold.price / TROY_OUNCE_GRAMS) * 10000) / 10000,
        silver: Math.round((silver.price / TROY_OUNCE_GRAMS) * 10000) / 10000
    };
    next.pricesDate = (gold.updatedAt || new Date().toISOString()).slice(0, 10);
    console.log('metals', next.gramUSD);
} catch (error) {
    console.log('metal prices failed, keeping previous:', error.message);
}

try {
    const fx = await json('https://api.frankfurter.dev/v1/latest?base=USD');
    next.rates = { USD: 1, ...fx.rates, ...PEGGED };
    next.ratesDate = fx.date;
    console.log('rates', Object.keys(next.rates).length);
} catch (error) {
    console.log('exchange rates failed, keeping previous:', error.message);
}

const changed = JSON.stringify(next) !== JSON.stringify(before);

if (!DRY && changed && next.gramUSD.gold) {
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, `${JSON.stringify(next, null, 2)}\n`);
    console.log('data/zakat-prices.json updated');
} else {
    console.log(changed ? 'changed (dry run or no prices)' : 'no change');
}
