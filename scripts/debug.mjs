const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36', Accept: 'application/json' };
for (const u of ['https://api.gold-api.com/price/XAU', 'https://api.gold-api.com/price/XAG', 'https://api.frankfurter.dev/v1/latest?base=USD', 'https://data-asg.goldprice.org/dbXRates/USD', 'https://data-asg.goldprice.org/dbXRates/EUR', 'https://freegoldapi.com/data/latest.json']) {
  try { const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(15000) }); const t = await r.text(); console.log('URL', u, r.status, r.headers.get('access-control-allow-origin'), t.slice(0, 400).replace(/\s+/g, ' ')); }
  catch (e) { console.log('URL', u, 'ERR', e.message); }
}
