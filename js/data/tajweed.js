/*
 * Adhan Tajweed: lessons, letters and games.
 *
 * The course follows the order of "Tilawa from the heart – Tajweed guide"
 * by Asma Rouane. The explanations are written for this site. Texts are in
 * English and Dutch ({ en, nl }); other interface languages show English.
 *
 * Every Arabic text that can be played is listed by speechTexts(), which
 * scripts/tajweed-audio.mjs uses to record the audio files.
 */

const tx = (en, nl) => ({ en, nl });

/* Interface texts of the Tajweed section. */
export const UI = {
    lead: tx('Learn to read the Quran correctly, one short lesson at a time. Listen to every letter and practise with games.',
        'Leer de Koran correct lezen, één korte les per keer. Luister naar elke letter en oefen met spelletjes.'),
    tabPath: tx('Lessons', 'Lessen'),
    tabLetters: tx('Letters', 'Letters'),
    tabGames: tx('Games', 'Spellen'),
    tabProgress: tx('Progress', 'Voortgang'),
    heroStart: tx('Start your tajweed journey', 'Begin je tajweed-reis'),
    heroBack: tx('Welcome back', 'Welkom terug'),
    heroDone: tx('All lessons completed', 'Alle lessen voltooid'),
    heroStartText: tx('Short lessons, letters you can hear straight away and games to make it stick. Start with lesson 1.',
        'Korte lessen, letters die je meteen hoort en spelletjes om het te laten hangen. Begin bij les 1.'),
    heroBackText: tx('You have finished {done} of {total} lessons. Carry on where you left off.',
        'Je hebt {done} van de {total} lessen gedaan. Ga verder waar je was.'),
    heroDoneText: tx('Keep it fresh with the daily mix or the games, and view your certificate.',
        'Herhaal met de dagelijkse mix of de spellen, en bekijk je certificaat.'),
    startLesson1: tx('Start lesson 1', 'Start les 1'),
    continue: tx('Continue', 'Ga verder'),
    dailyMix: tx('Daily mix', 'Dagelijkse mix'),
    completed: tx('{done}/{total} completed', '{done}/{total} voltooid'),
    next: tx('Next', 'Volgende'),
    lesson: tx('Lesson {n}', 'Les {n}'),
    back: tx('Back', 'Terug'),
    previous: tx('Previous', 'Vorige'),
    forward: tx('Next', 'Verder'),
    toQuiz: tx('Take the quiz', 'Naar de quiz'),
    quiz: tx('Quiz', 'Quiz'),
    stop: tx('Stop', 'Stoppen'),
    listen: tx('Listen', 'Beluister'),
    right: [tx('Well done!', 'Goed zo!'), tx('Masha’Allah!', 'Masha’Allah!'), tx('Exactly!', 'Precies!'), tx('Great!', 'Top!')],
    wrong: tx('Almost.', 'Bijna.'),
    rightAnswer: tx('The right answer is {answer}.', 'Het juiste antwoord is {answer}.'),
    excellent: tx('Excellent!', 'Uitstekend!'),
    good: tx('Well done!', 'Goed gedaan!'),
    keepGoing: tx('Keep practising!', 'Blijf oefenen!'),
    score: tx('{title}: {score} of {total} correct', '{title}: {score} van {total} goed'),
    again: tx('Try again', 'Opnieuw'),
    certificate: tx('Certificate', 'Certificaat'),
    certificateNext: tx('After all lessons', 'Na alle lessen'),
    slow: tx('Slow pronunciation', 'Langzaam uitspreken'),
    slowOn: tx('Slow pronunciation on', 'Langzaam uitspreken aan'),
    slowOff: tx('Normal speed', 'Normale snelheid'),
    heavyHint: tx('Orange = heavy letter. You will learn more about these later.', 'Oranje = zware letter. Daar leer je later meer over.'),
    allLetters: tx('All letters', 'Alle letters'),
    tapForDetails: tx('Tap a letter for details', 'Tik op een letter voor details'),
    name: tx('Name', 'Naam'),
    isolated: tx('isolated', 'los'),
    initial: tx('start', 'begin'),
    medial: tx('middle', 'midden'),
    final: tx('end', 'eind'),
    heavy: tx('heavy', 'zwaar'),
    light: tx('light', 'licht'),
    heavyOrLight: tx('heavy or light', 'zwaar of licht'),
    qalqalah: tx('qalqalah', 'qalqalah'),
    sunLetter: tx('sun letter', 'zonletter'),
    moonLetter: tx('moon letter', 'maanletter'),
    sunShort: tx('sun', 'zon'),
    moonShort: tx('moon', 'maan'),
    sunLam: tx('Sun: ل silent', 'Zon: ل stil'),
    moonLam: tx('Moon: ل heard', 'Maan: ل hoorbaar'),
    sunExplain: tx('sun letter: ل is silent, shadda on {letter}', 'zonletter: ل stil, shadda op {letter}'),
    moonExplain: tx('moon letter: ل is pronounced', 'maanletter: ل hoorbaar'),
    nonJoinNote: tx('This letter does not join the letter after it, so its start form is the same as the isolated form.',
        'Deze letter verbindt niet met de letter erna, dus begin = los.'),
    gamesLead: tx('Short rounds that earn real XP', 'Korte rondes, echte XP'),
    best: tx('Best: {score}/10', 'Beste: {score}/10'),
    soundTip: tx('Turn your sound on. With the snail button you hear everything more slowly.',
        'Zet het geluid aan. Met de slak-knop hoor je alles langzamer.'),
    tapToFlip: tx('Tap to turn over', 'Tik om te draaien'),
    knewIt: tx('I knew it', 'Ik kende hem'),
    practiseMore: tx('Practise more', 'Nog oefenen'),
    level: tx('Level {n}', 'Niveau {n}'),
    xp: tx('XP', 'XP'),
    streak: tx('days in a row', 'dagen op rij'),
    lessons: tx('lessons', 'lessen'),
    unlocked: tx('Unlocked', 'Ontgrendeld'),
    lessonsLeft: tx('{count} lessons to go', 'Nog {count} lessen'),
    yourName: tx('Your name', 'Jouw naam'),
    typeName: tx('Type your name', 'Typ je naam'),
    certTitle: tx('Certificate · Level 1', 'Certificaat · Niveau 1'),
    certTo: tx('Awarded to', 'Uitgereikt aan'),
    certFor: tx('for completing Tajweed & Quran reading', 'voor het afronden van Tajweed & Koran lezen'),
    certItems: [
        tx('Pronunciation of the letters (makharij)', 'Uitspraak van de letters (makharij)'),
        tx('Heavy and light letters', 'Zware en lichte letters'),
        tx('Short and long vowels, tanween, sukoon', 'Korte en lange klinkers, tanwien, sukoon'),
        tx('Shadda, ghunnah and hamzatul wasl', 'Shadda, ghunnah en hamzatul wasl'),
        tx('The rules of ر and the name Allah', 'Regels van ر en de naam Allah'),
        tx('Sun and moon letters, stopping', 'Zon- en maanletters, stoppen')
    ],
    certLocked: tx('Complete all lessons', 'Rond alle lessen af'),
    duaTitle: tx('Du‘a for learning', 'Du‘aa bij het leren'),
    duaMeaning: tx('O Allah, make the Quran the spring of our hearts, the light of our chests, the removal of our sadness and the end of our worries.',
        'O Allah, maak de Koran de lente van ons hart, het licht van onze borst, het verdrijven van ons verdriet en het wegnemen van onze zorgen.'),
    reset: tx('Reset progress', 'Voortgang wissen'),
    resetConfirm: tx('Reset your Tajweed XP, stars and streak? This cannot be undone.',
        'Je Tajweed-XP, sterren en reeks wissen? Dit kan niet ongedaan worden.'),
    resetDone: tx('Progress reset', 'Voortgang gewist'),
    credit: tx('Course outline based on “Tilawa from the heart – Tajweed guide” by Asma Rouane.',
        'Leerlijn gebaseerd op “Tilawa from the heart – Tajweed guide” van Asma Rouane.'),
    noVoice: tx('This sound is not recorded yet and your device has no Arabic voice.',
        'Deze klank is nog niet opgenomen en je apparaat heeft geen Arabische stem.'),
    noSound: tx('Playing the sound did not work.', 'Afspelen lukte niet.')
};

