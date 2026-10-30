/*
 * Static content. Kept small and sourced; references point to the
 * standard sunnah.com numbering.
 *
 * Interface labels are translation keys (see js/i18n). Hadith, du'a and
 * dhikr meanings stay in English next to the Arabic, so religious texts are
 * never machine-translated.
 */

export const PRAYER_ARABIC = {
    Fajr: 'الفجر',
    Sunrise: 'الشروق',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
    Jumuah: 'الجمعة'
};

export const CALCULATION_METHODS = [
    [3, 'Muslim World League'],
    [2, 'Islamic Society of North America (ISNA)'],
    [15, 'Moonsighting Committee Worldwide'],
    [1, 'University of Islamic Sciences, Karachi'],
    [4, 'Umm al-Qura University, Makkah'],
    [5, 'Egyptian General Authority of Survey'],
    [13, 'Diyanet, Turkey'],
    [12, 'Union des Organisations Islamiques de France'],
    [8, 'Gulf Region'],
    [9, 'Kuwait'],
    [10, 'Qatar'],
    [16, 'Dubai'],
    [11, 'MUIS, Singapore'],
    [17, 'JAKIM, Malaysia'],
    [20, 'KEMENAG, Indonesia'],
    [14, 'Spiritual Administration of Muslims of Russia'],
    [18, 'Tunisia'],
    [19, 'Algeria'],
    [21, 'Morocco'],
    [22, 'Comunidade Islâmica de Lisboa, Portugal'],
    [23, 'Ministry of Awqaf, Jordan'],
    [7, 'Institute of Geophysics, University of Tehran'],
    [0, 'Shia Ithna Ashari (Jafari)']
];

export function methodName(id) {
    return CALCULATION_METHODS.find(([value]) => value === Number(id))?.[1] || `Method ${id}`;
}

/* [value, translation key] */
export const ASR_METHODS = [
    [0, 'asr.standard'],
    [1, 'asr.hanafi']
];

export const HIGH_LATITUDE_RULES = [
    [0, 'latitude.auto'],
    [3, 'latitude.angle'],
    [1, 'latitude.middle'],
    [2, 'latitude.seventh']
];

/* [id, translation key, file] */
export const ADHAN_SOUNDS = [
    ['default', 'sound.default', 'audio/adhan.mp3'],
    ['makkah', 'sound.makkah', 'audio/makkah.mp3'],
    ['madinah', 'sound.madinah', 'audio/madinah.mp3'],
    ['alafasy', 'sound.alafasy', 'audio/alafasy.mp3'],
    ['chime', 'sound.chime', 'audio/chime.mp3'],
    ['none', 'sound.none', '']
];

