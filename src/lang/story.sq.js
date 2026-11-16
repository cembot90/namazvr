// Tregimet e pejgamberëve (shqip) dhe qielli me yje.
// Hapi: [titulli, tregimi, transliterimi i ajetit, kuptimi]. Pyetja q: [pyetja, përgjigjja e saktë, tjetër, tjetër].
export default {
  story: {
    menu: '📖 Tregime', title: 'Tregimet e pejgamberëve', sub: 'për të udhëtuar bashkë – për fëmijë dhe familje',
    intro: [
      'Udhëto me ne nëpër vende: te anija, te zjarri, te Nili, në det, në luginën e milingonave dhe te shpella.',
      'Nga respekti, pejgamberët nuk tregohen – ti i sheh vendet dhe e dëgjon tregimin. Ai ndjek Kur’anin (sureja:ajeti shënohet pranë) dhe, aty ku thuhet, transmetimet.',
    ],
    soundsSub: 'erë, shi, valë, bulkthi – të krijuara në shfletues',
    quran: (ref) => `Kur’ani ${ref}`, told: 'sipas transmetimeve',
    done: 'Çfarë mësojmë?', listen: '🔊 Lexo me zë', more: '📖 Të tjera', right: 'Saktë! Mashallah.',
    rightStar: (n) => `Saktë! Mashallah – një yll i ri ndriçon në qiellin tënd (${n} ⭐).`,
    wrong: 'Pothuajse! Shiko edhe një herë përgjigjen e gjelbër.',
    list: {
      nuh: {
        name: 'Nuhu dhe anija', sub: 'Durimi dhe besimi',
        s: {
          build: ['Nuhu ndërton një anije', 'Shumë kohë më parë jetonte pejgamberi Nuh, paqja qoftë mbi të. Shumë e shumë vite ai i lutej njerëzve me mirësi: Jini të mirë me njëri-tjetrin dhe adhurojeni vetëm Allahun. Por shumica qeshnin me të. Atëherë Allahu i tha Nuhut: Ndërto një anije të madhe. Dhe Nuhu ndërtoi – në mes të tokës së thatë.'],
          animals: ['Vijnë kafshët', 'Kur anija ishte gati, erdhën kafshët: nga çdo lloj nga një çift. Elefantë, luanë, gjirafa, deve, dele dhe kuaj hipën në anije. Edhe familja e Nuhut dhe të gjithë ata që besonin në Allahun hipën. Allahu kishte menduar për të gjithë – për njerëzit dhe për kafshët.'],
          rain: ['Shiu i madh', 'Pastaj qielli u hap dhe ra shi pa pushim. Nga toka gurgulloi ujë. Anija u ngrit nga toka dhe filloi të lundrojë. Nuhu tha: Në emër të Allahut lundron dhe ndalet.', 'Bismillāhi majrāhā wa mursāhā', 'Në emër të Allahut lundron dhe ndalet.'],
          sea: ['Mbi valë', 'Kudo kishte ujë, dhe valët ishin të larta si male. Por në anije të gjithë ishin të sigurt. Nuhu nuk kishte frikë, sepse i besonte Allahut. Kush është i durueshëm dhe i beson Allahut, nuk është kurrë vetëm.'],
          cudi: ['Anija ndalet', 'Më në fund shiu pushoi dhe uji u tërhoq. Anija u ndal butë mbi malin Xhudi. Doli dielli, zogjtë fluturuan. Allahu i tha Nuhut: Zbrit në paqe dhe me bekim. Njerëzit dhe kafshët zbritën dhe filluan një jetë të re.'],
        },
        lesson: 'Nuhu ishte i durueshëm dhe i mirë shumë vite, edhe kur të tjerët qeshnin me të. Ai i besoi Allahut – dhe Allahu e shpëtoi atë, familjen e tij, besimtarët dhe kafshët.',
        q: ['Çfarë e ndihmoi Nuhun kur të gjithë qeshnin?', 'Durimi dhe besimi te Allahu', 'Qeshi edhe ai me ta', 'U dorëzua'],
      },
      ibrahim: {
        name: 'Ibrahimi dhe zjarri', sub: 'Guximi, e vërteta dhe paqja',
        s: {
          sky: ['Ibrahimi kërkon Krijuesin e tij', 'Ibrahimi, paqja qoftë mbi të, shikonte natën qiellin. Pa një yll të ndritshëm, pastaj hënën dhe në mëngjes diellin. Por të gjithë perëndonin përsëri. Atëherë e kuptoi: Zoti im është Allahu, që krijoi qiellin dhe tokën. Ai nuk perëndon kurrë.'],
          wood: ['Ibrahimi thotë të vërtetën', 'Njerëzit në qytetin e tij adhuronin statuja prej guri dhe druri. Ibrahimi u tha me qetësi: Ato nuk mund as t’ju dëgjojnë, as t’ju ndihmojnë. Kjo i zemëroi shumë të fuqishmit. Ata mblodhën shumë e shumë dru për një zjarr gjigant.'],
          fire: ['Zjarri i madh', 'Zjarri ishte aq i nxehtë sa askush nuk mund t’i afrohej. E hodhën Ibrahimin brenda. Por Ibrahimi nuk kishte frikë. Ai tha: Allahu më mjafton, dhe Ai është mbrojtësi më i mirë.', 'Ḥasbiyallāhu wa niʿma l-wakīl', 'Allahu më mjafton, dhe Ai është mbrojtësi më i mirë.'],
          garden: ['Freski dhe paqe', 'Atëherë Allahu tha: O zjarr, bëhu freski dhe paqe për Ibrahimin! Dhe zjarri nuk e dogji. Ibrahimi ishte i sigurt dhe i qetë. Shumë tregojnë se për të ishte si një kopsht. Ai doli shëndoshë e mirë.', 'Yā nāru kūnī bardan wa salāman ʿalā Ibrāhīm', 'O zjarr, bëhu freski dhe paqe për Ibrahimin!'],
        },
        lesson: 'Ibrahimi e tha të vërtetën me guxim dhe me mirësi. Ai i besoi plotësisht Allahut – dhe Allahu e ktheu zjarrin në paqe.',
        q: ['Çfarë i tha Allahu zjarrit?', '„Bëhu freski dhe paqe për Ibrahimin!“', '„Digj edhe më fort!“', '„Shko më tutje!“'],
      },
      musa: {
        name: 'Musai në shportë', sub: 'Allahu mbron',
        s: {
          home: ['Një nënë e guximshme', 'Në Egjipt sundonte Faraoni. Ai ishte i padrejtë dhe nuk donte që djemtë e vegjël të bijve të Izraelit të rriteshin. Nëna e Musait, paqja qoftë mbi të, kishte shumë frikë për foshnjën e saj. Atëherë Allahu i frymëzoi: Kur të kesh frikë për të, vendose në lumë.'],
          basket: ['Në ujë', 'Ajo e vendosi Musain në një shportë të vogël dhe e lëshoi butë mbi Nil. Allahu e ngushëlloi: Mos ki frikë dhe mos u pikëllo. Ne do ta kthejmë te ti.', 'Wa lā takhāfī wa lā taḥzanī, innā rāddūhu ilayki', 'Mos ki frikë dhe mos u pikëllo – Ne do ta kthejmë te ti.'],
          float: ['Lumi e bart', 'Shporta lundroi poshtë lumit të madh. Motra e Musait ecte fshehurazi buzë lumit dhe shikonte se ku po shkonte. Lumi e çoi foshnjën pikërisht atje ku donte Allahu.'],
          palace: ['Në pallat', 'Shporta arriti te pallati i Faraonit. Gruaja e tij, Asija, e gjeti foshnjën dhe e deshi menjëherë. Mos e vritni, tha ajo, ndoshta do të na sjellë gëzim. Por foshnja nuk donte të pinte qumësht nga asnjë mëndeshë.'],
          back: ['Sërish te nëna', 'Atëherë motra e tij tha: Njoh një familje që do të kujdeset mirë për të. Kështu Musai u kthye te nëna e vet. Ajo ishte e lumtur dhe e dinte: premtimi i Allahut është i vërtetë.'],
        },
        lesson: 'Nëna e Musait kishte frikë – e megjithatë i besoi Allahut. Allahu e mbajti premtimin e Tij dhe ia ktheu foshnjën.',
        q: ['Çfarë i premtoi Allahu nënës së Musait?', 'Se do ta marrë sërish foshnjën', 'Se lumi do të ndalet', 'Se do të marrë një pallat'],
      },
      yunus: {
        name: 'Junusi dhe balena', sub: 'Mos u dorëzo kurrë – Allahu të dëgjon kudo',
        s: {
          ship: ['Junusi largohet', 'Pejgamberi Junus, paqja qoftë mbi të, jetonte në qytetin Ninevi. Gjatë i thirri njerëzit në të mirë, por ata nuk e dëgjuan. I mërzitur, ai u largua pa pritur lejen e Allahut dhe hipi në një anije.'],
          storm: ['Stuhia', 'Në det erdhi një stuhi e fortë. Anija ishte e ngarkuar rëndë dhe lëkundej rrezikshëm. Detarët hodhën short se kush duhej ta linte anijen – dhe shorti i ra Junusit.'],
          whale: ['Balena e madhe', 'Junusi ra në det. Atëherë Allahu dërgoi një balenë gjigante që e gëlltiti – por pa e lënduar. Balena nuk duhej ta hante, por ta mbronte.'],
          dark: ['Në errësirë', 'Në barkun e balenës, thellë në det dhe në mes të natës, ishte krejt errësirë. Junusi u pendua dhe u lut: Nuk ka zot tjetër përveç Teje, i lartësuar qofsh. Unë kam vepruar gabim. Allahu e dëgjoi – edhe atje.', 'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn', 'Nuk ka zot tjetër përveç Teje, i lartësuar qofsh – unë kam bërë padrejtësi.'],
          shore: ['Në breg', 'Allahu e shpëtoi Junusin. Balena e nxori në një breg. Junusi ishte i dobët, por Allahu bëri të rritej një bimë kungulli me gjethe të mëdha që i jepte hije. Më vonë ai u kthye te populli i tij – dhe këtë herë ata besuan.'],
        },
        lesson: 'Edhe kur gjithçka duket e errët: Allahu e dëgjon çdo lutje, kudo. Kush gabon, mund të kërkojë falje dhe të fillojë nga e para.',
        q: ['Ku e dëgjoi Allahu lutjen e Junusit?', 'Edhe në barkun e balenës – kudo', 'Vetëm në xhami', 'Vetëm ditën'],
      },
      suleyman: {
        name: 'Sulejmani dhe milingona', sub: 'Respekt për të gjitha krijesat',
        s: {
          gift: ['Një dhuratë e veçantë', 'Allahu i dhuroi pejgamberit Sulejman, paqja qoftë mbi të, urtësi dhe një mbretëri të madhe. Ai e kuptonte edhe gjuhën e zogjve dhe të kafshëve. Një ditë ai kalonte me ushtrinë e tij të madhe nëpër vend.'],
          ant: ['Milingona e vogël', 'Tani je shumë i vogël! Ata arritën në një luginë plot milingona. Një milingonë e vogël thirri: O milingona, hyni në banesat tuaja, që Sulejmani dhe ushtria e tij të mos ju shkelin pa e vënë re! Ajo kujdesej për të gjitha të tjerat.', 'Yā ayyuha n-namlu dkhulū masākinakum', 'O milingona, hyni në banesat tuaja!'],
          smile: ['Sulejmani buzëqesh', 'Sulejmani e dëgjoi milingonën e vogël. Ai buzëqeshi dhe e ndali ushtrinë, që asnjë milingone të mos i ndodhte gjë. Pastaj e falënderoi Allahun: Zoti im, më ndihmo të jem mirënjohës për dhuntitë e Tua dhe të bëj mirë që Ty të pëlqen.', 'Rabbi awziʿnī an ashkura niʿmataka', 'Zoti im, më ndihmo të jem mirënjohës për dhuntitë e Tua.'],
        },
        lesson: 'Sulejmani ishte një mbret i fuqishëm – e megjithatë kujdesej edhe për milingonën më të vogël. Një njeri i mirë është i butë me të gjitha krijesat dhe mirënjohës.',
        q: ['Çfarë bëri Sulejmani kur e dëgjoi milingonën?', 'Buzëqeshi, u ndal dhe e falënderoi Allahun', 'Vazhdoi rrugën sikur asgjë', 'U zemërua'],
      },
      hijra: {
        name: 'Shpella, merimanga dhe pëllumbi', sub: 'Allahu është me ne – Hixhreti',
        s: {
          night: ['Nisja natën', 'Pejgamberi ynë Muhamed, paqja dhe bekimi i Allahut qofshin mbi të, i ftonte njerëzit në Mekë në të mirë. Por disa donin t’i bënin keq. Allahu i lejoi të shkonte në Medinë. Natën ai u nis me mikun e tij më të mirë, Ebu Bekrin.'],
          cave: ['Shpella Theur', 'Të dy u fshehën në një shpellë në malin Theur. Tri ditë qëndruan aty. Jashtë, burra nga Meka i kërkonin kudo.'],
          web: ['Merimanga dhe pëllumbi', 'Kështu transmetohet: një merimangë thuri një rrjetë mbi hyrjen e shpellës, dhe një pëllumb ndërtoi aty folenë e vet dhe bëri vezë. Shiko si rritet rrjeta fije pas fije. Kafshë të vogla ndihmuan – ashtu siç deshi Allahu.'],
          search: ['Allahu është me ne', 'Ndjekësit erdhën shumë afër. Ebu Bekri pëshpëriti i shqetësuar: Nëse dikush shikon poshtë, na sheh. Pejgamberi tha me qetësi: Mos u pikëllo, Allahu është me ne. Burrat e panë rrjetën dhe folenë – dhe ikën.', 'Lā taḥzan innallāha maʿanā', 'Mos u pikëllo, Allahu është me ne.'],
          medina: ['Arritja në Medinë', 'Pas një udhëtimi të gjatë arritën në Medinë. Njerëzit u gëzuan shumë, dhe tregohet se fëmijët këndonin për mirëseardhje: Hëna e plotë ka lindur mbi ne. Në Medinë njerëzit u bënë vëllezër e motra dhe ndanë me njëri-tjetrin.', 'Ṭalaʿa l-badru ʿalaynā', 'Hëna e plotë ka lindur mbi ne.'],
        },
        lesson: 'Edhe në çaste të vështira Pejgamberi mbeti i qetë dhe i besoi Allahut. Allahu e mbron atë që do – madje edhe me një rrjetë merimange.',
        q: ['Çfarë i tha Pejgamberi Ebu Bekrit në shpellë?', '„Mos u pikëllo, Allahu është me ne.“', '„Vrapo shpejt!“', '„Kemi humbur.“'],
      },
    },
  },
  sky: {
    menu: '✨ Qielli me yje', title: 'Qielli im me yje', count: (a, b) => `${a} nga ${b} yje ndriçojnë`,
    lookUp: 'Shiko lart: çdo namaz, çdo sure dhe çdo tregim që ke mësuar ndriçon si yll.',
    lookUpMobile: 'Lart në qiell ndriçojnë yjet e tu: çdo namaz, çdo sure dhe çdo tregim që ke mësuar.',
    prayers: 'Namazet', suras: 'Suret', stories: 'Tregimet', badges: 'Distinktivët', days: 'Ditë me të 5 namazet',
    next: 'Ylli yt i radhës:', allDone: 'Të gjitha yjet ndriçojnë – Mashallah!',
  },
};
