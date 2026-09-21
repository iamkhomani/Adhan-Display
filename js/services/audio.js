const DB_NAME = 'AdhanAudioDB';
const STORE = 'audio';

let audioUnlockInstalled = false;
let audioUnlocked = false;

async function db() {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          DB_NAME,
          1
        );

      request.onupgradeneeded = event => {
        const database =
          event.target.result;

        if (
          !database.objectStoreNames.contains(
            STORE
          )
        ) {
          database.createObjectStore(
            STORE
          );
        }
      };

      request.onsuccess = event => {
        resolve(
          event.target.result
        );
      };

      request.onerror = () => {
        reject(request.error);
      };
    }
  );
}

function currentAudioSetting() {
  return (
    localStorage.getItem(
      'adhan_audio'
    ) || 'default'
  );
}

function currentVolume() {
  const value = Number(
    localStorage.getItem(
      'adhan_volume'
    ) || 1
  );

  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(
    0,
    Math.min(1, value)
  );
}

function findAudioElement(type) {
  return (
    document.getElementById(
      `audio-${type}`
    ) ||
    document.getElementById(
      'audio-default'
    )
  );
}

export const AudioService = {

  init(volume) {
    const initialVolume =
      Number.isFinite(
        Number(volume)
      )
        ? Number(volume)
        : currentVolume();

    document
      .querySelectorAll('audio')
      .forEach(audio => {
        audio.volume =
          Math.max(
            0,
            Math.min(
              1,
              initialVolume
            )
          );
      });

    this.installUnlock();
  },

  installUnlock() {
    if (audioUnlockInstalled) {
      return;
    }

    audioUnlockInstalled = true;

    const unlockFromUserGesture =
      () => {
        this.unlock();
      };

    document.addEventListener(
      'pointerdown',
      unlockFromUserGesture,
      {
        capture: true,
        passive: true
      }
    );

    document.addEventListener(
      'touchstart',
      unlockFromUserGesture,
      {
        capture: true,
        passive: true
      }
    );

    document.addEventListener(
      'keydown',
      unlockFromUserGesture,
      {
        capture: true,
        passive: true
      }
    );

    document.addEventListener(
      'change',
      unlockFromUserGesture,
      {
        capture: true,
        passive: true
      }
    );
  },

  async unlock() {
    if (audioUnlocked) {
      return true;
    }

    const type =
      currentAudioSetting();

    if (
      !type ||
      type === 'none'
    ) {
      return false;
    }

    try {
      const element =
        findAudioElement(type);

      if (!element) {
        return false;
      }

      element.volume =
        currentVolume();

      /*
       * The browser requires a user gesture before
       * allowing audible media playback.
       *
       * This first playback is muted so the user
       * does not hear a partial Adhan merely because
       * they tapped the interface.
       *
       * The gesture itself establishes the media
       * interaction needed for subsequent scheduled
       * playback on supported browsers.
       */
      const previousMuted =
        element.muted;

      const previousTime =
        element.currentTime;

      element.muted = true;

      const result =
        element.play();

      if (
        result &&
        typeof result.then === 'function'
      ) {
        await result;
      }

      element.pause();

      try {
        element.currentTime =
          previousTime || 0;
      } catch {
        element.currentTime = 0;
      }

      element.muted =
        previousMuted;

      audioUnlocked = true;

      return true;

    } catch {
      return false;
    }
  },

  isUnlocked() {
    return audioUnlocked;
  },

  stopAll() {
    document
      .querySelectorAll('audio')
      .forEach(audio => {
        audio.pause();

        try {
          audio.currentTime = 0;
        } catch {
          audio.currentTime = 0;
        }
      });
  },

  async saveCustom(file) {
    const database =
      await db();

    return new Promise(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            STORE,
            'readwrite'
          );

        transaction
          .objectStore(STORE)
          .put(
            file,
            'custom'
          );

        transaction.oncomplete =
          resolve;

        transaction.onerror = () =>
          reject(
            transaction.error
          );
      }
    );
  },

  async getCustom() {
    const database =
      await db();

    return new Promise(
      resolve => {
        const request =
          database
            .transaction(STORE)
            .objectStore(STORE)
            .get('custom');

        request.onsuccess =
          () => {
            resolve(
              request.result ||
              null
            );
          };

        request.onerror =
          () => {
            resolve(null);
          };
      }
    );
  },

  async play(type) {
    this.stopAll();

    if (
      !type ||
      type === 'none'
    ) {
      return false;
    }

    const volume =
      currentVolume();

    if (type === 'custom') {
      try {
        const blob =
          await this.getCustom();

        if (!blob) {
          return false;
        }

        const url =
          URL.createObjectURL(
            blob
          );

        const audio =
          new Audio(url);

        audio.volume =
          volume;

        const result =
          audio.play();

        if (
          result &&
          typeof result.then ===
            'function'
        ) {
          await result;
        }

        audio.addEventListener(
          'ended',
          () => {
            URL.revokeObjectURL(
              url
            );
          },
          {
            once: true
          }
        );

        return true;

      } catch {
        return false;
      }
    }

    const element =
      findAudioElement(type);

    if (!element) {
      return false;
    }

    element.volume =
      volume;

    try {
      const result =
        element.play();

      if (
        result &&
        typeof result.then ===
          'function'
      ) {
        await result;
      }

      return true;

    } catch {
      return false;
    }
  }
};
