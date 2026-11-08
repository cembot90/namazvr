// Gebetsablauf nach verbreiteter sunnitischer Praxis.
// Jede Textgruppe: ar = arabische Zeilen, tr = Umschrift, de = Bedeutung in der gewählten Sprache.
import { t } from './i18n.js';
import { STORY_LIST } from './stories.js';

// Name und Untertitel kommen aus der Sprachdatei, als Getter, damit ein Sprachwechsel sofort wirkt.
const named = (p) => ({ ...p, get name() { return t(`pn.${p.id}`); }, get de() { return t(`pd.${p.id}`); } });

export const PRAYERS = [
  { id: 'fajr', ar: 'الفجر', rakat: 2 },
  { id: 'dhuhr', ar: 'الظهر', rakat: 4 },
  { id: 'asr', ar: 'العصر', rakat: 4 },
  { id: 'maghrib', ar: 'المغرب', rakat: 3 },
  { id: 'isha', ar: 'العشاء', rakat: 4 },
].map(named);

// Freiwillige und besondere Gebete. kind: sunnah = Sure in jeder Rakʿa, witr = mit Qunūt.
export const EXTRA_PRAYERS = [
  { id: 'sfajr', rakat: 2, kind: 'sunnah' },
  { id: 'sdhuhr1', rakat: 4, kind: 'sunnah' },
  { id: 'sdhuhr2', rakat: 2, kind: 'sunnah' },
  { id: 'smaghrib', rakat: 2, kind: 'sunnah' },
  { id: 'sisha', rakat: 2, kind: 'sunnah' },
  { id: 'witr', rakat: 3, kind: 'witr' },
  { id: 'jumua', rakat: 2, kind: 'jumua' },
  { id: 'tahiyya', rakat: 2, kind: 'sunnah' },
  { id: 'eid', rakat: 2, kind: 'eid' },
  { id: 'janaza', rakat: 0, kind: 'janaza' },
].map(named);

// Umre und Hac (Simulator); die 2 Rakʿāt im Iḥrām und nach dem Tavaf werden wie Sunnah-Gebete geführt
export const PILGRIMAGES = [{ id: 'umre', kind: 'umre' }, { id: 'hajj', kind: 'hajj' }].map(named);
// Alevilik: Rundgang durch das Cemevi und Semah
export const ALEVI = [{ id: 'cem', kind: 'cem' }, { id: 'semah', kind: 'semah' }].map(named);
export const IHRAM_PRAYER = named({ id: 'ihramp', rakat: 2, kind: 'sunnah' });
export const TAWAF_PRAYER = named({ id: 'tawafp', rakat: 2, kind: 'sunnah' });

export const findPrayer = (id) => [...PRAYERS, ...EXTRA_PRAYERS, ...PILGRIMAGES, ...ALEVI, ...STORY_LIST].find((p) => p.id === id);

// Vereinfachte Unterschiede der vier sunnitischen Rechtsschulen (für Männer; Details bei Gelehrten erfragen).
// Texte (hands, takbir, notes) stehen in der Sprachdatei unter madhab.<id>.
export const MADHABS = [
  { id: 'hanafi', qiyam: 'qiyam', opening: 'thana', raise: false, raiseStand: false, asr: 'hanafi', tawarruk: () => false, qunutFajr: null, qunutWitr: 'before', splitNafl: false },
  { id: 'shafii', qiyam: 'qiyam', opening: 'wajjahtu', raise: true, raiseStand: true, asr: 'standard', tawarruk: (final) => final, qunutFajr: 'after', qunutWitr: 'after', splitNafl: true },
  { id: 'maliki', qiyam: 'stand', opening: null, raise: false, raiseStand: false, asr: 'standard', tawarruk: () => true, qunutFajr: 'before', qunutWitr: null, splitNafl: true },
  { id: 'hanbali', qiyam: 'qiyam', opening: 'thana', raise: true, raiseStand: false, asr: 'standard', tawarruk: (final, rakat) => final && rakat > 2, qunutFajr: null, qunutWitr: 'after', splitNafl: true },
].map((m) => ({
  ...m,
  get name() { return t(`mname.${m.id}`); },
  get hands() { return t(`madhab.${m.id}.hands`); },
  get takbir() { return t(`madhab.${m.id}.takbir`); },
  get notes() { return t(`madhab.${m.id}.notes`); },
}));