export const DAILY_HADITHS = [
    ['Actions are judged by intentions, and everyone will get what they intended.', 'Sahih al-Bukhari 1'],
    ['Whoever does not show mercy to people, Allah will not show mercy to him.', 'Sahih Muslim 2319'],
    ['Make things easy and do not make them difficult.', 'Sahih al-Bukhari 69'],
    ['A good word is charity.', 'Sahih al-Bukhari 2989'],
    ['None of you truly believes until he loves for his brother what he loves for himself.', 'Sahih al-Bukhari 13'],
    ['The strong person is the one who controls himself when angry.', 'Sahih al-Bukhari 6114'],
    ['The most beloved deeds to Allah are the most consistent, even if they are small.', 'Sahih al-Bukhari 6464'],
    ['Whoever believes in Allah and the Last Day should speak good or remain silent.', 'Sahih al-Bukhari 6018'],
    ['Allah does not look at your appearance or wealth, but at your hearts and your deeds.', 'Sahih Muslim 2564'],
    ['The best of you are those who learn the Quran and teach it.', 'Sahih al-Bukhari 5027'],
    ['Purity is half of faith.', 'Sahih Muslim 223'],
    ['Modesty brings nothing but good.', 'Sahih al-Bukhari 6117'],
    ['A Muslim is the one from whose tongue and hand other Muslims are safe.', 'Sahih al-Bukhari 10'],
    ['Truthfulness leads to righteousness, and righteousness leads to Paradise.', 'Sahih al-Bukhari 6094'],
    ['A person will be with those whom he loves.', 'Sahih al-Bukhari 6168'],
    ['Be in this world as if you were a stranger or a traveller.', 'Sahih al-Bukhari 6416'],
    ['Fasting is a shield.', 'Sahih al-Bukhari 1894'],
    ['Whoever does not thank people has not thanked Allah.', 'Sunan Abi Dawud 4811'],
    ['The religion is easy.', 'Sahih al-Bukhari 39'],
    ['The best of you are those with the best character.', 'Sahih al-Bukhari 6035'],
    ['Your smile in the face of your brother is charity.', 'Jami’ at-Tirmidhi 1956'],
    ['Allah is gentle and loves gentleness in all matters.', 'Sahih al-Bukhari 6927'],
    ['Do not belittle any good deed, even meeting your brother with a cheerful face.', 'Sahih Muslim 2626'],
    ['Whoever takes a path seeking knowledge, Allah makes easy for him a path to Paradise.', 'Sahih Muslim 2699'],
    ['The supplication of a Muslim for his brother in his absence is answered.', 'Sahih Muslim 2733']
];

