/*
 * Keeps the live stream links for Makkah, Madinah and Al-Aqsa working.
 *
 * Runs on GitHub Actions every few hours (.github/workflows/live-streams.yml).
 * For each site it searches YouTube for streams that are live right now and picks:
 *   1. a stream from one of the preferred (official) channels, otherwise
 *   2. the first live stream whose title matches the site (when `match` is set).
 * If nothing is found, the previous link is kept and marked as not live; the site
 * then also offers YouTube's live search.
 *
 * The result is written to data/live-streams.json, which the website reads.
 * The file only changes when a link changes, so there are no needless commits.
 *
 * Usage: node scripts/update-live-streams.mjs [--dry]
 * To prefer other channels, edit the `channels` lists below (YouTube handles).
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'data/live-streams.json');
const DRY = process.argv.includes('--dry');

const SITES = {
    haram: {
        /* Saudi Quran TV, the official broadcast from Masjid al-Haram */
        channels: ['@SaudiQuranTv'],
        searches: ['makkah live', 'قناة القرآن الكريم بث مباشر'],
        match: /makkah|mecca|makka|mekka|haram|kaaba|ka'?bah|مكة|الحرم|الكعبة/i
    },
    nabawi: {
        /* Saudi Sunnah TV, the official broadcast from Masjid an-Nabawi */
        channels: ['@SaudiSunnahTv'],
        searches: ['madinah live', 'قناة السنة النبوية بث مباشر'],
        match: /madina|medina|nabawi|nabvi|المدينة|النبوي|السنة النبوية/i
    },
    /* There is no stable 24/7 stream of Al-Aqsa; search results are mostly other cameras and
       re-uploads. Only streams from listed channels are used; otherwise the site shows YouTube's live search. */
    aqsa: {
        channels: [],
        searches: ['al aqsa mosque live', 'المسجد الأقصى بث مباشر'],
        match: null
    }
};

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Cookie: 'CONSENT=YES+cb; SOCS=CAI'
};

async function get(target) {
    const response = await fetch(target, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
}

function initialData(html) {
    const match = html.match(/var ytInitialData = (\{.+?\});<\/script>/s);
    return match ? JSON.parse(match[1]) : null;
}

function* videoRenderers(node) {
    if (!node || typeof node !== 'object') {
        return;
    }
    if (node.videoRenderer) {
        yield node.videoRenderer;
    }
    for (const value of Object.values(node)) {
        yield* videoRenderers(value);
    }
}

/* All streams that are live right now for a search query. */
async function searchLive(query) {
    const html = await get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgJAAQ%253D%253D&hl=en&gl=US`);
    const results = [];

    for (const video of videoRenderers(initialData(html))) {
        const live = /LIVE_NOW|"style":"LIVE"/.test(JSON.stringify([video.badges, video.thumbnailOverlays]));
        if (!video.videoId || !live) {
            continue;
        }
        const owner = video.ownerText?.runs?.[0];
        results.push({
            id: video.videoId,
            title: video.title?.runs?.map(run => run.text).join('') || '',
            channel: owner?.text || '',
            handle: (owner?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || '').replace(/^\//, '')
        });
    }

    return results;
}

async function resolve(id, site, previous) {
    const results = [];

    for (const query of site.searches) {
        try {
            const found = await searchLive(query);
            console.log(`${id}: "${query}" -> ${found.length} live`);
            results.push(...found);
        } catch (error) {
            console.log(`${id}: "${query}" failed: ${error.message}`);
        }
    }

    const preferred = site.channels.map(handle => handle.toLowerCase());
    const official = results.find(item => preferred.includes(item.handle.toLowerCase()));
    const matching = site.match ? results.find(item => site.match.test(item.title)) : null;
    const pick = official || matching;

    if (pick) {
        console.log(`${id}: using "${pick.title}" by ${pick.channel} (${pick.handle}, ${pick.id})${official ? ' [preferred channel]' : ''}`);
        return {
            url: `https://www.youtube.com/watch?v=${pick.id}`,
            channel: pick.channel,
            official: Boolean(official),
            live: true
        };
    }

    if (previous?.url) {
        console.log(`${id}: nothing live found, keeping the previous link`);
        return { ...previous, live: false };
    }

    console.log(`${id}: nothing live found`);
    return null;
}

const before = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, 'utf8')) : { sites: {} };
const sites = {};

for (const [id, site] of Object.entries(SITES)) {
    const result = await resolve(id, site, before.sites?.[id]);
    if (result) {
        sites[id] = result;
    }
}

const changed = JSON.stringify(sites) !== JSON.stringify(before.sites || {});
const output = { updated: changed ? new Date().toISOString() : before.updated || new Date().toISOString(), sites };

console.log(JSON.stringify(output, null, 2));

if (!DRY && changed) {
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
    console.log('data/live-streams.json updated');
} else {
    console.log(changed ? 'changed (dry run, not written)' : 'no change');
}