// Arabischer Text und Umschrift; die Bedeutung kommt aus der Sprachdatei (mean.*).
const TXT = {
  takbir: {
    ar: ['اللهُ أَكْبَرُ'],
    tr: ['Allāhu akbar'],
  },
  thana: {
    ar: ['سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَىٰ جَدُّكَ، وَلَا إِلَٰهَ غَيْرُكَ'],
    tr: ['Subḥānaka llāhumma wa bi-ḥamdika, wa tabāraka smuka, wa taʿālā jadduka, wa lā ilāha ghayruk.'],
  },
  fatiha1: {
    ar: [
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      'الرَّحْمَٰنِ الرَّحِيمِ',
      'مَالِكِ يَوْمِ الدِّينِ',
    ],
    tr: [
      'Bismi llāhi r-raḥmāni r-raḥīm',
      'Al-ḥamdu li-llāhi rabbi l-ʿālamīn',
      'Ar-raḥmāni r-raḥīm',
      'Māliki yawmi d-dīn',
    ],
  },
  fatiha2: {
    ar: [
      'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
      'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
      'آمِين',
    ],
    tr: [
      'Iyyāka naʿbudu wa iyyāka nastaʿīn',
      'Ihdina ṣ-ṣirāṭa l-mustaqīm',
      'Ṣirāṭa lladhīna anʿamta ʿalayhim, ghayri l-maghḍūbi ʿalayhim wa la ḍ-ḍāllīn',
      'Āmīn',
    ],
  },
  ikhlas: {
    ar: [
      'قُلْ هُوَ اللَّهُ أَحَدٌ',
      'اللَّهُ الصَّمَدُ',
      'لَمْ يَلِدْ وَلَمْ يُولَدْ',
      'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    ],
    tr: [
      'Qul huwa llāhu aḥad',
      'Allāhu ṣ-ṣamad',
      'Lam yalid wa lam yūlad',
      'Wa lam yakun lahū kufuwan aḥad',
    ],
  },
  ruku: {
    ar: ['سُبْحَانَ رَبِّيَ الْعَظِيمِ'],
    tr: ['Subḥāna rabbiya l-ʿaẓīm  (3×)'],
  },
  itidal: {
    ar: ['سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', 'رَبَّنَا وَلَكَ الْحَمْدُ'],
    tr: ['Samiʿa llāhu li-man ḥamidah', 'Rabbanā wa laka l-ḥamd'],
  },
  sujud: {
    ar: ['سُبْحَانَ رَبِّيَ الْأَعْلَىٰ'],
    tr: ['Subḥāna rabbiya l-aʿlā  (3×)'],
  },
  jalsa: {
    ar: ['رَبِّ اغْفِرْ لِي'],
    tr: ['Rabbi ghfir lī'],
  },
  tashahhud: {
    ar: [
      'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ',
      'السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ',
      'السَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللَّهِ الصَّالِحِينَ',
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    ],
    tr: [
      'At-taḥiyyātu li-llāhi wa ṣ-ṣalawātu wa ṭ-ṭayyibāt',
      'As-salāmu ʿalayka ayyuha n-nabiyyu wa raḥmatu llāhi wa barakātuh',
      'As-salāmu ʿalaynā wa ʿalā ʿibādi llāhi ṣ-ṣāliḥīn',
      'Ashhadu an lā ilāha illa llāh, wa ashhadu anna Muḥammadan ʿabduhū wa rasūluh',
    ],
  },
  salawat: {
    ar: [
      'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
      'اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
    ],
    tr: [
      'Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammad, kamā ṣallayta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm, innaka ḥamīdun majīd.',
      'Allāhumma bārik ʿalā Muḥammadin wa ʿalā āli Muḥammad, kamā bārakta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm, innaka ḥamīdun majīd.',
    ],
  },
  dua: {
    ar: ['رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ'],
    tr: ['Rabbanā ātinā fi d-dunyā ḥasanatan wa fi l-ākhirati ḥasanatan wa qinā ʿadhāba n-nār.'],
  },
  wajjahtu: {
    ar: ['وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا وَمَا أَنَا مِنَ الْمُشْرِكِينَ'],
    tr: ['Wajjahtu wajhiya li-lladhī faṭara s-samāwāti wa l-arḍa ḥanīfan wa mā ana mina l-mushrikīn.'],
  },
  qunut: {
    ar: ['اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ'],
    tr: ['Allāhumma hdinī fīman hadayt, wa ʿāfinī fīman ʿāfayt, wa tawallanī fīman tawallayt …'],
  },
  qunutHanafi: {
    ar: ['اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ'],
    tr: ['Allāhumma innā nastaʿīnuka wa nastaghfiruka wa nuʾminu bika wa natawakkalu ʿalayka wa nuthnī ʿalayka l-khayr …'],
  },
  salam: {
    ar: ['السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ'],
    tr: ['As-salāmu ʿalaykum wa raḥmatu llāh'],
  },
};

// Kurze Suren zum Lernen (und als Zusatzsure im Gebet)
Object.assign(TXT, {
  asr: {
    ar: [
      'وَالْعَصْرِ',
      'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
      'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ',
    ],
    tr: ['Wa l-ʿaṣr', 'Inna l-insāna la-fī khusr', 'Illa lladhīna āmanū wa ʿamilu ṣ-ṣāliḥāti wa tawāṣaw bi-l-ḥaqqi wa tawāṣaw bi-ṣ-ṣabr'],
  },
  kawthar: {
    ar: [
      'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
      'فَصَلِّ لِرَبِّكَ وَانْحَرْ',
      'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',
    ],
    tr: ['Innā aʿṭaynāka l-kawthar', 'Fa-ṣalli li-rabbika wa-nḥar', 'Inna shāniʾaka huwa l-abtar'],
  },
  falaq: {
    ar: [
      'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
      'مِن شَرِّ مَا خَلَقَ',
      'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
      'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',
      'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    ],
    tr: ['Qul aʿūdhu bi-rabbi l-falaq', 'Min sharri mā khalaq', 'Wa min sharri ghāsiqin idhā waqab', 'Wa min sharri n-naffāthāti fi l-ʿuqad', 'Wa min sharri ḥāsidin idhā ḥasad'],
  },
  nas: {
    ar: [
      'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
      'مَلِكِ النَّاسِ',
      'إِلَٰهِ النَّاسِ',
      'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
      'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',
      'مِنَ الْجِنَّةِ وَالنَّاسِ',
    ],
    tr: ['Qul aʿūdhu bi-rabbi n-nās', 'Maliki n-nās', 'Ilāhi n-nās', 'Min sharri l-waswāsi l-khannās', 'Alladhī yuwaswisu fī ṣudūri n-nās', 'Mina l-jinnati wa n-nās'],
  },
});

Object.assign(TXT, {
  dua2: {
    ar: ['رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ'],
    tr: ['Rabbana ghfir lī wa li-wālidayya wa li-l-muʾminīna yawma yaqūmu l-ḥisāb.'],
  },
  taqabbal: {
    ar: ['تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُم'],
    tr: ['Taqabbala llāhu minnā wa minkum'],
  },
  basmala: {
    ar: ['بِسْمِ اللَّهِ'],
    tr: ['Bismi llāh'],
  },
  shahada: {
    ar: ['أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ'],
    tr: ['Ashhadu an lā ilāha illa llāhu waḥdahū lā sharīka lah, wa ashhadu anna Muḥammadan ʿabduhū wa rasūluh.'],
  },
});

// Weitere kurze Suren (Juzʾ ʿAmma), Ezan und Ikamet, Gebet für Verstorbene
Object.assign(TXT, {
  fil: {
    ar: [
      'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ',
      'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ',
      'وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ',
      'تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ',
      'فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ',
    ],
    tr: ['Alam tara kayfa faʿala rabbuka bi-aṣḥābi l-fīl', 'Alam yajʿal kaydahum fī taḍlīl', 'Wa arsala ʿalayhim ṭayran abābīl', 'Tarmīhim bi-ḥijāratin min sijjīl', 'Fa-jaʿalahum ka-ʿaṣfin maʾkūl'],
  },
  quraysh: {
    ar: [
      'لِإِيلَافِ قُرَيْشٍ',
      'إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ',
      'فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ',
      'الَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ',
    ],
    tr: ['Li-īlāfi Quraysh', 'Īlāfihim riḥlata sh-shitāʾi wa ṣ-ṣayf', 'Fa-l-yaʿbudū rabba hādha l-bayt', 'Alladhī aṭʿamahum min jūʿin wa āmanahum min khawf'],
  },
  maun: {
    ar: [
      'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ',
      'فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ',
      'وَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ',
      'فَوَيْلٌ لِّلْمُصَلِّينَ',
      'الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ',
      'الَّذِينَ هُمْ يُرَاءُونَ',
      'وَيَمْنَعُونَ الْمَاعُونَ',
    ],
    tr: ['Araʾayta lladhī yukadhdhibu bi-d-dīn', 'Fa-dhālika lladhī yaduʿʿu l-yatīm', 'Wa lā yaḥuḍḍu ʿalā ṭaʿāmi l-miskīn', 'Fa-waylun li-l-muṣallīn', 'Alladhīna hum ʿan ṣalātihim sāhūn', 'Alladhīna hum yurāʾūn', 'Wa yamnaʿūna l-māʿūn'],
  },
  kafirun: {
    ar: [
      'قُلْ يَا أَيُّهَا الْكَافِرُونَ',
      'لَا أَعْبُدُ مَا تَعْبُدُونَ',
      'وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ',
      'وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ',
      'وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ',
      'لَكُمْ دِينُكُمْ وَلِيَ دِينِ',
    ],
    tr: ['Qul yā ayyuha l-kāfirūn', 'Lā aʿbudu mā taʿbudūn', 'Wa lā antum ʿābidūna mā aʿbud', 'Wa lā ana ʿābidun mā ʿabadtum', 'Wa lā antum ʿābidūna mā aʿbud', 'Lakum dīnukum wa liya dīn'],
  },
  nasr: {
    ar: [
      'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ',
      'وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا',
      'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ إِنَّهُ كَانَ تَوَّابًا',
    ],
    tr: ['Idhā jāʾa naṣru llāhi wa l-fatḥ', 'Wa raʾayta n-nāsa yadkhulūna fī dīni llāhi afwājā', 'Fa-sabbiḥ bi-ḥamdi rabbika wa-staghfirh, innahū kāna tawwābā'],
  },
  masad: {
    ar: [
      'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ',
      'مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ',
      'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ',
      'وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ',
      'فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ',
    ],
    tr: ['Tabbat yadā Abī Lahabin wa tabb', 'Mā aghnā ʿanhu māluhū wa mā kasab', 'Sa-yaṣlā nāran dhāta lahab', 'Wa-mraʾatuhū ḥammālata l-ḥaṭab', 'Fī jīdihā ḥablun min masad'],
  },
  ezan: {
    ar: [
      'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللهُ',
      'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ',
      'حَيَّ عَلَى الصَّلَاةِ',
      'حَيَّ عَلَى الْفَلَاحِ',
      'الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ',
      'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
      'لَا إِلَٰهَ إِلَّا اللهُ',
    ],
    tr: ['Allāhu akbar, Allāhu akbar  (2×)', 'Ashhadu an lā ilāha illa llāh  (2×)', 'Ashhadu anna Muḥammadan rasūlu llāh  (2×)', 'Ḥayya ʿala ṣ-ṣalāh  (2×)', 'Ḥayya ʿala l-falāḥ  (2×)', 'Aṣ-ṣalātu khayrun mina n-nawm  (2×, Fajr)', 'Allāhu akbar, Allāhu akbar', 'Lā ilāha illa llāh'],
  },
  ikamet: {
    ar: [
      'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللهُ',
      'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ',
      'حَيَّ عَلَى الصَّلَاةِ',
      'حَيَّ عَلَى الْفَلَاحِ',
      'قَدْ قَامَتِ الصَّلَاةُ',
      'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ',
      'لَا إِلَٰهَ إِلَّا اللهُ',
    ],
    tr: ['Allāhu akbar, Allāhu akbar  (2×)', 'Ashhadu an lā ilāha illa llāh  (2×)', 'Ashhadu anna Muḥammadan rasūlu llāh  (2×)', 'Ḥayya ʿala ṣ-ṣalāh  (2×)', 'Ḥayya ʿala l-falāḥ  (2×)', 'Qad qāmati ṣ-ṣalāh  (2×)', 'Allāhu akbar, Allāhu akbar', 'Lā ilāha illa llāh'],
  },
  janazaDua: {
    ar: ['اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ'],
    tr: ['Allāhumma ghfir lahū wa-rḥamhu, wa ʿāfihī wa-ʿfu ʿanh'],
  },
});

// Umre und Hac
Object.assign(TXT, {
  talbiya: {
    ar: ['لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ', 'إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ'],
    tr: ['Labbayka llāhumma labbayk, labbayka lā sharīka laka labbayk', 'Inna l-ḥamda wa n-niʿmata laka wa l-mulk, lā sharīka lak'],
  },
  niyyaUmre: {
    ar: ['اللَّهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي'],
    tr: ['Allāhumma innī urīdu l-ʿumrata fa-yassirhā lī wa taqabbalhā minnī'],
  },
  niyyaHajj: {
    ar: ['اللَّهُمَّ إِنِّي أُرِيدُ الْحَجَّ فَيَسِّرْهُ لِي وَتَقَبَّلْهُ مِنِّي'],
    tr: ['Allāhumma innī urīdu l-ḥajja fa-yassirhu lī wa taqabbalhu minnī'],
  },
  istilam: {
    ar: ['بِسْمِ اللَّهِ، وَاللَّهُ أَكْبَرُ'],
    tr: ['Bismi llāh, wa llāhu akbar'],
  },
  maqam: {
    ar: ['وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى'],
    tr: ['Wa-ttakhidhū min maqāmi Ibrāhīma muṣallā'],
  },
  zamzam: {
    ar: ['اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ'],
    tr: ['Allāhumma innī asʾaluka ʿilman nāfiʿā, wa rizqan wāsiʿā, wa shifāʾan min kulli dāʾ'],
  },
  safa: {
    ar: ['إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ', 'أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ'],
    tr: ['Inna ṣ-ṣafā wa l-marwata min shaʿāʾiri llāh', 'Abdaʾu bi-mā badaʾa llāhu bih'],
  },
  tahlil: {
    ar: ['لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ'],
    tr: ['Lā ilāha illa llāhu waḥdahū lā sharīka lah, lahu l-mulku wa lahu l-ḥamd, wa huwa ʿalā kulli shayʾin qadīr'],
  },
  sayDua: {
    ar: ['رَبِّ اغْفِرْ وَارْحَمْ، إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ'],
    tr: ['Rabbi ghfir wa-rḥam, innaka anta l-aʿazzu l-akram'],
  },
  jamra: {
    ar: ['بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ'],
    tr: ['Bismi llāh, Allāhu akbar'],
  },
  tashriq: {
    ar: ['اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ، لَا إِلَٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ'],
    tr: ['Allāhu akbar, Allāhu akbar, lā ilāha illa llāhu wa llāhu akbar, Allāhu akbar wa li-llāhi l-ḥamd'],
  },
});

// Textgruppe in der gewählten Sprache; mehrere Schlüssel werden aneinandergehängt.
// Umschrift: eigene Fassung der Sprache (z. B. türkisch), sonst die wissenschaftliche; Arabisch zeigt keine.
export function text(...keys) {
  const out = { ar: [], tr: [], de: [] };
  for (const k of keys) {
    out.ar.push(...TXT[k].ar);
    if (t('showTranslit')) {
      const own = t(`translit.${k}`);
      out.tr.push(...(Array.isArray(own) ? own : TXT[k].tr));
    }
    out.de.push(...t(`mean.${k}`));
  }
  return out;
}

export const taqabbal = () => text('taqabbal');

const TASBIH_AR = [['سُبْحَانَ اللَّهِ', 'Subḥāna llāh', 33], ['الْحَمْدُ لِلَّهِ', 'Al-ḥamdu li-llāh', 33], ['اللهُ أَكْبَرُ', 'Allāhu akbar', 34]];
export const TASBIH = TASBIH_AR.map(([ar, tr, target], i) => ({
  ar, target,
  get tr() { const own = t('translit.tasbih'); return Array.isArray(own) ? own[i] : tr; },
  get de() { return t('mean.tasbih')[i]; },
}));

// Erzeugt die Schrittfolge für ein Gebet nach der gewählten Rechtsschule, in der aktuellen Sprache.
// key benennt die Art des Schritts (für den spirituellen Modus).
// suraKey: Zusatzsure nach der Fātiḥa (in der Suren-Ansicht wählbar)
// Zusätzliche Takbīre im Festgebet: [erste Rakʿa, zweite Rakʿa]
const EID_TAKBIRS = { hanafi: [3, 3], shafii: [7, 5], maliki: [6, 5], hanbali: [6, 5] };

// Totengebet (Ṣalāt al-Janāza): im Stehen, vier Takbīre, ohne Rukūʿ und Sujūd, dann Salām.
function buildJanaza(m, gender) {
  const steps = [];
  const add = (step) => steps.push({ ar: [], tr: [], de: [], rakah: 0, ...step });
  const raisePose = m.raise ? 'takbir' : m.qiyam;
  const opening = m.id === 'hanafi' ? ['thana'] : m.id === 'maliki' ? ['janazaDua'] : ['fatiha1', 'fatiha2'];
  add({ key: 'niyya', title: t('title.niyya'), pose: 'stand', dur: 10, instr: t('instr.niyya', t('niyya.janaza')), de: [t('ext.janazaNote'), t(`awra.${gender}`) || t('awra.m')] });
  add({ key: 'takbir', title: t('ext.janTakbir', 1), pose: 'takbir', dur: 6, instr: t('ext.janTakbir1', m.hands), ...text('takbir') });
  add({ key: 'opening', title: t('ext.janAfter1'), pose: m.qiyam, how: m.hands, dur: 14, instr: t('ext.janOpening', m.id), ...text(...opening) });
  add({ key: 'takbir', title: t('ext.janTakbir', 2), pose: raisePose, dur: 5, instr: t('ext.janTakbirN', m.raise), ...text('takbir') });
  add({ key: 'salawat', title: t('title.salawat'), pose: m.qiyam, how: m.hands, dur: 22, instr: t('ext.janSalawat'), ...text('salawat') });
  add({ key: 'takbir', title: t('ext.janTakbir', 3), pose: raisePose, dur: 5, instr: t('ext.janTakbirN', m.raise), ...text('takbir') });
  add({ key: 'dua', title: t('ext.janDua'), pose: m.qiyam, how: m.hands, dur: 16, instr: t('ext.janDuaInstr'), ...text('janazaDua') });
  add({ key: 'takbir', title: t('ext.janTakbir', 4), pose: raisePose, dur: 5, instr: t('ext.janTakbir4'), ...text('takbir') });
  add({ key: 'salam', title: t('title.salamR'), pose: 'salamStandR', dur: 5, instr: t('ext.janSalamR'), ...text('salam') });
  add({ key: 'salam', title: t('title.salamL'), pose: 'salamStandL', dur: 5, instr: t('ext.janSalamL', m.id), ...text('salam') });
  return steps;
}

export function buildSteps(prayer, madhabId = 'hanafi', gender = 'm', suraKey = 'ikhlas') {
  const m = MADHABS.find((x) => x.id === madhabId) || MADHABS[0];
  if (prayer.kind === 'janaza') return buildJanaza(m, gender);
  const f = gender === 'f';
  const pick = (table) => (table && (table[m.id] ?? table.default)) || '';
  // Für Frauen: Hände, Takbīr und Sitzen je nach Schule anpassen.
  const hands = (f && pick(t('women.hands'))) || m.hands;
  const takbirHow = (f && pick(t('women.takbir'))) || m.takbir;
  const womenSit = f && (m.id === 'hanafi' || m.id === 'hanbali');
  const extraRuku = f ? pick(t('women.ruku')) : '';
  const extraSujud = f ? pick(t('women.sujud')) : '';
  const kind = prayer.kind || 'fard';
  const steps = [];
  const add = (step) => steps.push({ ar: [], tr: [], de: [], ...step });
  const niyyaOf = (p) => (p.kind ? t(`niyya.${p.id}`) : t('niyya.fard', p.rakat, p.name));

  // Witr und 4 Rakʿāt Sunnah betet man je nach Schule am Stück oder als 2 + 1 bzw. 2 + 2.
  let units = [{ n: prayer.rakat, niyya: niyyaOf(prayer), label: '' }];
  if (m.splitNafl && kind === 'witr') {
    units = [{ n: 2, niyya: t('niyya.shaf'), label: t('unit.shaf') }, { n: 1, niyya: t('niyya.witr1'), label: t('unit.witr') }];
  } else if (m.splitNafl && prayer.rakat === 4 && kind === 'sunnah') {
    units = [1, 2].map((k) => ({ n: 2, niyya: t('niyya.part', k, prayer.name), label: t('unit.part', k) }));
  }

  const raiseNote = t('instr.raise');
  const sitText = (final, n) => (womenSit ? t('women.sit') : m.tawarruk(final, n) ? t('tawarruk') : t('iftirash'));
  for (const [ui, unit] of units.entries()) {
    const { n, label } = unit;
    const witrUnit = kind === 'witr' && (units.length === 1 || ui === 1);
    const base = { unit: label, of: n };
    add({
      ...base, key: 'niyya', title: t('title.niyya'), pose: 'stand', rakah: 0, dur: 10,
      instr: t('instr.niyya', unit.niyya),
      de: [
        kind === 'jumua' ? t('instr.jumua', f) : kind === 'eid' ? t('ext.eidNote') : t('instr.heart'),
        ...(ui === 0 ? [t(`awra.${gender}`) || t('awra.m')] : []),
      ],
    });

    for (let r = 1; r <= n; r++) {
      const last = r === n;
      const qiyam = { pose: m.qiyam, how: hands };
      if (r === 1) {
        add({ ...base, key: 'takbir', title: t('title.takbir'), pose: 'takbir', rakah: r, dur: 6, instr: t('instr.takbir', takbirHow), ...text('takbir') });
        if (m.opening) {
          add({ ...base, ...qiyam, key: 'opening', title: t('title.opening'), rakah: r, dur: 12, instr: t('instr.opening', hands), ...text(m.opening) });
        }
      }
      // Festgebet: zusätzliche Takbīre – in der 1. Rakʿa vor der Fātiḥa, in der 2. je nach Schule davor oder (Ḥanafī) vor dem Rukūʿ
      const eidN = kind === 'eid' ? EID_TAKBIRS[m.id][r - 1] : 0;
      const zawaid = () => add({ ...base, key: 'takbir', title: t('ext.zawaid', eidN), pose: 'takbir', rakah: r, dur: 4 + eidN * 3, instr: t('ext.zawaidInstr', eidN, m.id), ...text('takbir') });
      if (eidN && (r === 1 || m.id !== 'hanafi')) zawaid();
      add({
        ...base, ...qiyam, key: 'fatiha', title: t('title.fatiha1'), rakah: r, dur: 16,
        instr: (r === 1 && !m.opening ? `${hands} ` : '') + (r === 1 ? t('instr.fatiha1First') : t('instr.fatiha1')),
        ...text('fatiha1'),
      });
      add({ ...base, ...qiyam, key: 'fatiha', title: t('title.fatiha2'), rakah: r, dur: 16, instr: t('instr.fatiha2'), ...text('fatiha2') });
      if (r <= 2 || kind !== 'fard') {
        add({ ...base, ...qiyam, key: 'sura', title: t('title.sura'), rakah: r, dur: 14, instr: kind === 'fard' ? t('instr.suraFard') : t('instr.suraNafl'), ...text(suraKey) });
      }
      if (eidN && r === 2 && m.id === 'hanafi') zawaid();
      // Qunūt vor dem Rukūʿ: Ḥanafī im Witr, Mālikī leise im Fajr
      const qunutBefore = (witrUnit && last && m.qunutWitr === 'before') || (prayer.id === 'fajr' && r === 2 && m.qunutFajr === 'before');
      if (qunutBefore && m.id === 'hanafi') {
        add({ ...base, key: 'takbir', title: t('title.qunutTakbir'), pose: 'takbir', rakah: r, dur: 5, instr: t('instr.qunutTakbir'), ...text('takbir') });
        add({ ...base, ...qiyam, key: 'qunut', title: t('title.qunut'), rakah: r, dur: 16, instr: t('instr.qunutHanafi'), ...text('qunutHanafi') });
      } else if (qunutBefore) {
        add({ ...base, ...qiyam, key: 'qunut', title: t('title.qunutQuiet'), rakah: r, dur: 14, instr: t('instr.qunutQuiet'), ...text('qunut') });
      }
      add({ ...base, key: 'ruku', title: t('title.ruku'), pose: 'ruku', rakah: r, dur: 9, instr: t('instr.ruku', extraRuku + (m.raise ? raiseNote : '')), ...text('ruku') });
      add({ ...base, key: 'itidal', title: t('title.itidal'), pose: 'stand', rakah: r, dur: 8, instr: t('instr.itidal', m.raise ? raiseNote : ''), ...text('itidal') });
      const qunutAfter = (witrUnit && last && m.qunutWitr === 'after') || (prayer.id === 'fajr' && r === 2 && m.qunutFajr === 'after');
      if (qunutAfter) {
        add({ ...base, key: 'qunut', title: t('title.qunut'), pose: 'dua', rakah: r, dur: 14, instr: t('instr.qunutAfter', kind === 'witr' && m.id === 'shafii'), ...text('qunut') });
      }
      add({ ...base, key: 'sujud', title: t('title.sujud1'), pose: 'sujud', rakah: r, dur: 9, instr: t('instr.sujud1', extraSujud), ...text('sujud') });
      add({ ...base, key: 'jalsa', title: t('title.jalsa'), pose: 'sit', how: sitText(false, n), rakah: r, dur: 6, instr: t('instr.jalsa'), ...text('jalsa') });
      add({ ...base, key: 'sujud', title: t('title.sujud2'), pose: 'sujud', rakah: r, dur: 9, instr: t('instr.sujud2', f), ...text('sujud') });

      if (r === 2 && !last) {
        add({ ...base, key: 'tashahhud', title: t('title.tash1'), pose: 'sit', how: sitText(false, n), rakah: r, dur: 20, instr: t('instr.tash1'), ...text('tashahhud') });
      }
      if (!last) {
        add({ ...base, ...qiyam, key: 'rise', title: t('title.rise', r + 1), rakah: r + 1, dur: 5, instr: t('instr.rise', m.raiseStand && r === 2 ? raiseNote : ''), ...text('takbir') });
      } else {
        const finalSit = sitText(true, n);
        add({ ...base, key: 'tashahhud', title: t('title.tashLast'), pose: 'sit', how: finalSit, rakah: r, dur: 20, instr: t('instr.tashLast'), ...text('tashahhud') });
        add({ ...base, key: 'salawat', title: t('title.salawat'), pose: 'sit', how: finalSit, rakah: r, dur: 24, instr: t('instr.salawat'), ...text('salawat') });
        // Ḥanafī (z. B. in der Türkei): nach „Rabbanā ātinā“ auch „Rabbana ghfir lī“
        const duas = m.id === 'hanafi' ? text('dua', 'dua2') : text('dua');
        add({ ...base, key: 'dua', title: t('title.dua'), pose: 'sit', how: finalSit, rakah: r, dur: m.id === 'hanafi' ? 16 : 10, instr: t('instr.dua'), ...duas });
        add({ ...base, key: 'salam', title: t('title.salamR'), pose: 'taslimR', rakah: r, dur: 5, instr: t('instr.salamR'), ...text('salam') });
        add({ ...base, key: 'salam', title: t('title.salamL'), pose: 'taslimL', rakah: r, dur: 5, instr: ui < units.length - 1 ? t('instr.salamLNext') : t('instr.salamL'), ...text('salam') });
      }
    }
  }
  return steps;
}
