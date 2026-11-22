// Esmāʾ al-Ḥusnā: die 99 schönen Namen Allahs (Liste nach at-Tirmiḏī 3507; „Allah hat 99 Namen …“, al-Buḫārī 2736).
// Arabisch und Umschrift hier; Bedeutungen in der Sprachdatei (esma.m, Reihenfolge wie hier).
import { t } from './i18n.js';

const RAW = [
  ['الرَّحْمَٰنُ', 'ar-Raḥmān'], ['الرَّحِيمُ', 'ar-Raḥīm'], ['الْمَلِكُ', 'al-Malik'], ['الْقُدُّوسُ', 'al-Quddūs'], ['السَّلَامُ', 'as-Salām'],
  ['الْمُؤْمِنُ', 'al-Muʾmin'], ['الْمُهَيْمِنُ', 'al-Muhaymin'], ['الْعَزِيزُ', 'al-ʿAzīz'], ['الْجَبَّارُ', 'al-Jabbār'], ['الْمُتَكَبِّرُ', 'al-Mutakabbir'],
  ['الْخَالِقُ', 'al-Khāliq'], ['الْبَارِئُ', 'al-Bāriʾ'], ['الْمُصَوِّرُ', 'al-Muṣawwir'], ['الْغَفَّارُ', 'al-Ghaffār'], ['الْقَهَّارُ', 'al-Qahhār'],
  ['الْوَهَّابُ', 'al-Wahhāb'], ['الرَّزَّاقُ', 'ar-Razzāq'], ['الْفَتَّاحُ', 'al-Fattāḥ'], ['الْعَلِيمُ', 'al-ʿAlīm'], ['الْقَابِضُ', 'al-Qābiḍ'],
  ['الْبَاسِطُ', 'al-Bāsiṭ'], ['الْخَافِضُ', 'al-Khāfiḍ'], ['الرَّافِعُ', 'ar-Rāfiʿ'], ['الْمُعِزُّ', 'al-Muʿizz'], ['الْمُذِلُّ', 'al-Mudhill'],
  ['السَّمِيعُ', 'as-Samīʿ'], ['الْبَصِيرُ', 'al-Baṣīr'], ['الْحَكَمُ', 'al-Ḥakam'], ['الْعَدْلُ', 'al-ʿAdl'], ['اللَّطِيفُ', 'al-Laṭīf'],
  ['الْخَبِيرُ', 'al-Khabīr'], ['الْحَلِيمُ', 'al-Ḥalīm'], ['الْعَظِيمُ', 'al-ʿAẓīm'], ['الْغَفُورُ', 'al-Ghafūr'], ['الشَّكُورُ', 'ash-Shakūr'],
  ['الْعَلِيُّ', 'al-ʿAliyy'], ['الْكَبِيرُ', 'al-Kabīr'], ['الْحَفِيظُ', 'al-Ḥafīẓ'], ['الْمُقِيتُ', 'al-Muqīt'], ['الْحَسِيبُ', 'al-Ḥasīb'],
  ['الْجَلِيلُ', 'al-Jalīl'], ['الْكَرِيمُ', 'al-Karīm'], ['الرَّقِيبُ', 'ar-Raqīb'], ['الْمُجِيبُ', 'al-Mujīb'], ['الْوَاسِعُ', 'al-Wāsiʿ'],
  ['الْحَكِيمُ', 'al-Ḥakīm'], ['الْوَدُودُ', 'al-Wadūd'], ['الْمَجِيدُ', 'al-Majīd'], ['الْبَاعِثُ', 'al-Bāʿith'], ['الشَّهِيدُ', 'ash-Shahīd'],
  ['الْحَقُّ', 'al-Ḥaqq'], ['الْوَكِيلُ', 'al-Wakīl'], ['الْقَوِيُّ', 'al-Qawiyy'], ['الْمَتِينُ', 'al-Matīn'], ['الْوَلِيُّ', 'al-Waliyy'],
  ['الْحَمِيدُ', 'al-Ḥamīd'], ['الْمُحْصِي', 'al-Muḥṣī'], ['الْمُبْدِئُ', 'al-Mubdiʾ'], ['الْمُعِيدُ', 'al-Muʿīd'], ['الْمُحْيِي', 'al-Muḥyī'],
  ['الْمُمِيتُ', 'al-Mumīt'], ['الْحَيُّ', 'al-Ḥayy'], ['الْقَيُّومُ', 'al-Qayyūm'], ['الْوَاجِدُ', 'al-Wājid'], ['الْمَاجِدُ', 'al-Mājid'],
  ['الْوَاحِدُ', 'al-Wāḥid'], ['الْأَحَدُ', 'al-Aḥad'], ['الصَّمَدُ', 'aṣ-Ṣamad'], ['الْقَادِرُ', 'al-Qādir'], ['الْمُقْتَدِرُ', 'al-Muqtadir'],
  ['الْمُقَدِّمُ', 'al-Muqaddim'], ['الْمُؤَخِّرُ', 'al-Muʾakhkhir'], ['الْأَوَّلُ', 'al-Awwal'], ['الْآخِرُ', 'al-Ākhir'], ['الظَّاهِرُ', 'aẓ-Ẓāhir'],
  ['الْبَاطِنُ', 'al-Bāṭin'], ['الْوَالِي', 'al-Wālī'], ['الْمُتَعَالِي', 'al-Mutaʿālī'], ['الْبَرُّ', 'al-Barr'], ['التَّوَّابُ', 'at-Tawwāb'],
  ['الْمُنْتَقِمُ', 'al-Muntaqim'], ['الْعَفُوُّ', 'al-ʿAfuww'], ['الرَّءُوفُ', 'ar-Raʾūf'], ['مَالِكُ الْمُلْكِ', 'Māliku l-Mulk'], ['ذُو الْجَلَالِ وَالْإِكْرَامِ', 'Dhu l-Jalāli wa l-Ikrām'],
  ['الْمُقْسِطُ', 'al-Muqsiṭ'], ['الْجَامِعُ', 'al-Jāmiʿ'], ['الْغَنِيُّ', 'al-Ghaniyy'], ['الْمُغْنِي', 'al-Mughnī'], ['الْمَانِعُ', 'al-Māniʿ'],
  ['الضَّارُّ', 'aḍ-Ḍārr'], ['النَّافِعُ', 'an-Nāfiʿ'], ['النُّورُ', 'an-Nūr'], ['الْهَادِي', 'al-Hādī'], ['الْبَدِيعُ', 'al-Badīʿ'],
  ['الْبَاقِي', 'al-Bāqī'], ['الْوَارِثُ', 'al-Wārith'], ['الرَّشِيدُ', 'ar-Rashīd'], ['الصَّبُورُ', 'aṣ-Ṣabūr'],
];

export const ESMA = RAW.map(([ar, tr], i) => ({
  i, ar,
  // eigene Umschrift der Sprache (z. B. türkisch), sonst die wissenschaftliche; in arabischer Schrift keine
  get tr() { const own = t('esma.tr'); return Array.isArray(own) ? own[i] : t('showTranslit') ? tr : ''; },
  get mean() { return t('esma.m')[i]; },
}));

// Quiz: Name zeigen, vier Bedeutungen zur Auswahl
export function esmaQuiz(n = 10, rnd = Math.random) {
  const pick = [...ESMA].sort(() => rnd() - 0.5).slice(0, n);
  return {
    i: 0, score: 0, picked: null,
    q: pick.map((e) => ({ ans: e.i, opts: [e.i, ...ESMA.filter((x) => x.i !== e.i).sort(() => rnd() - 0.5).slice(0, 3).map((x) => x.i)].sort(() => rnd() - 0.5) })),
  };
}
