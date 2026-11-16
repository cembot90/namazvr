// Kisah para nabi (Bahasa Indonesia) dan langit berbintang.
// Langkah: [judul, cerita, transliterasi ayat, arti]. Pertanyaan q: [pertanyaan, jawaban benar, lainnya, lainnya].
export default {
  story: {
    menu: '📖 Kisah', title: 'Kisah Para Nabi', sub: 'ikut berpetualang – untuk anak-anak dan keluarga',
    intro: [
      'Ikut berkunjung ke tempat-tempatnya: ke bahtera, ke api, ke Sungai Nil, ke laut, ke lembah semut, dan ke gua.',
      'Karena rasa hormat, para nabi tidak ditampilkan – kamu melihat tempat-tempatnya dan mendengar kisahnya. Kisah ini mengikuti Al-Qur’an (surah:ayat dicantumkan) dan, jika disebutkan, riwayat.',
    ],
    soundsSub: 'angin, hujan, ombak, jangkrik – dibuat di browser',
    quran: (ref) => `Al-Qur’an ${ref}`, told: 'menurut riwayat',
    done: 'Apa yang kita pelajari?', listen: '🔊 Bacakan', more: '📖 Lainnya', right: 'Benar! Masya Allah.',
    rightStar: (n) => `Benar! Masya Allah – satu bintang baru bersinar di langitmu (${n} ⭐).`,
    wrong: 'Hampir! Coba lihat lagi jawaban yang hijau.',
    list: {
      nuh: {
        name: 'Nuh dan Bahtera', sub: 'Sabar dan tawakal',
        s: {
          build: ['Nuh membuat kapal', 'Dahulu kala hiduplah Nabi Nuh, ‘alaihissalam. Bertahun-tahun lamanya ia mengajak orang-orang dengan ramah: Berbuat baiklah satu sama lain dan sembahlah Allah saja. Tetapi kebanyakan dari mereka menertawakannya. Lalu Allah berfirman kepada Nuh: Buatlah sebuah kapal besar. Maka Nuh pun membuatnya – di tengah daratan yang kering.'],
          animals: ['Hewan-hewan datang', 'Ketika kapal itu selesai, datanglah hewan-hewan: dari setiap jenis sepasang. Gajah, singa, jerapah, unta, domba, dan kuda naik ke kapal. Keluarga Nuh dan semua orang yang beriman kepada Allah juga ikut naik. Allah memikirkan semuanya – manusia dan juga hewan.'],
          rain: ['Hujan yang lebat', 'Lalu langit terbuka, dan hujan turun terus-menerus. Air memancar dari dalam bumi. Kapal itu terangkat dari tanah dan mulai berlayar. Nuh berkata: Dengan nama Allah kapal ini berlayar dan berlabuh.', 'Bismillāhi majrāhā wa mursāhā', 'Dengan nama Allah kapal ini berlayar dan berlabuh.'],
          sea: ['Di atas ombak', 'Di mana-mana ada air, dan ombaknya setinggi gunung. Tetapi di dalam kapal semua orang aman. Nuh tidak takut, karena ia bertawakal kepada Allah. Siapa yang sabar dan bertawakal kepada Allah, tidak pernah sendirian.'],
          cudi: ['Kapal berlabuh', 'Akhirnya hujan berhenti dan air pun surut. Kapal itu berhenti dengan lembut di atas Gunung Judi. Matahari bersinar, burung-burung terbang. Allah berfirman kepada Nuh: Turunlah dengan selamat dan penuh berkah. Manusia dan hewan turun dari kapal dan memulai kehidupan baru.'],
        },
        lesson: 'Nuh bersabar dan bersikap ramah selama bertahun-tahun, bahkan ketika orang lain menertawakannya. Ia bertawakal kepada Allah – dan Allah menyelamatkannya, keluarganya, orang-orang beriman, dan hewan-hewan.',
        q: ['Apa yang menolong Nuh ketika semua orang menertawakannya?', 'Sabar dan tawakal kepada Allah', 'Ia balas menertawakan mereka', 'Ia menyerah'],
      },
      ibrahim: {
        name: 'Ibrahim dan Api', sub: 'Berani, jujur, dan damai',
        s: {
          sky: ['Ibrahim mencari Penciptanya', 'Ibrahim, ‘alaihissalam, memandang langit pada malam hari. Ia melihat bintang yang terang, lalu bulan, dan pada pagi hari matahari. Tetapi semuanya terbenam lagi. Maka ia tahu: Tuhanku adalah Allah, yang menciptakan langit dan bumi. Dia tidak pernah terbenam.'],
          wood: ['Ibrahim mengatakan yang benar', 'Orang-orang di kotanya menyembah patung dari batu dan kayu. Ibrahim berkata kepada mereka dengan tenang: Patung-patung itu tidak bisa mendengar dan tidak bisa menolong kalian. Hal itu membuat para penguasa sangat marah. Mereka mengumpulkan kayu yang sangat banyak untuk api yang sangat besar.'],
          fire: ['Api yang besar', 'Api itu begitu panas sehingga tidak ada yang bisa mendekatinya. Mereka melemparkan Ibrahim ke dalamnya. Tetapi Ibrahim tidak takut. Ia berkata: Cukuplah Allah bagiku, dan Dia sebaik-baik pelindung.', 'Ḥasbiyallāhu wa niʿma l-wakīl', 'Cukuplah Allah bagiku, dan Dia sebaik-baik pelindung.'],
          garden: ['Dingin dan selamat', 'Lalu Allah berfirman: Wahai api, jadilah dingin dan keselamatan bagi Ibrahim! Dan api itu tidak membakarnya. Ibrahim aman dan tenang. Banyak yang menceritakan, bagi Ibrahim rasanya seperti di taman. Ia keluar dengan selamat.', 'Yā nāru kūnī bardan wa salāman ʿalā Ibrāhīm', 'Wahai api, jadilah dingin dan keselamatan bagi Ibrahim!'],
        },
        lesson: 'Ibrahim mengatakan kebenaran dengan berani dan ramah. Ia bertawakal sepenuhnya kepada Allah – dan Allah menjadikan api itu dingin dan menyelamatkan.',
        q: ['Apa firman Allah kepada api?', '“Jadilah dingin dan keselamatan bagi Ibrahim!”', '“Menyalalah lebih panas!”', '“Pergilah ke tempat lain!”'],
      },
      musa: {
        name: 'Musa di dalam Keranjang', sub: 'Allah melindungi',
        s: {
          home: ['Seorang ibu yang berani', 'Di Mesir berkuasa seorang Firaun. Ia zalim dan tidak ingin anak-anak laki-laki Bani Israil tumbuh besar. Ibu Musa, ‘alaihissalam, sangat takut akan bayinya. Lalu Allah mengilhamkan kepadanya: Jika kamu khawatir terhadapnya, letakkanlah ia di sungai.'],
          basket: ['Masuk ke air', 'Ia meletakkan Musa di dalam sebuah keranjang dan menaruhnya dengan lembut di Sungai Nil. Allah menghiburnya: Janganlah kamu takut dan janganlah bersedih. Kami akan mengembalikannya kepadamu.', 'Wa lā takhāfī wa lā taḥzanī, innā rāddūhu ilayki', 'Janganlah kamu takut dan janganlah bersedih – Kami akan mengembalikannya kepadamu.'],
          float: ['Sungai membawanya', 'Keranjang itu hanyut mengikuti sungai yang besar. Kakak perempuan Musa diam-diam berjalan di tepi sungai dan melihat ke mana keranjang itu hanyut. Sungai membawa bayi itu tepat ke tempat yang Allah kehendaki.'],
          palace: ['Di istana', 'Keranjang itu sampai ke istana Firaun. Istrinya, Asiyah, menemukan bayi itu dan langsung menyayanginya. Jangan bunuh dia, katanya, semoga ia membawa kebahagiaan bagi kita. Tetapi bayi itu tidak mau menyusu kepada ibu susu mana pun.'],
          back: ['Kembali kepada ibunya', 'Lalu kakaknya berkata: Aku tahu sebuah keluarga yang akan merawatnya dengan baik. Maka Musa kembali kepada ibunya sendiri. Ibunya sangat bahagia dan tahu: Janji Allah itu benar.'],
        },
        lesson: 'Ibu Musa merasa takut – namun tetap bertawakal kepada Allah. Allah menepati janji-Nya dan mengembalikan bayinya.',
        q: ['Apa yang Allah janjikan kepada ibu Musa?', 'Bahwa bayinya akan kembali kepadanya', 'Bahwa sungai akan berhenti mengalir', 'Bahwa ia akan mendapat istana'],
      },
      yunus: {
        name: 'Yunus dan Ikan Paus', sub: 'Jangan menyerah – Allah mendengarmu di mana saja',
        s: {
          ship: ['Yunus pergi', 'Nabi Yunus, ‘alaihissalam, tinggal di kota Ninawa. Lama sekali ia mengajak orang-orang kepada kebaikan, tetapi mereka tidak mau mendengarkannya. Dengan sedih ia pergi tanpa menunggu izin Allah, lalu naik ke sebuah kapal.'],
          storm: ['Badai', 'Di tengah laut datang badai yang kuat. Kapal itu sarat muatan dan berguncang dengan berbahaya. Para pelaut mengundi siapa yang harus meninggalkan kapal – dan undian jatuh kepada Yunus.'],
          whale: ['Ikan paus yang besar', 'Yunus masuk ke laut. Lalu Allah mengirim seekor ikan paus raksasa yang menelannya – tetapi tanpa menyakitinya. Ikan paus itu tidak untuk memakannya, melainkan untuk melindunginya.'],
          dark: ['Dalam kegelapan', 'Di dalam perut ikan paus, jauh di dasar laut dan di tengah malam, keadaannya gelap gulita. Yunus menyesal dan berdoa: Tidak ada Tuhan selain Engkau, Mahasuci Engkau. Aku telah berbuat salah. Allah mendengarnya – bahkan di sana.', 'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn', 'Tidak ada Tuhan selain Engkau, Mahasuci Engkau – sungguh aku termasuk orang yang zalim.'],
          shore: ['Di pantai', 'Allah menyelamatkan Yunus. Ikan paus itu membawanya ke sebuah pantai. Yunus lemah, tetapi Allah menumbuhkan sebatang pohon labu berdaun lebar yang memberinya keteduhan. Kemudian ia kembali kepada kaumnya – dan kali ini mereka beriman.'],
        },
        lesson: 'Walaupun semuanya terasa gelap: Allah mendengar setiap doa, di mana saja. Siapa yang berbuat salah boleh memohon ampun dan memulai lagi.',
        q: ['Di mana Allah mendengar doa Yunus?', 'Bahkan di dalam perut ikan paus – di mana saja', 'Hanya di masjid', 'Hanya pada siang hari'],
      },
      suleyman: {
        name: 'Sulaiman dan Semut', sub: 'Menghormati semua makhluk',
        s: {
          gift: ['Hadiah yang istimewa', 'Allah memberi Nabi Sulaiman, ‘alaihissalam, hikmah dan kerajaan yang besar. Ia bahkan memahami bahasa burung dan hewan. Suatu hari ia berjalan bersama bala tentaranya yang besar melintasi negeri.'],
          ant: ['Semut kecil', 'Sekarang kamu jadi sangat kecil! Mereka sampai di sebuah lembah yang penuh semut. Seekor semut kecil berseru: Wahai semut-semut, masuklah ke sarang kalian, agar Sulaiman dan tentaranya tidak menginjak kalian tanpa menyadarinya! Ia peduli pada semua semut yang lain.', 'Yā ayyuha n-namlu dkhulū masākinakum', 'Wahai semut-semut, masuklah ke sarang kalian!'],
          smile: ['Sulaiman tersenyum', 'Sulaiman mendengar semut kecil itu. Ia tersenyum dan menghentikan tentaranya, supaya tidak ada semut yang celaka. Lalu ia bersyukur kepada Allah: Ya Tuhanku, bantulah aku untuk mensyukuri nikmat-Mu dan berbuat kebaikan yang Engkau ridai.', 'Rabbi awziʿnī an ashkura niʿmataka', 'Ya Tuhanku, bantulah aku untuk mensyukuri nikmat-Mu.'],
        },
        lesson: 'Sulaiman adalah raja yang perkasa – tetapi ia tetap memperhatikan semut yang paling kecil. Orang yang baik bersikap lembut kepada semua makhluk dan pandai bersyukur.',
        q: ['Apa yang dilakukan Sulaiman ketika mendengar semut itu?', 'Ia tersenyum, berhenti, dan bersyukur kepada Allah', 'Ia terus saja berjalan', 'Ia menjadi marah'],
      },
      hijra: {
        name: 'Gua, Laba-laba, dan Merpati', sub: 'Allah bersama kita – hijrah',
        s: {
          night: ['Berangkat pada malam hari', 'Nabi kita Muhammad, ṣallallāhu ‘alaihi wa sallam, mengajak orang-orang di Makkah kepada kebaikan. Tetapi ada yang ingin mencelakainya. Allah mengizinkannya pergi ke Madinah. Pada malam hari ia berangkat bersama sahabat terbaiknya, Abu Bakar.'],
          cave: ['Gua Tsur', 'Keduanya bersembunyi di sebuah gua di Gunung Tsur. Tiga hari mereka tinggal di sana. Di luar, orang-orang dari Makkah mencari mereka ke mana-mana.'],
          web: ['Laba-laba dan merpati', 'Diriwayatkan: Seekor laba-laba membuat sarang di pintu gua, dan seekor merpati membangun sarangnya di sana lalu bertelur. Lihat, jaring laba-laba itu tumbuh benang demi benang. Hewan-hewan kecil ikut menolong – sesuai kehendak Allah.'],
          search: ['Allah bersama kita', 'Para pengejar datang sangat dekat. Abu Bakar berbisik dengan cemas: Kalau salah satu dari mereka melihat ke bawah, ia akan melihat kita. Nabi berkata dengan tenang: Jangan bersedih, Allah bersama kita. Orang-orang itu melihat jaring dan sarang burung – lalu pergi lagi.', 'Lā taḥzan innallāha maʿanā', 'Jangan bersedih, sesungguhnya Allah bersama kita.'],
          medina: ['Tiba di Madinah', 'Setelah perjalanan yang panjang, mereka tiba di Madinah. Orang-orang sangat gembira, dan diceritakan bahwa anak-anak bernyanyi untuk menyambutnya: Bulan purnama telah terbit di atas kami. Di Madinah orang-orang menjadi bersaudara dan saling berbagi.', 'Ṭalaʿa l-badru ʿalaynā', 'Bulan purnama telah terbit di atas kami.'],
        },
        lesson: 'Bahkan di saat yang sulit, Nabi tetap tenang dan bertawakal kepada Allah. Allah melindungi siapa yang Dia kehendaki – bahkan dengan sarang laba-laba.',
        q: ['Apa yang dikatakan Nabi kepada Abu Bakar di dalam gua?', '“Jangan bersedih, Allah bersama kita.”', '“Cepat lari!”', '“Kita sudah tamat.”'],
      },
    },
  },
  sky: {
    menu: '✨ Langit Bintang', title: 'Langit Bintangku', count: (a, b) => `${a} dari ${b} bintang bersinar`,
    lookUp: 'Lihat ke atas: Setiap salat, setiap surah, dan setiap kisah yang sudah kamu pelajari bersinar sebagai bintang.',
    lookUpMobile: 'Di atas, di langit, bintang-bintangmu bersinar: setiap salat, setiap surah, dan setiap kisah yang sudah kamu pelajari.',
    prayers: 'Salat', suras: 'Surah', stories: 'Kisah', badges: 'Lencana', days: 'Hari dengan kelima salat',
    next: 'Bintangmu berikutnya:', allDone: 'Semua bintang bersinar – Masya Allah!',
  },
};