/* [letter, transliteration, Arabic name, sound hint, place of articulation] */
export const LETTERS = [
    ['ا', 'alif', 'أَلِف', tx('a long “aa”; it has no consonant sound of its own and often carries the hamza', 'lange “aa”; zelf geen medeklinker en draagt vaak de hamza'), 'jawf'],
    ['ب', 'baa', 'بَاء', tx('b as in “bat”', 'b zoals in “bal”'), 'lips'],
    ['ت', 'taa', 'تَاء', tx('a light t as in “tea”, without a puff of air', 't zoals in “tas”, licht en zonder pufje'), 'tip'],
    ['ث', 'thaa', 'ثَاء', tx('th as in “think”, tongue between the teeth', 'th zoals in Engels “think”, tong tussen de tanden'), 'tip'],
    ['ج', 'jiim', 'جِيم', tx('j as in “jam”', 'dj zoals in “jeans”'), 'middle'],
    ['ح', 'ḥaa', 'حَاء', tx('a sharp, breathy h from the middle of the throat, as if you breathe on glasses', 'scherpe, geblazen h uit het midden van de keel, alsof je op een bril blaast'), 'throat'],
    ['خ', 'khaa', 'خَاء', tx('ch as in Scottish “loch”, heavy', 'de Nederlandse g/ch van “goed”, zwaar'), 'throat'],
    ['د', 'daal', 'دَال', tx('d as in “day”', 'd zoals in “dak”'), 'tip'],
    ['ذ', 'dhaal', 'ذَال', tx('th as in “this”, tongue between the teeth', 'th zoals in Engels “this”, tong tussen de tanden'), 'tip'],
    ['ر', 'raa', 'رَاء', tx('a rolled r with one tap of the tongue', 'gerolde tong-r met één tik'), 'tip'],
    ['ز', 'zaay', 'زَاي', tx('z as in “zoo”', 'z zoals in “zon”'), 'tip'],
    ['س', 'siin', 'سِين', tx('s as in “sun”', 'scherpe s zoals in “sok”'), 'tip'],
    ['ش', 'shiin', 'شِين', tx('sh as in “shoe”', 'sj zoals in “sjaal”'), 'middle'],
    ['ص', 'ṣaad', 'صَاد', tx('a heavy, full s; the back of the tongue rises', 'zware, volle s; tongrug omhoog'), 'tip'],
    ['ض', 'ḍaad', 'ضَاد', tx('a heavy d made with the side of the tongue', 'zware d met de zijkant van de tong'), 'side'],
    ['ط', 'ṭaa', 'طَاء', tx('a heavy, full t', 'zware, volle t'), 'tip'],
    ['ظ', 'ẓaa', 'ظَاء', tx('a heavy “th” as in “this”', 'zware “th” van “this”'), 'tip'],
    ['ع', 'ʿayn', 'عَيْن', tx('a squeezed sound from the middle of the throat; new for most learners', 'geknepen klank uit het midden van de keel; nieuw voor de meeste mensen'), 'throat'],
    ['غ', 'ghayn', 'غَيْن', tx('a gargled r, like the French r in “Paris”', 'gegorgelde r, zoals de Franse r in “Paris”'), 'throat'],
    ['ف', 'faa', 'فَاء', tx('f as in “fish”', 'f zoals in “fiets”'), 'lips'],
    ['ق', 'qaaf', 'قَاف', tx('a deep k at the back of the throat, heavy', 'diepe k achter in de keel, zwaar'), 'back'],
    ['ك', 'kaaf', 'كَاف', tx('k as in “kite”', 'k zoals in “kat”'), 'back'],
    ['ل', 'laam', 'لَام', tx('l as in “lamp”', 'l zoals in “lamp”'), 'tip'],
    ['م', 'miim', 'مِيم', tx('m as in “moon”', 'm zoals in “maan”'), 'lips'],
    ['ن', 'nuun', 'نُون', tx('n as in “nose”', 'n zoals in “neus”'), 'tip'],
    ['ه', 'haa', 'هَاء', tx('a soft h as in “house”', 'zachte h zoals in “huis”'), 'throat'],
    ['و', 'waaw', 'وَاو', tx('w as in “water”, lips rounded', 'w zoals in Engels “water”, lippen rond'), 'lips'],
    ['ي', 'yaa', 'يَاء', tx('y as in “yes”', 'j zoals in “ja”'), 'middle'],
    ['ء', 'hamza', 'هَمْزَة', tx('a short catch in the throat, as in “uh-oh”', 'korte stemstop, zoals tussen “be-amen”'), 'throat']
];

export const PLACES = {
    jawf: tx('Mouth cavity', 'Mondholte'),
    throat: tx('Throat', 'Keel'),
    back: tx('Back of the tongue', 'Achterkant tong'),
    middle: tx('Middle of the tongue', 'Midden van de tong'),
    side: tx('Side of the tongue', 'Zijkant tong'),
    tip: tx('Tip of the tongue', 'Tongpunt'),
    lips: tx('Lips', 'Lippen')
};

export const HEAVY = 'خصضغطقظ';
export const QALQALAH = 'قطبجد';
export const SUN = 'تثدذرزسشصضطظلن';
export const NON_JOINING = 'اءدذرزو';

/* Example word with al- for every sun and moon letter: [word, transliteration, meaning] */
export const SUN_MOON = {
    'ا': ['الْأَرْضُ', 'al-arḍ', tx('the earth', 'de aarde')],
    'ب': ['الْبَيْتُ', 'al-bayt', tx('the house', 'het huis')],
    'ج': ['الْجَنَّةُ', 'al-jannah', tx('paradise', 'het paradijs')],
    'ح': ['الْحَمْدُ', 'al-ḥamd', tx('the praise', 'de lof')],
    'خ': ['الْخَيْرُ', 'al-khayr', tx('the good', 'het goede')],
    'ع': ['الْعِلْمُ', 'al-ʿilm', tx('knowledge', 'de kennis')],
    'غ': ['الْغَفُورُ', 'al-ghafūr', tx('the Forgiving', 'de Vergevende')],
    'ف': ['الْفَجْرُ', 'al-fajr', tx('the dawn', 'de dageraad')],
    'ق': ['الْقَمَرُ', 'al-qamar', tx('the moon', 'de maan')],
    'ك': ['الْكِتَابُ', 'al-kitāb', tx('the book', 'het boek')],
    'م': ['الْمَاءُ', 'al-māʾ', tx('the water', 'het water')],
    'ه': ['الْهُدَى', 'al-hudā', tx('the guidance', 'de leiding')],
    'و': ['الْوَلَدُ', 'al-walad', tx('the child', 'het kind')],
    'ي': ['الْيَوْمُ', 'al-yawm', tx('the day', 'de dag')],
    'ت': ['التَّوْبَةُ', 'at-tawbah', tx('repentance', 'het berouw')],
    'ث': ['الثَّوَابُ', 'ath-thawāb', tx('the reward', 'de beloning')],
    'د': ['الدِّينُ', 'ad-dīn', tx('the religion', 'de religie')],
    'ذ': ['الذِّكْرُ', 'adh-dhikr', tx('remembrance', 'het gedenken')],
    'ر': ['الرَّحْمٰنُ', 'ar-raḥmān', tx('the Most Merciful', 'de Barmhartige')],
    'ز': ['الزَّكَاةُ', 'az-zakāh', tx('the zakat', 'de zakaat')],
    'س': ['السَّلَامُ', 'as-salām', tx('peace', 'de vrede')],
    'ش': ['الشَّمْسُ', 'ash-shams', tx('the sun', 'de zon')],
    'ص': ['الصَّبْرُ', 'aṣ-ṣabr', tx('patience', 'het geduld')],
    'ض': ['الضُّحَى', 'aḍ-ḍuḥā', tx('the forenoon', 'de ochtend')],
    'ط': ['الطَّرِيقُ', 'aṭ-ṭarīq', tx('the way', 'de weg')],
    'ظ': ['الظُّلْمُ', 'aẓ-ẓulm', tx('injustice', 'het onrecht')],
    'ل': ['اللَّيْلُ', 'al-layl', tx('the night', 'de nacht')],
    'ن': ['النَّاسُ', 'an-nās', tx('the people', 'de mensen')]
};

/* Vowel signs for the vowel lab: [mark added after the letter, label, sound] */
export const MODS = {
    a: ['َ', tx('fatha · a', 'fatha · a'), 'a'],
    i: ['ِ', tx('kasra · i', 'kasra · i'), 'i'],
    u: ['ُ', tx('damma · u', 'damma · u'), 'u'],
    aa: ['َا', tx('long · aa', 'lang · aa'), 'aa'],
    ii: ['ِي', tx('long · ii', 'lang · ii'), 'ii'],
    uu: ['ُو', tx('long · uu', 'lang · uu'), 'uu'],
    an: ['ًا', tx('tanween · an', 'tanwien · an'), 'an'],
    in: ['ٍ', tx('tanween · in', 'tanwien · in'), 'in'],
    un: ['ٌ', tx('tanween · un', 'tanwien · un'), 'un'],
    sukoon: ['ْ', tx('sukoon', 'sukoon'), '']
};

export const TRANSLIT = {
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'ḥ', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 'ṣ', 'ض': 'ḍ', 'ط': 'ṭ', 'ظ': 'ẓ', 'ع': 'ʿ', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y'
};

/* Letters used in the vowel lab and the vowel game. */
export const LAB_LETTERS = LETTERS.map(letter => letter[0]).filter(letter => !'اء'.includes(letter));

/* Text played for a letter in the lab: with sukoon, a short a goes in front. */
export function labText(letter, mod) {
    return mod === 'sukoon' ? `أَ${letter}ْ` : letter + MODS[mod][0];
}

