import { STORAGE_PREFIX, TRACKER_DEFAULT, QADA_DEFAULT, APP } from './config.js';

export const Storage = {
  get(key, fallback = null) {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch { return raw; }
  },
  set(key, value) { localStorage.setItem(STORAGE_PREFIX + key, typeof value === 'string' ? value : JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(STORAGE_PREFIX + key); },
  getRaw(key, fallback = null) { return localStorage.getItem(STORAGE_PREFIX + key) ?? fallback; },
  setRaw(key, value) { localStorage.setItem(STORAGE_PREFIX + key, value); },
  getSettings() {
    return {
      theme: this.getRaw('theme', 'dark'), lang: this.getRaw('lang', 'en'), size: this.getRaw('size', 'normal'), daily: this.getRaw('daily', 'quran'),
      audio: this.getRaw('audio', 'default'), volume: Number(this.getRaw('volume', '1')),
      method: Number(this.getRaw('method', '3')), offset: Number(this.getRaw('offset', '0')), hijriOffset: Number(this.getRaw('hijri_offset', '0')),
      autodim: this.get('autodim', false), screensaver: this.get('screensaver', false), autoQada: this.get('auto_qada', true),
      wudu: this.get('wudu', false), tahajjudAlarm: this.get('tahajjud_alarm', false), dailyAlert: this.get('daily_alert', false), autoLocation: this.getRaw('auto_loc', 'true') !== 'false',
      trackerExemptionMode: this.get('tracker_exemption_mode', false)
    };
  },
  setSetting(key, value) { this.set(key, value); },
  getLocations() { return this.get('saved_locs', []); },
  setLocations(locations) { this.set('saved_locs', locations); },
  getTracker() { return this.get('tracker', {}); },
  setTracker(data) { this.set('tracker', data); },
  ensureTrackerDate(date) {
    const tracker = this.getTracker();
    if (!tracker[date]) { tracker[date] = { ...TRACKER_DEFAULT }; this.setTracker(tracker); }
    return tracker;
  },
  getQada() { return { ...QADA_DEFAULT, ...(this.get('qada', QADA_DEFAULT) || {}) }; },
  setQada(data) { this.set('qada', data); },
  getQuran() { return this.get('quran', { surah: '', ayah: '' }); },
  setQuran(data) { this.set('quran', data); },
  getHiddenWidgets() { return this.get('hidden_widgets', []); },
  setHiddenWidgets(data) { this.set('hidden_widgets', data); },
  clearCache() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && (key.includes('cache_') || key.includes('calendar_') || key.includes('weather_') || key.includes('quran_') || key.includes('allah_names'))) localStorage.removeItem(key);
    }
  },
  exportBackup() {
    const data = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key?.startsWith(STORAGE_PREFIX)) {
        data[key] = localStorage.getItem(key);
      }
    }

    /*
     * Legacy-compatible format.
     *
     * The old Adhan Display stored backup values directly as
     * adhan_* keys. Keeping those keys at the top level means the
     * legacy application can still consume the exported backup.
     *
     * V2 can import this format as well as the older V2 { data: {} }
     * format.
     */
    return {
      format: 'adhan-display-backup',
      version: APP.version,
      createdAt: new Date().toISOString(),
      ...data
    };
  },

  importBackup(backup) {
    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
      throw new Error('Invalid backup');
    }

    let source = null;

    /*
     * Current/older V2 format:
     * {
     *   version: ...,
     *   createdAt: ...,
     *   data: {
     *     adhan_...: ...
     *   }
     * }
     */
    if (
      backup.data &&
      typeof backup.data === 'object' &&
      !Array.isArray(backup.data)
    ) {
      source = backup.data;
    } else {
      /*
       * Legacy Adhan Display format:
       * {
       *   adhan_qada: "...",
       *   adhan_tracker: "...",
       *   ...
       * }
       */
      source = Object.fromEntries(
        Object.entries(backup).filter(
          ([key]) => key.startsWith(STORAGE_PREFIX)
        )
      );
    }

    if (!source || Object.keys(source).length === 0) {
      throw new Error('No Adhan Display data found in backup');
    }

    const autoLocationKey = `${STORAGE_PREFIX}auto_loc`;
    const legacyLocationKey = `${STORAGE_PREFIX}location_auto`;

    /*
     * Some older exports contain both location keys. If the modern
     * auto_loc key is missing, use the legacy location_auto value.
     */
    if (
      source[autoLocationKey] === undefined &&
      source[legacyLocationKey] !== undefined
    ) {
      source[autoLocationKey] = source[legacyLocationKey];
    }

    Object.entries(source).forEach(([key, value]) => {
      if (!key.startsWith(STORAGE_PREFIX)) return;

      const normalized =
        typeof value === 'string'
          ? value
          : JSON.stringify(value);

      localStorage.setItem(key, normalized);
    });
  }
};
