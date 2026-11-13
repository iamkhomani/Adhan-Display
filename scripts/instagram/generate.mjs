// Weekly content top-up for the Instagram queue (social/content.json), using Gemini.
//
// Safety rules (do not relax):
// - Qur'an: Gemini only proposes REFERENCES. The text is always fetched verbatim at post time.
// - Hadith: only Sahih al-Bukhari. The source text (Arabic + English) comes from the hadith-api
//   dataset; Gemini only writes a short, faithful English rendering of the Prophet's words,
//   and a second Gemini call must confirm it is faithful. Anything doubtful is dropped.
// - Stories are never generated.
//
//   node scripts/instagram/generate.mjs           -> adds items to social/content.json
//   DRY_RUN=1 node scripts/instagram/generate.mjs -> prints what would be added
//
// Env: GEMINI_API_KEY (required), GEMINI_MODEL (default gemini-3.6-flash),
//      ADD_QURAN (default 8), ADD_HADITH (default 6)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONTENT = path.join(ROOT, 'social/content.json');
const MODELS = [...new Set([process.env.GEMINI_MODEL || 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'])];
const ADD_QURAN = Number(process.env.ADD_QURAN || 8);
const ADD_HADITH = Number(process.env.ADD_HADITH || 6);
const BUKHARI_MAX = 7563;
const HADITH_API = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

// ---------- helpers ----------
async function fetchJson(url, opts = {}, tries = 3) {
    for (let i = 1; ; i++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(30000), ...opts, headers: { 'User-Agent': 'AdhanDisplay-Instagram/1.0', ...(opts.headers || {}) } });
            if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.replace(/key=[^&]+/, 'key=***')}`);
            return await res.json();
        } catch (err) {
            if (i >= tries) throw err;
            await new Promise((r) => setTimeout(r, 1500 * i));
        }
    }
}

export async function gemini(prompt) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not set');
    let lastErr;
    // Each model gets a few attempts with growing pauses (503/429 are usually short overloads).
    for (const model of MODELS) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
                    method: 'POST',
                    signal: AbortSignal.timeout(90000),
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
                    })
                });
                if (res.status === 429 || res.status >= 500) throw Object.assign(new Error(`HTTP ${res.status}`), { retry: true });
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
                return JSON.parse(text);
            } catch (err) {
                lastErr = err;
                console.warn(`Gemini ${model} attempt ${attempt} failed: ${err.message}`);
                if (!err.retry && err.name !== 'TimeoutError') break;
                await new Promise((r) => setTimeout(r, 10000 * attempt));
            }
        }
    }
    throw lastErr;
}

export function parseRef(ref) {
    const m = /^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/.exec(String(ref || '').trim());
    if (!m) return null;
    const surah = +m[1], from = +m[2], to = m[3] ? +m[3] : +m[2];
    if (surah < 1 || surah > 114 || from < 1 || to < from || to - from > 2) return null;
    return { surah, from, to, ref: from === to ? `${surah}:${from}` : `${surah}:${from}-${to}` };
}

const overlaps = (a, b) => a.surah === b.surah && a.from <= b.to && b.from <= a.to;

// ---------- Qur'an ----------
async function verseLength(r) {
    let words = 0;
    for (let a = r.from; a <= r.to; a++) {
        const d = await fetchJson(`https://api.alquran.cloud/v1/ayah/${r.surah}:${a}/en.pickthall`);
        if (Number(d?.data?.surah?.number) !== r.surah || Number(d?.data?.numberInSurah) !== a) throw new Error(`Bad ayah ${r.surah}:${a}`);
        words += String(d.data.text).split(/\s+/).length;
    }
    return words;
}

export async function newQuranItems(items, count) {
    const taken = items.filter((i) => i.ref).map((i) => parseRef(i.ref)).filter(Boolean);
    const prompt = `You help a Muslim app choose short Qur'an passages for daily Instagram reminders.
Propose 30 passages of 1 to 3 consecutive ayat that are uplifting, general and understandable without context
(themes such as mercy, patience, gratitude, prayer, trust in Allah, good character, remembrance, hope, family, justice).
Avoid passages about war, punishments, legal rulings or specific historical events that need explanation.
Do not use any of these references: ${taken.map((t) => t.ref).join(', ') || 'none'}.
Return JSON only: an array of objects {"ref": "surah:ayah" or "surah:from-to", "theme": "two or three words"}.`;
    const proposals = await gemini(prompt);
    if (!Array.isArray(proposals)) throw new Error('Gemini returned no list of references');
    const out = [];
    for (const p of proposals) {
        if (out.length >= count) break;
        const r = parseRef(p?.ref);
        if (!r || taken.some((t) => overlaps(t, r)) || out.some((o) => overlaps(parseRef(o.ref), r))) continue;
        try {
            const words = await verseLength(r);
            if (words > 75) continue;
        } catch (err) {
            console.warn(`Skipping ${r.ref}: ${err.message}`);
            continue;
        }
        out.push({ id: `q-${r.ref.replace(/[:]/g, '-')}`, type: 'quran', ref: r.ref, theme: String(p.theme || '').slice(0, 40), approved: true, origin: 'gemini', added: today() });
    }
    return out;
}

// ---------- Hadith (Sahih al-Bukhari only) ----------
async function bukhari(n) {
    const [en, ar] = await Promise.all([
        fetchJson(`${HADITH_API}/eng-bukhari/${n}.json`), fetchJson(`${HADITH_API}/ara-bukhari/${n}.json`)
    ]);
    const e = en?.hadiths?.[0], a = ar?.hadiths?.[0];
    if (!e || !a || Number(e.hadithnumber) !== n || Number(a.hadithnumber) !== n) throw new Error(`Bukhari ${n} not found`);
    return { number: n, english: String(e.text || '').trim(), arabic: String(a.text || '').trim() };
}

