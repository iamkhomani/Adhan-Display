// Records the Arabic audio for Adhan Tajweed with Gemini text-to-speech.
//
// Every text from speechTexts() in js/data/tajweed.js becomes one MP3 in
// audio/tajweed/, and audio/tajweed/manifest.json maps the text to its file.
// The site plays these clips, so visitors do not need an Arabic voice on
// their device. Texts that already have a clip are skipped; the manifest is
// saved after every clip, so a run that stops early (rate limits, time
// budget) can simply be run again.
//
// Env: GEMINI_API_KEY (required), TTS_MODEL (default gemini-3.8-flash-tts),
//      TTS_VOICE (default Charon), REDO=1 to record everything again,
//      DELAY_MS between requests (default 6500), BUDGET_MIN (default 75).
// Needs ffmpeg on the PATH.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'audio/tajweed');
const manifestPath = path.join(dir, 'manifest.json');
const { speechTexts } = await import(url.pathToFileURL(path.join(root, 'js/data/tajweed.js')).href);

const key = process.env.GEMINI_API_KEY;
const MODELS = [...new Set([process.env.TTS_MODEL || 'gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts'])];
const VOICE = process.env.TTS_VOICE || 'Charon';
const DELAY = Number(process.env.DELAY_MS || 6500);
const DEADLINE = Date.now() + Number(process.env.BUDGET_MIN || 75) * 60000;
const STYLE = 'A calm Quran teacher reading Classical Arabic for a beginners tajweed lesson. '
    + 'Pronounce exactly what is written, including every vowel mark, slowly and clearly. '
    + 'For a single letter with a vowel, say only that syllable; never spell out letter names unless the text is a letter name.';

if (!key) {
    console.log('GEMINI_API_KEY is not set: nothing recorded.');
    process.exit(0);
}

fs.mkdirSync(dir, { recursive: true });
let manifest = {};
try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch {
    manifest = {};
}

const texts = speechTexts();
const fileFor = text => `${crypto.createHash('sha1').update(text).digest('hex').slice(0, 12)}.mp3`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/* Newer TTS models take the style beside the text; older ones read it from the prompt. */
function body(model, text) {
    const legacy = model.startsWith('gemini-2.');
    return {
        contents: [{
            role: 'user',
            parts: [legacy ? { text: `${STYLE}\nRead this Arabic text: ${text}` } : { text, speech_metadata: { style: STYLE } }]
        }],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: legacy
                ? { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } }
                : { voiceConfig: { voice: VOICE }, languageCode: 'ar' }
        }
    };
}

let modelIndex = 0;

async function synthesize(text) {
    for (let attempt = 1; attempt <= 6; attempt++) {
        const model = MODELS[modelIndex];
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify(body(model, text)),
            signal: AbortSignal.timeout(60000)
        }).catch(error => ({ ok: false, status: 0, text: async () => String(error) }));

        if (res.ok) {
            const data = await res.json();
            const part = data.candidates?.[0]?.content?.parts?.find(item => item.inlineData?.data);
            if (part) {
                return { audio: Buffer.from(part.inlineData.data, 'base64'), mime: part.inlineData.mimeType || '' };
            }
            console.warn(`  no audio in the answer (attempt ${attempt})`);
        } else {
            const detail = (await res.text()).slice(0, 300);
            if ((res.status === 400 || res.status === 404) && modelIndex < MODELS.length - 1) {
                console.warn(`  ${model} answered ${res.status}; trying ${MODELS[modelIndex + 1]}. ${detail}`);
                modelIndex++;
                continue;
            }
            if (res.status === 429 && /per.?day|daily/i.test(detail)) {
                throw new Error(`Daily quota reached: ${detail}`);
            }
            console.warn(`  HTTP ${res.status} (attempt ${attempt}): ${detail}`);
        }
        await sleep(Math.min(120000, 10000 * 2 ** (attempt - 1)));
    }
    throw new Error('No audio after 6 attempts');
}

function toMp3(audio, mime, target) {
    const raw = path.join(dir, '.tmp-audio');
    fs.writeFileSync(raw, audio);
    const pcm = /l16|pcm/i.test(mime) && !/wav/i.test(mime);
    const rate = Number((mime.match(/rate=(\d+)/) || [])[1] || 24000);
    const input = pcm ? ['-f', 's16le', '-ar', String(rate), '-ac', '1', '-i', raw] : ['-i', raw];
    // Trim silence at both ends, keep a short tail, mono 64 kb/s.
    const trim = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.15';
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...input, '-af', trim, '-ac', '1', '-b:a', '64k', target]);
    fs.rmSync(raw, { force: true });
}

const todo = texts.filter(text => process.env.REDO === '1' || !manifest[text] || !fs.existsSync(path.join(dir, manifest[text])));
console.log(`${texts.length} texts, ${todo.length} to record with ${MODELS[0]} (voice ${VOICE}).`);

let recorded = 0;
for (const text of todo) {
    if (Date.now() > DEADLINE) {
        console.log('Time budget used up; run again to record the rest.');
        break;
    }
    const file = fileFor(text);
    try {
        const { audio, mime } = await synthesize(text);
        toMp3(audio, mime, path.join(dir, file));
        manifest[text] = file;
        fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
        recorded++;
        console.log(`  ✓ ${text} → ${file}`);
    } catch (error) {
        console.warn(`  ✗ ${text}: ${error.message}`);
        if (/Daily quota/.test(error.message)) {
            break;
        }
    }
    await sleep(DELAY);
}

/* Drop clips for texts that are no longer used. */
const used = new Set(texts);
for (const [text, file] of Object.entries(manifest)) {
    if (!used.has(text)) {
        delete manifest[text];
        fs.rmSync(path.join(dir, file), { force: true });
    }
}
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
console.log(`Recorded ${recorded}; ${Object.keys(manifest).length} of ${texts.length} texts have a clip.`);
