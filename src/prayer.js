// Gebetsablauf nach verbreiteter sunnitischer Praxis.
// Jede Textgruppe: ar = arabische Zeilen, tr = Umschrift, de = deutsche Bedeutung.

export const PRAYERS = [
  { id: 'fajr', name: 'Fajr', ar: 'الفجر', rakat: 2, de: 'Morgengebet' },
  { id: 'dhuhr', name: 'Dhuhr', ar: 'الظهر', rakat: 4, de: 'Mittagsgebet' },
  { id: 'asr', name: 'Asr', ar: 'العصر', rakat: 4, de: 'Nachmittag' },
  { id: 'maghrib', name: 'Maghrib', ar: 'المغرب', rakat: 3, de: 'Abendgebet' },
  { id: 'isha', name: 'Isha', ar: 'العشاء', rakat: 4, de: 'Nachtgebet' },
];

// Freiwillige und besondere Gebete. kind: sunnah = Sure in jeder Rakʿa, witr = mit Qunūt.
export const EXTRA_PRAYERS = [
  { id: 'sfajr', name: 'Sunnah vor Fajr', rakat: 2, kind: 'sunnah', de: 'stark betonte Sunnah', niyya: 'die 2 Rakʿāt Sunnah vor dem Fajr-Gebet' },
  { id: 'sdhuhr1', name: 'Sunnah vor Dhuhr', rakat: 4, kind: 'sunnah', de: 'vor dem Pflichtgebet', niyya: 'die 4 Rakʿāt Sunnah vor dem Dhuhr-Gebet' },
  { id: 'sdhuhr2', name: 'Sunnah nach Dhuhr', rakat: 2, kind: 'sunnah', de: 'nach dem Pflichtgebet', niyya: 'die 2 Rakʿāt Sunnah nach dem Dhuhr-Gebet' },
  { id: 'smaghrib', name: 'Sunnah nach Maghrib', rakat: 2, kind: 'sunnah', de: 'nach dem Pflichtgebet', niyya: 'die 2 Rakʿāt Sunnah nach dem Maghrib-Gebet' },
  { id: 'sisha', name: 'Sunnah nach Isha', rakat: 2, kind: 'sunnah', de: 'nach dem Pflichtgebet', niyya: 'die 2 Rakʿāt Sunnah nach dem Isha-Gebet' },
  { id: 'witr', name: 'Witr', rakat: 3, kind: 'witr', de: 'nach Isha bis vor Fajr', niyya: 'das Witr-Gebet' },
  { id: 'jumua', name: 'Jumuʿa', rakat: 2, kind: 'jumua', de: 'Freitag, statt Dhuhr', niyya: 'die 2 Rakʿāt des Freitagsgebets hinter dem Imam' },
  { id: 'tahiyya', name: 'Taḥiyyat al-Masjid', rakat: 2, kind: 'sunnah', de: 'beim Betreten der Moschee', niyya: '2 Rakʿāt zur Begrüßung der Moschee' },
];

export const findPrayer = (id) => [...PRAYERS, ...EXTRA_PRAYERS].find((p) => p.id === id);

