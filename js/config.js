export const APP = {
  name: 'Adhan Display',
  version: '4.0.0',
  api: {
    aladhan: 'https://api.aladhan.com/v1',
    quran: 'https://api.alquran.cloud/v1',
    weather: 'https://api.open-meteo.com/v1/forecast',
    geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
    ipLocation: 'https://ipapi.co/json/'
  },
  coordinates: { lat: 52.0907, lon: 5.1214, city: 'Netherlands' },
  qibla: { lat: 21.422487, lon: 39.826206 },
  cache: { prayerHours: 12, weatherHours: 1, contentHours: 24, namesHours: 720 },
  prayerSequence: ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  trackablePrayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  methods: [
    [2, 'ISNA'], [3, 'Muslim World League'], [4, 'Umm Al-Qura, Makkah'], [5, 'Egyptian Survey'],
    [8, 'Gulf Region'], [9, 'Kuwait'], [10, 'Qatar'], [11, 'Singapore'], [12, 'France'], [13, 'Turkey (Diyanet)']
  ],
  languages: { en: 'English', nl: 'Nederlands', tr: 'Türkçe', fr: 'Français', de: 'Deutsch', es: 'Español', ar: 'العربية', id: 'Bahasa Indonesia', ur: 'اردو', bn: 'বাংলা', ru: 'Русский' },
  widgets: [
    ['hero', 'Prayer Times Hero'], ['times-card', 'Daily Times'], ['tracker', 'Prayer Tracker'], ['quran-card', 'Quran Tracker'],
    ['qada-card', 'Missed Prayers'], ['tasbih-card', 'Digital Tasbih'], ['qibla', 'Qibla'], ['text-widget', 'Ayah / Hadith'],
    ['night-widget', 'Night Prayers'], ['names-widget', 'Name of Allah'], ['dua-widget', 'Dua of the Day'], ['ramadan-card', 'Ramadan'],
    ['events-card', 'Islamic Events'], ['tools-card', 'Tools & Resources'], ['live', 'Holy Sites Live']
  ]
};
export const STORAGE_PREFIX = 'adhan_';
export const TRACKER_DEFAULT = { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false, Fast: false, Kahf: false, Exempt: false };
export const QADA_DEFAULT = { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 };
