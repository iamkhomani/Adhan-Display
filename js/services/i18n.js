const base = {
    hero_title: 'Smart Islamic Prayer Dashboard',
    hero_subtitle: 'Prayer times, Salah tracking and spiritual tools in one calm interface.',
    focus: 'Focus Mode',
    gregorian: 'Gregorian',
    current_time: 'Current Time',
    location: 'Location',
    hijri: 'Hijri',
    current_prayer: 'Current Prayer',
    next_prayer_in: 'Next Prayer In',
    sunrise_warning: 'Prayer is not performed during sunrise.',
    todays_times: "Today's Times",
    daily_times: 'Daily Prayer Times',
    monthly_timetable: 'View Monthly Timetable',
    tracker_title: 'Prayer Tracker',
    tracker_subtitle: 'Tap a day to edit history.',
    last_7: 'Last 7 Days',
    last_30: 'Last 30 Days',
    past_days: 'Past Days',
    quran_tracker: 'Quran Reading Tracker',
    save_progress: 'Save Progress',
    qada: 'Missed Prayers (Qada)',
    digital: 'Digital',
    reset_content: 'Reset Content',
    qibla: 'Qibla Direction',
    qibla_from_north: 'from true North',
    open_qibla: 'Open Qibla Compass',
    ayah_of_day: 'Ayah of the Day',
    hadith_of_day: 'Hadith of the Day',
    night_prayers: 'Night Prayers',
    midnight: 'Midnight',
    tahajjud: 'Tahajjud',
    name_of_allah: 'Name of Allah',
    dua_of_day: 'Dua of the Day',
    ramadan: 'Ramadan',
    days_remaining: 'Days Remaining',
    fasting_timer: 'Fasting Timer',
    events: 'Upcoming Islamic Events',
    tools: 'Tools & Resources',
    adhkar: 'Morning & Evening Adhkar',
    prayer_guide: 'Prayer Guide',
    zakat: 'Zakat Calculator',
    holy_sites: 'Holy Sites Live',
    watch_stream: 'Watch Stream',
    get_app: 'Get App',
    install_app: 'Install App',
    install_description: 'Install Adhan Display on your home screen for fast offline access.',
    welcome: 'Welcome to Adhan Display',
    welcome_body: 'Choose a name if you want a personal greeting. You can change everything later in Settings.',
    your_name: 'Your name',
    continue: 'Continue',
    skip: 'Skip',
    jumuah: "It's Jumu'ah. Remember Surah Al-Kahf and Salawat.",
    dashboard_settings: 'Dashboard',
    language: 'Language',
    theme: 'Theme',
    text_size: 'Text Size',
    auto_dim: 'Auto Dim',
    screensaver: 'Ambient Screensaver',
    widgets: 'Show Widgets',
    custom_background: 'Custom Background',
    prayer_settings: 'Prayer & Location',
    calculation_method: 'Calculation Method',
    manual_offset: 'Manual Offset (min)',
    hijri_offset: 'Hijri Offset (days)',
    auto_qada: 'Auto-add missed prayers to Qada',
    inspiration_source: 'Daily Inspiration',
    audio_settings: 'Audio & Alerts',
    volume: 'Volume',
    custom_audio: 'Custom Adhan',
    wudu_alert: '10-minute Wudu Alert',
    tahajjud_alarm: 'Tahajjud Alert (30 min before Fajr)',
    daily_alert: 'Daily Inspiration',
    data_management: 'Data Management',
    data_note: 'Backups are local. No account is required.',
    reset_all: 'Reset All Counters',
    prayer_times: 'Prayer Times',
    tracker: 'Tracker'
};


/*
 * IMPORTANT:
 * English MUST exist as a real translation object.
 *
 * This is also the final fallback language.
 */
