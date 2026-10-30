/*
 * Quran structure: number of ayahs per surah (Hafs, 6236 ayahs in total).
 * Used to split the Quran into equal daily portions for a khatm goal.
 */

export const SURAH_AYAHS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

export const TOTAL_AYAHS = SURAH_AYAHS.reduce((sum, count) => sum + count, 0);

/* Global ayah number (1..6236) -> { surah, ayah } */
export function refOfGlobal(global) {
    let rest = Math.max(1, Math.min(TOTAL_AYAHS, Math.round(global)));

    for (let index = 0; index < SURAH_AYAHS.length; index += 1) {
        if (rest <= SURAH_AYAHS[index]) {
            return { surah: index + 1, ayah: rest };
        }
        rest -= SURAH_AYAHS[index];
    }

    return { surah: 114, ayah: 6 };
}

/* Where each of the 30 juz starts ([surah, ayah]). Portions follow these, so every day has a similar amount to read. */
const JUZ_STARTS = [
    [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
    [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
    [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1]
];

export function globalOfRef(surah, ayah) {
    return SURAH_AYAHS.slice(0, surah - 1).reduce((sum, count) => sum + count, 0) + ayah;
}

const JUZ_GLOBALS = [...JUZ_STARTS.map(([surah, ayah]) => globalOfRef(surah, ayah)), TOTAL_AYAHS + 1];

/* Position in juz (0..30, may be fractional) -> first global ayah at that position. */
function globalAtJuz(position) {
    const index = Math.min(29, Math.floor(position));
    const fraction = position - index;
    return Math.round(JUZ_GLOBALS[index] + fraction * (JUZ_GLOBALS[index + 1] - JUZ_GLOBALS[index]));
}

/* Portion `index` (0-based) of the Quran split into `parts` daily portions: { from, to } as { surah, ayah }. */
export function portion(index, parts) {
    const first = globalAtJuz((30 * index) / parts);
    const last = index + 1 >= parts ? TOTAL_AYAHS : globalAtJuz((30 * (index + 1)) / parts) - 1;
    return { from: refOfGlobal(first), to: refOfGlobal(Math.max(first, last)) };
}
