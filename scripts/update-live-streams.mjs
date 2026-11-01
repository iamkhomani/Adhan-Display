/*
 * Keeps the live stream links for Makkah, Madinah and Al-Aqsa working.
 *
 * Runs on GitHub Actions (.github/workflows/live-streams.yml). For each site it:
 *   1. tries the preferred channels in order and uses the first one that is live
 *      (https://www.youtube.com/@channel/live always opens that channel's current stream);
 *   2. otherwise searches YouTube for live streams and takes the first matching result;
 *   3. otherwise keeps the previous link.
 * The result is written to data/live-streams.json, which the site reads.
 * The file only changes when a link changes, so there are no needless commits.
 *
 * Usage: node scripts/update-live-streams.mjs [--dry]
 * To prefer other channels, edit the `channels` lists below.
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'data/live-streams.json');
const DRY = process.argv.includes('--dry');

const SITES = {
    haram: {
        channels: ['@SaudiQuranTv', '@makkahlivehd4385'],
        search: 'makkah live',
        match: /makkah|mecca|makka|mekka|haram|kaaba|ka'?bah|مكة|الحرم|الكعبة/i
    },
    nabawi: {
        channels: ['@SaudiSunnahTv'],
        search: 'madinah live masjid nabawi',
        match: /madina|medina|nabawi|nabvi|المدينة|النبوي/i
    },
    aqsa: {
        channels: ['@livebroadcastal-aqsa3717'],
        search: 'al aqsa mosque live',
        match: /aqsa|الأقصى|الاقصى/i
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

/* Is this channel live right now? Returns the video id or null. */
async function channelLive(handle) {
    const html = await get(`https://www.youtube.com/${handle}/live?hl=en&gl=US`);
    const canonical = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/);
    const live = /"isLiveNow":true/.test(html) || /"isLive":true/.test(html);
    return canonical && live ? canonical[1] : null;
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

function isLiveRenderer(video) {
    const text = JSON.stringify([video.badges, video.thumbnailOverlays]);
    return /LIVE_NOW|"style":"LIVE"/.test(text);
}

/* First live search result whose title matches. */
async function searchLive(query, match) {
    const html = await get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgJAAQ%253D%253D&hl=en&gl=US`);
    const data = initialData(html);
    for (const video of videoRenderers(data)) {
        const title = video.title?.runs?.map(run => run.text).join('') || '';
        if (!video.videoId || !isLiveRenderer(video) || !match.test(title)) {
            continue;
        }
        const owner = video.ownerText?.runs?.[0];
        return {
            id: video.videoId,
            title,
            channel: owner?.text || '',
            handle: owner?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || ''
        };
    }
    return null;
}

async function resolve(id, site, previous) {
    for (const handle of site.channels) {
        try {
            const video = await channelLive(handle);
            console.log(`${id}: ${handle} ${video ? `live (${video})` : 'not live'}`);
            if (video) {
                return { url: `https://www.youtube.com/${handle}/live`, source: 'channel', channel: handle, live: true };
            }
        } catch (error) {
            console.log(`${id}: ${handle} check failed: ${error.message}`);
        }
    }

    try {
        const found = await searchLive(site.search, site.match);
        console.log(`${id}: search ${found ? `found "${found.title}" by ${found.channel} (${found.id}, ${found.handle})` : 'found nothing live'}`);
        if (found) {
            /* A channel's /live link survives a restart of the stream; a watch link does not. */
            const link = found.handle.startsWith('/@')
                ? `https://www.youtube.com${found.handle}/live`
                : `https://www.youtube.com/watch?v=${found.id}`;
            return { url: link, source: 'search', channel: found.channel, live: true };
        }
    } catch (error) {
        console.log(`${id}: search failed: ${error.message}`);
    }

    if (previous?.url) {
        console.log(`${id}: keeping previous link`);
        return { ...previous, live: false };
    }

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
    fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
    console.log('data/live-streams.json updated');
} else {
    console.log(changed ? 'changed (dry run, not written)' : 'no change');
}
