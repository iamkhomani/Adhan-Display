// Checks that every translation key used in the code exists in en.js, and reports
// missing/extra keys and placeholder mismatches for every other language file.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const files = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { if (entry.name !== 'i18n') walk(full); }
        else if (entry.name.endsWith('.js')) files.push(full);
    }
})(path.join(root, 'js'));

const { DUA_CATEGORIES } = await import(url.pathToFileURL(path.join(root, 'js/data/content.js')).href);
const used = new Set();
const PREFIX = '(adhkar|alert|app|backup|dua|duas|khatm|memo|calendar|common|display|error|event|hadith|hijri|home|insight|islamic|learn|location|names|nav|prayer|qada|qibla|quran|ramadan|settings|shahada|share|site|sound|tasbih|time|times|tool|tracker|asr|latitude)';
const literal = new RegExp(`['\`](${PREFIX}\\.[A-Za-z0-9.]+)['\`]`, 'g');
for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(literal)) used.add(m[1]);
}
const expand = {
    'event': ['newYear', 'ashura', 'ramadan', 'lastTen', 'eidFitr', 'dhulHijjah', 'arafah', 'eidAdha'].flatMap(id => [`event.${id}`, `event.${id}.note`]),
    'tool': ['adhkar', 'duas', 'tasbih', 'names', 'ramadan', 'calendar'].flatMap(id => [`tool.${id}`, `tool.${id}.text`]),
    'duas': DUA_CATEGORIES.flatMap(category => [`duas.cat.${category.id}`, ...category.duas.map(dua => `dua.${dua.id}`)]),
    'site': ['haram', 'nabawi', 'aqsa'].flatMap(id => [`site.${id}`, `site.${id}.city`]),
    'learn': ['book', 'ios', 'android'].flatMap(id => [`learn.${id}`, `learn.${id}.text`]),
    'hijri': Array.from({ length: 12 }, (_, i) => `hijri.${i + 1}`),
    'prayer': ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumuah'].map(n => `prayer.${n}`),
    'nav': ['home', 'prayer', 'quran', 'hadith', 'islamic', 'settings'].map(n => `nav.${n}`),
    'ramadan': ['days', 'hours', 'minutes', 'seconds'].map(n => `ramadan.${n}`),
    'settings': ['appearance', 'location', 'prayer', 'alerts', 'display', 'quran', 'data', 'about', 'notBackup', 'noBackupData'].map(n => `settings.${n}`)
};
Object.values(expand).flat().forEach(k => used.add(k));

const load = async code => (await import(url.pathToFileURL(path.join(root, 'js/i18n', `${code}.js`)).href)).default;
const en = await load('en');
let problems = 0;
const missingInEn = [...used].filter(k => !(k in en));
if (missingInEn.length) { problems++; console.log('Used but missing in en.js:', missingInEn.join(' ')); }
const unused = Object.keys(en).filter(k => !used.has(k));
if (unused.length) console.log('In en.js but not found in code (check):', unused.join(' '));

const params = v => new Set((typeof v === 'object' ? Object.values(v).join(' ') : String(v)).match(/\{\w+\}/g) || []);
const langs = fs.readdirSync(path.join(root, 'js/i18n')).filter(f => f.endsWith('.js') && f !== 'en.js').map(f => f.slice(0, -3));
for (const code of langs) {
    const dict = await load(code);
    const missing = Object.keys(en).filter(k => !(k in dict));
    const extra = Object.keys(dict).filter(k => !(k in en));
    const badParams = Object.keys(dict).filter(k => k in en && [...params(en[k])].sort().join() !== [...params(dict[k])].sort().join()
        && !(typeof en[k] === 'object' && [...params(dict[k])].every(p => params(en[k]).has(p)) ));
    const badPlural = Object.keys(dict).filter(k => typeof en[k] === 'object' && typeof dict[k] !== 'object');
    const rules = new Intl.PluralRules(code).resolvedOptions().pluralCategories;
    const missingCats = Object.keys(dict).filter(k => typeof dict[k] === 'object' && rules.some(c => !(c in dict[k]) && !('other' in dict[k])));
    if (missing.length || extra.length || badParams.length || badPlural.length || missingCats.length) problems++;
    console.log(`${code}: ${Object.keys(dict).length} keys` +
        (missing.length ? `\n  missing: ${missing.join(' ')}` : '') +
        (extra.length ? `\n  extra: ${extra.join(' ')}` : '') +
        (badParams.length ? `\n  placeholders differ: ${badParams.join(' ')}` : '') +
        (badPlural.length ? `\n  should be plural object: ${badPlural.join(' ')}` : ''));
}
console.log(problems ? `\n${problems} problem group(s)` : '\nAll translation checks passed');
process.exit(problems ? 1 : 0);
