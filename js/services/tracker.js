import { APP, TRACKER_DEFAULT } from '../config.js';
import { Storage } from '../storage.js';

export class Tracker {
  constructor() {
    this.offset = 0;
  }

  dateAtOffset(offset = this.offset) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  }

  iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  record(date) {
    const tracker = Storage.getTracker();
    const existing = tracker[date];

    return {
      ...TRACKER_DEFAULT,
      ...(existing && typeof existing === 'object' ? existing : {})
    };
  }

  toggle(date, prayer, value) {
    const data = Storage.getTracker();
    const record = this.record(date);

    /*
     * An exempt day cannot have individual prayer states changed.
     * This prevents an exempt day from accidentally becoming a
     * missed/completed prayer day.
     */
    if (record.Exempt) {
      return;
    }

    const previous = !!record[prayer];

    record[prayer] = value;
    data[date] = record;

    Storage.setTracker(data);
    this.reconcileQada(date, prayer, previous, value);
  }

  setExempt(date, value) {
    const data = Storage.getTracker();
    const record = this.record(date);

    record.Exempt = !!value;

    /*
     * Once a day is marked exempt, clear individual prayer states.
     * This keeps the record internally consistent.
     *
     * We deliberately do not modify the existing aggregate Qada
     * balance here. Qada may contain manually adjusted values and
     * there is no per-date provenance in the current data model.
     */
    if (record.Exempt) {
      APP.trackablePrayers.forEach(prayer => {
        record[prayer] = false;
      });
    }

    data[date] = record;
    Storage.setTracker(data);
  }

  reconcileQada(date, prayer, previous, value) {
    if (
      !APP.trackablePrayers.includes(prayer) ||
      !Storage.getSettings().autoQada
    ) {
      return;
    }

    const today = this.iso(new Date());

    if (date >= today || previous === value) {
      return;
    }

    const qada = Storage.getQada();

    if (!previous && value) {
      qada[prayer] = Math.max(
        0,
        (qada[prayer] || 0) - 1
      );
    }

    if (previous && !value) {
      qada[prayer] = (qada[prayer] || 0) + 1;
    }

    Storage.setQada(qada);
  }

  stats() {
    const tracker = Storage.getTracker();
    const today = new Date();

    let weekScore = 0;
    let weekTotal = 0;
    let monthScore = 0;
    let monthTotal = 0;
    let streak = 0;

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const r = this.record(this.iso(d));

      /*
       * An exempt day is treated as a fully satisfied day for
       * continuity purposes. This preserves the existing tracker
       * behaviour while ensuring it is never treated as missed.
       */
      const done = r.Exempt
        ? APP.trackablePrayers.length
        : APP.trackablePrayers.filter(
            prayer => r[prayer]
          ).length;

      if (i < 7) {
        weekScore += done;
        weekTotal += APP.trackablePrayers.length;
      }

      monthScore += done;
      monthTotal += APP.trackablePrayers.length;

      if (
        i === 0 &&
        (done === APP.trackablePrayers.length || r.Exempt)
      ) {
        streak++;
      } else if (
        i > 0 &&
        (done === APP.trackablePrayers.length || r.Exempt) &&
        streak === i
      ) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      weekScore,
      weekTotal,
      monthScore,
      monthTotal,
      streak
    };
  }

  ensure(date) {
    Storage.ensureTrackerDate(date);
  }
}
