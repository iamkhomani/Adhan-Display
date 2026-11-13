// Daily Instagram post for @adhandisplay.
//
//   node scripts/instagram/post.mjs render            -> out/instagram/post.jpg + caption.txt + meta.json
//   node scripts/instagram/post.mjs publish <imageUrl> -> publishes the rendered post, updates social/state.json
//   node scripts/instagram/post.mjs preview <id...>    -> renders the given item ids (or all approved) into out/instagram/preview/
//
// Env: IG_USER_ID, IG_ACCESS_TOKEN (publish only), FIXTURE=1 (offline layout test, never published).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'out/instagram');
const CONTENT = path.join(ROOT, 'social/content.json');
const STATE = path.join(ROOT, 'social/state.json');
const GRAPH = 'https://graph.instagram.com/v23.0';
const ROTATION = ['quran', 'hadith', 'quran', 'story', 'quran', 'hadith'];
const HASHTAGS = {
    quran: '#Quran #QuranVerses #Islam #Muslim #Allah #Deen #IslamicReminders #AdhanDisplay',
    hadith: '#Hadith #Sunnah #ProphetMuhammad #Islam #Muslim #IslamicReminders #AdhanDisplay',
    story: '#QuranStories #Prophets #Quran #Islam #Muslim #IslamicReminders #AdhanDisplay'
};

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- choosing the next item ----------
export function pickNext(items, state) {
    const approved = items.filter((i) => i.approved === true);
    if (!approved.length) throw new Error('No approved items in social/content.json');
    const byType = {};
    for (const it of approved) (byType[it.type] ||= []).push(it);
    const slot = state.next || 0;
    for (let k = 0; k < ROTATION.length; k++) {
        const type = ROTATION[(slot + k) % ROTATION.length];
        const list = byType[type];
        if (!list) continue;
        // least recently posted item of this type (never posted first, then oldest)
        const last = new Map((state.posted || []).map((p, idx) => [p.id, idx]));
        const pick = [...list].sort((a, b) => (last.has(a.id) ? last.get(a.id) : -1) - (last.has(b.id) ? last.get(b.id) : -1)
            || list.indexOf(a) - list.indexOf(b))[0];
        return { item: pick, nextSlot: (slot + k + 1) % ROTATION.length };
    }
    throw new Error('No item found');
}

// ---------- Qur'an text (verbatim from api.alquran.cloud) ----------
function parseRef(ref) {
    const m = /^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/.exec(ref || '');
    if (!m) throw new Error(`Bad Qur'an reference: ${ref}`);
    const surah = +m[1], from = +m[2], to = m[3] ? +m[3] : +m[2];
    if (surah < 1 || surah > 114 || from < 1 || to < from || to - from > 5) throw new Error(`Bad Qur'an reference: ${ref}`);
    return { surah, from, to };
}

async function fetchJson(url, tries = 3) {
    for (let i = 1; ; i++) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'AdhanDisplay-Instagram/1.0' } });
            if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
            return await res.json();
        } catch (err) {
            if (i >= tries) throw err;
            await new Promise((r) => setTimeout(r, 2000 * i));
        }
    }
}

const BISMILLAH = /^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/;

