// Peygamber kıssaları (Türkçe) ve yıldızlı gök.
export default {
  story: {
    menu: '📖 Kıssalar', title: 'Peygamber Kıssaları', sub: 'birlikte yolculuk – çocuklar ve aileler için',
    intro: [
      'Mekânlara birlikte git: gemiye, ateşe, Nil’e, denize, karıncalar vadisine ve mağaraya.',
      'Saygımızdan dolayı peygamberler gösterilmez – mekânları görür, kıssayı dinlersin. Kıssalar Kur’an’a (sure:ayet yazılıdır) ve belirtilen yerlerde rivayetlere dayanır.',
    ],
    soundsSub: 'Rüzgâr, yağmur, dalgalar, cırcır böcekleri – tarayıcıda üretilir',
    quran: (ref) => `Kur’an ${ref}`, told: 'rivayete göre',
    done: 'Ne öğrendik?', listen: '🔊 Dinle', more: '📖 Diğerleri', right: 'Doğru! Maşallah.',
    rightStar: (n) => `Doğru! Maşallah – gökyüzünde yeni bir yıldız parlıyor (${n} ⭐).`,
    wrong: 'Az kaldı! Yeşil cevaba bir daha bak.',
    list: {
      nuh: {
        name: 'Nuh (a.s.) ve Gemi', sub: 'Sabır ve tevekkül',
        s: {
          build: ['Nuh gemi yapıyor', 'Çok uzun zaman önce Nuh Peygamber, ona selam olsun, yaşardı. Uzun yıllar boyunca insanlara nazikçe: Birbirinize iyi davranın ve yalnız Allah’a ibadet edin, dedi. Ama çoğu onunla alay etti. Allah Nuh’a: Büyük bir gemi yap, dedi. Nuh da kupkuru toprağın ortasında gemiyi yaptı.'],
          animals: ['Hayvanlar geliyor', 'Gemi bitince hayvanlar geldi: her türden bir çift. Filler, aslanlar, zürafalar, develer, koyunlar ve atlar gemiye bindi. Nuh’un ailesi ve Allah’a inananlar da bindi. Allah herkesi düşünmüştü – insanları da hayvanları da.'],
          rain: ['Büyük yağmur', 'Sonra gök açıldı, yağmur yağdı da yağdı. Yerden sular fışkırdı. Gemi yerden kalktı ve yüzmeye başladı. Nuh şöyle dedi: Onun yüzmesi de durması da Allah’ın adıyladır.', 'Bismillâhi mecrâhâ ve mürsâhâ', 'Onun yüzmesi de durması da Allah’ın adıyladır.'],
          sea: ['Dalgaların üstünde', 'Her yer su olmuştu, dalgalar dağlar kadar yüksekti. Ama gemide herkes güvendeydi. Nuh korkmadı, çünkü Allah’a güveniyordu. Sabreden ve Allah’a güvenen asla yalnız değildir.'],
          cudi: ['Gemi karaya oturuyor', 'Sonunda yağmur durdu ve sular çekildi. Gemi yavaşça Cudi Dağı’nın üzerine oturdu. Güneş çıktı, kuşlar uçtu. Allah Nuh’a: Selametle ve bereketle in, dedi. İnsanlar ve hayvanlar gemiden inip yeni bir hayata başladı.'],
        },
        lesson: 'Nuh (a.s.) başkaları onunla alay ederken bile yıllarca sabırlı ve nazik kaldı. Allah’a güvendi – Allah da onu, ailesini, inananları ve hayvanları kurtardı.',
        q: ['Herkes alay ederken Nuh’a ne yardım etti?', 'Sabır ve Allah’a güven', 'O da onlarla alay etti', 'Vazgeçti'],
      },
      ibrahim: {
        name: 'İbrahim (a.s.) ve Ateş', sub: 'Cesaret, doğruluk ve barış',
        s: {
          sky: ['İbrahim Rabbini arıyor', 'İbrahim, ona selam olsun, geceleyin gökyüzüne baktı. Parlak bir yıldız gördü, sonra Ay’ı, sabah da Güneş’i. Ama hepsi battı. O zaman anladı: Benim Rabbim gökleri ve yeri yaratan Allah’tır. O asla batmaz.'],
          wood: ['İbrahim doğruyu söylüyor', 'Şehrindeki insanlar taştan ve tahtadan heykellere tapıyordu. İbrahim onlara sakince: Bunlar sizi ne duyar ne de size yardım edebilir, dedi. Bu, güçlüleri çok kızdırdı. Kocaman bir ateş için çok, çok odun topladılar.'],
          fire: ['Büyük ateş', 'Ateş o kadar sıcaktı ki kimse yanına yaklaşamıyordu. İbrahim’i ateşe attılar. Ama İbrahim korkmadı. Şöyle dedi: Allah bana yeter, O ne güzel vekildir.', 'Hasbiyallâhu ve ni’me’l-vekîl', 'Allah bana yeter, O ne güzel vekildir.'],
          garden: ['Serin ve esenlik', 'Allah şöyle buyurdu: Ey ateş! İbrahim’e serin ve esenlik ol! Ve ateş onu yakmadı. İbrahim güvende ve sakindi. Anlatılır ki ateş onun için bir bahçe gibi oldu. Sapasağlam dışarı çıktı.', 'Yâ nâru kûnî berden ve selâmen alâ İbrâhîm', 'Ey ateş! İbrahim’e serin ve esenlik ol!'],
        },
        lesson: 'İbrahim (a.s.) doğruyu cesaretle ve nezaketle söyledi. Tamamen Allah’a güvendi – Allah da ateşi esenliğe çevirdi.',
        q: ['Allah ateşe ne buyurdu?', '„İbrahim’e serin ve esenlik ol!“', '„Daha çok yan!“', '„Başka yere git!“'],
      },
      musa: {
        name: 'Sepetteki Musa (a.s.)', sub: 'Allah korur',
        s: {
          home: ['Cesur bir anne', 'Mısır’da Firavun hüküm sürüyordu. Zalimdi ve İsrailoğullarının küçük erkek çocuklarının büyümesini istemiyordu. Musa’nın annesi bebeği için çok korkuyordu. Allah ona şöyle ilham etti: Onun için korkarsan onu nehre bırak.'],
          basket: ['Suya', 'Musa’yı bir sepete koydu ve yavaşça Nil’e bıraktı. Allah onu teselli etti: Korkma ve üzülme. Biz onu sana geri döndüreceğiz.', 'Ve lâ tehâfî ve lâ tahzenî, innâ râddûhu ileyki', 'Korkma ve üzülme – onu sana geri döndüreceğiz.'],
          float: ['Nehir onu taşıyor', 'Sepet büyük nehirde akıp gitti. Musa’nın ablası gizlice kıyıdan onu takip etti ve nereye gittiğine baktı. Nehir bebeği tam Allah’ın dilediği yere götürdü.'],
          palace: ['Sarayda', 'Sepet Firavun’un sarayına geldi. Hanımı Asiye bebeği buldu ve hemen sevdi. Onu öldürmeyin, dedi, belki bize sevinç olur. Ama bebek hiçbir sütanneden süt emmedi.'],
          back: ['Annesine dönüş', 'O zaman ablası: Ona iyi bakacak bir aile biliyorum, dedi. Böylece Musa kendi annesine geri döndü. Annesi çok mutluydu ve biliyordu: Allah’ın vaadi haktır.'],
        },
        lesson: 'Musa’nın (a.s.) annesi korkuyordu – yine de Allah’a güvendi. Allah sözünü tuttu ve bebeği ona geri getirdi.',
        q: ['Allah Musa’nın annesine ne söz verdi?', 'Bebeğine kavuşacağını', 'Nehrin duracağını', 'Ona bir saray vereceğini'],
      },
      yunus: {
        name: 'Yunus (a.s.) ve Balina', sub: 'Asla vazgeçme – Allah seni her yerde duyar',
        s: {
          ship: ['Yunus ayrılıyor', 'Yunus Peygamber, ona selam olsun, Ninova şehrinde yaşardı. Uzun zaman insanları iyiliğe çağırdı ama onu dinlemediler. Üzgün bir şekilde, Allah’ın iznini beklemeden ayrıldı ve bir gemiye bindi.'],
          storm: ['Fırtına', 'Denizde şiddetli bir fırtına çıktı. Gemi çok yüklüydü ve tehlikeli şekilde sallanıyordu. Denizciler gemiden kimin ayrılacağını belirlemek için kura çektiler – kura Yunus’a çıktı.'],
          whale: ['Büyük balık', 'Yunus denize düştü. Allah kocaman bir balık gönderdi; balık onu yuttu ama hiç incitmedi. Balık onu yemek için değil, korumak için gelmişti.'],
          dark: ['Karanlıkta', 'Balığın karnında, denizin derinliklerinde ve gecenin içinde her yer karanlıktı. Yunus pişman oldu ve dua etti: Senden başka ilah yoktur, Sen münezzehsin. Ben yanlış yaptım. Allah onu duydu – orada bile.', 'Lâ ilâhe illâ ente sübhâneke innî küntü mine’z-zâlimîn', 'Senden başka ilah yoktur, Sen münezzehsin – ben zulmedenlerden oldum.'],
          shore: ['Sahilde', 'Allah Yunus’u kurtardı. Balık onu bir sahile bıraktı. Yunus çok halsizdi; Allah büyük yapraklı bir kabak bitkisi bitirdi ve ona gölge yaptı. Sonra kavmine döndü – bu kez iman ettiler.'],
        },
        lesson: 'Her şey karanlık görünse bile Allah her duayı her yerde duyar. Hata yapan affedilmeyi isteyip yeniden başlayabilir.',
        q: ['Allah Yunus’un duasını nerede duydu?', 'Balığın karnında bile – her yerde', 'Sadece camide', 'Sadece gündüz'],
      },
      suleyman: {
        name: 'Süleyman (a.s.) ve Karınca', sub: 'Bütün canlılara saygı',
        s: {
          gift: ['Özel bir hediye', 'Allah Süleyman Peygamber’e, ona selam olsun, hikmet ve büyük bir mülk verdi. O, kuşların ve hayvanların dilini bile anlardı. Bir gün büyük ordusuyla yola çıktı.'],
          ant: ['Küçük karınca', 'Şimdi sen de çok küçüksün! Karıncalarla dolu bir vadiye geldiler. Küçük bir karınca seslendi: Ey karıncalar, yuvalarınıza girin, Süleyman ve ordusu farkında olmadan sizi ezmesin! O, diğer herkesi düşündü.', 'Yâ eyyühe’n-neml üdhulû mesâkinekum', 'Ey karıncalar, yuvalarınıza girin!'],
          smile: ['Süleyman gülümsüyor', 'Süleyman küçük karıncayı duydu. Gülümsedi ve hiçbir karıncaya zarar gelmesin diye ordusunu durdurdu. Sonra Allah’a şükretti: Rabbim, nimetlerine şükretmemi ve razı olacağın iyi işler yapmamı nasip et.', 'Rabbi evzi’nî en eşküre ni’meteke', 'Rabbim, nimetine şükretmemi nasip et.'],
        },
        lesson: 'Süleyman (a.s.) güçlü bir kraldı – yine de en küçük karıncayı gözetti. İyi insan bütün canlılara karşı yumuşak ve şükredendir.',
        q: ['Süleyman karıncayı duyunca ne yaptı?', 'Gülümsedi, durdu ve Allah’a şükretti', 'Yoluna devam etti', 'Kızdı'],
      },
      hijra: {
        name: 'Mağara, Örümcek ve Güvercin', sub: 'Allah bizimle – Hicret',
        s: {
          night: ['Gece yola çıkış', 'Peygamber Efendimiz Hz. Muhammed (s.a.v.) Mekke’deki insanları iyiliğe davet etti. Ama bazıları ona zarar vermek istedi. Allah ona Medine’ye gitme izni verdi. Gece en yakın dostu Hz. Ebubekir ile birlikte yola çıktı.'],
          cave: ['Sevr Mağarası', 'İkisi Sevr Dağı’ndaki bir mağaraya saklandılar. Üç gün orada kaldılar. Dışarıda Mekkeli adamlar her yerde onları arıyordu.'],
          web: ['Örümcek ve güvercin', 'Rivayet edilir ki bir örümcek mağaranın girişine ağ ördü, bir güvercin de oraya yuva yapıp yumurtladı. Bak, ağ ip ip nasıl büyüyor. Küçük hayvanlar yardım etti – Allah’ın dilediği gibi.'],
          search: ['Allah bizimle', 'Takip edenler çok yaklaştı. Hz. Ebubekir endişeyle fısıldadı: Biri aşağı baksa bizi görür. Peygamberimiz sakince: Üzülme, Allah bizimle, dedi. Adamlar ağı ve yuvayı gördüler – ve geri döndüler.', 'Lâ tahzen innallâhe meanâ', 'Üzülme, Allah bizimle.'],
          medina: ['Medine’ye varış', 'Uzun bir yolculuktan sonra Medine’ye vardılar. İnsanlar çok sevindi; anlatılır ki çocuklar onları şöyle karşıladı: Dolunay üzerimize doğdu. Medine’de insanlar kardeş oldu ve birbirleriyle paylaştı.', 'Tala’al bedru aleynâ', 'Dolunay üzerimize doğdu.'],
        },
        lesson: 'Peygamberimiz (s.a.v.) zor anlarda bile sakin kaldı ve Allah’a güvendi. Allah dilediğini korur – bir örümcek ağıyla bile.',
        q: ['Peygamberimiz mağarada Hz. Ebubekir’e ne dedi?', '„Üzülme, Allah bizimle.“', '„Hemen kaç!“', '„Kaybolduk.“'],
      },
    },
  },
  sky: {
    menu: '✨ Yıldızlı Gök', title: 'Benim Yıldızlı Göğüm', count: (a, b) => `${b} yıldızdan ${a} tanesi parlıyor`,
    lookUp: 'Yukarı bak: Öğrendiğin her namaz, her sure ve her kıssa bir yıldız olarak parlıyor.',
    lookUpMobile: 'Gökyüzünde yıldızların parlıyor: Öğrendiğin her namaz, her sure ve her kıssa.',
    prayers: 'Namazlar', suras: 'Sureler', stories: 'Kıssalar', badges: 'Rozetler', days: '5 vakti kıldığın günler',
    next: 'Sıradaki yıldızın:', allDone: 'Bütün yıldızlar parlıyor – Maşallah!',
  },
};
