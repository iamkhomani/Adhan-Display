import { APP } from '../config.js';
import { Storage } from '../storage.js';
import { Api } from './api.js';
import { AudioService } from './audio.js';

export class PrayerService {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.data = null;
    this.cache = [];
    this.next = null;
    this.previous = null;
    this.isRamadan = false;
    this.lastAdhanKey = null;
  }

  async load() {
    const settings = Storage.getSettings();

    const loc = {
      lat: Number(
        Storage.getRaw(
          'lat',
          APP.coordinates.lat
        )
      ),
      lon: Number(
        Storage.getRaw(
          'lon',
          APP.coordinates.lon
        )
      )
    };

    const result = await Api.prayerCalendar({
      lat: loc.lat,
      lon: loc.lon,
      method: settings.method,
      hijriOffset: settings.hijriOffset
    });

    if (!result?.data) {
      throw new Error('Prayer API returned no data');
    }

    this.cache = result.data;

    const now = new Date();

    this.data = result.data[now.getDate() - 1];

    if (!this.data) {
      throw new Error('No prayer data for today');
    }

    this.onUpdate(
      this.data,
      this.cache
    );

    this.refreshState();

    return this.data;
  }

  refreshState() {
    if (!this.data) {
      return;
    }

    const sequence = APP.prayerSequence;
    const now = new Date();

    let found = null;

    for (let i = 0; i < sequence.length; i++) {
      const time = this.parse(
        this.data.timings[sequence[i]]
      );

      if (time > now) {
        found = {
          name: sequence[i],
          time
        };

        const previousName =
          i === 0
            ? 'Isha'
            : sequence[i - 1];

        let previousTime = this.parse(
          this.data.timings[previousName]
        );

        if (i === 0) {
          previousTime.setDate(
            previousTime.getDate() - 1
          );
        }

        this.previous = {
          name: previousName,
          time: previousTime
        };

        break;
      }
    }

    if (!found) {
      const fajr = this.parse(
        this.data.timings.Fajr
      );

      fajr.setDate(
        fajr.getDate() + 1
      );

      found = {
        name: 'Fajr',
        time: fajr
      };

      this.previous = {
        name: 'Isha',
        time: this.parse(
          this.data.timings.Isha
        )
      };
    }

    this.next = found;

    this.onUpdate(
      this.data,
      this.cache,
      this.next,
      this.previous
    );
  }

  parse(raw) {
    const clean = String(raw || '')
      .split(' ')[0];

    const [hours, minutes] =
      clean.split(':').map(Number);

    const date = new Date();

    date.setHours(
      hours,
      minutes,
      0,
      0
    );

    date.setMinutes(
      date.getMinutes() +
      Number(
        Storage.getSettings().offset || 0
      )
    );

    return date;
  }

  formatted(raw) {
    const date = this.parse(raw);

    return date.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    );
  }

  tick() {
    if (!this.next || !this.data) {
      return null;
    }

    const now = new Date();
    const diff = this.next.time - now;
    const settings = Storage.getSettings();

    if (diff <= 0) {
      const adhanKey =
        `${new Date().toDateString()}_${this.next.name}`;

      if (this.lastAdhanKey !== adhanKey) {
        this.lastAdhanKey = adhanKey;

        if (
          this.next.name !== 'Sunrise' &&
          settings.audio !== 'none'
        ) {
          AudioService.play(
            settings.audio
          );
        }
      }

      this.refreshState();

      return {
        diff: 0
      };
    }

    return {
      diff
    };
  }

  qibla(lat, lon) {
    const r = Math.PI / 180;

    const lat1 = lat * r;
    const lon1 = lon * r;

    const lat2 = APP.qibla.lat * r;
    const lon2 = APP.qibla.lon * r;

    const y =
      Math.sin(lon2 - lon1) *
      Math.cos(lat2);

    const x =
      Math.cos(lat1) *
      Math.sin(lat2) -
      Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(lon2 - lon1);

    return Math.round(
      (
        Math.atan2(y, x) / r +
        360
      ) % 360
    );
  }

  nightTimes() {
    if (!this.data) {
      return {};
    }

    return {
      midnight: this.formatted(
        this.data.timings.Midnight ||
        this.data.timings.Isha
      ),
      lastThird: this.formatted(
        this.data.timings.Lastthird ||
        this.data.timings.Fajr
      )
    };
  }
}
