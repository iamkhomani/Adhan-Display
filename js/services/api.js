import { APP } from '../config.js';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function cachedFetch(key, url, ttlHours) {
  const cacheKey = `adhan_cache_${key}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const payload = JSON.parse(cached);
      if (Date.now() - payload.timestamp < ttlHours * 3600000) return payload.data;
    } catch { localStorage.removeItem(cacheKey); }
  }
  try {
    const data = await fetchJson(url);
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
    return data;
  } catch (error) {
    if (cached) return JSON.parse(cached).data;
    throw error;
  }
}

export const Api = {
  async prayerCalendar({ lat, lon, method, hijriOffset = 0, date = new Date() }) {
    const y = date.getFullYear(), m = date.getMonth() + 1;
    const key = `calendar_${lat}_${lon}_${method}_${hijriOffset}_${y}_${m}`;
    const url = `${APP.api.aladhan}/calendar/${y}/${m}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&method=${method}&adjustment=${hijriOffset}`;
    return cachedFetch(key, url, APP.cache.prayerHours);
  },
  async weather(lat, lon) {
    const key = `weather_${lat}_${lon}`;
    const url = `${APP.api.weather}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    return cachedFetch(key, url, APP.cache.weatherHours);
  },
  async geocode(city) {
    const url = `${APP.api.geocoding}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    return fetchJson(url);
  },
  async ipLocation() { return cachedFetch('ip_location', APP.api.ipLocation, 2); },
  async quranAyah(ayahNumber, edition) {
    return cachedFetch(`quran_${edition}_${ayahNumber}`, `${APP.api.quran}/ayah/${ayahNumber}/${edition}`, APP.cache.contentHours);
  },
  async hadithCollections() {
    const key = 'hadith_collections';
    return cachedFetch(
      key,
      'https://ummahapi.com/api/hadith/collections',
      APP.cache.contentHours
    );
  },

  async hadithRandom(collection = 'bukhari') {
    const key = `hadith_random_${collection}`;
    const url =
      `https://ummahapi.com/api/hadith/random?collection=${encodeURIComponent(collection)}`;

    return cachedFetch(
      key,
      url,
      0.25
    );
  },

  async hadithSearch(query, collection = '', limit = 12) {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit)
    });

    if (collection) {
      params.set('collection', collection);
    }

    return fetchJson(
      `https://ummahapi.com/api/hadith/search?${params.toString()}`
    );
  },

  async hadithByNumber(collection, number) {
    return fetchJson(
      `https://ummahapi.com/api/hadith/${encodeURIComponent(collection)}/${encodeURIComponent(number)}`
    );
  },

  async names() { return cachedFetch('allah_names', `${APP.api.aladhan}/asmaAlHusna`, APP.cache.namesHours); }
};
