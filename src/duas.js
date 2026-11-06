// Bittgebete für sich, die Familie und die Menschen, die man liebt – nur aus Qurʾān und anerkannten Hadith-Sammlungen.
// Arabisch und wissenschaftliche Umschrift hier; Bedeutung, Anlass und türkische Umschrift in der Sprachdatei (duas.*).
import { t } from './i18n.js';

export const DUA_CATS = ['protect', 'family', 'parents', 'sick', 'worry', 'travel'];

// src: q = [Sure, Vers], b = Bukhārī, m = Muslim, ad = Abū Dāwūd, ti = Tirmidhī, im = Ibn Māja
const LIST = [
  { id: 'kids', cat: 'protect', src: { b: 3371 },
    ar: 'أُعِيذُكُمَا بِكَلِمَاتِ اللَّهِ التَّامَّةِ، مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ',
    tr: 'Uʿīdhukumā bi-kalimāti llāhi t-tāmmah, min kulli shayṭānin wa hāmmah, wa min kulli ʿaynin lāmmah' },
  { id: 'mashallah', cat: 'protect', src: { q: [18, 39] },
    ar: 'مَا شَاءَ اللَّهُ لَا قُوَّةَ إِلَّا بِاللَّهِ',
    tr: 'Mā shāʾa llāh, lā quwwata illā bi-llāh' },
  { id: 'barik', cat: 'protect', src: { im: 3509 },
    ar: 'اللَّهُمَّ بَارِكْ فِيهِ',
    tr: 'Allāhumma bārik fīh' },
  { id: 'bismillah', cat: 'protect', src: { ad: 5088, ti: 3388 },
    ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ',
    tr: 'Bismi llāhi lladhī lā yaḍurru maʿa smihī shayʾun fi l-arḍi wa lā fi s-samāʾ, wa huwa s-samīʿu l-ʿalīm' },
  { id: 'kalimat', cat: 'protect', src: { m: 2708 },
    ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    tr: 'Aʿūdhu bi-kalimāti llāhi t-tāmmāti min sharri mā khalaq' },
  { id: 'kursi', cat: 'protect', src: { q: [2, 255] },
    ar: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    tr: 'Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm, lā taʾkhudhuhū sinatun wa lā nawm, lahū mā fi s-samāwāti wa mā fi l-arḍ, man dhā lladhī yashfaʿu ʿindahū illā bi-idhnih, yaʿlamu mā bayna aydīhim wa mā khalfahum, wa lā yuḥīṭūna bi-shayʾin min ʿilmihī illā bi-mā shāʾ, wasiʿa kursiyyuhu s-samāwāti wa l-arḍ, wa lā yaʾūduhū ḥifẓuhumā, wa huwa l-ʿaliyyu l-ʿaẓīm' },
  { id: 'spouses', cat: 'family', src: { q: [25, 74] },
    ar: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    tr: 'Rabbanā hab lanā min azwājinā wa dhurriyyātinā qurrata aʿyunin wa-jʿalnā li-l-muttaqīna imāmā' },
  { id: 'wedding', cat: 'family', src: { ad: 2130, ti: 1091 },
    ar: 'بَارَكَ اللَّهُ لَكَ، وَبَارَكَ عَلَيْكَ، وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ',
    tr: 'Bāraka llāhu lak, wa bāraka ʿalayk, wa jamaʿa baynakumā fī khayr' },
  { id: 'prayerful', cat: 'family', src: { q: [14, 40] },
    ar: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي، رَبَّنَا وَتَقَبَّلْ دُعَاءِ',
    tr: 'Rabbi jʿalnī muqīma ṣ-ṣalāti wa min dhurriyyatī, rabbanā wa taqabbal duʿāʾ' },
  { id: 'atina', cat: 'family', src: { q: [2, 201] },
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    tr: 'Rabbanā ātinā fi d-dunyā ḥasanatan wa fi l-ākhirati ḥasanatan wa qinā ʿadhāba n-nār' },
  { id: 'mercyParents', cat: 'parents', src: { q: [17, 24] },
    ar: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    tr: 'Rabbi rḥamhumā kamā rabbayānī ṣaghīrā' },
  { id: 'forgiveParents', cat: 'parents', src: { q: [14, 41] },
    ar: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    tr: 'Rabbana ghfir lī wa li-wālidayya wa li-l-muʾminīna yawma yaqūmu l-ḥisāb' },
  { id: 'heal', cat: 'sick', src: { b: 5743, m: 2191 },
    ar: 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
    tr: 'Allāhumma rabba n-nās, adhhibi l-baʾs, ishfi anta sh-shāfī, lā shifāʾa illā shifāʾuk, shifāʾan lā yughādiru saqamā' },
  { id: 'worry', cat: 'worry', src: { b: 6369 },
    ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    tr: 'Allāhumma innī aʿūdhu bika mina l-hammi wa l-ḥazan, wa l-ʿajzi wa l-kasal, wa l-bukhli wa l-jubn, wa ḍalaʿi d-dayni wa ghalabati r-rijāl' },
  { id: 'hasbuna', cat: 'worry', src: { q: [3, 173] },
    ar: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    tr: 'Ḥasbunā llāhu wa niʿma l-wakīl' },
  { id: 'leaveHome', cat: 'travel', src: { ad: 5095, ti: 3426 },
    ar: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    tr: 'Bismi llāh, tawakkaltu ʿala llāh, wa lā ḥawla wa lā quwwata illā bi-llāh' },
  { id: 'farewell', cat: 'travel', src: { ad: 2600, ti: 3443 },
    ar: 'أَسْتَوْدِعُ اللَّهَ دِينَكَ وَأَمَانَتَكَ وَخَوَاتِيمَ عَمَلِكَ',
    tr: 'Astawdiʿu llāha dīnaka wa amānataka wa khawātīma ʿamalik' },
];

const BOOK = { b: 'peace.bukhari', m: 'peace.muslim', ti: 'peace.tirmidhi', ad: 'duas.abudawud', im: 'duas.ibnmajah' };
function source(src) {
  if (src.q) return t('peace.quran', src.q[0], src.q[1]);
  return Object.entries(src).map(([k, n]) => `${t(BOOK[k])} ${n}`).join(' · ');
}

export const DUAS = LIST.map((d) => ({
  ...d,
  get translit() { const own = t(`duas.translit.${d.id}`); return own === `duas.translit.${d.id}` ? (t('showTranslit') ? d.tr : '') : own; },
  get mean() { return t(`duas.mean.${d.id}`); },
  get when() { return t(`duas.when.${d.id}`); },
  get source() { return source(d.src); },
}));

export const duasOf = (cat) => DUAS.filter((d) => d.cat === cat);
