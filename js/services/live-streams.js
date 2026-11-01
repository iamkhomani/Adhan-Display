/*
 * Direct links to the live streams of the holy mosques.
 *
 * A GitHub Action (scripts/update-live-streams.mjs) checks every 3 hours which
 * YouTube streams are live and writes data/live-streams.json. The file is read
 * from GitHub directly, so a new link works at once without waiting for the site
 * to rebuild; the copy on this site is the fallback. When a site has no live
 * stream, the card keeps linking to YouTube's live search.
 */

import { cachedJson, fetchJson } from './api.js';

const REMOTE = 'https://raw.githubusercontent.com/iamkhomani/Adhan-Display/main/data/live-streams.json';
const LOCAL = 'data/live-streams.json';

function clean(json) {
    const sites = {};
    Object.entries(json?.sites || {}).forEach(([id, site]) => {
        if (site?.live && /^https:\/\/(www\.)?youtube\.com\//.test(site.url || '')) {
            sites[id] = { url: site.url, channel: String(site.channel || '') };
        }
    });
    return sites;
}

/* { haram: { url, channel }, ... } for sites that are live; {} when unknown. */
export async function liveStreams() {
    try {
        return await cachedJson('live_streams', REMOTE, 1, clean);
    } catch {
        try {
            return clean(await fetchJson(LOCAL));
        } catch {
            return {};
        }
    }
}
