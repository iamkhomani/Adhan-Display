/*
 * Static content. Kept small and sourced; references point to the
 * standard sunnah.com numbering.
 */

export const PRAYER_INFO = {
    Fajr: { label: 'Fajr', arabic: 'الفجر' },
    Sunrise: { label: 'Sunrise', arabic: 'الشروق' },
    Dhuhr: { label: 'Dhuhr', arabic: 'الظهر' },
    Asr: { label: 'Asr', arabic: 'العصر' },
    Maghrib: { label: 'Maghrib', arabic: 'المغرب' },
    Isha: { label: 'Isha', arabic: 'العشاء' }
};

export const JUMUAH = { label: 'Jumu’ah', arabic: 'الجمعة' };

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

export const ASR_METHODS = [
    [0, 'Standard (Shafi’i, Maliki, Hanbali)'],
    [1, 'Hanafi']
];

export const HIGH_LATITUDE_RULES = [
    [0, 'Automatic'],
    [3, 'Angle based'],
    [1, 'Middle of the night'],
    [2, 'One seventh of the night']
];

export const ADHAN_SOUNDS = [
    ['default', 'Classic adhan', 'audio/adhan.mp3'],
    ['makkah', 'Makkah', 'audio/makkah.mp3'],
    ['madinah', 'Madinah', 'audio/madinah.mp3'],
    ['alafasy', 'Mishary Alafasy', 'audio/alafasy.mp3'],
    ['chime', 'Soft chime only', 'audio/chime.mp3'],
    ['none', 'Silent (no sound)', '']
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
        title: 'Ayat al-Kursi',
        quran: '2:255',
        meaning: 'Recite the Verse of the Throne once in the morning and once in the evening.',
        count: 1,
        reference: 'Quran 2:255'
    },
    {
        title: 'Al-Ikhlas, Al-Falaq and An-Nas',
        quran: '112',
        meaning: 'Recite the last three surahs three times each, morning and evening.',
        count: 3,
        reference: 'Sunan Abi Dawud 5082'
    },
    {
        title: 'Sayyid al-Istighfar',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
        transliteration: 'Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana ‘abduka, wa ana ‘ala ‘ahdika wa wa‘dika mastata‘tu, a‘udhu bika min sharri ma sana‘tu, abu’u laka bini‘matika ‘alayya, wa abu’u laka bidhanbi faghfir li, fa innahu la yaghfirudh-dhunuba illa anta.',
        meaning: 'O Allah, You are my Lord; there is no god but You. You created me and I am Your servant, and I keep Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.',
        count: 1,
        reference: 'Sahih al-Bukhari 6306'
    },
    {
        title: 'Protection',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration: 'Bismillahil-ladhi la yadurru ma‘asmihi shay’un fil-ardi wa la fis-sama’i wa huwas-Sami‘ul-‘Alim.',
        meaning: 'In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the All-Hearing, the All-Knowing.',
        count: 3,
        reference: 'Sunan Abi Dawud 5088'
    },
    {
        title: 'Contentment',
        arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
        transliteration: 'Raditu billahi rabba, wa bil-islami dina, wa bi-Muhammadin sallallahu ‘alayhi wa sallama nabiyya.',
        meaning: 'I am pleased with Allah as my Lord, with Islam as my religion and with Muhammad ﷺ as my Prophet.',
        count: 3,
        reference: 'Sunan Abi Dawud 5072'
    },
    {
        title: 'Reliance on Allah',
        arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        transliteration: 'Hasbiyallahu la ilaha illa huwa, ‘alayhi tawakkaltu wa huwa rabbul-‘arshil-‘azim.',
        meaning: 'Allah is sufficient for me; there is no god but Him. In Him I put my trust, and He is the Lord of the Mighty Throne.',
        count: 7,
        reference: 'Sunan Abi Dawud 5081'
    },
    {
        title: 'Tasbih',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhanallahi wa bihamdih.',
        meaning: 'Glory be to Allah and praise be to Him.',
        count: 100,
        reference: 'Sahih Muslim 2692'
    },
    {
        title: 'Tahlil',
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: 'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa ‘ala kulli shay’in qadir.',
        meaning: 'There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.',
        count: 100,
        reference: 'Sahih al-Bukhari 3293'
    },
    {
        title: 'Seeking forgiveness',
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
export const ISLAMIC_EVENTS = [
    ['Islamic New Year', 1, 1, 'The first day of Muharram.'],
    ['Day of Ashura', 1, 10, 'Fasting is recommended, together with the 9th or 11th.'],
    ['Ramadan begins', 9, 1, 'The month of fasting and the Quran.'],
    ['Last ten nights', 9, 21, 'Seek Laylat al-Qadr in the odd nights.'],
    ['Eid al-Fitr', 10, 1, 'The festival marking the end of Ramadan.'],
    ['First ten days of Dhul Hijjah', 12, 1, 'The best days of the year for good deeds.'],
    ['Day of Arafah', 12, 9, 'Fasting is recommended for those not performing Hajj.'],
    ['Eid al-Adha', 12, 10, 'The festival of sacrifice.']
];

export const HOLY_SITES = [
    ['Masjid al-Haram', 'Makkah', 'The Sacred Mosque around the Ka‘bah, the direction of prayer.', 'https://www.youtube.com/results?search_query=makkah+live&sp=EgJAAQ%253D%253D'],
    ['Al-Masjid an-Nabawi', 'Madinah', 'The Mosque of the Prophet ﷺ in Madinah.', 'https://www.youtube.com/results?search_query=madinah+live&sp=EgJAAQ%253D%253D'],
    ['Al-Masjid al-Aqsa', 'Jerusalem', 'The third holiest mosque in Islam.', 'https://www.youtube.com/results?search_query=al+aqsa+live&sp=EgJAAQ%253D%253D']
];

export const LEARN_SALAH = [
    ['My Prayer Book', 'Learn the prayer step by step in your browser.', 'https://www.myprayer.org/pages/my-prayer-book'],
    ['Namaz App for iPhone', 'Guided lessons for learning salah.', 'https://apps.apple.com/us/app/namaz-app-learn-salah-prayer/id1447056625'],
    ['Namaz App for Android', 'Guided lessons for learning salah.', 'https://play.google.com/store/apps/details?id=com.nurios.namazapp']
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
    transliteration: 'Ashhadu an la ilaha illallah, wa ashhadu anna Muhammadan rasulullah.',
    meaning: 'I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah.'
};

export const SUPPORT_URL = 'https://buymeacoffee.com/kmni';
