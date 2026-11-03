// Gebetsablauf nach verbreiteter sunnitischer Praxis.
// Jede Textgruppe: ar = arabische Zeilen, tr = Umschrift, de = Bedeutung in der gewählten Sprache.
import { t } from './i18n.js';

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
].map(named);

export const findPrayer = (id) => [...PRAYERS, ...EXTRA_PRAYERS].find((p) => p.id === id);

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
export function buildSteps(prayer, madhabId = 'hanafi', gender = 'm') {
  const m = MADHABS.find((x) => x.id === madhabId) || MADHABS[0];
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
        kind === 'jumua' ? t('instr.jumua', f) : t('instr.heart'),
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
      add({
        ...base, ...qiyam, key: 'fatiha', title: t('title.fatiha1'), rakah: r, dur: 16,
        instr: (r === 1 && !m.opening ? `${hands} ` : '') + (r === 1 ? t('instr.fatiha1First') : t('instr.fatiha1')),
        ...text('fatiha1'),
      });
      add({ ...base, ...qiyam, key: 'fatiha', title: t('title.fatiha2'), rakah: r, dur: 16, instr: t('instr.fatiha2'), ...text('fatiha2') });
      if (r <= 2 || kind !== 'fard') {
        add({ ...base, ...qiyam, key: 'sura', title: t('title.sura'), rakah: r, dur: 14, instr: kind === 'fard' ? t('instr.suraFard') : t('instr.suraNafl'), ...text('ikhlas') });
      }
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