const translations = {
    en: {
        ...base
    },

    nl: {
        ...base,
        hero_title: 'Slim Islamitisch Gebedsdashboard',
        hero_subtitle: 'Gebedstijden, Salah-tracking en spirituele hulpmiddelen in één rustige interface.',
        focus: 'Focusmodus',
        gregorian: 'Gregoriaans',
        current_time: 'Huidige tijd',
        location: 'Locatie',
        hijri: 'Hidjri',
        current_prayer: 'Huidig gebed',
        next_prayer_in: 'Volgend gebed over',
        sunrise_warning: 'Tijdens zonsopkomst wordt het gebed niet verricht.',
        todays_times: 'Vandaag',
        daily_times: 'Dagelijkse gebedstijden',
        monthly_timetable: 'Maandoverzicht openen',
        tracker_title: 'Gebedstracker',
        tracker_subtitle: 'Tik op een dag om de geschiedenis te wijzigen.',
        last_7: 'Laatste 7 dagen',
        last_30: 'Laatste 30 dagen',
        past_days: 'Vorige dagen',
        quran_tracker: 'Quran Reading Tracker',
        save_progress: 'Voortgang opslaan',
        qada: 'Gemiste gebeden (Qada)',
        digital: 'Digitaal',
        reset_content: 'Inhoud resetten',
        qibla: 'Qibla-richting',
        qibla_from_north: 'vanaf het ware noorden',
        open_qibla: 'Open Qibla-kompas',
        ayah_of_day: 'Vers van de dag',
        hadith_of_day: 'Hadith van de dag',
        night_prayers: 'Nachtgebeden',
        midnight: 'Middernacht',
        tahajjud: 'Tahajjud',
        name_of_allah: 'Naam van Allah',
        dua_of_day: 'Dua van de dag',
        ramadan: 'Ramadan',
        days_remaining: 'Dagen resterend',
        fasting_timer: 'Vastentimer',
        events: 'Islamitische gebeurtenissen',
        tools: 'Tools & bronnen',
        adhkar: 'Ochtend- & avondadhkar',
        prayer_guide: 'Gebedsgids',
        zakat: 'Zakat calculator',
        holy_sites: 'Heilige plaatsen live',
        watch_stream: 'Stream bekijken',
        get_app: 'App gebruiken',
        install_app: 'App installeren',
        install_description: 'Installeer Adhan Display op je startscherm voor snelle offline toegang.',
        welcome: 'Welkom bij Adhan Display',
        welcome_body: 'Kies een naam voor een persoonlijke begroeting. Alles kan later worden aangepast in Instellingen.',
        your_name: 'Jouw naam',
        continue: 'Doorgaan',
        skip: 'Overslaan',
        jumuah: 'Het is Jumu’ah. Vergeet Surah Al-Kahf en salawat niet.',
        dashboard_settings: 'Dashboard',
        language: 'Taal',
        theme: 'Thema',
        text_size: 'Tekstgrootte',
        auto_dim: 'Automatisch dimmen',
        screensaver: 'Omgevingsscreensaver',
        widgets: 'Widgets tonen',
        custom_background: 'Eigen achtergrond',
        prayer_settings: 'Gebed & locatie',
        calculation_method: 'Berekeningsmethode',
        manual_offset: 'Handmatige correctie (min)',
        hijri_offset: 'Hidjri-correctie (dagen)',
        auto_qada: 'Gemiste gebeden automatisch naar Qada',
        inspiration_source: 'Dagelijkse inspiratie',
        audio_settings: 'Audio & meldingen',
        volume: 'Volume',
        custom_audio: 'Eigen adhan',
        wudu_alert: 'Wudu-melding 10 minuten vooraf',
        tahajjud_alarm: 'Tahajjud-melding 30 minuten voor Fajr',
        daily_alert: 'Dagelijkse inspiratie',
        data_management: 'Gegevensbeheer',
        data_note: 'Back-ups zijn lokaal. Een account is niet nodig.',
        reset_all: 'Alle tellers resetten',
        prayer_times: 'Gebedstijden',
        tracker: 'Tracker'
    },

    tr: {
        ...base,
        hero_title: 'Akıllı İslami Namaz Panosu',
        hero_subtitle: 'Namaz vakitleri, Salah takibi ve manevi araçlar tek bir sakin arayüzde.',
        focus: 'Odak Modu',
        gregorian: 'Miladi',
        current_time: 'Şu anki saat',
        location: 'Konum',
        hijri: 'Hicri',
        current_prayer: 'Mevcut Namaz',
        next_prayer_in: 'Sıradaki Namaza',
        todays_times: 'Bugünün Vakitleri',
        daily_times: 'Günlük Namaz Vakitleri',
        monthly_timetable: 'Aylık Çizelge',
        tracker_title: 'Namaz Takibi',
        tracker_subtitle: 'Geçmişi düzenlemek için bir güne dokunun.',
        last_7: 'Son 7 Gün',
        last_30: 'Son 30 Gün',
        past_days: 'Geçmiş Günler',
        qibla: 'Kıble Yönü',
        qibla_from_north: 'gerçek kuzeyden',
        open_qibla: 'Kıble Pusulasını Aç',
        ayah_of_day: 'Günün Ayeti',
        hadith_of_day: 'Günün Hadisi',
        night_prayers: 'Gece Namazları',
        midnight: 'Gece Yarısı',
        tahajjud: 'Teheccüd',
        name_of_allah: 'Allah’ın İsmi',
        dua_of_day: 'Günün Duası',
        ramadan: 'Ramazan',
        days_remaining: 'Kalan Günler',
        fasting_timer: 'Oruç Zamanlayıcısı',
        events: 'Yaklaşan İslami Etkinlikler',
        tools: 'Araçlar ve Kaynaklar',
        adhkar: 'Sabah ve Akşam Zikirleri',
        prayer_guide: 'Namaz Rehberi',
        zakat: 'Zekât Hesaplayıcı',
        holy_sites: 'Kutsal Mekânlar Canlı',
        watch_stream: 'Yayını İzle',
        get_app: 'Uygulamayı Al',
        install_app: 'Uygulamayı Yükle',
        welcome: 'Adhan Display’e Hoş Geldiniz',
        your_name: 'Adınız',
        continue: 'Devam',
        skip: 'Atla',
        language: 'Dil',
        theme: 'Tema',
        text_size: 'Metin Boyutu',
        prayer_settings: 'Namaz ve Konum',
        calculation_method: 'Hesaplama yöntemi',
        manual_offset: 'Manuel düzeltme (dk)',
        hijri_offset: 'Hicri düzeltme (gün)',
        audio_settings: 'Ses ve Uyarılar',
        volume: 'Ses',
        data_management: 'Veri Yönetimi',
        reset_all: 'Tüm Sayaçları Sıfırla',
        prayer_times: 'Namaz Vakitleri',
        tracker: 'Takip'
    },

    fr: {
        ...base,
        hero_title: 'Tableau de bord islamique intelligent',
        hero_subtitle: 'Horaires de prière, suivi de la Salah et outils spirituels dans une interface sereine.',
        focus: 'Mode Focus',
        gregorian: 'Grégorien',
        current_time: 'Heure actuelle',
        location: 'Emplacement',
        hijri: 'Hégire',
        current_prayer: 'Prière actuelle',
        next_prayer_in: 'Prochaine prière dans',
        todays_times: "Horaires d'aujourd'hui",
        daily_times: 'Horaires quotidiens',
        monthly_timetable: 'Calendrier mensuel',
        tracker_title: 'Suivi de la prière',
        tracker_subtitle: 'Appuyez sur un jour pour modifier l’historique.',
        last_7: '7 derniers jours',
        last_30: '30 derniers jours',
        past_days: 'Jours précédents',
        qibla: 'Direction de la Qibla',
        qibla_from_north: 'depuis le nord vrai',
        open_qibla: 'Ouvrir la boussole Qibla',
        ayah_of_day: 'Verset du jour',
        hadith_of_day: 'Hadith du jour',
        night_prayers: 'Prières nocturnes',
        midnight: 'Minuit',
        tahajjud: 'Tahajjud',
        name_of_allah: 'Nom d’Allah',
        dua_of_day: 'Doua du jour',
        ramadan: 'Ramadan',
        days_remaining: 'Jours restants',
        fasting_timer: 'Minuteur de jeûne',
        events: 'Événements islamiques à venir',
        tools: 'Outils et ressources',
        adhkar: 'Adhkar du matin et du soir',
        prayer_guide: 'Guide de prière',
        zakat: 'Calculateur de Zakat',
        holy_sites: 'Lieux saints en direct',
        watch_stream: 'Voir le flux',
        get_app: "Obtenir l'application",
        install_app: "Installer l'application",
        welcome: 'Bienvenue sur Adhan Display',
        your_name: 'Votre nom',
        continue: 'Continuer',
        skip: 'Passer',
        language: 'Langue',
        theme: 'Thème',
        text_size: 'Taille du texte',
        prayer_settings: 'Prière et emplacement',
        calculation_method: 'Méthode de calcul',
        manual_offset: 'Correction manuelle (min)',
        hijri_offset: 'Correction Hijri (jours)',
        audio_settings: 'Audio et alertes',
        volume: 'Volume',
        data_management: 'Gestion des données',
        reset_all: 'Réinitialiser tous les compteurs',
        prayer_times: 'Horaires de prière',
        tracker: 'Suivi'
    },

    de: {
        ...base,
        hero_title: 'Intelligentes islamisches Gebets-Dashboard',
        hero_subtitle: 'Gebetszeiten, Salah-Tracking und spirituelle Werkzeuge in einer ruhigen Oberfläche.',
        focus: 'Fokusmodus',
        gregorian: 'Gregorianisch',
        current_time: 'Aktuelle Zeit',
        location: 'Ort',
        hijri: 'Hidschri',
        current_prayer: 'Aktuelles Gebet',
        next_prayer_in: 'Nächstes Gebet in',
        todays_times: 'Heutige Gebetszeiten',
        daily_times: 'Tägliche Gebetszeiten',
        monthly_timetable: 'Monatsübersicht',
        tracker_title: 'Gebets-Tracker',
        tracker_subtitle: 'Tippe auf einen Tag, um den Verlauf zu bearbeiten.',
        last_7: 'Letzte 7 Tage',
        last_30: 'Letzte 30 Tage',
        past_days: 'Vergangene Tage',
        qibla: 'Qibla-Richtung',
        qibla_from_north: 'vom geografischen Norden',
        open_qibla: 'Qibla-Kompass öffnen',
        ayah_of_day: 'Vers des Tages',
        hadith_of_day: 'Hadith des Tages',
        night_prayers: 'Nachtgebete',
        midnight: 'Mitternacht',
        tahajjud: 'Tahajjud',
        name_of_allah: 'Name Allahs',
        dua_of_day: 'Dua des Tages',
        ramadan: 'Ramadan',
        days_remaining: 'Verbleibende Tage',
        fasting_timer: 'Fasten-Timer',
        events: 'Kommende islamische Ereignisse',
        tools: 'Werkzeuge & Ressourcen',
        adhkar: 'Morgen- & Abend-Adhkar',
        prayer_guide: 'Gebetsanleitung',
        zakat: 'Zakat-Rechner',
        holy_sites: 'Heilige Orte live',
        watch_stream: 'Stream ansehen',
        get_app: 'App abrufen',
        install_app: 'App installieren',
        welcome: 'Willkommen bei Adhan Display',
        your_name: 'Dein Name',
        continue: 'Weiter',
        skip: 'Überspringen',
        language: 'Sprache',
        theme: 'Design',
        text_size: 'Textgröße',
        prayer_settings: 'Gebet & Standort',
        calculation_method: 'Berechnungsmethode',
        manual_offset: 'Manuelle Korrektur (Min.)',
        hijri_offset: 'Hidschri-Korrektur (Tage)',
        audio_settings: 'Audio & Warnungen',
        volume: 'Lautstärke',
        data_management: 'Datenverwaltung',
        reset_all: 'Alle Zähler zurücksetzen',
        prayer_times: 'Gebetszeiten',
        tracker: 'Tracker'
    },

    es: {
        ...base,
        hero_title: 'Panel Islámico Inteligente',
        hero_subtitle: 'Horarios de oración, seguimiento de Salah y herramientas espirituales en una interfaz tranquila.',
        focus: 'Modo Enfoque',
        gregorian: 'Gregoriano',
        current_time: 'Hora actual',
        location: 'Ubicación',
        hijri: 'Hiyri',
        current_prayer: 'Oración actual',
        next_prayer_in: 'Próxima oración en',
        todays_times: 'Horarios de hoy',
        daily_times: 'Horarios diarios de oración',
        monthly_timetable: 'Calendario mensual',
        tracker_title: 'Seguimiento de oración',
        tracker_subtitle: 'Toca un día para editar el historial.',
        last_7: 'Últimos 7 días',
        last_30: 'Últimos 30 días',
        past_days: 'Días anteriores',
        qibla: 'Dirección de la Qibla',
        qibla_from_north: 'desde el norte verdadero',
        open_qibla: 'Abrir brújula Qibla',
        ayah_of_day: 'Aleya del día',
        hadith_of_day: 'Hadiz del día',
        night_prayers: 'Oraciones nocturnas',
        midnight: 'Medianoche',
        tahajjud: 'Tahajjud',
        name_of_allah: 'Nombre de Allah',
        dua_of_day: 'Dua del día',
        ramadan: 'Ramadán',
        days_remaining: 'Días restantes',
        fasting_timer: 'Temporizador de ayuno',
        events: 'Próximos eventos islámicos',
        tools: 'Herramientas y recursos',
        adhkar: 'Adhkar de mañana y tarde',
        prayer_guide: 'Guía de oración',
        zakat: 'Calculadora de Zakat',
        holy_sites: 'Lugares sagrados en directo',
        watch_stream: 'Ver transmisión',
        get_app: 'Obtener aplicación',
        install_app: 'Instalar aplicación',
        welcome: 'Bienvenido a Adhan Display',
        your_name: 'Tu nombre',
        continue: 'Continuar',
        skip: 'Omitir',
        language: 'Idioma',
        theme: 'Tema',
        text_size: 'Tamaño del texto',
        prayer_settings: 'Oración y ubicación',
        calculation_method: 'Método de cálculo',
        manual_offset: 'Corrección manual (min)',
        hijri_offset: 'Corrección Hiyri (días)',
        audio_settings: 'Audio y alertas',
        volume: 'Volumen',
        data_management: 'Gestión de datos',
        reset_all: 'Restablecer todos los contadores',
        prayer_times: 'Horarios de oración',
        tracker: 'Seguimiento'
    },

    ar: {
        ...base,
        hero_title: 'لوحة الصلاة الإسلامية الذكية',
        hero_subtitle: 'أوقات الصلاة وتتبع الصلاة والأدوات الروحية في واجهة هادئة.',
        focus: 'وضع التركيز',
        gregorian: 'ميلادي',
        current_time: 'الوقت الحالي',
        location: 'الموقع',
        hijri: 'هجري',
        current_prayer: 'الصلاة الحالية',
        next_prayer_in: 'الصلاة التالية خلال',
        todays_times: 'أوقات اليوم',
        daily_times: 'أوقات الصلاة اليومية',
        monthly_timetable: 'الجدول الشهري',
        tracker_title: 'متابعة الصلاة',
        tracker_subtitle: 'اضغط على يوم لتعديل السجل.',
        last_7: 'آخر 7 أيام',
        last_30: 'آخر 30 يومًا',
        past_days: 'الأيام السابقة',
        qibla: 'اتجاه القبلة',
        qibla_from_north: 'من الشمال الحقيقي',
        open_qibla: 'فتح بوصلة القبلة',
        ayah_of_day: 'آية اليوم',
        hadith_of_day: 'حديث اليوم',
        night_prayers: 'صلوات الليل',
        midnight: 'منتصف الليل',
        tahajjud: 'التهجد',
        name_of_allah: 'اسم الله',
        dua_of_day: 'دعاء اليوم',
        ramadan: 'رمضان',
        days_remaining: 'الأيام المتبقية',
        fasting_timer: 'مؤقت الصيام',
        events: 'المناسبات الإسلامية القادمة',
        tools: 'الأدوات والمصادر',
        adhkar: 'أذكار الصباح والمساء',
        prayer_guide: 'دليل الصلاة',
        zakat: 'حاسبة الزكاة',
        holy_sites: 'الأماكن المقدسة مباشرة',
        watch_stream: 'مشاهدة البث',
        get_app: 'الحصول على التطبيق',
        install_app: 'تثبيت التطبيق',
        welcome: 'مرحبًا بك في Adhan Display',
        your_name: 'اسمك',
        continue: 'متابعة',
        skip: 'تخطي',
        language: 'اللغة',
        theme: 'المظهر',
        text_size: 'حجم النص',
        prayer_settings: 'الصلاة والموقع',
        calculation_method: 'طريقة الحساب',
        manual_offset: 'التعديل اليدوي (دقيقة)',
        hijri_offset: 'تعديل هجري (أيام)',
        audio_settings: 'الصوت والتنبيهات',
        volume: 'مستوى الصوت',
        data_management: 'إدارة البيانات',
        reset_all: 'إعادة ضبط جميع العدادات',
        prayer_times: 'أوقات الصلاة',
        tracker: 'المتابعة'
    },

    id: {
        ...base,
        hero_title: 'Dashboard Waktu Salat Islami',
        hero_subtitle: 'Waktu salat, pelacak ibadah, dan alat spiritual dalam satu antarmuka yang tenang.',
        focus: 'Mode Fokus',
        gregorian: 'Gregorian',
        current_time: 'Waktu sekarang',
        location: 'Lokasi',
        hijri: 'Hijriah',
        current_prayer: 'Salat saat ini',
        next_prayer_in: 'Salat berikutnya dalam',
        todays_times: 'Waktu Salat Hari Ini',
        daily_times: 'Waktu Salat Harian',
        monthly_timetable: 'Jadwal Bulanan',
        tracker_title: 'Pelacak Salat',
        tracker_subtitle: 'Ketuk hari untuk mengedit riwayat.',
        last_7: '7 Hari Terakhir',
        last_30: '30 Hari Terakhir',
        past_days: 'Hari Sebelumnya',
        qibla: 'Arah Kiblat',
        qibla_from_north: 'dari utara sebenarnya',
        open_qibla: 'Buka Kompas Kiblat',
        ayah_of_day: 'Ayat Hari Ini',
        hadith_of_day: 'Hadis Hari Ini',
        night_prayers: 'Salat Malam',
        midnight: 'Tengah Malam',
        tahajjud: 'Tahajud',
        name_of_allah: 'Nama Allah',
        dua_of_day: 'Doa Hari Ini',
        ramadan: 'Ramadan',
        days_remaining: 'Hari Tersisa',
        fasting_timer: 'Pengatur Waktu Puasa',
        events: 'Acara Islam Mendatang',
        tools: 'Alat & Sumber',
        adhkar: 'Zikir Pagi & Petang',
        prayer_guide: 'Panduan Salat',
        zakat: 'Kalkulator Zakat',
        holy_sites: 'Tempat Suci Langsung',
        watch_stream: 'Tonton Siaran',
        get_app: 'Dapatkan Aplikasi',
        install_app: 'Pasang Aplikasi',
        welcome: 'Selamat Datang di Adhan Display',
        your_name: 'Nama Anda',
        continue: 'Lanjutkan',
        skip: 'Lewati',
        language: 'Bahasa',
        theme: 'Tema',
        text_size: 'Ukuran Teks',
        prayer_settings: 'Salat & Lokasi',
        calculation_method: 'Metode perhitungan',
        manual_offset: 'Koreksi manual (menit)',
        hijri_offset: 'Koreksi Hijriah (hari)',
        audio_settings: 'Audio & Peringatan',
        volume: 'Volume',
        data_management: 'Manajemen Data',
        reset_all: 'Atur Ulang Semua Penghitung',
        prayer_times: 'Waktu Salat',
        tracker: 'Pelacak'
    },

    ur: {
        ...base,
        hero_title: 'اسمارٹ اسلامی نماز ڈیش بورڈ',
        hero_subtitle: 'نماز کے اوقات، نماز ٹریکنگ اور روحانی سہولیات ایک پرسکون انٹرفیس میں۔',
        focus: 'فوکس موڈ',
        gregorian: 'عیسوی',
        current_time: 'موجودہ وقت',
        location: 'مقام',
        hijri: 'ہجری',
        current_prayer: 'موجودہ نماز',
        next_prayer_in: 'اگلی نماز میں',
        todays_times: 'آج کے اوقات',
        daily_times: 'روزانہ نماز کے اوقات',
        monthly_timetable: 'ماہانہ جدول',
        tracker_title: 'نماز ٹریکر',
        tracker_subtitle: 'ریکارڈ میں ترمیم کرنے کے لیے دن منتخب کریں۔',
        last_7: 'گزشتہ 7 دن',
        last_30: 'گزشتہ 30 دن',
        past_days: 'گزشتہ دن',
        qibla: 'قبلہ کی سمت',
        qibla_from_north: 'حقیقی شمال سے',
        open_qibla: 'قبلہ کمپاس کھولیں',
        ayah_of_day: 'آج کی آیت',
        hadith_of_day: 'آج کی حدیث',
        night_prayers: 'رات کی نمازیں',
        midnight: 'آدھی رات',
        tahajjud: 'تہجد',
        name_of_allah: 'اللہ کا نام',
        dua_of_day: 'آج کی دعا',
        ramadan: 'رمضان',
        days_remaining: 'باقی دن',
        fasting_timer: 'روزہ ٹائمر',
        events: 'آنے والے اسلامی واقعات',
        tools: 'ٹولز اور وسائل',
        adhkar: 'صبح و شام کے اذکار',
        prayer_guide: 'نماز گائیڈ',
        zakat: 'زکوٰۃ کیلکولیٹر',
        holy_sites: 'مقدس مقامات لائیو',
        watch_stream: 'اسٹریم دیکھیں',
        get_app: 'ایپ حاصل کریں',
        install_app: 'ایپ انسٹال کریں',
        welcome: 'Adhan Display میں خوش آمدید',
        your_name: 'آپ کا نام',
        continue: 'جاری رکھیں',
        skip: 'چھوڑیں',
        language: 'زبان',
        theme: 'تھیم',
        text_size: 'متن کا سائز',
        prayer_settings: 'نماز اور مقام',
        calculation_method: 'حساب کا طریقہ',
        manual_offset: 'دستی اصلاح (منٹ)',
        hijri_offset: 'ہجری اصلاح (دن)',
        audio_settings: 'آڈیو اور الرٹس',
        volume: 'آواز',
        data_management: 'ڈیٹا مینجمنٹ',
        reset_all: 'تمام کاؤنٹرز ری سیٹ کریں',
        prayer_times: 'نماز کے اوقات',
        tracker: 'ٹریکر'
    },

    bn: {
        ...base,
        hero_title: 'স্মার্ট ইসলামিক নামাজ ড্যাশবোর্ড',
        hero_subtitle: 'নামাজের সময়, সালাত ট্র্যাকিং এবং আধ্যাত্মিক সরঞ্জাম এক শান্ত ইন্টারফেসে।',
        focus: 'ফোকাস মোড',
        gregorian: 'গ্রেগরিয়ান',
        current_time: 'বর্তমান সময়',
        location: 'অবস্থান',
        hijri: 'হিজরি',
        current_prayer: 'বর্তমান নামাজ',
        next_prayer_in: 'পরবর্তী নামাজে',
        todays_times: 'আজকের সময়সূচি',
        daily_times: 'দৈনিক নামাজের সময়',
        monthly_timetable: 'মাসিক সময়সূচি',
        tracker_title: 'নামাজ ট্র্যাকার',
        tracker_subtitle: 'ইতিহাস সম্পাদনা করতে একটি দিন নির্বাচন করুন।',
        last_7: 'শেষ ৭ দিন',
        last_30: 'শেষ ৩০ দিন',
        past_days: 'পূর্ববর্তী দিন',
        qibla: 'কিবলার দিক',
        qibla_from_north: 'সত্যিকারের উত্তর থেকে',
        open_qibla: 'কিবলা কম্পাস খুলুন',
        ayah_of_day: 'আজকের আয়াত',
        hadith_of_day: 'আজকের হাদিস',
        night_prayers: 'রাতের নামাজ',
        midnight: 'মধ্যরাত',
        tahajjud: 'তাহাজ্জুদ',
        name_of_allah: 'আল্লাহর নাম',
        dua_of_day: 'আজকের দোয়া',
        ramadan: 'রমজান',
        days_remaining: 'অবশিষ্ট দিন',
        fasting_timer: 'রোজার টাইমার',
        events: 'আসন্ন ইসলামিক অনুষ্ঠান',
        tools: 'টুলস ও রিসোর্স',
        adhkar: 'সকাল ও সন্ধ্যার যিকর',
        prayer_guide: 'নামাজ গাইড',
        zakat: 'যাকাত ক্যালকুলেটর',
        holy_sites: 'পবিত্র স্থান লাইভ',
        watch_stream: 'স্ট্রিম দেখুন',
        get_app: 'অ্যাপ নিন',
        install_app: 'অ্যাপ ইনস্টল করুন',
        welcome: 'Adhan Display-এ স্বাগতম',
        your_name: 'আপনার নাম',
        continue: 'চালিয়ে যান',
        skip: 'এড়িয়ে যান',
        language: 'ভাষা',
        theme: 'থিম',
        text_size: 'টেক্সট সাইজ',
        prayer_settings: 'নামাজ ও অবস্থান',
        calculation_method: 'হিসাবের পদ্ধতি',
        manual_offset: 'ম্যানুয়াল সংশোধন (মিনিট)',
        hijri_offset: 'হিজরি সংশোধন (দিন)',
        audio_settings: 'অডিও ও সতর্কতা',
        volume: 'ভলিউম',
        data_management: 'ডেটা ব্যবস্থাপনা',
        reset_all: 'সব কাউন্টার রিসেট করুন',
        prayer_times: 'নামাজের সময়',
        tracker: 'ট্র্যাকার'
    },

    ru: {
        ...base,
        hero_title: 'Интеллектуальная исламская панель намаза',
        hero_subtitle: 'Время молитв, отслеживание Салах и духовные инструменты в одном спокойном интерфейсе.',
        focus: 'Режим фокуса',
        gregorian: 'Григорианский',
        current_time: 'Текущее время',
        location: 'Местоположение',
        hijri: 'Хиджра',
        current_prayer: 'Текущая молитва',
        next_prayer_in: 'Следующая молитва через',
        todays_times: 'Время молитв сегодня',
        daily_times: 'Ежедневное время молитв',
        monthly_timetable: 'Месячное расписание',
        tracker_title: 'Трекер молитв',
        tracker_subtitle: 'Нажмите на день, чтобы изменить историю.',
        last_7: 'Последние 7 дней',
        last_30: 'Последние 30 дней',
        past_days: 'Прошедшие дни',
        qibla: 'Направление Киблы',
        qibla_from_north: 'от истинного севера',
        open_qibla: 'Открыть компас Киблы',
        ayah_of_day: 'Аят дня',
        hadith_of_day: 'Хадис дня',
        night_prayers: 'Ночные молитвы',
        midnight: 'Полночь',
        tahajjud: 'Тахаджуд',
        name_of_allah: 'Имя Аллаха',
        dua_of_day: 'Дуа дня',
        ramadan: 'Рамадан',
        days_remaining: 'Осталось дней',
        fasting_timer: 'Таймер поста',
        events: 'Предстоящие исламские события',
        tools: 'Инструменты и ресурсы',
        adhkar: 'Утренний и вечерний зикр',
        prayer_guide: 'Руководство по молитве',
        zakat: 'Калькулятор закята',
        holy_sites: 'Святые места в реальном времени',
        watch_stream: 'Смотреть трансляцию',
        get_app: 'Получить приложение',
        install_app: 'Установить приложение',
        welcome: 'Добро пожаловать в Adhan Display',
        your_name: 'Ваше имя',
        continue: 'Продолжить',
        skip: 'Пропустить',
        language: 'Язык',
        theme: 'Тема',
        text_size: 'Размер текста',
        prayer_settings: 'Молитва и местоположение',
        calculation_method: 'Метод расчёта',
        manual_offset: 'Ручная корректировка (мин)',
        hijri_offset: 'Корректировка Хиджры (дни)',
        audio_settings: 'Аудио и оповещения',
        volume: 'Громкость',
        data_management: 'Управление данными',
        reset_all: 'Сбросить все счётчики',
        prayer_times: 'Время молитв',
        tracker: 'Трекер'
    }
};


