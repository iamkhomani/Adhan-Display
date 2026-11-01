const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+cb; SOCS=CAI' };
for (const h of ['@SaudiSunnahTv', '@SaudiQuranTv', '@AlQuran4KOfficial']) {
  const r = await fetch(`https://www.youtube.com/${h}/live?hl=en&gl=US`, { headers: HEADERS });
  const html = await r.text();
  console.log(h, r.status, r.url, 'len', html.length,
    'canon', (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1],
    'og', (html.match(/<meta property="og:url" content="([^"]+)"/) || [])[1],
    'isLiveNow', /"isLiveNow":true/.test(html), 'isLive', /"isLive":true/.test(html), 'isLiveContent', /"isLiveContent":true/.test(html),
    'consent', /consent\.youtube|before you continue/i.test(html), 'videoId', (html.match(/"videoId":"([\w-]{11})"/) || [])[1]);
}
for (const q of ['al aqsa live', 'المسجد الأقصى مباشر', 'masjid al aqsa live 24/7', 'بث مباشر المسجد الاقصى']) {
  const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgJAAQ%253D%253D&hl=en&gl=US`, { headers: HEADERS });
  const html = await r.text();
  const m = html.match(/var ytInitialData = (\{.+?\});<\/script>/s);
  const data = m ? JSON.parse(m[1]) : null;
  const out = [];
  (function walk(n) { if (!n || typeof n !== 'object') return; if (n.videoRenderer) { const v = n.videoRenderer; out.push(`${v.videoId} | ${v.title?.runs?.map(x=>x.text).join('')} | ${v.ownerText?.runs?.[0]?.text} | ${v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl} | live=${/LIVE_NOW|"style":"LIVE"/.test(JSON.stringify([v.badges, v.thumbnailOverlays]))}`); } for (const x of Object.values(n)) walk(x); })(data);
  console.log('Q', q, out.length); out.slice(0, 6).forEach(x => console.log('   ', x));
}