// Vereinfachte Unterschiede der vier sunnitischen Rechtsschulen (für Männer; Details bei Gelehrten erfragen).
export const MADHABS = [
  {
    id: 'hanafi', name: 'Ḥanafī', qiyam: 'qiyam', opening: 'thana', raise: false, raiseStand: false, asr: 'hanafi',
    hands: 'Lege die rechte Hand über die linke, unterhalb des Bauchnabels.',
    takbir: 'bis auf Ohrhöhe – die Daumen berühren fast die Ohrläppchen',
    tawarruk: () => false, qunutFajr: null, qunutWitr: 'before', splitNafl: false,
    notes: ['Hände unterhalb des Bauchnabels', 'Eröffnung mit „Subḥānaka llāhumma“', 'Hände nur beim Eröffnungs-Takbīr heben', 'Sitzen immer auf dem linken Fuß (Iftirāsh)', 'Witr: 3 Rakʿāt am Stück, Qunūt vor dem Rukūʿ', 'Asr nach Ḥanafī-Berechnung'],
  },
  {
    id: 'shafii', name: 'Shāfiʿī', qiyam: 'qiyam', opening: 'wajjahtu', raise: true, raiseStand: true, asr: 'standard',
    hands: 'Lege die rechte Hand über die linke, unterhalb der Brust und oberhalb des Bauchnabels.',
    takbir: 'bis auf Schulterhöhe',
    tawarruk: (final) => final, qunutFajr: 'after', qunutWitr: 'after', splitNafl: true,
    notes: ['Hände zwischen Brust und Bauchnabel', 'Eröffnung mit „Wajjahtu wajhiya“', 'Hände heben auch beim Rukūʿ, beim Aufrichten und nach dem 1. Tashahhud', 'Letztes Sitzen im Tawarruk', 'Qunūt im Fajr nach dem Rukūʿ der 2. Rakʿa', 'Witr: 2 + 1 Rakʿa getrennt'],
  },
  {
    id: 'maliki', name: 'Mālikī', qiyam: 'stand', opening: null, raise: false, raiseStand: false, asr: 'standard',
    hands: 'Lass die Arme locker seitlich hängen (Sadl).',
    takbir: 'bis auf Schulterhöhe',
    tawarruk: () => true, qunutFajr: 'before', qunutWitr: null, splitNafl: true,
    notes: ['Arme seitlich hängen lassen (Sadl)', 'Kein Eröffnungs-Bittgebet im Pflichtgebet', 'Hände nur beim Eröffnungs-Takbīr heben', 'Alle Sitzhaltungen im Tawarruk', 'Qunūt im Fajr leise vor dem Rukūʿ der 2. Rakʿa', 'Witr: 2 + 1 Rakʿa getrennt'],
  },
  {
    id: 'hanbali', name: 'Ḥanbalī', qiyam: 'qiyam', opening: 'thana', raise: true, raiseStand: false, asr: 'standard',
    hands: 'Lege die rechte Hand über die linke, unterhalb des Bauchnabels.',
    takbir: 'bis auf Schulterhöhe',
    tawarruk: (final, rakat) => final && rakat > 2, qunutFajr: null, qunutWitr: 'after', splitNafl: true,
    notes: ['Hände unterhalb des Bauchnabels', 'Eröffnung mit „Subḥānaka llāhumma“', 'Hände heben auch beim Rukūʿ und beim Aufrichten', 'Tawarruk nur im letzten Sitzen von 3- und 4-Rakʿa-Gebeten', 'Witr: 2 + 1, Qunūt nach dem Rukūʿ'],
  },
];

// Unterschiede für Frauen (vereinfacht, nach verbreiteter Lehre der jeweiligen Schule).
const WOMEN = {
  hands: { hanafi: 'Lege die rechte Hand über die linke auf die Brust.' },
  takbir: { hanafi: 'bis auf Schulterhöhe, die Hände bleiben unter dem Tuch' },
  ruku: {
    hanafi: ' Verbeuge dich etwas weniger tief, die Finger geschlossen auf den Knien, die Arme nah am Körper.',
    default: ' Halte die Arme dabei nah am Körper.',
  },
  sujud: {
    hanafi: ' Halte dich kompakt: Bauch nah an den Oberschenkeln, Arme am Körper, die Unterarme liegen auf dem Boden.',
    default: ' Halte dich kompakt: Bauch nah an den Oberschenkeln, die Arme nah am Körper.',
  },
  sit: 'Sitz auf dem Boden, beide Füße zeigen nach rechts heraus. Hände auf die Oberschenkel.',
};
const AWRA = {
  m: 'Für Männer: Bedeckt sein muss mindestens der Bereich vom Bauchnabel bis zu den Knien, besser auch die Schultern.',
  f: 'Für Frauen: Bedeckt ist der ganze Körper außer Gesicht und Händen (Ḥanafī: auch die Füße dürfen frei sein). Während der Menstruation und der Wochenbettblutung wird nicht gebetet; diese Gebete werden nicht nachgeholt.',
};

const IFTIRASH = 'Sitz auf dem linken Fuß, der rechte Fuß bleibt aufgestellt, die Zehen zeigen zur Qibla. Hände auf die Oberschenkel.';
const TAWARRUK = 'Tawarruk: Gesäß auf den Boden, der linke Fuß kommt unter dem rechten Unterschenkel heraus, der rechte Fuß bleibt aufgestellt.';