/* The five areas of articulation: [title, text, icon path, points]; point = [letters, text, sounds] */
export const MAKHARIJ = [
    [tx('Mouth cavity (al-Jawf)', 'Mondholte (al-Jawf)'), tx('The empty space of mouth and throat, for the long vowels.', 'De lege ruimte van mond en keel, voor de lange klinkers.'),
        'M4 12h16M7 8c2-2 8-2 10 0M7 16c2 2 8 2 10 0',
        [['ا و ي', tx('only as a madd letter (long)', 'alleen als madd-letter (lang)'), ['بَا', 'بُو', 'بِي']]]],
    [tx('Throat (al-Ḥalq)', 'Keel (al-Ḥalq)'), tx('Three points, from deep to shallow.', 'Drie punten, van diep naar ondiep.'),
        'M9 3v8a3 3 0 0 0 6 0V3M12 14v7',
        [['ء ه', tx('deepest part', 'diepste deel'), ['أَءْ', 'أَهْ']],
            ['ع ح', tx('middle', 'midden'), ['أَعْ', 'أَحْ']],
            ['غ خ', tx('closest to the mouth', 'dichtst bij de mond'), ['أَغْ', 'أَخْ']]]],
    [tx('Tongue (al-Lisaan)', 'Tong (al-Lisaan)'), tx('Ten points: most of the letters.', 'Tien punten: de meeste letters.'),
        'M4 14c3-5 13-5 16 0-3 4-13 4-16 0z',
        [['ق', tx('back of the tongue, soft palate', 'achterkant tong, zacht gehemelte'), ['أَقْ']],
            ['ك', tx('a little further forward', 'iets verder naar voren'), ['أَكْ']],
            ['ج ش ي', tx('middle of the tongue', 'midden van de tong'), ['أَجْ', 'أَشْ', 'أَيْ']],
            ['ض', tx('side of the tongue against the molars', 'zijkant van de tong tegen de kiezen'), ['أَضْ']],
            ['ل ن ر', tx('tip of the tongue against the gums', 'tongpunt tegen het tandvlees'), ['أَلْ', 'أَنْ', 'أَرْ']],
            ['ت د ط', tx('tip of the tongue against the upper teeth', 'tongpunt tegen de boventanden'), ['أَتْ', 'أَدْ', 'أَطْ']],
            ['ص س ز', tx('tip of the tongue near the lower teeth, air between', 'tongpunt bij de ondertanden, lucht ertussen'), ['أَصْ', 'أَسْ', 'أَزْ']],
            ['ث ذ ظ', tx('tongue between the teeth', 'tong tussen de tanden'), ['أَثْ', 'أَذْ', 'أَظْ']]]],
    [tx('Lips (ash-Shafataan)', 'Lippen (ash-Shafataan)'), tx('Two points.', 'Twee punten.'),
        'M4 12c4-4 12-4 16 0-4 4-12 4-16 0z',
        [['ف', tx('upper teeth on the lower lip', 'boventanden op onderlip'), ['أَفْ']],
            ['ب م و', tx('both lips', 'beide lippen'), ['أَبْ', 'أَمْ', 'أَوْ']]]],
    [tx('Nose (al-Khayshoom)', 'Neus (al-Khayshuum)'), tx('The nasal sound (ghunnah) of ن and م.', 'De neusklank (ghunnah) bij ن en م.'),
        'M12 3v10l-3 4h6',
        [['ن م', tx('ghunnah', 'ghunnah'), ['إِنَّ', 'ثُمَّ']]]]
];

/* Rule rows: [h(eavy) or l(ight) or a vowel, text, example] */
const RAA_OWN = [
    ['h', tx('ر with fatha', 'ر met fatha'), 'رَبِّ'],
    ['h', tx('ر with damma', 'ر met damma'), 'رُسُلٌ'],
    ['l', tx('ر with kasra', 'ر met kasra'), 'رِزْقٌ']
];
const RAA_SUKOON = [
    ['h', tx('Letter before: fatha', 'Letter ervoor: fatha'), 'أَرْضٌ'],
    ['h', tx('Letter before: damma', 'Letter ervoor: damma'), 'قُرْآنٌ'],
    ['h', tx('Silent letter + fatha/damma before', 'Stil + fatha/damma ervoor'), 'وَالْعَصْرْ'],
    ['l', tx('Letter before: kasra', 'Letter ervoor: kasra'), 'فِرْعَوْنَ'],
    ['l', tx('A silent ي before', 'Ervoor een stille ي'), 'خَيْرْ'],
    ['l', tx('Silent letter + kasra before', 'Stil + kasra ervoor'), 'ذِكْرْ']
];
const ALLAH_RULES = [
    ['h', tx('Fatha before', 'Fatha ervoor'), 'قَالَ ٱللَّهُ'],
    ['h', tx('Damma before', 'Damma ervoor'), 'نَصْرُ ٱللَّهِ'],
    ['l', tx('Kasra before', 'Kasra ervoor'), 'بِسْمِ ٱللَّهِ']
];
const WASL_RULES = [
    ['a', tx('With ٱلْ (the article)', 'Bij ٱلْ (lidwoord)'), 'ٱلْحَمْدُ'],
    ['u', tx('Third letter has damma', 'Derde letter heeft damma'), 'ٱنْصُرْنَا'],
    ['i', tx('Third letter has fatha or kasra', 'Derde letter heeft fatha of kasra'), 'ٱذْهَبْ'],
    ['i', tx('Also in: ٱسْمٌ، ٱبْنٌ', 'Ook bij: ٱسْمٌ، ٱبْنٌ'), 'ٱبْنُ']
];

/* Stop signs: [sign as a combining mark, how it is shown here, meaning, explanation] */
export const STOP_SIGNS = [
    ['ۘ', 'مـ', tx('Must stop', 'Verplicht stoppen'), tx('Otherwise the meaning changes', 'Anders verandert de betekenis')],
    ['ۙ', 'لا', tx('Do not stop', 'Niet stoppen'), tx('Keep reading', 'Lees door')],
    ['ۚ', 'ج', tx('Either is fine', 'Mag allebei'), tx('Stop or continue', 'Stoppen of doorgaan')],
    ['ۖ', 'صلى', tx('Better to continue', 'Liever doorgaan'), tx('Stopping is allowed', 'Stoppen mag')],
    ['ۗ', 'قلى', tx('Better to stop', 'Liever stoppen'), tx('Continuing is allowed', 'Doorgaan mag')],
    ['ۛ', '∴ ∴', tx('Stop at one of the two', 'Stop bij één van de twee'), tx('Not at both', 'Niet bij allebei')],
    ['ۜ', 'س', tx('Short pause', 'Korte pauze'), tx('Without taking a breath', 'Zonder adem te halen')]
];

const PAIRS = [['س', 'ص'], ['ت', 'ط'], ['د', 'ض'], ['ذ', 'ظ'], ['ك', 'ق'], ['ه', 'ح']];

/* Example row: [Arabic, transliteration, meaning, text to play (optional)] */
const ex = (ar, tr, en, nl, say) => [ar, tr, tx(en, nl), say];

/* Answer options that need translating. */
const O = {
    heavy: tx('Heavy', 'Zwaar'), light: tx('Light', 'Licht'),
    sun: tx('Sun', 'Zon'), moon: tx('Moon', 'Maan'),
    yes: tx('Yes', 'Ja'), no: tx('No', 'Nee'),
    sunGame: tx('☀ Sun – ل silent', '☀ Zon – ل stil'), moonGame: tx('☾ Moon – ل heard', '☾ Maan – ل hoorbaar')
};
export const OPTIONS = O;

/*
 * Lessons. Card: { h, p, w (widget), mods, ex, tip }. Quiz question:
 * { q, opts, a, ar (Arabic options), big (Arabic shown large), say (played), why }.
 * Texts in p and tip may hold simple HTML.
 */