/*
 * Return supported languages.
 */
export function getLanguageOptions() {
    return Object.entries({
        en: 'English',
        nl: 'Nederlands',
        tr: 'Türkçe',
        fr: 'Français',
        de: 'Deutsch',
        es: 'Español',
        ar: 'العربية',
        id: 'Bahasa Indonesia',
        ur: 'اردو',
        bn: 'বাংলা',
        ru: 'Русский'
    });
}


/*
 * Safely apply translations.
 *
 * A missing language or missing translation can NEVER
 * crash the entire application.
 */
export function applyTranslations(lang) {
    const requestedLanguage =
        typeof lang === 'string'
            ? lang.toLowerCase()
            : 'en';

    const dict =
        translations[requestedLanguage] ||
        translations.en ||
        base;

    document.documentElement.lang = requestedLanguage;

    document.documentElement.dir =
        ['ar', 'ur'].includes(requestedLanguage)
            ? 'rtl'
            : 'ltr';

    document
        .querySelectorAll('[data-i18n]')
        .forEach(element => {
            const key = element.dataset.i18n;

            if (!key) {
                return;
            }

            const value =
                dict?.[key] ??
                base?.[key] ??
                key;

            if (typeof value === 'string') {
                element.textContent = value;
            }
        });

    /*
     * Placeholder translations.
     */
    document
        .querySelectorAll('[data-i18n-placeholder]')
        .forEach(element => {
            const key = element.dataset.i18nPlaceholder;

            if (!key) {
                return;
            }

            const value =
                dict?.[key] ??
                base?.[key] ??
                key;

            if (typeof value === 'string') {
                element.setAttribute('placeholder', value);
            }
        });

    /*
     * Title / tooltip translations.
     */
    document
        .querySelectorAll('[data-i18n-title]')
        .forEach(element => {
            const key = element.dataset.i18nTitle;

            if (!key) {
                return;
            }

            const value =
                dict?.[key] ??
                base?.[key] ??
                key;

            if (typeof value === 'string') {
                element.setAttribute('title', value);
            }
        });

    return dict;
}


/*
 * Get a single translated value safely.
 */
export function t(key, lang = 'en') {
    const requestedLanguage =
        typeof lang === 'string'
            ? lang.toLowerCase()
            : 'en';

    const dict =
        translations[requestedLanguage] ||
        translations.en ||
        base;

    return (
        dict?.[key] ??
        base?.[key] ??
        key
    );
}


export { translations };