const TXT = {
  takbir: {
    ar: ['اللهُ أَكْبَرُ'],
    tr: ['Allāhu akbar'],
    de: ['Allah ist größer (als alles).'],
  },
  thana: {
    ar: ['سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَىٰ جَدُّكَ، وَلَا إِلَٰهَ غَيْرُكَ'],
    tr: ['Subḥānaka llāhumma wa bi-ḥamdika, wa tabāraka smuka, wa taʿālā jadduka, wa lā ilāha ghayruk.'],
    de: ['Gepriesen seist Du, o Allah, und Dir gebührt das Lob. Gesegnet ist Dein Name, erhaben Deine Majestät, und es gibt keinen Gott außer Dir.'],
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
    de: [
      'Im Namen Allahs, des Allerbarmers, des Barmherzigen.',
      'Alles Lob gebührt Allah, dem Herrn der Welten,',
      'dem Allerbarmer, dem Barmherzigen,',
      'dem Herrscher am Tag des Gerichts.',
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
    de: [
      'Dir allein dienen wir, und Dich allein bitten wir um Hilfe.',
      'Leite uns den geraden Weg,',
      'den Weg derer, denen Du Gnade erwiesen hast, nicht derer, die Deinem Zorn verfallen sind, und nicht der Irregehenden.',
      'Amen – o Allah, erhöre uns.',
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
    de: [
      'Sprich: Er ist Allah, der Eine,',
      'Allah, der Absolute, auf den alle angewiesen sind.',
      'Er zeugt nicht und wurde nicht gezeugt,',
      'und niemand ist Ihm gleich.',
    ],
  },
  ruku: {
    ar: ['سُبْحَانَ رَبِّيَ الْعَظِيمِ'],
    tr: ['Subḥāna rabbiya l-ʿaẓīm  (3×)'],
    de: ['Gepriesen sei mein Herr, der Gewaltige.'],
  },
  itidal: {
    ar: ['سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', 'رَبَّنَا وَلَكَ الْحَمْدُ'],
    tr: ['Samiʿa llāhu li-man ḥamidah', 'Rabbanā wa laka l-ḥamd'],
    de: ['Allah hört den, der Ihn lobt.', 'Unser Herr, Dir gebührt alles Lob.'],
  },
  sujud: {
    ar: ['سُبْحَانَ رَبِّيَ الْأَعْلَىٰ'],
    tr: ['Subḥāna rabbiya l-aʿlā  (3×)'],
    de: ['Gepriesen sei mein Herr, der Höchste.'],
  },
  jalsa: {
    ar: ['رَبِّ اغْفِرْ لِي'],
    tr: ['Rabbi ghfir lī'],
    de: ['Mein Herr, vergib mir.'],
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
    de: [
      'Alle Grüße, Gebete und guten Dinge gebühren Allah.',
      'Friede sei mit dir, o Prophet, und die Barmherzigkeit Allahs und Sein Segen.',
      'Friede sei mit uns und mit den rechtschaffenen Dienern Allahs.',
      'Ich bezeuge, dass es keinen Gott gibt außer Allah, und dass Muhammad Sein Diener und Gesandter ist.',
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
    de: [
      'O Allah, lass Deine Gnade auf Muhammad und seine Familie herabkommen, wie Du sie auf Ibrahim und seine Familie herabkommen ließest. Du bist der Preiswürdige, der Ruhmreiche.',
      'O Allah, segne Muhammad und seine Familie, wie Du Ibrahim und seine Familie gesegnet hast. Du bist der Preiswürdige, der Ruhmreiche.',
    ],
  },
  dua: {
    ar: ['رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ'],
    tr: ['Rabbanā ātinā fi d-dunyā ḥasanatan wa fi l-ākhirati ḥasanatan wa qinā ʿadhāba n-nār.'],
    de: ['Unser Herr, gib uns im Diesseits Gutes und im Jenseits Gutes, und bewahre uns vor der Strafe des Feuers.'],
  },
  wajjahtu: {
    ar: ['وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا وَمَا أَنَا مِنَ الْمُشْرِكِينَ'],
    tr: ['Wajjahtu wajhiya li-lladhī faṭara s-samāwāti wa l-arḍa ḥanīfan wa mā ana mina l-mushrikīn.'],
    de: ['Ich wende mein Gesicht aufrichtig Dem zu, der die Himmel und die Erde erschaffen hat, und ich gehöre nicht zu denen, die Ihm etwas beigesellen. (Anfang des Bittgebets)'],
  },
  qunut: {
    ar: ['اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ'],
    tr: ['Allāhumma hdinī fīman hadayt, wa ʿāfinī fīman ʿāfayt, wa tawallanī fīman tawallayt …'],
    de: ['O Allah, leite mich unter denen, die Du geleitet hast, gewähre mir Wohlergehen unter denen, denen Du es gewährt hast, und nimm Dich meiner an unter denen, deren Du Dich angenommen hast … (Anfang des Qunūt)'],
  },
  qunutHanafi: {
    ar: ['اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ'],
    tr: ['Allāhumma innā nastaʿīnuka wa nastaghfiruka wa nuʾminu bika wa natawakkalu ʿalayka wa nuthnī ʿalayka l-khayr …'],
    de: ['O Allah, wir bitten Dich um Hilfe und um Vergebung, wir glauben an Dich, vertrauen auf Dich und loben Dich mit allem Guten … (Anfang des Qunūt)'],
  },
  salam: {
    ar: ['السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ'],
    tr: ['As-salāmu ʿalaykum wa raḥmatu llāh'],
    de: ['Friede sei mit euch und die Barmherzigkeit Allahs.'],
  },
};

export const TAQABBAL = {
  ar: ['تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُم'],
  tr: ['Taqabbala llāhu minnā wa minkum'],
  de: ['Möge Allah es von uns und von euch annehmen.'],
};

export const TASBIH = [
  { ar: 'سُبْحَانَ اللَّهِ', tr: 'Subḥāna llāh', de: 'Gepriesen sei Allah', target: 33 },
  { ar: 'الْحَمْدُ لِلَّهِ', tr: 'Al-ḥamdu li-llāh', de: 'Alles Lob gebührt Allah', target: 33 },
  { ar: 'اللهُ أَكْبَرُ', tr: 'Allāhu akbar', de: 'Allah ist größer', target: 34 },
];

// Erzeugt die Schrittfolge für ein Gebet nach der gewählten Rechtsschule.
export function buildSteps(prayer, madhabId = 'hanafi', gender = 'm') {
  const base0 = MADHABS.find((x) => x.id === madhabId) || MADHABS[0];
  const f = gender === 'f';
  const pick = (table) => table[base0.id] ?? table.default ?? '';
  // Für Frauen: Hände, Takbīr und Sitzen je nach Schule anpassen.
  const m = !f ? base0 : {
    ...base0,
    hands: WOMEN.hands[base0.id] || base0.hands,
    takbir: WOMEN.takbir[base0.id] || base0.takbir,
  };
  const womenSit = f && (m.id === 'hanafi' || m.id === 'hanbali');
  const extraRuku = f ? pick(WOMEN.ruku) : '';
  const extraSujud = f ? pick(WOMEN.sujud) : '';
  const kind = prayer.kind || 'fard';
  const steps = [];
  const add = (step) => steps.push({ ar: [], tr: [], de: [], ...step });

  // Witr und 4 Rakʿāt Sunnah betet man je nach Schule am Stück oder als 2 + 1 bzw. 2 + 2.
  let units = [{ n: prayer.rakat, niyya: prayer.niyya || `die ${prayer.rakat} Rakʿāt des ${prayer.name}-Gebets`, label: '' }];
  if (m.splitNafl && kind === 'witr') {
    units = [{ n: 2, niyya: 'die 2 Rakʿāt Shafʿ vor dem Witr', label: 'Shafʿ' }, { n: 1, niyya: 'die 1 Rakʿa Witr', label: 'Witr' }];
  } else if (m.splitNafl && prayer.rakat === 4 && kind === 'sunnah') {
    units = [1, 2].map((k) => ({ n: 2, niyya: `die ${k === 1 ? 'ersten' : 'zweiten'} 2 Rakʿāt ${prayer.name}`, label: `Teil ${k}` }));
  }

  const raiseNote = ' Hebe dabei die Hände wie beim Eröffnungs-Takbīr (Rafʿ al-Yadayn).';
  for (const [ui, unit] of units.entries()) {
    const { n, label } = unit;
    const witrUnit = kind === 'witr' && (units.length === 1 || ui === 1);
    const base = { unit: label, of: n };
    add({
      ...base, title: 'Niyya – Absicht', pose: 'stand', rakah: 0, dur: 10,
      instr: `Stell dich aufrecht in Richtung Qibla, den Blick auf den Platz der Niederwerfung. Fasse im Herzen die Absicht: „Ich bete ${unit.niyya} für Allah.“`,
      de: [
        kind === 'jumua'
          ? `Das Freitagsgebet betest du in der Gemeinschaft hinter dem Imam, direkt nach der Khuṭba. Der Imam rezitiert laut – ob du die Fātiḥa leise mitsprichst, hängt von der Rechtsschule ab.${f ? ' Für Frauen ist es keine Pflicht: Sie dürfen teilnehmen oder beten stattdessen Dhuhr.' : ''}`
          : 'Die Absicht wird im Herzen gefasst – sie muss nicht laut ausgesprochen werden.',
        ...(ui === 0 ? [AWRA[gender] || AWRA.m] : []),
      ],
    });

    for (let r = 1; r <= n; r++) {
      const last = r === n;
      const qiyam = { pose: m.qiyam, how: m.hands };
      if (r === 1) {
        add({
          ...base, title: 'Takbīrat al-Iḥrām', pose: 'takbir', rakah: r, dur: 6,
          instr: `Hebe die Hände ${m.takbir} und sprich den Eröffnungs-Takbīr. Ab jetzt bist du im Gebet.`,
          ...TXT.takbir,
        });
        if (m.opening) {
          add({
            ...base, ...qiyam, title: 'Eröffnungs-Bittgebet', rakah: r, dur: 12,
            instr: `${m.hands} Sprich leise (Sunnah):`,
            ...TXT[m.opening],
          });
        }
      }
      add({
        ...base, ...qiyam, title: 'Al-Fātiḥa (1/2)', rakah: r, dur: 16,
        instr: (r === 1 && !m.opening ? `${m.hands} ` : '') + (r === 1
          ? 'Sprich leise „Aʿūdhu billāhi mina sh-shayṭāni r-rajīm“, dann rezitiere die Fātiḥa – sie ist in jeder Rakʿa Pflicht:'
          : 'Rezitiere die Fātiḥa – sie ist in jeder Rakʿa Pflicht:'),
        ...TXT.fatiha1,
      });
      add({ ...base, ...qiyam, title: 'Al-Fātiḥa (2/2)', rakah: r, dur: 16, instr: '… und schließe mit „Āmīn“ ab:', ...TXT.fatiha2 });
      if (r <= 2 || kind !== 'fard') {
        add({
          ...base, ...qiyam, title: 'Zusätzliche Sure', rakah: r, dur: 14,
          instr: kind === 'fard'
            ? 'In den ersten beiden Rakʿāt folgt eine weitere Sure – z. B. Al-Ikhlāṣ (112) oder jede andere, die du kannst:'
            : 'In freiwilligen Gebeten folgt in jeder Rakʿa eine weitere Sure – z. B. Al-Ikhlāṣ (112):',
          ...TXT.ikhlas,
        });
      }
      // Qunūt vor dem Rukūʿ: Ḥanafī im Witr, Mālikī leise im Fajr
      const qunutBefore = (witrUnit && last && m.qunutWitr === 'before') || (prayer.id === 'fajr' && r === 2 && m.qunutFajr === 'before');
      if (qunutBefore && m.id === 'hanafi') {
        add({ ...base, title: 'Takbīr für das Qunūt', pose: 'takbir', rakah: r, dur: 5, instr: 'Sprich „Allāhu akbar“ und hebe die Hände wie beim Eröffnungs-Takbīr, dann lege sie wieder übereinander.', ...TXT.takbir });
        add({ ...base, ...qiyam, title: 'Qunūt', rakah: r, dur: 16, instr: 'Sprich das Qunūt-Bittgebet:', ...TXT.qunutHanafi });
      } else if (qunutBefore) {
        add({ ...base, ...qiyam, title: 'Qunūt (leise)', rakah: r, dur: 14, instr: 'Sprich vor dem Rukūʿ leise das Qunūt-Bittgebet:', ...TXT.qunut });
      }
      add({
        ...base, title: 'Rukūʿ – Verbeugung', pose: 'ruku', rakah: r, dur: 9,
        instr: `Sprich „Allāhu akbar“ und verbeuge dich: Rücken gerade, Hände auf den Knien.${extraRuku}${m.raise ? raiseNote : ''} Sprich dreimal:`,
        ...TXT.ruku,
      });
      add({ ...base, title: 'Iʿtidāl – Aufrichten', pose: 'stand', rakah: r, dur: 8, instr: `Richte dich wieder auf, bis du gerade stehst.${m.raise ? raiseNote : ''} Sprich:`, ...TXT.itidal });
      const qunutAfter = (witrUnit && last && m.qunutWitr === 'after') || (prayer.id === 'fajr' && r === 2 && m.qunutFajr === 'after');
      if (qunutAfter) {
        add({
          ...base, title: 'Qunūt', pose: 'dua', rakah: r, dur: 14,
          instr: `Hebe die Hände zum Bittgebet, Handflächen nach oben, und sprich das Qunūt${kind === 'witr' && m.id === 'shafii' ? ' (im Witr empfohlen in der zweiten Hälfte des Ramadan)' : ''}:`,
          ...TXT.qunut,
        });
      }
      const sitShort = womenSit ? WOMEN.sit : m.tawarruk(false, n) ? TAWARRUK : IFTIRASH;
      add({
        ...base, title: 'Sujūd – 1. Niederwerfung', pose: 'sujud', rakah: r, dur: 9,
        instr: `Sprich „Allāhu akbar“ und wirf dich nieder: Stirn und Nase, beide Handflächen, beide Knie und die Zehen berühren den Boden.${extraSujud} Sprich dreimal:`,
        ...TXT.sujud,
      });
      add({ ...base, title: 'Julūs – kurzes Sitzen', pose: 'sit', how: sitShort, rakah: r, dur: 6, instr: 'Sprich „Allāhu akbar“ und setz dich kurz aufrecht hin:', ...TXT.jalsa });
      add({ ...base, title: 'Sujūd – 2. Niederwerfung', pose: 'sujud', rakah: r, dur: 9, instr: `Sprich „Allāhu akbar“ und wirf dich ein zweites Mal nieder.${f ? ' Wieder kompakt bleiben.' : ''} Sprich dreimal:`, ...TXT.sujud });

      if (r === 2 && !last) {
        add({
          ...base, title: 'Erster Tashahhud', pose: 'sit', how: sitShort, rakah: r, dur: 20,
          instr: 'Sprich „Allāhu akbar“ und setz dich. Sprich den Tashahhud – beim Glaubensbekenntnis hebst du den rechten Zeigefinger:',
          ...TXT.tashahhud,
        });
      }
      if (!last) {
        add({
          ...base, ...qiyam, title: `Aufstehen zur ${r + 1}. Rakʿa`, rakah: r + 1, dur: 5,
          instr: `Steh auf und sprich dabei den Takbīr.${m.raiseStand && r === 2 ? raiseNote : ''}`,
          ...TXT.takbir,
        });
      } else {
        const finalSit = womenSit ? WOMEN.sit : m.tawarruk(true, n) ? TAWARRUK : IFTIRASH;
        add({
          ...base, title: 'Letzter Tashahhud', pose: 'sit', how: finalSit, rakah: r, dur: 20,
          instr: 'Sprich „Allāhu akbar“ und setz dich zum letzten Sitzen. Sprich den Tashahhud:',
          ...TXT.tashahhud,
        });
        add({ ...base, title: 'Ṣalawāt Ibrāhīmiyya', pose: 'sit', how: finalSit, rakah: r, dur: 24, instr: 'Bleib sitzen und sprich den Segenswunsch für den Propheten ﷺ:', ...TXT.salawat });
        add({ ...base, title: 'Bittgebet (Duʿāʾ)', pose: 'sit', how: finalSit, rakah: r, dur: 10, instr: 'Empfohlen: ein kurzes Bittgebet vor dem Friedensgruß, z. B.:', ...TXT.dua });
        add({ ...base, title: 'Taslīm – rechts', pose: 'taslimR', rakah: r, dur: 5, instr: 'Dreh den Kopf nach rechts und sprich den Friedensgruß:', ...TXT.salam });
        add({
          ...base, title: 'Taslīm – links', pose: 'taslimL', rakah: r, dur: 5,
          instr: ui < units.length - 1 ? 'Dreh den Kopf nach links und sprich ihn noch einmal. Danach stehst du für den nächsten Teil auf.' : 'Dreh den Kopf nach links und sprich ihn noch einmal. Damit ist das Gebet beendet.',
          ...TXT.salam,
        });
      }
    }
  }
  return steps;
}