export const LESSONS = [
    {
        id: 'alphabet', ar: 'أ',
        t: tx('The alphabet', 'Het alfabet'), s: tx('28 letters, from right to left', '28 letters, van rechts naar links'),
        cards: [
            { h: tx('28 letters, from right to left', '28 letters, van rechts naar links'),
                p: tx('Arabic is read and written from <b>right to left</b>. The alphabet has 28 letters, plus the hamza (ء). Tap a letter to hear its name.',
                    'Arabisch lees en schrijf je van <b>rechts naar links</b>. Het alfabet heeft 28 letters, plus de hamza (ء). Tik op een letter om de naam te horen.'),
                w: 'alphabet' },
            { h: tx('Good news: you already know many', 'Goed nieuws: veel ken je al'),
                p: tx('These letters sound (almost) like in English. That is already half the alphabet.', 'Deze letters klinken (bijna) zoals in het Nederlands. Daarmee heb je al de helft.'),
                letters: 'بتدرزسفكلمنهوي' },
            { h: tx('New sounds', 'Nieuwe klanken'),
                p: tx('These letters are new. Read the hint, listen and say them out loud.', 'Deze letters zijn nieuw. Lees de hint, luister en zeg ze hardop na. Als Nederlandstalige heb je een voordeel: de <b>خ</b> is gewoon onze g van “goed”.'),
                letters: 'ثذحخعغقصضطظء',
                tip: tx('Take your time with <b>ع</b> and <b>ح</b>. Repeat them a few times a day.', 'Neem de tijd voor <b>ع</b> en <b>ح</b>. Die bestaan niet in het Nederlands, dus herhaal ze een paar keer per dag.') }
        ],
        quiz: [
            { q: tx('Which way do you read Arabic?', 'Welke kant op lees je Arabisch?'), opts: [tx('From right to left', 'Van rechts naar links'), tx('From left to right', 'Van links naar rechts'), tx('From top to bottom', 'Van boven naar beneden')], a: 0 },
            { q: tx('Which letter sounds like the ch in “loch” (the Dutch g in “goed”)?', 'Welke letter klinkt als de Nederlandse g in “goed”?'), opts: ['خ', 'ح', 'غ', 'ج'], ar: true, a: 0, why: tx('خ (khaa).', 'خ (khaa) is de g/ch van “goed”.') },
            { q: tx('Which letter do you hear?', 'Welke letter hoor je?'), say: 'جِيم', opts: ['ج', 'ح', 'خ', 'ك'], ar: true, a: 0 },
            { q: tx('Which letter sounds like “sh” in “shoe”?', 'Welke letter klinkt als “sj” in “sjaal”?'), opts: ['س', 'ش', 'ص', 'ث'], ar: true, a: 1 },
            { q: tx('Which letter do you hear?', 'Welke letter hoor je?'), say: 'قَاف', opts: ['ك', 'ق', 'ف', 'غ'], ar: true, a: 1, why: tx('قَاف: the deep k at the back of the throat.', 'قَاف: de diepe k achter in de keel.') }
        ]
    },
    {
        id: 'forms', ar: 'ب',
        t: tx('Letter shapes', 'Lettervormen'), s: tx('Start, middle, end and joining', 'Begin, midden, eind en verbinden'),
        cards: [
            { h: tx('One letter, four shapes', 'Eén letter, vier vormen'),
                p: tx('Arabic is joined-up writing, so a letter changes its shape a little: <b>isolated</b>, at the <b>start</b>, in the <b>middle</b> or at the <b>end</b> of a word. Pick a letter.',
                    'Arabisch is aan elkaar geschreven. Daarom verandert een letter een beetje van vorm: <b>los</b>, aan het <b>begin</b>, in het <b>midden</b> of aan het <b>eind</b> van een woord. Kies een letter.'),
                w: 'forms' },
            { h: tx('Six letters are different', 'Zes letters zijn eigenwijs'),
                p: tx('These letters only join the letter <b>before</b> them (on the right), never the letter after. After them the word starts “fresh”.',
                    'Deze letters verbinden alleen met de letter <b>ervoor</b> (rechts), nooit met de letter erna. Na deze letters begint het woord dus “opnieuw”.'),
                w: 'nonjoin',
                ex: [ex('وَرْدٌ', 'ward', 'rose: only non-joining letters!', 'roos: alleen eigenwijze letters!'), ex('دَارٌ', 'dār', 'house', 'huis')] },
            { h: tx('Building words', 'Woorden bouwen'), p: tx('See how single letters become a word.', 'Zie hoe losse letters samen een woord worden.'),
                ex: [ex('كِتَابٌ', 'k + t + aa + b', 'book', 'boek'), ex('مَسْجِدٌ', 'm + s + j + d', 'mosque', 'moskee'), ex('نُورٌ', 'n + uu + r', 'light', 'licht'), ex('قَلَمٌ', 'q + l + m', 'pen', 'pen')] }
        ],
        quiz: [
            { q: tx('Which letter does NOT join the letter after it?', 'Welke letter verbindt NIET met de letter erna?'), opts: ['ب', 'ر', 'م', 'ك'], ar: true, a: 1 },
            { q: tx('What is the middle shape of ب?', 'Wat is de middenvorm van ب?'), opts: ['بـ', 'ـبـ', 'ـب', 'ب'], ar: true, a: 1 },
            { q: tx('Which letters make نُور (light)?', 'Uit welke letters bestaat نُور (licht)?'), opts: ['ن + و + ر', 'ن + ر + و', 'ب + و + ر'], a: 0 },
            { q: tx('Which group are all non-joining letters?', 'Welke groep zijn allemaal “eigenwijze” letters?'), opts: ['ا د ذ ر ز و', 'ا ب ت ث ج ح', 'س ش ص ض ط ظ'], a: 0 }
        ]
    },
    {
        id: 'makharij', ar: 'خ',
        t: tx('Makharij', 'Makharij'), s: tx('Where does each sound come from?', 'Waar komt elke klank vandaan?'),
        cards: [
            { h: tx('What is a makhraj?', 'Wat is een makhraj?'),
                p: tx('A <b>makhraj</b> (مَخْرَج) is the place where a sound is made: in the throat, on the tongue, at the lips or in the nose. There are <b>5 areas</b> with <b>17 points</b> in total.',
                    'Een <b>makhraj</b> (مَخْرَج) is de plek waar een klank ontstaat: in de keel, op de tong, bij de lippen of in de neus. Er zijn <b>5 gebieden</b> met samen <b>17 punten</b>.'),
                tip: tx('<b>Test trick:</b> put a short “a” before the letter with sukoon, for example <span class="tj-ar">أَبْ</span> “ab”. Where your mouth stops is the makhraj.',
                    '<b>Testtrucje:</b> zet een korte “a” voor de letter met sukoon, bijvoorbeeld <span class="tj-ar">أَبْ</span> “ab”. Waar je mond stopt, daar zit de makhraj.') },
            { h: tx('Explore the 5 areas', 'Ontdek de 5 gebieden'), p: tx('Open an area, then tap the letters to hear them with the “a” trick.', 'Open een gebied en tik daarna op de letters om ze met de “a-truc” te horen.'), w: 'makharij' }
        ],
        quiz: [
            { q: tx('What does makhraj mean?', 'Wat betekent makhraj?'), opts: [tx('The place where a sound is made', 'De plek waar een klank ontstaat'), tx('A vowel sign', 'Een klinkerteken'), tx('A stop sign', 'Een stopteken')], a: 0 },
            { q: tx('Which letters do you make with both lips?', 'Welke letters maak je met beide lippen?'), opts: ['ب م و', 'ف ق ك', 'ت د ط'], a: 0 },
            { q: tx('How do you make ف?', 'Hoe maak je de ف?'), opts: [tx('Upper teeth on the lower lip', 'Boventanden op de onderlip'), tx('Both lips together', 'Beide lippen op elkaar'), tx('Tongue against the palate', 'Tong tegen het gehemelte')], a: 0 },
            { q: tx('Where does the nasal sound (ghunnah) come from?', 'Waar komt de neusklank (ghunnah) vandaan?'), opts: [tx('The nose', 'Uit de neusholte'), tx('The deep throat', 'Uit de diepe keel'), tx('The tip of the tongue', 'Van de tongpunt')], a: 0 },
            { q: tx('Which letters come from the deepest part of the throat?', 'Welke letters komen uit het diepste deel van de keel?'), opts: ['ء ه', 'غ خ', 'ع ح'], a: 0,
                why: tx('ء and ه are deepest, ع ح in the middle, غ خ closest to the mouth.', 'ء en ه zitten het diepst, ع ح in het midden, غ خ het dichtst bij de mond.') }
        ]
    },
    {
        id: 'heavy', ar: 'ق',
        t: tx('Heavy and light', 'Zwaar en licht'), s: tx('Tafkheem and tarqeeq', 'Tafkhiim en tarqiiq'),
        cards: [
            { h: tx('Seven heavy letters', 'Zeven zware letters'),
                p: tx('With these letters the back of your tongue rises and your mouth feels “full”. This is <b>tafkheem</b>. To remember them: <span class="tj-ar tj-gold">خُصَّ ضَغْطٍ قِظْ</span>',
                    'Bij deze letters gaat de achterkant van je tong omhoog en voelt je mond “vol”. Dat heet <b>tafkhiim</b>. Ezelsbruggetje: <span class="tj-ar tj-gold">خُصَّ ضَغْطٍ قِظْ</span>'),
                w: 'heavyset' },
            { h: tx('Hear the difference', 'Hoor het verschil'), p: tx('Each pair sounds alike, but the second one is heavy. Listen to both.', 'Elk paar lijkt op elkaar, maar de tweede is zwaar. Luister naar beide.'), w: 'pairs' },
            { h: tx('Light is the default', 'Licht is de standaard'),
                p: tx('All other letters are <b>light</b> (tarqeeq): relaxed tongue, flat lips. Two letters change: <b>ر</b> and the <b>ل</b> in “Allah”. They have their own lessons.',
                    'Alle andere letters zijn <b>licht</b> (tarqiiq): ontspannen tong, platte lippen. Twee uitzonderingen wisselen: <b>ر</b> en de <b>ل</b> in “Allah”. Daar komen aparte lessen voor.'),
                tip: tx('With a heavy letter a fatha sounds darker: <span class="tj-ar">صَ</span> sounds fuller than <span class="tj-ar">سَ</span>.', 'Bij een zware letter klinkt een fatha donkerder: <span class="tj-ar">صَ</span> klinkt voller dan <span class="tj-ar">سَ</span>.') }
        ],
        quiz: [
            { q: tx('Which letter is heavy?', 'Welke letter is zwaar?'), opts: ['ص', 'س', 'ت', 'ك'], ar: true, a: 0 },
            { q: tx('Which letter is light?', 'Welke letter is licht?'), opts: ['ط', 'ق', 'د', 'ظ'], ar: true, a: 2 },
            { q: tx('How many heavy letters are there?', 'Hoeveel zware letters zijn er?'), opts: ['5', '7', '14'], a: 1 },
            { q: tx('Which letters can be heavy or light?', 'Welke letters kunnen zwaar óf licht zijn?'), opts: [tx('ر and the ل of Allah', 'ر en de ل van Allah'), tx('ب and م', 'ب en م'), tx('ص and ض', 'ص en ض')], a: 0 }
        ]
    },
    {
        id: 'short', ar: 'بَ',
        t: tx('Short vowels', 'Korte klinkers'), s: tx('Fatha, kasra, damma', 'Fatha, kasra, damma'),
        cards: [
            { h: tx('Vowels are small marks', 'Klinkers zijn streepjes'),
                p: tx('Short vowels are not written as letters but as small marks above or below a letter. Together they are called <b>harakaat</b> (“movements”).',
                    'Korte klinkers schrijf je niet als letters maar als tekentjes boven of onder de letter. Samen heten ze <b>harakaat</b> (“bewegingen”).'),
                ex: [ex('بَ', 'ba', 'fatha: a stroke above, “a”', 'fatha: streepje erboven, “a”'), ex('بِ', 'bi', 'kasra: a stroke below, “i”', 'kasra: streepje eronder, “i”'), ex('بُ', 'bu', 'damma: a small curl above, “u”', 'damma: krulletje erboven, “u”')] },
            { h: tx('Vowel lab', 'Klinker-lab'), p: tx('Pick a letter and a vowel and hear how it sounds.', 'Kies een letter en een klinker en hoor hoe hij klinkt.'), w: 'lab', mods: ['a', 'i', 'u'] },
            { h: tx('One mark, another meaning', 'Eén streepje, andere betekenis'), p: tx('Pay attention: another mark can make a completely different word.', 'Let goed op: een ander tekentje kan een heel ander woord maken.'),
                ex: [ex('كِتَابٌ', 'kitābun', 'a book', 'een boek'), ex('كُتُبٌ', 'kutubun', 'books', 'boeken'), ex('كَتَبَ', 'kataba', 'he wrote', 'hij schreef')],
                tip: tx('Fatha: open your mouth a little. Kasra: corners of the mouth slightly sideways. Damma: lips rounded forward.', 'Fatha: mond iets open. Kasra: mondhoeken iets naar opzij. Damma: lippen rond naar voren.') }
        ],
        quiz: [
            { q: tx('How do you read this?', 'Hoe lees je dit?'), big: 'بِ', opts: ['ba', 'bi', 'bu'], a: 1 },
            { q: tx('How do you read this?', 'Hoe lees je dit?'), big: 'تُ', opts: ['ta', 'ti', 'tu'], a: 2 },
            { q: tx('Which mark gives an “a” sound?', 'Welk teken geeft een “a”-klank?'), opts: ['Fatha', 'Kasra', 'Damma'], a: 0 },
            { q: tx('Which one do you hear?', 'Welke hoor je?'), say: 'كُ', opts: ['كَ', 'كِ', 'كُ'], ar: true, a: 2 }
        ]
    },
    {
        id: 'long', ar: 'بَا',
        t: tx('Long vowels', 'Lange klinkers'), s: tx('Madd: two counts', 'Madd: twee tellen'),
        cards: [
            { h: tx('Three madd letters', 'Drie madd-letters'),
                p: tx('With ا و ي a vowel becomes <b>twice as long</b>: two counts. They only work with the matching short vowel before them.',
                    'Met ا و ي maak je een klinker <b>twee keer zo lang</b>: twee tellen. Ze werken alleen samen met de juiste korte klinker ervoor.'),
                ex: [ex('بَا', 'baa', 'fatha + ا', 'fatha + ا'), ex('بُو', 'buu', 'damma + و', 'damma + و'), ex('بِي', 'bii', 'kasra + ي', 'kasra + ي')] },
            { h: tx('Vowel lab', 'Klinker-lab'), p: tx('Compare short and long. Count in your head: one count against two.', 'Vergelijk kort en lang. Tel in je hoofd: één tel tegen twee tellen.'), w: 'lab', mods: ['a', 'aa', 'i', 'ii', 'u', 'uu'] },
            { h: tx('Short or long? A big difference', 'Kort of lang? Groot verschil'), p: tx('Both forms are read in Al-Fatiha. Can you hear the difference?', 'In Al-Faatiha lees je beide vormen. Hoor je het verschil?'),
                ex: [ex('مَلِكِ', 'maliki', 'king', 'koning'), ex('مَالِكِ', 'māliki', 'owner', 'eigenaar')] },
            { h: tx('Practice words', 'Oefenwoorden'), p: tx('Read aloud and hold the long sound for two counts.', 'Lees hardop en houd de lange klank twee tellen vast.'),
                ex: [ex('قَالَ', 'qāla', 'he said', 'hij zei'), ex('دِينٌ', 'dīnun', 'religion', 'religie'), ex('نُورٌ', 'nūrun', 'light', 'licht'), ex('كَرِيمٌ', 'karīmun', 'generous', 'edelmoedig'), ex('غَفُورٌ', 'ghafūrun', 'forgiving', 'vergevend'), ex('عَالِمٌ', 'ʿālimun', 'scholar', 'geleerde')] }
        ],
        quiz: [
            { q: tx('What are the three madd letters?', 'Wat zijn de drie madd-letters?'), opts: ['ا و ي', 'ب ت ث', 'ق ط ب'], a: 0 },
            { q: tx('How long is a madd?', 'Hoe lang duurt een madd?'), opts: [tx('1 count', '1 tel'), tx('2 counts', '2 tellen'), tx('6 counts', '6 tellen')], a: 1 },
            { q: tx('Which vowel comes before the madd ي?', 'Welke klinker hoort vóór de ي van madd?'), opts: ['Fatha', 'Kasra', 'Damma'], a: 1 },
            { q: tx('How do you read this?', 'Hoe lees je dit?'), big: 'نُو', opts: ['nu', 'nuu', 'naa'], a: 1 }
        ]
    },
    {
        id: 'tanween', ar: 'بٌ',
        t: tx('Tanween', 'Tanwien'), s: tx('-an, -in, -un at the end', '-an, -in, -un aan het eind'),
        cards: [
            { h: tx('Double marks = an extra “n”', 'Dubbele tekentjes = extra “n”'),
                p: tx('A double vowel mark at the <b>end</b> of a word adds an “n”, without a written ن. This is <b>tanween</b>.',
                    'Een dubbel klinkerteken aan het <b>eind</b> van een woord voegt een “n” toe, zonder dat er een ن staat. Dat is <b>tanwien</b>.'),
                ex: [ex('كِتَابًا', 'kitāban', 'fathatayn: “an”', 'fathatayn: “an”'), ex('كِتَابٍ', 'kitābin', 'kasratayn: “in”', 'kasratayn: “in”'), ex('كِتَابٌ', 'kitābun', 'dammatayn: “un”', 'dammatayn: “un”')] },
            { h: tx('Vowel lab', 'Klinker-lab'), p: tx('Try it yourself with different letters.', 'Probeer het zelf met verschillende letters.'), w: 'lab', mods: ['an', 'in', 'un'] },
            { h: tx('“A” book', '“Een” boek'), p: tx('Tanween usually means “a” (indefinite). With ال in front it becomes “the”.', 'Tanwien betekent meestal “een” (onbepaald). Met ال ervoor wordt het “het/de”.'),
                ex: [ex('كِتَابٌ', 'kitābun', 'a book', 'een boek'), ex('الْكِتَابُ', 'al-kitābu', 'the book', 'het boek'), ex('رَجُلٌ', 'rajulun', 'a man', 'een man'), ex('مَسْجِدٍ', 'masjidin', 'a mosque', 'een moskee')],
                tip: tx('With fathatayn there is often an extra ا: <span class="tj-ar">قَلَمًا</span>. You do not pronounce that ا while reading on.', 'Bij fathatayn staat er vaak een extra ا achter: <span class="tj-ar">قَلَمًا</span>. Die ا spreek je niet uit tijdens het doorlezen.') }
        ],
        quiz: [
            { q: tx('How do you read this?', 'Hoe lees je dit?'), big: 'بٍ', opts: ['ban', 'bin', 'bun'], a: 1 },
            { q: tx('Where is tanween written?', 'Waar staat tanwien?'), opts: [tx('Only at the end of a word', 'Alleen aan het eind van een woord'), tx('Anywhere', 'Overal'), tx('Only at the start', 'Alleen aan het begin')], a: 0 },
            { q: tx('What does كِتَابٌ mean?', 'Wat betekent كِتَابٌ?'), opts: [tx('a book', 'een boek'), tx('the book', 'het boek'), tx('books', 'boeken')], a: 0 }
        ]
    },
    {
        id: 'sukoon', ar: 'بْ',
        t: tx('Sukoon', 'Sukoon'), s: tx('The silent letter', 'Stille letter'),
        cards: [
            { h: tx('The little circle: no vowel', 'Het rondje: geen klinker'),
                p: tx('A <b>sukoon</b> (ْ) is a small circle above a letter. That letter gets <b>no vowel</b>: say it briefly and move straight on. In the Quran it sometimes looks like ۡ.',
                    'Een <b>sukoon</b> (ْ) is een klein rondje boven een letter. Die letter krijgt <b>geen klinker</b>: je zegt hem kort en gaat meteen door. In de Koran ziet hij er soms uit als ۡ.'),
                ex: [ex('أَبْ', 'ab', 'b with sukoon', 'b met sukoon'), ex('أَنْ', 'an', 'n with sukoon', 'n met sukoon'), ex('أَسْ', 'as', 's with sukoon', 's met sukoon')] },
            { h: tx('Practice words', 'Oefenwoorden'), p: tx('Attach the silent letter to the syllable before it.', 'Plak de stille letter aan de lettergreep ervoor.'),
                ex: [ex('أَكْبَرُ', 'ak-ba-ru', 'greater', 'groter'), ex('يَكْتُبُ', 'yak-tu-bu', 'he writes', 'hij schrijft'), ex('قَلْبٌ', 'qal-bun', 'heart', 'hart'), ex('مِنْهُمْ', 'min-hum', 'from them', 'van hen'), ex('مَكْتَبٌ', 'mak-ta-bun', 'desk', 'bureau')] },
            { h: tx('Vowel lab', 'Klinker-lab'), p: tx('Compare a letter with a vowel and with sukoon (using the “a” trick).', 'Vergelijk de letter met een klinker en met sukoon (met de “a”-truc).'), w: 'lab', mods: ['a', 'i', 'u', 'sukoon'] }
        ],
        quiz: [
            { q: tx('What does a sukoon mean?', 'Wat betekent een sukoon?'), opts: [tx('The letter has no vowel', 'De letter heeft geen klinker'), tx('The letter is doubled', 'De letter wordt dubbel'), tx('Hold it long', 'Lang aanhouden')], a: 0 },
            { q: tx('How do you read قَلْبٌ?', 'Hoe lees je قَلْبٌ?'), opts: ['qa-la-bun', 'qal-bun', 'qaa-lib'], a: 1 },
            { q: tx('Can a word start with a sukoon?', 'Kan een woord met een sukoon beginnen?'), opts: [O.yes, O.no], a: 1, why: tx('A sukoon always comes after a letter with a vowel.', 'Een sukoon komt altijd na een letter met een klinker.') }
        ]
    },
    {
        id: 'qalqalah', ar: 'قْ',
        t: tx('Qalqalah', 'Qalqalah'), s: tx('The five bouncing letters', 'De vijf stuiterletters'),
        cards: [
            { h: tx('Five letters that bounce', 'Vijf letters die stuiteren'),
                p: tx('<b>Qalqalah</b> means “vibration”. Five letters get a light bounce when they have a <b>sukoon</b> or when you <b>stop</b> on them. To remember them: <span class="tj-ar tj-gold">قُطْبُ جَدٍّ</span>',
                    '<b>Qalqalah</b> betekent “trilling”. Vijf letters krijgen een licht stuitertje als ze een <b>sukoon</b> hebben of als je erop <b>stopt</b>. Ezelsbruggetje: <span class="tj-ar tj-gold">قُطْبُ جَدٍّ</span>'),
                w: 'qalqset' },
            { h: tx('Inside a word', 'In het midden van een woord'), p: tx('A short echo, not a real vowel. So not “qa-da” but “qad” with a small bounce.', 'Een korte echo, geen echte klinker. Zeg dus niet “qa-da” maar “qad” met een klein stuitertje.'),
                ex: [ex('قَدْ', 'qad', 'indeed', 'al/zeker'), ex('اقْرَأْ', 'iqraʾ', 'read!', 'lees!'), ex('أَطْعَمَهُمْ', 'aṭʿamahum', 'He fed them', 'Hij voedde hen'), ex('يَجْعَلُونَ', 'yajʿalūna', 'they make', 'zij maken'), ex('أَبْوَابٌ', 'abwābun', 'doors', 'deuren')] },
            { h: tx('When stopping: stronger', 'Bij stoppen: sterker'), p: tx('When you stop on a qalqalah letter at the end of a verse, the bounce is clearer.', 'Stop je op een qalqalah-letter aan het eind van een vers, dan stuitert hij duidelijker.'),
                ex: [ex('أَحَدْ', 'aḥad', 'one (Al-Ikhlas)', 'één (Al-Ikhlaas)'), ex('الْفَلَقْ', 'al-falaq', 'the daybreak', 'de dageraad'), ex('مُحِيطْ', 'muḥīṭ', 'encompassing', 'omvattend')],
                tip: tx('Also listen to a qari reciting Al-Ikhlas and Al-Falaq to hear the bounce clearly.', 'Luister ook naar een qaari bij soera Al-Ikhlaas en Al-Falaq om het stuitertje goed te horen.') }
        ],
        quiz: [
            { q: tx('Which letters are qalqalah letters?', 'Welke letters zijn qalqalah-letters?'), opts: ['ق ط ب ج د', 'خ ص ض غ ط', 'ا و ي'], a: 0 },
            { q: tx('When does a qalqalah letter bounce?', 'Wanneer stuitert een qalqalah-letter?'), opts: [tx('With sukoon or when stopping', 'Met sukoon of bij stoppen'), tx('Always', 'Altijd'), tx('Only with fatha', 'Alleen met fatha')], a: 0 },
            { q: tx('In which word do you hear qalqalah?', 'In welk woord hoor je qalqalah?'), opts: ['قَدْ', 'قَالَ', 'قُلُوبٌ'], ar: true, a: 0 }
        ]
    },
    {
        id: 'wasl', ar: 'ٱ',
        t: tx('Hamzatul wasl', 'Hamzatul wasl'), s: tx('The disappearing alif', 'De verdwijnende alif'),
        cards: [
            { h: tx('Sometimes heard, sometimes not', 'Soms wel, soms niet'),
                p: tx('The <b>ٱ</b> (alif with a small “head”) is only pronounced <b>at the start</b>. In the middle of a sentence you skip it and read straight on.',
                    'De <b>ٱ</b> (alif met een klein “kopje”) lees je alleen <b>aan het begin</b>. Midden in een zin sla je hem over en lees je meteen door.'),
                ex: [ex('ٱلْحَمْدُ', 'al-ḥamdu', 'start: pronounced', 'begin: wel uitspreken'), ex('بِسْمِ ٱللَّهِ', 'bismillāhi', 'middle: skipped', 'midden: overgeslagen')] },
            { h: tx('Which vowel do you start with?', 'Met welke klinker begin je?'), p: tx('The ٱ has no mark of its own. Choose the vowel like this:', 'De ٱ heeft geen eigen teken. Je kiest de klinker zo:'), w: 'wasl' },
            { h: tx('Exception', 'Uitzondering'), p: tx('In these verbs the third letter has a damma, yet you start with <b>i</b>.', 'Bij deze werkwoorden heeft de derde letter een damma, maar begin je tóch met <b>i</b>.'),
                ex: [ex('ٱمْشُوا', 'imshū', 'walk', 'loop'), ex('ٱقْضُوا', 'iqḍū', 'carry out', 'voer uit'), ex('ٱبْنُوا', 'ibnū', 'build', 'bouw'), ex('ٱئْتُوا', 'iʾtū', 'come', 'kom'), ex('ٱمْضُوا', 'imḍū', 'go on', 'ga door')] }
        ],
        quiz: [
            { q: tx('When do you pronounce ٱ?', 'Wanneer spreek je de ٱ uit?'), opts: [tx('Only at the start', 'Alleen aan het begin'), tx('Always', 'Altijd'), tx('Never', 'Nooit')], a: 0 },
            { q: tx('Which vowel starts ٱلْ...?', 'Met welke klinker begin je bij ٱلْ...?'), opts: ['a', 'i', 'u'], a: 0 },
            { q: tx('How do you start ٱدْخُلُوا (third letter has damma)?', 'Hoe begin je ٱدْخُلُوا (derde letter heeft damma)?'), opts: ['a', 'i', 'u'], a: 2 },
            { q: tx('How do you start ٱهْدِنَا?', 'Hoe begin je ٱهْدِنَا?'), opts: ['a', 'i', 'u'], a: 1 }
        ]
    },
    {
        id: 'shadda', ar: 'بّ',
        t: tx('Shadda and ghunnah', 'Shadda en ghunnah'), s: tx('Double letter and nasal sound', 'Dubbele letter en neusklank'),
        cards: [
            { h: tx('The “w”: read it twice', 'De “w”: dubbel lezen'),
                p: tx('The <b>shadda</b> (ّ) means the letter is doubled: first silent (with sukoon), then with the vowel. Stress it slightly.',
                    'De <b>shadda</b> (ّ) betekent: de letter twee keer. Eerst stil (met sukoon), dan met de klinker. Druk er iets op.'),
                ex: [ex('رَبِّ', 'rab-bi', 'Lord', 'Heer'), ex('حَقٌّ', 'ḥaq-qun', 'truth', 'waarheid'), ex('مُحَمَّدٌ', 'mu-ḥam-ma-dun', 'Muhammad ﷺ', 'Mohammed ﷺ'), ex('نَبِيٌّ', 'na-biy-yun', 'prophet', 'profeet')] },
            { h: tx('نّ and مّ: always nasal', 'نّ en مّ: altijd neusklank'),
                p: tx('When the shadda is on <b>ن</b> or <b>م</b>, hold a nasal sound (<b>ghunnah</b>) for two counts. This is always required.',
                    'Staat de shadda op <b>ن</b> of <b>م</b>, dan houd je een neusklank (<b>ghunnah</b>) twee tellen vast. Dit is altijd verplicht.'),
                ex: [ex('إِنَّ', 'in-na', 'indeed', 'voorwaar'), ex('ثُمَّ', 'thum-ma', 'then', 'daarna'), ex('ٱلنَّاسِ', 'an-nāsi', 'the people', 'de mensen'), ex('أَمَّا', 'am-mā', 'as for', 'wat betreft')],
                tip: tx('Feel it: pinch your nose and say “mmm”. Does the sound stop? Then it came from your nose.', 'Voel het: knijp je neus dicht en zeg “mmm”. Stopt het geluid? Dan kwam het uit je neus.') }
        ],
        quiz: [
            { q: tx('What does a shadda do?', 'Wat doet een shadda?'), opts: [tx('The letter is read twice', 'De letter wordt dubbel gelezen'), tx('The letter is silent', 'De letter is stil'), tx('Hold it long', 'Lang aanhouden')], a: 0 },
            { q: tx('How do you read رَبِّ?', 'Hoe lees je رَبِّ?'), opts: ['ra-bi', 'rab-bi', 'raa-bi'], a: 1 },
            { q: tx('With which letters does a shadda bring ghunnah?', 'Bij welke letters met shadda hoort ghunnah?'), opts: [tx('ن and م', 'ن en م'), tx('ب and ت', 'ب en ت'), tx('ر and ل', 'ر en ل')], a: 0 },
            { q: tx('How long is that ghunnah?', 'Hoe lang duurt die ghunnah?'), opts: [tx('1 count', '1 tel'), tx('2 counts', '2 tellen'), tx('4 counts', '4 tellen')], a: 1 }
        ]
    },
    {
        id: 'raa', ar: 'ر',
        t: tx('The ر: heavy or light', 'De ر: zwaar of licht'), s: tx('Rules for the raa', 'Regels voor de raa'),
        cards: [
            { h: tx('First look at the ر itself', 'Kijk eerst naar de ر zelf'), p: tx('Does the ر have its own vowel? Then it is simple.', 'Heeft de ر een eigen klinker? Dan is het simpel.'), rules: RAA_OWN },
            { h: tx('Does the ر have a sukoon?', 'Heeft de ر een sukoon?'), p: tx('Then look at the letter <b>before</b> it (or two before, if that one is silent too).', 'Kijk dan naar de letter <b>ervoor</b> (of twee ervoor als die ook stil is).'), rules: RAA_SUKOON,
                tip: tx('Heavy sounds like the r in “raw”, light like the r in “ring”. In short: <b>fatha/damma → heavy, kasra → light</b>.', 'Zwaar klinkt als de r in Engels “raw”, licht als de r in “ring”. Kort: <b>fatha/damma → zwaar, kasra → licht</b>.') },
            { h: tx('Two exceptions', 'Twee uitzonderingen'), p: tx('After a hamzatul wasl the ر is heavy. And after a kasra, but with a heavy letter after it, as well.', 'Na een hamzatul wasl is de ر zwaar. En na een kasra, maar met een zware letter erachter, ook.'),
                ex: [ex('ٱرْجِعُوا', 'irjiʿū', 'heavy: after hamzatul wasl', 'zwaar: na hamzatul wasl'), ex('قِرْطَاسٍ', 'qirṭāsin', 'heavy: ط follows', 'zwaar: ط volgt'), ex('مِرْصَادًا', 'mirṣādan', 'heavy: ص follows', 'zwaar: ص volgt')] }
        ],
        quiz: [
            { q: tx('رَبِّ: the ر is…', 'رَبِّ: de ر is…'), opts: [O.heavy, O.light], a: 0, fixed: true },
            { q: tx('رِزْقٌ: the ر is…', 'رِزْقٌ: de ر is…'), opts: [O.heavy, O.light], a: 1, fixed: true },
            { q: tx('فِرْعَوْنَ: the ر is…', 'فِرْعَوْنَ: de ر is…'), opts: [O.heavy, O.light], a: 1, fixed: true, why: tx('Sukoon on the ر, and the letter before has kasra → light.', 'Sukoon op de ر, en de letter ervoor heeft kasra → licht.') },
            { q: tx('قُرْآنٌ: the ر is…', 'قُرْآنٌ: de ر is…'), opts: [O.heavy, O.light], a: 0, fixed: true, why: tx('Sukoon on the ر, and the letter before has damma → heavy.', 'Sukoon op de ر, en de letter ervoor heeft damma → zwaar.') }
        ]
    },
    {
        id: 'allah', ar: 'ﷲ',
        t: tx('The name Allah', 'De naam Allah'), s: tx('Heavy or light ل', 'Zware of lichte ل'),
        cards: [
            { h: tx('Two ways', 'Twee manieren'), p: tx('The ل in <b>Allah</b> depends on the vowel <b>before</b> it.', 'De ل in <b>Allah</b> hangt af van de klinker <b>ervoor</b>.'), rules: ALLAH_RULES },
            { h: tx('Practise', 'Oefen'), p: tx('Listen and pay attention to the ل.', 'Luister en let op de ل.'),
                ex: [ex('سُبْحَانَ ٱللَّهِ', 'subḥāna-llāh', 'heavy: fatha before', 'zwaar: fatha ervoor'), ex('رَسُولُ ٱللَّهِ', 'rasūlu-llāh', 'heavy: damma before', 'zwaar: damma ervoor'), ex('ٱلْحَمْدُ لِلَّهِ', 'al-ḥamdu lillāh', 'light: kasra before', 'licht: kasra ervoor'), ex('قُلِ ٱللَّهُمَّ', 'quli-llāhumma', 'light: kasra before', 'licht: kasra ervoor')],
                tip: tx('When you start with “Allah” itself, the ل is heavy too: you start with an “a”.', 'Begin je met “Allah” zelf, dan is de ل ook zwaar: je start met een “a”.') }
        ],
        quiz: [
            { q: tx('بِسْمِ ٱللَّهِ: the ل is…', 'بِسْمِ ٱللَّهِ: de ل is…'), opts: [O.heavy, O.light], a: 1, fixed: true },
            { q: tx('قَالَ ٱللَّهُ: the ل is…', 'قَالَ ٱللَّهُ: de ل is…'), opts: [O.heavy, O.light], a: 0, fixed: true },
            { q: tx('After which vowel is the ل of Allah light?', 'Na welke klinker is de ل van Allah licht?'), opts: ['Kasra', 'Fatha', 'Damma'], a: 0 }
        ]
    },
    {
        id: 'sunmoon', ar: '☾',
        t: tx('Sun and moon letters', 'Zon- en maanletters'), s: tx('Do you hear the ل of ال?', 'Hoor je de ل van ال?'),
        cards: [
            { h: tx('Moon letters: you hear the ل', 'Maanletters: ل hoor je'), p: tx('When a <b>moon letter</b> follows ال, you pronounce the ل clearly. You see a sukoon on the ل.', 'Na ال komt een <b>maanletter</b>? Dan spreek je de ل duidelijk uit. Je ziet een sukoon op de ل.'),
                ex: [ex('الْقَمَرُ', 'al-qamar', 'the moon', 'de maan'), ex('الْكِتَابُ', 'al-kitāb', 'the book', 'het boek')] },
            { h: tx('Sun letters: the ل disappears', 'Zonletters: ل verdwijnt'), p: tx('When a <b>sun letter</b> follows ال, you do not say the ل. The next letter gets a shadda and is doubled.', 'Na ال komt een <b>zonletter</b>? Dan zeg je de ل niet. De volgende letter krijgt een shadda en wordt dubbel.'),
                ex: [ex('الشَّمْسُ', 'ash-shams', 'the sun', 'de zon'), ex('النَّاسُ', 'an-nās', 'the people', 'de mensen')],
                tip: tx('A phrase that holds all 14 moon letters: <span class="tj-ar">ابْغِ حَجَّكَ وَخَفْ عَقِيمَهُ</span>', 'Ezelsbrug voor de 14 maanletters: <span class="tj-ar">ابْغِ حَجَّكَ وَخَفْ عَقِيمَهُ</span>') },
            { h: tx('Discover all 28', 'Ontdek alle 28'), p: tx('Tap a letter to hear the example.', 'Tik op een letter om het voorbeeld te horen.'), w: 'sunmoon' }
        ],
        quiz: [
            { q: tx('Is ش a sun or a moon letter?', 'Is ش een zon- of maanletter?'), opts: [O.sun, O.moon], a: 0, fixed: true },
            { q: tx('Is ق a sun or a moon letter?', 'Is ق een zon- of maanletter?'), opts: [O.sun, O.moon], a: 1, fixed: true },
            { q: tx('How do you read النَّاسُ?', 'Hoe lees je النَّاسُ?'), opts: ['an-naas', 'al-naas', 'a-laas'], a: 0 },
            { q: tx('What do you see on the ل before a moon letter?', 'Wat zie je op de ل bij een maanletter?'), opts: ['Sukoon', 'Shadda', tx('Nothing', 'Niets')], a: 0 }
        ]
    },
    {
        id: 'twosukoon', ar: 'قُلِ',
        t: tx('Two sukoons', 'Twee sukoons'), s: tx('Reading on smoothly', 'Vloeiend doorlezen'),
        cards: [
            { h: tx('Two silent letters? Not possible', 'Twee stille letters? Kan niet'),
                p: tx('When reading on, two silent letters may not clash. Then the first one changes. This only applies when you <b>read on</b>, not when you stop.',
                    'Bij het doorlezen mogen twee stille letters niet botsen. Dan verandert de eerste. Dit geldt alleen als je <b>doorleest</b>, niet als je stopt.'),
                ex: [ex('قُلِ ٱللَّهُ', 'qulillāh', 'قُلْ → قُلِ: kasra added', 'قُلْ → قُلِ: kasra erbij'), ex('مِنَ ٱللَّهِ', 'minallāh', 'مِنْ → مِنَ: fatha added', 'مِنْ → مِنَ: fatha erbij'), ex('عَلَيْهِمُ ٱلْقِتَالُ', 'ʿalayhimul-qitāl', 'هِمْ → هِمُ: damma added', 'هِمْ → هِمُ: damma erbij')] },
            { h: tx('Madd letter + ال', 'Madd-letter + ال'), p: tx('Is there a madd letter (ا و ي) before ال? Then the long sound drops when reading on. It is written, but you say it short.', 'Staat er een madd-letter (ا و ي) vóór ال? Dan valt de lange klank weg bij het doorlezen. Je schrijft hem wel, maar zegt hem kort.'),
                ex: [ex('قَالُوا ٱلْحَمْدُ', 'qālul-ḥamdu', 'و drops', 'و valt weg'), ex('فِي ٱلْأَرْضِ', 'fil-arḍi', 'ي drops', 'ي valt weg'), ex('وَقَالَا ٱلْحَمْدُ', 'wa qālal-ḥamdu', 'ا drops', 'ا valt weg')] },
            { h: tx('Tanween + ال', 'Tanwien + ال'), p: tx('When tanween comes before a silent letter, add a short <b>ni</b>.', 'Komt tanwien vóór een stille letter, dan voeg je een klein <b>ni</b> toe.'),
                ex: [ex('نُوحٌ ٱبْنَهُ', 'nūḥunibnah', 'un + ni', 'un + ni'), ex('خَيْرًا ٱلْوَصِيَّةُ', 'khayranil-waṣiyyah', 'an + ni', 'an + ni')] }
        ],
        quiz: [
            { q: tx('How do you read قُلْ ٱللَّهُ when reading on?', 'Hoe lees je قُلْ ٱللَّهُ bij doorlezen?'), opts: ['qulillaah', 'qul allaah', 'qullaah'], a: 0 },
            { q: tx('فِي ٱلْأَرْضِ sounds like…', 'فِي ٱلْأَرْضِ klinkt als…'), opts: ['fil-ard', 'fii al-ard', 'fiil-ard'], a: 0 },
            { q: tx('What do you add for tanween + a silent letter?', 'Wat voeg je toe bij tanwien + stille letter?'), opts: ['ni', 'na', 'nu'], a: 0 }
        ]
    },
    {
        id: 'stopping', ar: 'مـ',
        t: tx('Stopping', 'Stoppen'), s: tx('Stop signs and what changes', 'Stoptekens en wat er verandert'),
        cards: [
            { h: tx('Stop signs in the Quran', 'Stoptekens in de Koran'), p: tx('Small signs above the text tell you whether you may stop.', 'Kleine tekens boven de tekst vertellen of je mag stoppen.'), w: 'stops' },
            { h: tx('What changes when you stop?', 'Wat verandert als je stopt?'), p: tx('When you stop at the end of a word, the last vowel becomes a <b>sukoon</b>.', 'Stop je aan het eind van een woord, dan wordt de laatste klinker een <b>sukoon</b>.'),
                ex: [ex('ٱلْعَالَمِينْ', 'al-ʿālamīn', 'ٱلْعَالَمِينَ → the last fatha drops', 'ٱلْعَالَمِينَ → laatste fatha valt weg'), ex('ٱلرَّحِيمْ', 'ar-raḥīm', 'ٱلرَّحِيمِ → the kasra drops', 'ٱلرَّحِيمِ → kasra valt weg')] },
            { h: tx('Two special cases', 'Twee speciale gevallen'), p: tx('Fathatayn (ـًا) becomes a long <b>aa</b>. And ة becomes a silent <b>h</b>.', 'Fathatayn (ـًا) wordt een lange <b>aa</b>. En ة wordt een stille <b>h</b>.'),
                ex: [ex('عَلِيمَا', 'ʿalīmā', 'عَلِيمًا → “aa”', 'عَلِيمًا → “aa”'), ex('رَحْمَهْ', 'raḥmah', 'رَحْمَةٌ → “h”', 'رَحْمَةٌ → “h”')] }
        ],
        quiz: [
            { q: tx('What does the sign لا mean?', 'Wat betekent het teken لا?'), opts: [tx('Do not stop', 'Niet stoppen'), tx('Must stop', 'Verplicht stoppen'), tx('Short pause', 'Kort pauzeren')], a: 0 },
            { q: tx('What happens to the last vowel when you stop?', 'Wat gebeurt er met de laatste klinker als je stopt?'), opts: [tx('It becomes sukoon', 'Wordt sukoon'), tx('It becomes long', 'Wordt lang'), tx('It stays the same', 'Blijft gelijk')], a: 0 },
            { q: tx('You stop on رَحْمَةٌ. What do you say?', 'Je stopt op رَحْمَةٌ. Wat zeg je?'), opts: ['raḥmah', 'raḥmatun', 'raḥmat'], a: 0 },
            { q: tx('What does ج mean?', 'Wat betekent ج?'), opts: [tx('Stopping or continuing are both fine', 'Stoppen of doorgaan mag allebei'), tx('Must stop', 'Verplicht stoppen'), tx('Do not stop', 'Niet stoppen')], a: 0 }
        ]
    }
];

