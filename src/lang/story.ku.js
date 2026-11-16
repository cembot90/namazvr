// Çîrokên pêxemberan (Kurdî – Kurmancî) û ezmanê stêran.
// Gav: [sernav, çîrok, transkrîpsiyona ayetê, wate]. Pirs q: [pirs, bersiva rast, ya din, ya din].
export default {
  story: {
    menu: '📖 Çîrok', title: 'Çîrokên pêxemberan', sub: 'werin em bi hev re biçin – ji bo zarok û malbatan',
    intro: [
      'Bi me re here wan deran: cem keştiyê, cem agir, li ber Nîlê, ser deryayê, nava newala mûrîstkan û şikeftê.',
      'Ji ber hurmetê pêxember nayên nîşandan – tu cihan dibînî û çîrokê dibihîzî. Ew li gorî Quranê ye (sûre:ayet li ber e) û, li ku derê hatibe nîşandan, li gorî rîwayetê.',
    ],
    soundsSub: 'ba, baran, pêl, sîsirk – di gerokê de tên çêkirin',
    quran: (ref) => `Quran ${ref}`, told: 'li gorî rîwayetê',
    done: 'Em çi hîn dibin?', listen: '🔊 Bi deng bixwîne', more: '📖 Yên din', right: 'Rast e! Maşallah.',
    rightStar: (n) => `Rast e! Maşallah – stêreke nû li ezmanê te dibiriqe (${n} ⭐).`,
    wrong: 'Hema hema! Carek din li bersiva kesk binêre.',
    list: {
      nuh: {
        name: 'Nûh û keştî', sub: 'Sebr û bawerî',
        s: {
          build: ['Nûh keştiyekê çêdike', 'Berî demeke pir dirêj pêxember Nûh, silav li ser wî be, dijiya. Gelek û gelek salan wî bi dilnermî ji mirovan xwest: Bi hev re baş bin û tenê ji Allah re îbadetê bikin. Lê piraniya wan bi wî dikeniyan. Wê demê Allah ji Nûh re got: Keştiyeke mezin çêke. Û Nûh dest bi çêkirinê kir – li nava erdê hişk.'],
          animals: ['Heywan tên', 'Gava keştî qediya, heywan hatin: ji her cureyekê cotek. Fîl, şêr, zirafe, deve, pez û hesp siwar bûn. Malbata Nûh û hemû yên ku bawerî bi Allah anîbûn jî siwar bûn. Allah hemû kes anîbûn bîra xwe – mirov û heywan jî.'],
          rain: ['Barana mezin', 'Paşê ezman vebû, û baran barî û barî. Av ji erdê derket. Keştî ji erdê rabû û dest bi avjeniyê kir. Nûh got: Bi navê Allah ew diçe û disekine.', 'Bismillāhi majrāhā wa mursāhā', 'Bi navê Allah ew diçe û disekine.'],
          sea: ['Li ser pêlan', 'Her der av bû, û pêl wek çiyayan bilind bûn. Lê di keştiyê de her kes ewle bû. Nûh netirsiya, ji ber ku wî xwe dispart Allah. Yê ku sebir dike û xwe dispêre Allah, qet ne bi tena serê xwe ye.'],
          cudi: ['Keştî datîne', 'Di dawiyê de baran sekinî, û av paşve kişiya. Keştî bi nermî li ser Çiyayê Cûdî sekinî. Roj derket, çûk firiyan. Allah ji Nûh re got: Bi aştî û bereketê dakeve. Mirov û heywan daketin û dest bi jiyaneke nû kirin.'],
        },
        lesson: 'Nûh gelek salan bi sebr û dilnerm bû, heta gava ku yên din bi wî dikeniyan jî. Wî xwe dispart Allah – û Allah ew, malbata wî, bawermend û heywan xilas kirin.',
        q: ['Gava ku her kes dikeniya, çi alîkariya Nûh kir?', 'Sebr û baweriya bi Allah', 'Wî jî bi wan keniya', 'Wî dev jê berda'],
      },
      ibrahim: {
        name: 'Îbrahîm û agir', sub: 'Wêrekî, rastî û aştî',
        s: {
          sky: ['Îbrahîm li Afirînerê xwe digere', 'Îbrahîm, silav li ser wî be, bi şev li ezman dinêrî. Wî stêreke ronak dît, paşê heyv û sibehê roj. Lê hemû dîsa ava bûn. Wê demê wî zanî: Xudanê min Allah e, yê ku ezman û erd afirandine. Ew qet ava nabe.'],
          wood: ['Îbrahîm rastiyê dibêje', 'Mirovên bajarê wî îbadet ji pûtên ji kevir û daran re dikirin. Îbrahîm bi aramî ji wan re got: Ew ne dikarin we bibihîzin û ne jî alîkariya we bikin. Ev yek hêzdaran pir hêrs kir. Wan gelek û gelek êzing ji bo agirekî mezin berhev kirin.'],
          fire: ['Agirê mezin', 'Agir ewqas germ bû ku kes nikaribû nêzî wî bibe. Wan Îbrahîm avêt nava wî. Lê Îbrahîm netirsiya. Wî got: Allah ji min re bes e, û Ew parêzvanê herî baş e.', 'Ḥasbiyallāhu wa niʿma l-wakīl', 'Allah ji min re bes e, û Ew parêzvanê herî baş e.'],
          garden: ['Sar û aştî', 'Wê demê Allah got: Ey agir, ji Îbrahîm re sar û aştî be! Û agir ew neşewitand. Îbrahîm ewle û aram bû. Gelek kes dibêjin ku ji bo wî wek baxçeyekî bû. Ew sax û silamet derket.', 'Yā nāru kūnī bardan wa salāman ʿalā Ibrāhīm', 'Ey agir, ji Îbrahîm re sar û aştî be!'],
        },
        lesson: 'Îbrahîm bi wêrekî û dilnermî rastî got. Wî bi temamî xwe dispart Allah – û Allah agir kir aştî.',
        q: ['Allah ji agir re çi got?', '“Ji Îbrahîm re sar û aştî be!”', '“Hîn germtir bişewite!”', '“Here cihekî din!”'],
      },
      musa: {
        name: 'Mûsa di selikê de', sub: 'Allah diparêze',
        s: {
          home: ['Dayikeke wêrek', 'Li Misrê Fîrewn hukum dikir. Ew neheq bû û nedixwest ku kurên biçûk ên Benî Îsraîl mezin bibin. Diya Mûsa, silav li ser wî be, ji bo pitika xwe pir ditirsiya. Wê demê Allah xiste dilê wê: Eger tu ji bo wî ditirsî, wî bavêje çem.'],
          basket: ['Ber bi avê', 'Wê Mûsa xiste selikekê û bi nermî danî ser Nîlê. Allah dilê wê rehet kir: Netirse û xemgîn nebe. Em ê wî ji te re vegerînin.', 'Wa lā takhāfī wa lā taḥzanī, innā rāddūhu ilayki', 'Netirse û xemgîn nebe – Em ê wî ji te re vegerînin.'],
          float: ['Çem wî dibe', 'Selik li ser çemê mezin ber bi jêr ve çû. Xwişka Mûsa bi dizî li ber çem dimeşiya û dinêrî ka ew diçe ku derê. Çem pitik rast bir wî cihî ku Allah dixwest.'],
          palace: ['Li qesrê', 'Selik gihîşt qesra Fîrewn. Jina wî Asiya pitik dît û yekser jê hez kir. Wê got: Wî nekujin, dibe ku ew ji me re bibe şahî. Lê pitik ji tu dayîna şîr şîr venedixwar.'],
          back: ['Vegera cem diya xwe', 'Wê demê xwişka wî got: Ez malbatekê nas dikim ku ê baş li wî xwedî derkeve. Bi vî awayî Mûsa vegeriya cem diya xwe ya rastîn. Ew kêfxweş bû û zanî: Soza Allah rast e.'],
        },
        lesson: 'Diya Mûsa ditirsiya – û dîsa jî xwe spart Allah. Allah soza xwe bi cih anî û pitik ji wê re vegerand.',
        q: ['Allah çi soz da diya Mûsa?', 'Ku ew ê pitika xwe dîsa bistîne', 'Ku çem ê bisekine', 'Ku ew ê qesrekê bistîne'],
      },
      yunus: {
        name: 'Yûnis û nehenga mezin', sub: 'Qet dev jê bernede – Allah her derê te dibihîze',
        s: {
          ship: ['Yûnis diçe', 'Pêxember Yûnis, silav li ser wî be, li bajarê Neynewayê dijiya. Demeke dirêj wî mirov ber bi qenciyê ve vexwendin, lê wan guh nedidan wî. Ew bi xemgînî çû, bê ku li benda destûra Allah bimîne, û siwarî keştiyekê bû.'],
          storm: ['Bager', 'Li ser deryayê bagereke xurt rabû. Keştî giran barkirî bû û bi xeternak dihejiya. Keştîvanan pişk avêtin ka kî divê ji keştiyê derkeve – û pişk li Yûnis ket.'],
          whale: ['Nehenga mezin', 'Yûnis ket deryayê. Wê demê Allah nehengeke pir mezin şand ku ew daqurtand – lê bê ku zirarê bide wî. Neheng ne ji bo xwarina wî bû, lê ji bo parastina wî.'],
          dark: ['Di tariyê de', 'Di zikê nehengê de, kûr di deryayê de û di nîvê şevê de, her der pir tarî bû. Yûnis poşman bû û dua kir: Ji Te pêve tu xwedê nîne, Tu pak û bilind î. Min şaşî kir. Allah ew bihîst – li wir jî.', 'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn', 'Ji Te pêve tu xwedê nîne, Tu pak û bilind î – min neheqî kir.'],
          shore: ['Li qeraxê', 'Allah Yûnis xilas kir. Nehengê ew bir qeraxeke deryayê. Yûnis qels bû, lê Allah nebatek kundiran bi pelên mezin şîn kir ku sî dida wî. Paşê ew vegeriya cem gelê xwe – û vê carê wan bawerî anî.'],
        },
        lesson: 'Heta gava ku her tişt tarî xuya dike jî: Allah her duayê, li her derê dibihîze. Yê ku şaşiyekê dike, dikare lêborînê bixwaze û ji nû ve dest pê bike.',
        q: ['Allah duaya Yûnis li ku bihîst?', 'Heta di zikê nehengê de – li her derê', 'Tenê di mizgeftê de', 'Tenê bi roj'],
      },
      suleyman: {
        name: 'Silêman û mûrîstk', sub: 'Hurmet ji hemû afirîdeyan re',
        s: {
          gift: ['Diyariyeke taybet', 'Allah ji pêxember Silêman re, silav li ser wî be, zanyarî û padîşahiyeke mezin da. Wî heta zimanê çûk û heywanan jî fêm dikir. Rojekê ew bi leşkerê xwe yê mezin re di nav welat de derbas dibû.'],
          ant: ['Mûrîstka biçûk', 'Tu niha pir biçûk î! Ew gihîştin newaleke tije mûrîstk. Mûrîstkeke biçûk qîriya: Gelî mûrîstkan, herin hêlînên xwe, da ku Silêman û leşkerê wî bê ku pê bihesin we neperçiqînin! Wê li hemû yên din xwedî derdiket.', 'Yā ayyuha n-namlu dkhulū masākinakum', 'Gelî mûrîstkan, herin hêlînên xwe!'],
          smile: ['Silêman dibişire', 'Silêman mûrîstka biçûk bihîst. Ew bişirî û leşkerê xwe da sekinandin, da ku tiştek nebe tu mûrîstkê. Paşê wî şikir ji Allah re kir: Xudanê min, alîkariya min bike ku ez ji bo nîmetên Te şikirdar bim û karên qenc ên ku Tu jê razî yî bikim.', 'Rabbi awziʿnī an ashkura niʿmataka', 'Xudanê min, alîkariya min bike ku ez ji bo nîmetên Te şikirdar bim.'],
        },
        lesson: 'Silêman padîşahekî bi hêz bû – û dîsa jî li mûrîstka herî biçûk miqate bû. Mirovekî qenc li hemû afirîdeyan nerm û şikirdar e.',
        q: ['Gava Silêman mûrîstk bihîst, wî çi kir?', 'Ew bişirî, sekinî û şikir ji Allah re kir', 'Ew tenê berdewam çû', 'Ew hêrs bû'],
      },
      hijra: {
        name: 'Şikeft, pîrhevok û kevok', sub: 'Allah bi me re ye – Hicret',
        s: {
          night: ['Derketina bi şev', 'Pêxemberê me Muhammed, silav û selawat li ser wî be, mirovên Mekkeyê ber bi qenciyê ve vedixwendin. Lê hinekan dixwestin zirarê bidin wî. Allah destûr da wî ku here Medîneyê. Bi şev ew bi hevalê xwe yê herî baş Ebû Bekir re derket rê.'],
          cave: ['Şikefta Sewr', 'Herduyan xwe di şikefteke li ser Çiyayê Sewr de veşartin. Sê rojan ew li wir man. Li derve mêrên Mekkeyê li her derê li wan digeriyan.'],
          web: ['Pîrhevok û kevok', 'Wiha tê vegotin: Pîrhevokekê torek li ser deriyê şikeftê hûna, û kevokekê li wir hêlîna xwe çêkir û hêk kirin. Binêre ka tor çawa tayek bi tayek mezin dibe. Heywanên biçûk alîkarî kirin – wekî ku Allah dixwest.'],
          search: ['Allah bi me re ye', 'Yên li pey wan pir nêzîk bûn. Ebû Bekir bi xem pistî: Eger yek li jêr binêre, ê me bibîne. Pêxember bi aramî got: Xemgîn nebe, Allah bi me re ye. Mêran tor û hêlîn dîtin – û dîsa çûn.', 'Lā taḥzan innallāha maʿanā', 'Xemgîn nebe, Allah bi me re ye.'],
          medina: ['Gihîştina Medîneyê', 'Piştî rêwîtiyeke dirêj ew gihîştin Medîneyê. Mirov pir kêfxweş bûn, û tê gotin ku zarokan ji bo pêşwaziyê stran digotin: Heyva çardehê li ser me hilat. Li Medîneyê mirov bûn wek xwişk û bira û tiştên xwe bi hev re parve kirin.', 'Ṭalaʿa l-badru ʿalaynā', 'Heyva çardehê li ser me hilat.'],
        },
        lesson: 'Heta di demên dijwar de jî Pêxember aram ma û xwe spart Allah. Allah kê bixwaze diparêze – heta bi tora pîrhevokekê jî.',
        q: ['Pêxember di şikeftê de ji Ebû Bekir re çi got?', '“Xemgîn nebe, Allah bi me re ye.”', '“Zû bireve!”', '“Em winda bûn.”'],
      },
    },
  },
  sky: {
    menu: '✨ Ezmanê stêran', title: 'Ezmanê min ê stêran', count: (a, b) => `${a} ji ${b} stêran dibiriqin`,
    lookUp: 'Li jor binêre: Her nimêj, her sûre û her çîroka ku te hîn kiriye, wek stêrekê dibiriqe.',
    lookUpMobile: 'Li jor li ezman stêrên te dibiriqin: Her nimêj, her sûre û her çîroka ku te hîn kiriye.',
    prayers: 'Nimêj', suras: 'Sûre', stories: 'Çîrok', badges: 'Nîşan', days: 'Rojên bi hemû 5 nimêjan',
    next: 'Stêra te ya bê:', allDone: 'Hemû stêr dibiriqin – Maşallah!',
  },
};
