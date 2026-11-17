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

/*
 * Speaks with the device's own voice. Android often lists no voices at all
 * (or only after a while), yet speaks Arabic fine when asked for ar-SA, so
 * it always tries and waits for the speech to actually start.
 */
function speakWithDevice(text, slow) {
    if (!('speechSynthesis' in window)) {
        return Promise.resolve(false);
    }
    const synth = window.speechSynthesis;
    pickVoice();

    return new Promise(resolve => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice?.lang?.replace('_', '-') || 'ar-SA';
        if (voice) {
            utterance.voice = voice;
        }
        utterance.rate = slow ? 0.55 : 0.8;

        let settled = false;
        const finish = ok => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve(ok);
            }
        };
        const timer = setTimeout(() => finish(false), 3000);
        utterance.onstart = () => finish(true);
        utterance.onend = () => finish(true);
        utterance.onerror = event => finish(event.error === 'interrupted' || event.error === 'canceled');

        /* Some Android versions drop an utterance spoken right after cancel(), so wait a moment. */
        synth.cancel();
        setTimeout(() => synth.speak(utterance), 80);
    });
}

/*
 * Plays the text. Resolves to 'clip', 'device' or 'none' (nothing could
 * play it, for example no clip yet and no Arabic voice on this device).
 */
export async function playArabic(text, { slow = false } = {}) {
    stopAudio();
    const files = manifest || await loadManifest();
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

    return (await speakWithDevice(text, slow)) ? 'device' : 'none';
}

/* Fetches the manifest early so the first tap plays without delay. */
export function prepareAudio() {
    loadManifest();
}
