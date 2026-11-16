// Kazivanja o poslanicima (bosanski) i zvjezdano nebo.
// Korak: [naslov, priča, transliteracija ajeta, značenje]. Pitanje q: [pitanje, tačan odgovor, drugi, drugi].
export default {
  story: {
    menu: '📖 Priče', title: 'Priče o poslanicima', sub: 'putuj s nama – za djecu i porodice',
    intro: [
      'Putuj s nama na ta mjesta: do lađe, do vatre, na Nil, na more, u dolinu mrava i do pećine.',
      'Iz poštovanja se poslanici ne prikazuju – vidiš mjesta i slušaš priču. Ona slijedi Kur’an (sura:ajet je naveden) i, gdje je to navedeno, predaju.',
    ],
    soundsSub: 'vjetar, kiša, valovi, cvrčci – napravljeno u pregledniku',
    quran: (ref) => `Kur’an ${ref}`, told: 'prema predaji',
    done: 'Šta učimo?', listen: '🔊 Čitaj naglas', more: '📖 Još priča', right: 'Tačno! Mašallah.',
    rightStar: (n) => `Tačno! Mašallah – nova zvijezda svijetli na tvom nebu (${n} ⭐).`,
    wrong: 'Skoro! Pogledaj još jednom zeleni odgovor.',
    list: {
      nuh: {
        name: 'Nuh i lađa', sub: 'Strpljivost i povjerenje',
        s: {
          build: ['Nuh gradi lađu', 'Prije mnogo, mnogo vremena živio je poslanik Nuh, mir s njim. Mnogo, mnogo godina lijepo je molio ljude: Budite dobri jedni prema drugima i klanjajte se samo Allahu. Ali većina mu se smijala. Tada je Allah rekao Nuhu: Napravi veliku lađu. I Nuh je gradio – nasred suhe zemlje.'],
          animals: ['Dolaze životinje', 'Kad je lađa bila gotova, došle su životinje: od svake vrste po par. Slonovi, lavovi, žirafe, deve, ovce i konji ušli su u lađu. Ušla je i Nuhova porodica i svi koji su vjerovali u Allaha. Allah je mislio na sve – i na ljude i na životinje.'],
          rain: ['Velika kiša', 'Onda se otvorilo nebo, i kiša je padala i padala. Iz zemlje je izbijala voda. Lađa se podigla sa tla i zaplovila. Nuh je rekao: U ime Allaha neka plovi i neka pristane.', 'Bismillāhi majrāhā wa mursāhā', 'U ime Allaha neka plovi i neka pristane.'],
          sea: ['Na valovima', 'Svuda je bila voda, a valovi su bili visoki kao planine. Ali u lađi su svi bili sigurni. Nuh se nije bojao, jer se oslanjao na Allaha. Ko je strpljiv i oslanja se na Allaha, nikad nije sam.'],
          cudi: ['Lađa pristaje', 'Napokon je kiša prestala i voda se povukla. Lađa se nježno zaustavila na brdu Džudi. Izašlo je sunce, poletjele su ptice. Allah je rekao Nuhu: Siđi u miru i s bereketom. Ljudi i životinje su izašli i počeli novi život.'],
        },
        lesson: 'Nuh je mnogo godina bio strpljiv i ljubazan, čak i kad su mu se drugi smijali. Oslanjao se na Allaha – i Allah je spasio njega, njegovu porodicu, vjernike i životinje.',
        q: ['Šta je pomoglo Nuhu kad su mu se svi smijali?', 'Strpljivost i povjerenje u Allaha', 'Smijao im se i on', 'Odustao je'],
      },
      ibrahim: {
        name: 'Ibrahim i vatra', sub: 'Hrabrost, istina i mir',
        s: {
          sky: ['Ibrahim traži svog Stvoritelja', 'Ibrahim, mir s njim, gledao je noću u nebo. Vidio je sjajnu zvijezdu, zatim mjesec, a ujutro sunce. Ali sve je opet zalazilo. Tada je znao: moj Gospodar je Allah, Koji je stvorio nebesa i Zemlju. On nikad ne zalazi.'],
          wood: ['Ibrahim govori istinu', 'Ljudi u njegovom gradu klanjali su se kipovima od kamena i drveta. Ibrahim im je mirno rekao: Oni vas ne mogu ni čuti ni pomoći vam. To je moćnike jako naljutilo. Skupili su mnogo, mnogo drva za ogromnu vatru.'],
          fire: ['Velika vatra', 'Vatra je bila toliko vruća da joj niko nije mogao prići. Bacili su Ibrahima u nju. Ali Ibrahim se nije bojao. Rekao je: Allah mi je dovoljan, i On je najbolji Zaštitnik.', 'Ḥasbiyallāhu wa niʿma l-wakīl', 'Allah mi je dovoljan, i On je najbolji Zaštitnik.'],
          garden: ['Hladnoća i mir', 'Tada je Allah rekao: O vatro, budi hladna i spas Ibrahimu! I vatra ga nije opekla. Ibrahim je bio siguran i miran. Mnogi pričaju da mu je bilo kao u bašči. Izašao je živ i zdrav.', 'Yā nāru kūnī bardan wa salāman ʿalā Ibrāhīm', 'O vatro, budi hladna i spas Ibrahimu!'],
        },
        lesson: 'Ibrahim je hrabro i ljubazno govorio istinu. Potpuno se oslonio na Allaha – i Allah je vatru učinio mirom.',
        q: ['Šta je Allah rekao vatri?', '„Budi hladna i spas Ibrahimu!“', '„Gori još jače!“', '„Idi dalje!“'],
      },
      musa: {
        name: 'Musa u korpici', sub: 'Allah čuva',
        s: {
          home: ['Hrabra majka', 'U Egiptu je vladao faraon. Bio je nepravedan i nije htio da mali dječaci Izraelćana odrastu. Musaova majka, mir s njim, jako se bojala za svoju bebu. Tada joj je Allah nadahnuo: Kad se pobojiš za njega, stavi ga u rijeku.'],
          basket: ['U vodu', 'Stavila je Musaa u korpicu i nježno je spustila na Nil. Allah ju je tješio: Ne boj se i ne tuguj. Mi ćemo ti ga vratiti.', 'Wa lā takhāfī wa lā taḥzanī, innā rāddūhu ilayki', 'Ne boj se i ne tuguj – Mi ćemo ti ga vratiti.'],
          float: ['Rijeka ga nosi', 'Korpica je plovila niz veliku rijeku. Musaova sestra krišom je išla obalom i gledala kuda je voda nosi. Rijeka je odnijela bebu tačno tamo gdje je Allah htio.'],
          palace: ['U dvorcu', 'Korpica je stigla do faraonovog dvorca. Njegova žena Asija pronašla je bebu i odmah je zavoljela. Ne ubijajte ga, rekla je, možda će nam biti radost. Ali beba nije htjela piti ni od jedne dojilje.'],
          back: ['Ponovo kod majke', 'Tada je njegova sestra rekla: Znam jednu porodicu koja će se dobro brinuti o njemu. Tako se Musa vratio svojoj rođenoj majci. Bila je sretna i znala je: Allahovo obećanje je istina.'],
        },
        lesson: 'Musaova majka se bojala – a ipak se oslonila na Allaha. Allah je održao Svoje obećanje i vratio joj bebu.',
        q: ['Šta je Allah obećao Musaovoj majci?', 'Da će joj vratiti bebu', 'Da će rijeka stati', 'Da će dobiti dvorac'],
      },
      yunus: {
        name: 'Junus i kit', sub: 'Nikad ne odustaj – Allah te čuje svugdje',
        s: {
          ship: ['Junus odlazi', 'Poslanik Junus, mir s njim, živio je u gradu Ninivi. Dugo je pozivao ljude dobru, ali oni ga nisu slušali. Tužan je otišao, ne čekajući Allahovo dopuštenje, i ukrcao se na lađu.'],
          storm: ['Oluja', 'Na moru je nastala jaka oluja. Lađa je bila teško natovarena i opasno se ljuljala. Mornari su vukli kocku ko mora napustiti lađu – i kocka je pala na Junusa.'],
          whale: ['Veliki kit', 'Junus je pao u more. Tada je Allah poslao ogromnog kita koji ga je progutao – ali ga nije povrijedio. Kit ga nije trebao pojesti, nego čuvati.'],
          dark: ['U tami', 'U utrobi kita, duboko u moru i usred noći, bio je potpuni mrak. Junus se pokajao i molio: Nema boga osim Tebe, slavljen neka si. Ja sam pogriješio. Allah ga je čuo – čak i tamo.', 'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn', 'Nema boga osim Tebe, slavljen neka si – ja sam učinio nepravdu.'],
          shore: ['Na obali', 'Allah je spasio Junusa. Kit ga je donio do obale. Junus je bio slab, ali Allah je dao da izraste biljka tikve s velikim listovima, koja mu je davala hlad. Kasnije se vratio svom narodu – i ovaj put su povjerovali.'],
        },
        lesson: 'Čak i kad se sve čini mračnim: Allah čuje svaku dovu, svugdje. Ko pogriješi, smije tražiti oprost i početi iznova.',
        q: ['Gdje je Allah čuo Junusovu dovu?', 'Čak i u utrobi kita – svugdje', 'Samo u džamiji', 'Samo danju'],
      },
      suleyman: {
        name: 'Sulejman i mrav', sub: 'Poštovanje prema svim stvorenjima',
        s: {
          gift: ['Poseban dar', 'Allah je poslaniku Sulejmanu, mir s njim, darovao mudrost i veliko carstvo. Razumio je čak i jezik ptica i životinja. Jednog dana prolazio je sa svojom velikom vojskom kroz zemlju.'],
          ant: ['Mali mrav', 'Sada si sasvim malen! Stigli su do doline pune mrava. Jedan mali mrav je povikao: O mravi, uđite u svoje stanove, da vas Sulejman i njegova vojska ne izgaze, a da i ne primijete! Brinuo se za sve ostale.', 'Yā ayyuha n-namlu dkhulū masākinakum', 'O mravi, uđite u svoje stanove!'],
          smile: ['Sulejman se smiješi', 'Sulejman je čuo malog mrava. Nasmiješio se i zaustavio svoju vojsku, da se nijednom mravu ništa ne desi. Onda je zahvalio Allahu: Gospodaru moj, pomozi mi da budem zahvalan za Tvoje blagodati i da činim dobro koje Ti je drago.', 'Rabbi awziʿnī an ashkura niʿmataka', 'Gospodaru moj, pomozi mi da budem zahvalan za Tvoje blagodati.'],
        },
        lesson: 'Sulejman je bio moćan car – a ipak je pazio i na najmanjeg mrava. Dobar čovjek je blag prema svim stvorenjima i zahvalan.',
        q: ['Šta je Sulejman učinio kad je čuo mrava?', 'Nasmiješio se, zaustavio se i zahvalio Allahu', 'Jednostavno je išao dalje', 'Naljutio se'],
      },
      hijra: {
        name: 'Pećina, pauk i golubica', sub: 'Allah je s nama – hidžra',
        s: {
          night: ['Polazak u noći', 'Naš Poslanik Muhammed, mir i blagoslov neka su na njega, pozivao je ljude u Mekki dobru. Ali neki su mu htjeli nauditi. Allah mu je dozvolio da ode u Medinu. U noći je krenuo sa svojim najboljim prijateljem Ebu Bekrom.'],
          cave: ['Pećina Sevr', 'Njih dvojica su se sakrila u pećinu na brdu Sevr. Tri dana su ostali tamo. Vani su ih ljudi iz Mekke tražili posvuda.'],
          web: ['Pauk i golubica', 'Ovako se prenosi: jedan pauk je ispleo mrežu preko ulaza u pećinu, a jedna golubica je tamo napravila gnijezdo i snijela jaja. Pogledaj kako mreža raste nit po nit. Male životinje su pomogle – onako kako je Allah htio.'],
          search: ['Allah je s nama', 'Progonitelji su došli sasvim blizu. Ebu Bekr je zabrinuto šapnuo: Ako neko pogleda dolje, vidjet će nas. Poslanik je mirno rekao: Ne tuguj, Allah je s nama. Ljudi su vidjeli mrežu i gnijezdo – i otišli.', 'Lā taḥzan innallāha maʿanā', 'Ne tuguj, Allah je s nama.'],
          medina: ['Dolazak u Medinu', 'Nakon dugog putovanja stigli su u Medinu. Ljudi su se jako obradovali, a priča se da su djeca u znak dobrodošlice pjevala: Pun mjesec je izašao nad nama. U Medini su ljudi postali braća i dijelili jedni s drugima.', 'Ṭalaʿa l-badru ʿalaynā', 'Pun mjesec je izašao nad nama.'],
        },
        lesson: 'I u teškim trenucima Poslanik je ostao miran i oslanjao se na Allaha. Allah čuva koga hoće – čak i paukovom mrežom.',
        q: ['Šta je Poslanik u pećini rekao Ebu Bekru?', '„Ne tuguj, Allah je s nama.“', '„Bježi brzo!“', '„Izgubljeni smo.“'],
      },
    },
  },
  sky: {
    menu: '✨ Zvjezdano nebo', title: 'Moje zvjezdano nebo', count: (a, b) => `Svijetli ${a} od ${b} zvijezda`,
    lookUp: 'Pogledaj gore: svaki namaz, svaka sura i svaka priča koju si naučio svijetli kao zvijezda.',
    lookUpMobile: 'Gore na nebu svijetle tvoje zvijezde: svaki namaz, svaka sura i svaka priča koju si naučio.',
    prayers: 'Namazi', suras: 'Sure', stories: 'Priče', badges: 'Značke', days: 'Dana sa svih 5 namaza',
    next: 'Tvoja sljedeća zvijezda:', allDone: 'Sve zvijezde svijetle – mašallah!',
  },
};