/* [arabic, transliteration, meaning, reference] */
export const DAILY_DUAS = [
    ['رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina ‘adhaban-nar.', 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.', 'Quran 2:201'],
    ['رَبِّ زِدْنِي عِلْمًا', 'Rabbi zidni ‘ilma.', 'My Lord, increase me in knowledge.', 'Quran 20:114'],
    ['رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ', 'Rabbana la tuzigh qulubana ba‘da idh hadaytana wa hab lana min ladunka rahmah, innaka antal-Wahhab.', 'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself. You are the Bestower.', 'Quran 3:8'],
    ['رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', 'Rabbana hab lana min azwajina wa dhurriyyatina qurrata a‘yunin waj‘alna lil-muttaqina imama.', 'Our Lord, grant us spouses and children who are a comfort to our eyes, and make us an example for the righteous.', 'Quran 25:74'],
    ['لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin.', 'There is no god but You. Glory be to You. I have been among the wrongdoers.', 'Quran 21:87'],
    ['حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'Hasbunallahu wa ni‘mal-wakil.', 'Allah is sufficient for us, and He is the best Disposer of affairs.', 'Quran 3:173'],
    ['اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى', 'Allahumma inni as’alukal-huda wat-tuqa wal-‘afafa wal-ghina.', 'O Allah, I ask You for guidance, piety, chastity and self-sufficiency.', 'Sahih Muslim 2721'],
    ['اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ', 'Allahumma inni a‘udhu bika minal-hammi wal-hazan, wal-‘ajzi wal-kasal.', 'O Allah, I seek refuge in You from worry and grief, and from weakness and laziness.', 'Sahih al-Bukhari 6369'],
    ['اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', 'Allahumma a‘inni ‘ala dhikrika wa shukrika wa husni ‘ibadatik.', 'O Allah, help me to remember You, to thank You and to worship You well.', 'Sunan Abi Dawud 1522'],
    ['رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ', 'Rabbana taqabbal minna innaka antas-Sami‘ul-‘Alim.', 'Our Lord, accept this from us. You are the All-Hearing, the All-Knowing.', 'Quran 2:127'],
    ['رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ', 'Rabbighfir li wa tub ‘alayya innaka antat-Tawwabur-Rahim.', 'My Lord, forgive me and accept my repentance. You are the Accepter of repentance, the Merciful.', 'Jami’ at-Tirmidhi 3434'],
    ['اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', 'Allahumma inni as’alukal-‘afwa wal-‘afiyata fid-dunya wal-akhirah.', 'O Allah, I ask You for pardon and well-being in this world and the Hereafter.', 'Sunan Ibn Majah 3871']
];

/*
 * Morning and evening remembrance.
 * { arabic, transliteration, meaning, count, reference, quran? }
 * Quranic recitations open in the Quran reader instead of being retyped here.
 */
export const ADHKAR = [
    {
        title: 'adhkar.0',
        quran: '2:255',
        note: 'adhkar.0.note',
        count: 1,
        reference: 'Quran 2:255'
    },
    {
        title: 'adhkar.1',
        quran: '112',
        note: 'adhkar.1.note',
        count: 3,
        reference: 'Sunan Abi Dawud 5082'
    },
    {
        title: 'adhkar.2',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
        transliteration: 'Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana ‘abduka, wa ana ‘ala ‘ahdika wa wa‘dika mastata‘tu, a‘udhu bika min sharri ma sana‘tu, abu’u laka bini‘matika ‘alayya, wa abu’u laka bidhanbi faghfir li, fa innahu la yaghfirudh-dhunuba illa anta.',
        meaning: 'O Allah, You are my Lord; there is no god but You. You created me and I am Your servant, and I keep Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.',
        count: 1,
        reference: 'Sahih al-Bukhari 6306'
    },
    {
        title: 'adhkar.3',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration: 'Bismillahil-ladhi la yadurru ma‘asmihi shay’un fil-ardi wa la fis-sama’i wa huwas-Sami‘ul-‘Alim.',
        meaning: 'In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the All-Hearing, the All-Knowing.',
        count: 3,
        reference: 'Sunan Abi Dawud 5088'
    },
    {
        title: 'adhkar.4',
        arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
        transliteration: 'Raditu billahi rabba, wa bil-islami dina, wa bi-Muhammadin sallallahu ‘alayhi wa sallama nabiyya.',
        meaning: 'I am pleased with Allah as my Lord, with Islam as my religion and with Muhammad ﷺ as my Prophet.',
        count: 3,
        reference: 'Sunan Abi Dawud 5072'
    },
    {
        title: 'adhkar.5',
        arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        transliteration: 'Hasbiyallahu la ilaha illa huwa, ‘alayhi tawakkaltu wa huwa rabbul-‘arshil-‘azim.',
        meaning: 'Allah is sufficient for me; there is no god but Him. In Him I put my trust, and He is the Lord of the Mighty Throne.',
        count: 7,
        reference: 'Sunan Abi Dawud 5081'
    },
    {
        title: 'adhkar.6',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhanallahi wa bihamdih.',
        meaning: 'Glory be to Allah and praise be to Him.',
        count: 100,
        reference: 'Sahih Muslim 2692'
    },
    {
        title: 'adhkar.7',
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: 'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa ‘ala kulli shay’in qadir.',
        meaning: 'There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.',
        count: 100,
        reference: 'Sahih al-Bukhari 3293'
    },
    {
        title: 'adhkar.8',
        arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
        transliteration: 'Astaghfirullaha wa atubu ilayh.',
        meaning: 'I seek Allah’s forgiveness and turn to Him in repentance.',
        count: 100,
        reference: 'Sahih Muslim 2702'
    }
];

export const TASBIH_PHRASES = [
    { arabic: 'سُبْحَانَ اللَّهِ', label: 'SubhanAllah' },
    { arabic: 'الْحَمْدُ لِلَّهِ', label: 'Alhamdulillah' },
    { arabic: 'اللَّهُ أَكْبَرُ', label: 'Allahu Akbar' },
    { arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', label: 'La ilaha illallah' },
    { arabic: 'أَسْتَغْفِرُ اللَّهَ', label: 'Astaghfirullah' },
    { arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', label: 'Salawat' }
];

/* [name, hijri month, hijri day, note] */
/* [id, hijri month, hijri day]; names and notes are translation keys event.<id> */
export const ISLAMIC_EVENTS = [
    ['newYear', 1, 1],
    ['ashura', 1, 10],
    ['ramadan', 9, 1],
    ['lastTen', 9, 21],
    ['eidFitr', 10, 1],
    ['dhulHijjah', 12, 1],
    ['arafah', 12, 9],
    ['eidAdha', 12, 10]
];

/* [id, url]; texts are translation keys site.<id>.* */
export const HOLY_SITES = [
    ['haram', 'https://www.youtube.com/results?search_query=makkah+live&sp=EgJAAQ%253D%253D'],
    ['nabawi', 'https://www.youtube.com/results?search_query=madinah+live&sp=EgJAAQ%253D%253D'],
    ['aqsa', 'https://www.youtube.com/results?search_query=al+aqsa+live&sp=EgJAAQ%253D%253D']
];

/* [id, url]; texts are translation keys learn.<id>.* */
export const LEARN_SALAH = [
    ['book', 'https://www.myprayer.org/pages/my-prayer-book'],
    ['ios', 'https://apps.apple.com/us/app/namaz-app-learn-salah-prayer/id1447056625'],
    ['android', 'https://play.google.com/store/apps/details?id=com.nurios.namazapp']
];

export const HADITH_COLLECTIONS = [
    { key: 'bukhari', name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري' },
    { key: 'muslim', name: 'Sahih Muslim', arabic: 'صحيح مسلم' },
    { key: 'abudawud', name: 'Sunan Abi Dawud', arabic: 'سنن أبي داود' },
    { key: 'tirmidhi', name: 'Jami’ at-Tirmidhi', arabic: 'جامع الترمذي' },
    { key: 'nasai', name: 'Sunan an-Nasa’i', arabic: 'سنن النسائي' },
    { key: 'ibnmajah', name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه' },
    { key: 'malik', name: 'Muwatta Malik', arabic: 'موطأ مالك' },
    { key: 'nawawi', name: 'An-Nawawi’s 40', arabic: 'الأربعون النووية' },
    { key: 'qudsi', name: '40 Hadith Qudsi', arabic: 'الأحاديث القدسية' },
    { key: 'dehlawi', name: 'Shah Waliullah’s 40', arabic: 'أربعون الدهلوي' }
];

export const SHAHADA = {
    arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
    transliteration: 'Ashhadu an la ilaha illallah, wa ashhadu anna Muhammadan rasulullah.'
};

export const SUPPORT_URL = 'https://buymeacoffee.com/kmni';

/*
 * Du'a collection for daily situations (mostly from Hisnul Muslim).
 * Titles and categories are translation keys (dua.<id>, duas.cat.<id>);
 * the Arabic, transliteration and English meaning are kept as they are.
 */
export const DUA_CATEGORIES = [
    { id: 'sleep', icon: 'moon', duas: [
        { id: 'wake', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', transliteration: 'Alhamdu lillahil-ladhi ahyana ba‘da ma amatana wa ilayhin-nushur.', meaning: 'All praise is for Allah, who gave us life after He caused us to die, and to Him is the return.', reference: 'Sahih al-Bukhari 6312' },
        { id: 'sleep', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', transliteration: 'Bismika Allahumma amutu wa ahya.', meaning: 'In Your name, O Allah, I die and I live.', reference: 'Sahih al-Bukhari 6324' }
    ] },
    { id: 'home', icon: 'home', duas: [
        { id: 'leaveHome', arabic: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: 'Bismillah, tawakkaltu ‘alallah, wa la hawla wa la quwwata illa billah.', meaning: 'In the name of Allah, I place my trust in Allah, and there is no power and no strength except with Allah.', reference: 'Abu Dawud 5095, at-Tirmidhi 3426' },
        { id: 'enterHome', arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا', transliteration: 'Bismillahi walajna, wa bismillahi kharajna, wa ‘alallahi rabbina tawakkalna.', meaning: 'In the name of Allah we enter, in the name of Allah we leave, and upon Allah, our Lord, we place our trust.', reference: 'Abu Dawud 5096' }
    ] },
    { id: 'mosque', icon: 'mosque', duas: [
        { id: 'enterMosque', arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', transliteration: 'Allahummaftah li abwaba rahmatik.', meaning: 'O Allah, open the gates of Your mercy for me.', reference: 'Sahih Muslim 713' },
        { id: 'leaveMosque', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', transliteration: 'Allahumma inni as’aluka min fadlik.', meaning: 'O Allah, I ask You of Your bounty.', reference: 'Sahih Muslim 713' },
        { id: 'afterSalah', arabic: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', transliteration: 'Astaghfirullah, astaghfirullah, astaghfirullah. Allahumma antas-salamu wa minkas-salam, tabarakta ya dhal-jalali wal-ikram.', meaning: 'I seek Allah’s forgiveness (three times). O Allah, You are Peace and from You comes peace. Blessed are You, Possessor of majesty and honour.', reference: 'Sahih Muslim 591' }
    ] },
    { id: 'purity', icon: 'hand', duas: [
        { id: 'toiletIn', arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', transliteration: 'Allahumma inni a‘udhu bika minal-khubuthi wal-khaba’ith.', meaning: 'O Allah, I seek refuge in You from evil and from evil beings.', reference: 'Sahih al-Bukhari 142, Sahih Muslim 375' },
        { id: 'toiletOut', arabic: 'غُفْرَانَكَ', transliteration: 'Ghufranak.', meaning: 'I ask You for Your forgiveness.', reference: 'Abu Dawud 30, at-Tirmidhi 7' },
        { id: 'afterWudu', arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', transliteration: 'Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa ashhadu anna Muhammadan ‘abduhu wa rasuluh.', meaning: 'I bear witness that there is no god but Allah alone, without partner, and I bear witness that Muhammad is His servant and Messenger.', reference: 'Sahih Muslim 234' }
    ] },
    { id: 'food', icon: 'food', duas: [
        { id: 'beforeEating', arabic: 'بِسْمِ اللَّهِ', transliteration: 'Bismillah. If you forget at the start: Bismillahi awwalahu wa akhirah.', meaning: 'In the name of Allah. (If forgotten: In the name of Allah, at its beginning and at its end.)', reference: 'Abu Dawud 3767, at-Tirmidhi 1858' },
        { id: 'afterEating', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', transliteration: 'Alhamdu lillahil-ladhi at‘amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah.', meaning: 'All praise is for Allah, who fed me this and provided it for me without any might or power from myself.', reference: 'Abu Dawud 4023, at-Tirmidhi 3458' }
    ] },
    { id: 'travel', icon: 'navigation', duas: [
        { id: 'travel', arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَىٰ رَبِّنَا لَمُنْقَلِبُونَ', transliteration: 'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun.', meaning: 'Glory be to Him who has made this subservient to us, for we could not have done it ourselves, and to our Lord we will surely return.', reference: 'Quran 43:13–14, Sahih Muslim 1342' }
    ] },
    { id: 'hardship', icon: 'heart', duas: [
        { id: 'distress', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ', transliteration: 'La ilaha illallahul-‘Azimul-Halim, la ilaha illallahu Rabbul-‘arshil-‘azim, la ilaha illallahu Rabbus-samawati wa Rabbul-ardi wa Rabbul-‘arshil-karim.', meaning: 'There is no god but Allah, the Mighty, the Forbearing. There is no god but Allah, Lord of the Mighty Throne. There is no god but Allah, Lord of the heavens, Lord of the earth and Lord of the Noble Throne.', reference: 'Sahih al-Bukhari 6346, Sahih Muslim 2730' },
        { id: 'yunus', arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin.', meaning: 'There is no god but You. Glory be to You. Indeed, I have been of the wrongdoers.', reference: 'Quran 21:87' },
        { id: 'worry', arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ', transliteration: 'Allahumma inni a‘udhu bika minal-hammi wal-hazan, wal-‘ajzi wal-kasal, wal-bukhli wal-jubn, wa dala‘id-dayni wa ghalabatir-rijal.', meaning: 'O Allah, I seek refuge in You from worry and grief, from helplessness and laziness, from miserliness and cowardice, from the burden of debt and from being overpowered by others.', reference: 'Sahih al-Bukhari 6369' },
        { id: 'anger', arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', transliteration: 'A‘udhu billahi minash-shaytanir-rajim.', meaning: 'I seek refuge in Allah from Satan, the accursed.', reference: 'Sahih al-Bukhari 3282' }
    ] },
    { id: 'daily', icon: 'sun', duas: [
        { id: 'sneeze', arabic: 'الْحَمْدُ لِلَّهِ — يَرْحَمُكَ اللَّهُ — يَهْدِيكُمُ اللَّهُ وَيُصْلِحُ بَالَكُمْ', transliteration: 'Alhamdulillah. Reply: Yarhamukallah. Answer: Yahdikumullahu wa yuslihu balakum.', meaning: 'The one who sneezes says: All praise is for Allah. The listener replies: May Allah have mercy on you. The one who sneezed answers: May Allah guide you and set your affairs right.', reference: 'Sahih al-Bukhari 6224' },
        { id: 'dressing', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَٰذَا الثَّوْبَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', transliteration: 'Alhamdu lillahil-ladhi kasani hadhath-thawba wa razaqanihi min ghayri hawlin minni wa la quwwah.', meaning: 'All praise is for Allah, who clothed me with this garment and provided it for me without any might or power from myself.', reference: 'Abu Dawud 4023' },
        { id: 'rain', arabic: 'اللَّهُمَّ صَيِّبًا نَافِعًا', transliteration: 'Allahumma sayyiban nafi‘a.', meaning: 'O Allah, let it be a beneficial rain.', reference: 'Sahih al-Bukhari 1032' },
        { id: 'sick', arabic: 'لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ', transliteration: 'La ba’s, tahurun in sha’ Allah.', meaning: 'No harm, it is a purification, if Allah wills.', reference: 'Sahih al-Bukhari 3616' },
        { id: 'newMoon', arabic: 'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ، وَالسَّلَامَةِ وَالْإِسْلَامِ، رَبِّي وَرَبُّكَ اللَّهُ', transliteration: 'Allahumma ahillahu ‘alayna bil-yumni wal-iman, was-salamati wal-islam, rabbi wa rabbukallah.', meaning: 'O Allah, let this moon appear to us with blessing and faith, with safety and Islam. My Lord and your Lord is Allah.', reference: 'at-Tirmidhi 3451' }
    ] },
    { id: 'family', icon: 'star', duas: [
        { id: 'parents', arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', transliteration: 'Rabbir-hamhuma kama rabbayani saghira.', meaning: 'My Lord, have mercy on them as they raised me when I was small.', reference: 'Quran 17:24' },
        { id: 'family', arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', transliteration: 'Rabbana hab lana min azwajina wa dhurriyyatina qurrata a‘yunin waj‘alna lil-muttaqina imama.', meaning: 'Our Lord, grant us from our spouses and offspring comfort to our eyes, and make us leaders of the righteous.', reference: 'Quran 25:74' }
    ] },
    { id: 'ramadan', icon: 'crescent', duas: [
        { id: 'iftar', arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ', transliteration: 'Dhahabadh-dhama’u wabtallatil-‘uruqu wa thabatal-ajru in sha’ Allah.', meaning: 'The thirst is gone, the veins are moistened, and the reward is certain, if Allah wills.', reference: 'Abu Dawud 2357' },
        { id: 'qadr', arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', transliteration: 'Allahumma innaka ‘afuwwun tuhibbul-‘afwa fa‘fu ‘anni.', meaning: 'O Allah, You are Pardoning and You love to pardon, so pardon me.', reference: 'at-Tirmidhi 3513' }
    ] }
];