export const WIDGET_DATA = { PAIRS, WASL_RULES };

/* Words for the Raa detector: [word, heavy?, reason] */
export const RAA_WORDS = [
    ['رَبِّ', true, tx('ر with fatha', 'ر met fatha')],
    ['رُسُلٌ', true, tx('ر with damma', 'ر met damma')],
    ['رِزْقٌ', false, tx('ر with kasra', 'ر met kasra')],
    ['رِجَالٌ', false, tx('ر with kasra', 'ر met kasra')],
    ['أَرْضٌ', true, tx('sukoon, fatha before', 'sukoon, fatha ervoor')],
    ['قُرْآنٌ', true, tx('sukoon, damma before', 'sukoon, damma ervoor')],
    ['فِرْعَوْنَ', false, tx('sukoon, kasra before', 'sukoon, kasra ervoor')],
    ['مَرْيَمَ', true, tx('sukoon, fatha before', 'sukoon, fatha ervoor')],
    ['خَيْرْ', false, tx('a silent ي before', 'stille ي ervoor')],
    ['وَالْعَصْرْ', true, tx('silent letter + fatha before', 'stil + fatha ervoor')],
    ['ذِكْرْ', false, tx('silent letter + kasra before', 'stil + kasra ervoor')],
    ['ٱرْجِعُوا', true, tx('after hamzatul wasl', 'na hamzatul wasl')],
    ['قِرْطَاسٍ', true, tx('kasra before, but ط follows', 'kasra ervoor, maar ط volgt')],
    ['كَرِيمٌ', false, tx('ر with kasra', 'ر met kasra')],
    ['نُورٌ', true, tx('ر with damma', 'ر met damma')],
    ['شِرْعَةً', false, tx('sukoon, kasra before', 'sukoon, kasra ervoor')]
];