export const shortQuote = (h) => h.english.length >= 50 && h.english.length <= 500 && /(Prophet|Messenger)/i.test(h.english) && /\bsaid\b|\bsays\b/i.test(h.english);

export async function newHadithItems(items, count) {
    const used = new Set(items.filter((i) => i.type === 'hadith').flatMap((i) => (String(i.source || '').match(/Bukhari (\d+)/g) || []).map((s) => +s.split(' ')[1])));
    // sample random numbers in parallel batches until there are enough short candidates
    const candidates = [];
    const tried = new Set();
    for (let round = 0; candidates.length < 40 && round < 15; round++) {
        const batch = [];
        while (batch.length < 25) {
            const n = 1 + Math.floor(Math.random() * BUKHARI_MAX);
            if (!used.has(n) && !tried.has(n)) { tried.add(n); batch.push(n); }
        }
        const res = await Promise.allSettled(batch.map((n) => bukhari(n)));
        for (const r of res) if (r.status === 'fulfilled' && shortQuote(r.value)) candidates.push(r.value);
    }
    console.log(`Hadith candidates: ${candidates.length} from ${tried.size} sampled`);
    if (!candidates.length) return [];

    const pick = await gemini(`You prepare authentic hadith for a Muslim app's daily Instagram reminder.
Below are hadith from Sahih al-Bukhari with the Arabic text and a reference English translation.
Choose the ones that are a clear, general, uplifting teaching of the Prophet ﷺ that needs no extra context
(skip anything that is a legal ruling, prohibition, punishment, oath, ritual detail, battle, or unclear or sensitive topic;
prefer teachings about kindness, character, mercy, worship, gratitude, patience and hope).
For each chosen hadith write a short, faithful modern English rendering of ONLY the Prophet's own words.
Do not add, explain, soften or summarise meaning that is not in the Arabic. Keep it under 220 characters.
Also give the companion who narrated it, as named in the source.
Return JSON only: an array of {"number": <hadith number>, "narrator": "...", "text": "..."}. Return at most ${count + 4}.

${candidates.map((c) => `#${c.number}\nARABIC: ${c.arabic}\nENGLISH: ${c.english}`).join('\n\n')}`);
    if (!Array.isArray(pick)) return [];

    const prepared = [];
    for (const p of pick) {
        const c = candidates.find((x) => x.number === Number(p?.number));
        const text = String(p?.text || '').trim().replace(/^["“]|["”]$/g, '');
        const narrator = String(p?.narrator || '').trim();
        if (!c || text.length < 15 || text.length > 230 || !narrator || narrator.length > 40) continue;
        // narrator must appear in the source (first word of the name, e.g. "Abu", "Aisha")
        const key = narrator.replace(/^(Abu|Ibn|Umm)\s+/i, '').split(/\s+/)[0].toLowerCase().slice(0, 5);
        if (!c.english.toLowerCase().includes(key)) continue;
        if (prepared.some((x) => x.c.number === c.number)) continue;
        prepared.push({ c, text, narrator });
    }
    // Checked one by one: the free Gemini tier rejects bursts (HTTP 429).
    const out = [];
    for (const { c, text, narrator } of prepared) {
        if (out.length >= count) break;
        let check = null;
        try {
            check = await gemini(`Review a short English rendering of a hadith for a gentle daily Instagram reminder.
ARABIC: ${c.arabic}
REFERENCE ENGLISH: ${c.english}
RENDERING: ${text}
Answer JSON only: {"faithful": true|false, "suitable": true|false, "reason": "..."}.
"faithful" is true only if the rendering contains nothing that is not in the Prophet's words in the source and does not change their meaning.
"suitable" is true only if it is an uplifting, general teaching about faith, character, kindness, worship or hope.
It must be false for legal rulings, prohibitions, punishments, oaths, war, ritual details, or anything that needs context.`);
        } catch (err) {
            console.warn(`Check failed for Bukhari ${c.number}: ${err.message}`);
        }
        if (check?.faithful !== true || check?.suitable !== true) { console.warn(`Dropped Bukhari ${c.number}: ${check?.reason || 'check failed'}`); continue; }
        out.push({ id: `h-bukhari-${c.number}`, type: 'hadith', text, narrator, source: `Sahih al-Bukhari ${c.number}`, grade: 'Sahih', approved: true, origin: 'gemini', added: today() });
        await new Promise((r) => setTimeout(r, 4000));
    }
    return out;
}

const today = () => new Date().toISOString().slice(0, 10);

// ---------- main ----------
async function main() {
    const content = JSON.parse(await readFile(CONTENT, 'utf8'));
    // A Gemini outage must never break the posting itself: skip the part that fails.
    const q = await newQuranItems(content.items, ADD_QURAN).catch((err) => { console.warn(`::warning::Qur'an top-up skipped: ${err.message}`); return []; });
    const h = await newHadithItems(content.items, ADD_HADITH).catch((err) => { console.warn(`::warning::Hadith top-up skipped: ${err.message}`); return []; });
    const ids = new Set(content.items.map((i) => i.id));
    const added = [...q, ...h].filter((i) => !ids.has(i.id));
    console.log(`New items: ${added.length} (${q.length} Qur'an, ${h.length} hadith)`);
    for (const i of added) console.log(`- ${i.id}: ${i.ref || `${i.text} (${i.source})`}`);
    if (process.env.DRY_RUN || !added.length) return;
    content.items.push(...added);
    await writeFile(CONTENT, JSON.stringify(content, null, 2) + '\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((err) => { console.error(err.message || err); process.exit(1); });
}
