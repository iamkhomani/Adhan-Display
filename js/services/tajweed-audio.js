/*
 * Audio for Adhan Tajweed.
 *
 * Recorded clips come first: audio/tajweed/manifest.json maps each Arabic
 * text to an MP3 (made by scripts/tajweed-audio.mjs), so nobody has to
 * install an Arabic voice. A text without a clip falls back to the device's
 * own speech (Web Speech API) when it has an Arabic voice.
 */

const MANIFEST = 'audio/tajweed/manifest.json';

let manifest = null;
let loading = null;
let current = null;
let voice = null;

function loadManifest() {
    if (manifest) {
        return Promise.resolve(manifest);
    }
    if (!loading) {
        loading = fetch(MANIFEST, { cache: 'no-cache' })
            .then(response => (response.ok ? response.json() : {}))
            .catch(() => ({}))
            .then(data => {
                manifest = data && typeof data === 'object' ? data : {};
                return manifest;
            });
    }
    return loading;
}

function pickVoice() {
    if (!('speechSynthesis' in window)) {
        return;
    }
    const voices = window.speechSynthesis.getVoices();
    voice = voices.find(item => /^ar/i.test(item.lang) && /natural|online|google|maged|majed|hamed|zariyah|naayf|laila/i.test(item.name))
        || voices.find(item => /^ar/i.test(item.lang))
        || null;
}

if ('speechSynthesis' in window) {
    pickVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function stopAudio() {
    if (current) {
        current.pause();
        current = null;
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

function speakWithDevice(text, slow) {
    if (!('speechSynthesis' in window) || !voice) {
        return false;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice.lang || 'ar-SA';
    utterance.voice = voice;
    utterance.rate = slow ? 0.55 : 0.8;
    window.speechSynthesis.speak(utterance);
    return true;
}

/*
 * Plays the text. Resolves to 'clip', 'device' or 'none' (nothing could
 * play it, for example no clip yet and no Arabic voice on this device).
 */
export async function playArabic(text, { slow = false } = {}) {
    stopAudio();
    const files = await loadManifest();
    const file = files[text];

    if (file) {
        const audio = new Audio(`audio/tajweed/${file}`);
        audio.preservesPitch = true;
        audio.playbackRate = slow ? 0.7 : 1;
        current = audio;
        try {
            await audio.play();
            return 'clip';
        } catch {
            current = null;
        }
    }

    return speakWithDevice(text, slow) ? 'device' : 'none';
}

/* Fetches the manifest early so the first tap plays without delay. */
export function prepareAudio() {
    loadManifest();
}
