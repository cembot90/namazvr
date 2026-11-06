// Frieden & gutes Herz: Verse und Hadithe über Frieden, Barmherzigkeit und Selbstbeherrschung,
// dazu der Kinder-Modus (einfache Erklärung je Schritt). Arabischer Originaltext hier,
// Übersetzungen und Quellennamen in der Sprachdatei (peace.*, kids.*).
import { t } from './i18n.js';

// src: q = Quran [Sure, Vers], b = al-Buḫārī, m = Muslim, ti = at-Tirmiḏī (Hadith-Nummer)
const ITEMS = [
  { ar: 'مَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا', q: [5, 32] },
  { ar: 'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا', q: [49, 13] },
  { ar: 'ادْفَعْ بِالَّتِي هِيَ أَحْسَنُ فَإِذَا الَّذِي بَيْنَكَ وَبَيْنَهُ عَدَاوَةٌ كَأَنَّهُ وَلِيٌّ حَمِيمٌ', q: [41, 34] },
  { ar: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ', q: [3, 134] },
  { ar: 'لَا إِكْرَاهَ فِي الدِّينِ', q: [2, 256] },
  { ar: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ', q: [21, 107] },
  { ar: 'وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا وَإِذَا خَاطَبَهُمُ الْجَاهِلُونَ قَالُوا سَلَامًا', q: [25, 63] },
  { ar: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ', b: 6114 },
  { ar: 'لَا تَغْضَبْ', b: 6116 },
  { ar: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', b: 13 },
  { ar: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ', b: 10 },
  { ar: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ', b: 6927 },
  { ar: 'أَفْشُوا السَّلَامَ بَيْنَكُمْ', m: 54 },
  { ar: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', ti: 1956 },
  { ar: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَٰنُ، ارْحَمُوا مَنْ فِي الْأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ', ti: 1924 },
];

export const PEACE = ITEMS.map((it, i) => ({
  ar: it.ar,
  get text() { return t('peace.items')[i]; },
  get source() {
    if (it.q) return t('peace.quran', it.q[0], it.q[1]);
    const [book, n] = it.b ? ['bukhari', it.b] : it.m ? ['muslim', it.m] : ['tirmidhi', it.ti];
    return `${t(`peace.${book}`)} ${n}`;
  },
}));

// Ruhig werden: so viele Atemzüge mit der Kugel
export const CALM_BREATHS = 5;

// Ein einfacher Satz für Kinder zum aktuellen Schritt
export function kidLine(step) {
  if (step.hajj) return step.kid || '';
  if (step.key === 'shahada') return t('kids.shahada');
  if (step.wudu) return t('kids.wudu');
  return step.key ? t(`kids.${step.key}`) : '';
}