export async function fetchVerses(ref) {
    const { surah, from, to } = parseRef(ref);
    if (process.env.FIXTURE) {
        return { surahName: 'Fixture', ref, arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', english: 'Layout test text. This is not a real translation and is never published.' };
    }
    const ar = [], en = [];
    let surahName = '';
    for (let a = from; a <= to; a++) {
        const data = await fetchJson(`https://api.alquran.cloud/v1/ayah/${surah}:${a}/editions/quran-uthmani,en.pickthall`);
        const [arabic, english] = data?.data || [];
        if (!arabic?.text || !english?.text || arabic.edition?.identifier !== 'quran-uthmani' || english.edition?.identifier !== 'en.pickthall'
            || Number(arabic.surah?.number) !== surah || Number(arabic.numberInSurah) !== a) {
            throw new Error(`Unexpected API answer for ${surah}:${a}`);
        }
        let text = String(arabic.text);
        if (a === 1 && surah !== 1 && surah !== 9) text = text.replace(BISMILLAH, '');
        ar.push(`${text} ﴿${toArabicDigits(a)}﴾`);
        en.push(String(english.text).trim());
        surahName = String(arabic.surah?.englishName || '');
    }
    return { surahName, ref, arabic: ar.join(' '), english: en.join(' ') };
}

const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

// ---------- post data + caption ----------
export async function buildPost(item) {
    if (item.type === 'quran') {
        const v = await fetchVerses(item.ref);
        return {
            item, label: "Qur'an", arabic: v.arabic, text: v.english,
            source: `Qur'an ${v.ref} · ${v.surahName}`,
            caption: [`“${v.english}”`, '', `— Qur'an ${v.ref} (${v.surahName}), translation by M. Pickthall`]
        };
    }
    if (item.type === 'hadith') {
        if (!item.text || !item.source || item.grade !== 'Sahih') throw new Error(`Hadith ${item.id} needs text, source and grade Sahih`);
        return {
            item, label: 'Hadith', text: item.text,
            intro: 'The Prophet ﷺ said:',
            source: item.source, narrator: item.narrator,
            caption: [`The Prophet ﷺ said: “${item.text}”`, '', `— ${item.source}${item.narrator ? `, narrated by ${item.narrator}` : ''}`]
        };
    }
    if (item.type === 'story') {
        const v = await fetchVerses(item.ref);
        return {
            item, label: "Stories of the Qur'an", title: item.title, text: item.text, verse: v.english,
            source: `Qur'an ${v.ref} · ${v.surahName}`,
            caption: [item.title, '', item.text, '', `“${v.english}”`, `— Qur'an ${v.ref} (${v.surahName}), translation by M. Pickthall`]
        };
    }
    throw new Error(`Unknown type ${item.type}`);
}

export function captionFor(post) {
    return [...post.caption, '', 'Prayer times, Qibla and the Qur\'an in one place: adhandisplay.com (link in bio)', '', HASHTAGS[post.item.type]].join('\n').slice(0, 2200);
}

// ---------- rendering ----------
async function dataUri(file, mime) {
    return `data:${mime};base64,${(await readFile(path.join(ROOT, file))).toString('base64')}`;
}

async function html(post) {
    const [marcellus, manrope, amiri, logo] = await Promise.all([
        dataUri('fonts/marcellus.woff2', 'font/woff2'), dataUri('fonts/manrope.woff2', 'font/woff2'),
        dataUri('fonts/amiri-quran.woff2', 'font/woff2'), dataUri('images/icons/logo-96.png', 'image/png')
    ]);
    const body = post.item.type === 'quran'
        ? `<p class="ar" dir="rtl" lang="ar">${esc(post.arabic)}</p><p class="q">“${esc(post.text)}”</p>`
        : post.item.type === 'hadith'
            ? `<p class="intro">${esc(post.intro)}</p><p class="q${post.text.length < 90 ? ' big' : ''}">“${esc(post.text)}”</p>${post.narrator ? `<p class="by">Narrated by ${esc(post.narrator)}</p>` : ''}`
            : `<h1>${esc(post.title)}</h1><p class="story">${esc(post.text)}</p><p class="q small">“${esc(post.verse)}”</p>`;
    return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Marcellus;src:url(${marcellus})}
@font-face{font-family:Manrope;src:url(${manrope});font-weight:200 800}
@font-face{font-family:Amiri;src:url(${amiri})}
*{box-sizing:border-box;margin:0}
html,body{width:1080px;height:1350px}
body{background:#171310;color:#efe6d4;font-family:Manrope,sans-serif;position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 90% 60% at 50% 42%,rgba(218,181,93,.16),rgba(218,181,93,0) 70%)}
.frame{position:absolute;inset:44px;border:2px solid rgba(218,181,93,.38);border-radius:28px}
.wrap{position:absolute;inset:44px;padding:78px 96px 70px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:center;gap:16px}
.top img{width:58px;height:58px}
.label{font:600 25px Manrope;letter-spacing:.28em;text-transform:uppercase;color:#DAB55D}
.rule{width:120px;height:2px;background:#DAB55D;opacity:.7;margin:30px auto 0}
.main{flex:1;display:flex;flex-direction:column;justify-content:center;gap:34px;text-align:center;overflow:hidden}
.ar{font-family:Amiri;font-size:60px;line-height:1.9;color:#F6D981}
.q{font-family:Marcellus;font-size:52px;line-height:1.35;color:#f3ead8}
.q.big{font-size:70px}
.q.small{font-size:36px;color:#F6D981}
.intro{font:500 30px Manrope;color:#c9b998}
.by{font:500 28px Manrope;color:#c9b998}
h1{font:400 64px Marcellus;color:#F6D981;line-height:1.15}
.story{font:400 34px/1.55 Manrope;color:#e7ddca}
.src{text-align:center;font:600 28px Manrope;color:#DAB55D;margin-top:26px}
.foot{text-align:center;font:500 24px Manrope;letter-spacing:.12em;color:#a8987a;margin-top:18px}
</style></head><body><div class="bg"></div><div class="frame"></div>
<div class="wrap"><div class="top"><img src="${logo}" alt=""><span class="label">${esc(post.label)}</span></div><div class="rule"></div>
<div class="main" id="main">${body}</div>
<div class="src">${esc(post.source)}</div><div class="foot">ADHANDISPLAY.COM</div></div>
<script>
// shrink all text in .main until it fits
(async()=>{await document.fonts.ready;const m=document.getElementById('main');const els=[...m.children];const base=els.map(e=>parseFloat(getComputedStyle(e).fontSize));
let f=1;while(m.scrollHeight>m.clientHeight+1&&f>0.4){f-=0.03;els.forEach((e,i)=>e.style.fontSize=(base[i]*f)+'px');}
document.body.dataset.scale=f.toFixed(2);document.body.dataset.ready='1';})();
</script></body></html>`;
}

async function render(posts, dir) {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const out = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
        for (const post of posts) {
            await page.setContent(await html(post), { waitUntil: 'load' });
            await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 15000 });
            const scale = Number(await page.evaluate(() => document.body.dataset.scale));
            const overflow = await page.evaluate(() => { const m = document.getElementById('main'); return m.scrollHeight > m.clientHeight + 1; });
            if (overflow) throw new Error(`Text of ${post.item.id} does not fit, even at the smallest size`);
            const file = path.join(dir, `${post.item.id}.jpg`);
            await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
            out.push({ id: post.item.id, file, scale });
        }
    } finally {
        await browser.close();
    }
    return out;
}

// ---------- Instagram API ----------
async function graph(method, url, params) {
    const body = new URLSearchParams(params);
    const res = await fetch(method === 'GET' ? `${url}?${body}` : url, method === 'GET' ? {} : { method, body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) throw new Error(`Instagram API ${res.status}: ${json.error?.message || JSON.stringify(json)}`);
    return json;
}

async function publish(imageUrl) {
    const { IG_USER_ID: user, IG_ACCESS_TOKEN: token } = process.env;
    if (!user || !token) throw new Error('IG_USER_ID and IG_ACCESS_TOKEN are required to publish');
    if (process.env.FIXTURE) throw new Error('Refusing to publish a FIXTURE render');
    if (!/^https:\/\/raw\.githubusercontent\.com\/iamkhomani\/Adhan-Display\/instagram-media\/[a-z0-9-]+-\d{8}\.jpg$/.test(imageUrl)) throw new Error(`Unexpected image URL: ${imageUrl}`);
    const meta = await readJson(path.join(OUT, 'meta.json'));
    const caption = await readFile(path.join(OUT, 'caption.txt'), 'utf8');
    const container = await graph('POST', `${GRAPH}/${user}/media`, { image_url: imageUrl, caption, access_token: token });
    for (let i = 0; i < 10; i++) {
        const st = await graph('GET', `${GRAPH}/${container.id}`, { fields: 'status_code', access_token: token });
        if (st.status_code === 'FINISHED') break;
        if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`Container status ${st.status_code}`);
        await new Promise((r) => setTimeout(r, 15000));
    }
    const media = await graph('POST', `${GRAPH}/${user}/media_publish`, { creation_id: container.id, access_token: token });
    const state = await readJson(STATE);
    state.next = meta.nextSlot;
    state.posted = [...(state.posted || []), { id: meta.id, date: new Date().toISOString().slice(0, 10), media: media.id }].slice(-400);
    await writeFile(STATE, JSON.stringify(state, null, 2) + '\n');
    console.log(`Published ${meta.id} as media ${media.id}`);
}

// ---------- CLI ----------
async function main() {
    const [cmd, ...args] = process.argv.slice(2);
    const content = await readJson(CONTENT);
    await mkdir(OUT, { recursive: true });
    if (cmd === 'render') {
        const { item, nextSlot } = pickNext(content.items, await readJson(STATE));
        const post = await buildPost(item);
        const [r] = await render([post], OUT);
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const name = `${item.id}-${date}.jpg`;
        await writeFile(path.join(OUT, 'caption.txt'), captionFor(post));
        await writeFile(path.join(OUT, 'meta.json'), JSON.stringify({ id: item.id, nextSlot, image: name, scale: r.scale }, null, 2));
        const { rename } = await import('node:fs/promises');
        await rename(r.file, path.join(OUT, name));
        console.log(`Rendered ${item.id} -> ${name} (text scale ${r.scale})`);
        console.log(captionFor(post));
    } else if (cmd === 'publish') {
        await publish(args[0]);
    } else if (cmd === 'preview') {
        const dir = path.join(OUT, 'preview');
        await mkdir(dir, { recursive: true });
        const wanted = args.length ? content.items.filter((i) => args.includes(i.id)) : content.items;
        const posts = [];
        for (const it of wanted) posts.push(await buildPost(it));
        const res = await render(posts, dir);
        await writeFile(path.join(dir, 'captions.txt'), posts.map((p) => `===== ${p.item.id}${p.item.approved ? '' : ' (NOT APPROVED)'}\n${captionFor(p)}`).join('\n\n'));
        res.forEach((r) => console.log(`${r.id} scale=${r.scale}`));
    } else {
        console.log('Usage: post.mjs render | publish <imageUrl> | preview [id...]');
        process.exitCode = 2;
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((err) => { console.error(err.message || err); process.exit(1); });
}