export const GAMES = [
    { id: 'ear', ar: 'ع', t: tx('Letter ear', 'Letter-oor'), s: tx('Hear the letter, pick the right one', 'Hoor de letter, kies de juiste') },
    { id: 'sunmoon', ar: '☀', t: tx('Sun or moon?', 'Zon of maan?'), s: tx('Do you hear the ل or not?', 'Hoor je de ل of niet?') },
    { id: 'heavy', ar: 'ص', t: tx('Heavy or light?', 'Zwaar of licht?'), s: tx('Spot the 7 heavy letters', 'Herken de 7 zware letters') },
    { id: 'raa', ar: 'ر', t: tx('Raa detector', 'Raa-detector'), s: tx('Is the ر heavy or light?', 'Is de ر zwaar of licht?') },
    { id: 'vowels', ar: 'بُ', t: tx('Vowel check', 'Klinker-check'), s: tx('Read the letter with its vowel', 'Lees de letter met klinker') },
    { id: 'cards', ar: 'ق', t: tx('Flashcards', 'Flitskaarten'), s: tx('Turn over and repeat all letters', 'Draai en herhaal alle letters') }
];

export const DUA = 'اللَّهُمَّ اجْعَلِ الْقُرْآنَ رَبِيعَ قُلُوبِنَا، وَنُورَ صُدُورِنَا، وَجَلَاءَ أَحْزَانِنَا، وَذَهَابَ هُمُومِنَا';

/* Every Arabic text the section can play, for the audio recordings. */
export function speechTexts() {
    const texts = new Set();
    const add = text => text && texts.add(text);

    LETTERS.forEach(([letter, , name]) => {
        add(name);
        if (!'اء'.includes(letter)) {
            add(`أَ${letter}ْ`);
        }
    });
    LAB_LETTERS.forEach(letter => Object.keys(MODS).forEach(mod => add(labText(letter, mod))));
    Object.values(SUN_MOON).forEach(([word]) => add(word));
    MAKHARIJ.forEach(area => area[3].forEach(point => point[2].forEach(add)));
    PAIRS.flat().forEach(letter => add(`${letter}َ`));
    [...RAA_OWN, ...RAA_SUKOON, ...ALLAH_RULES, ...WASL_RULES].forEach(row => add(row[2]));
    RAA_WORDS.forEach(([word]) => add(word));
    LESSONS.forEach(lesson => {
        lesson.cards.forEach(card => (card.ex || []).forEach(row => add(row[3] || row[0])));
        lesson.quiz.forEach(question => add(question.say));
    });
    return [...texts];
}

