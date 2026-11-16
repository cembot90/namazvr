// Histoires des prophètes (français) et ciel étoilé.
// Étape : [titre, récit, translittération du verset, sens]. Question q : [question, bonne réponse, autre, autre].
export default {
  story: {
    menu: '📖 Histoires', title: 'Histoires des prophètes', sub: 'pour voyager ensemble – pour les enfants et les familles',
    intro: [
      'Voyage avec nous vers les lieux : vers l’arche, près du feu, au bord du Nil, sur la mer, dans la vallée des fourmis et jusqu’à la grotte.',
      'Par respect, les prophètes ne sont pas montrés – tu vois les lieux et tu entends l’histoire. Elle suit le Coran (sourate:verset est indiqué) et, quand c’est précisé, la tradition.',
    ],
    soundsSub: 'vent, pluie, vagues, grillons – créés dans le navigateur',
    quran: (ref) => `Coran ${ref}`, told: 'selon la tradition',
    done: 'Qu’apprenons-nous ?', listen: '🔊 Lire à voix haute', more: '📖 Autres', right: 'Juste ! Masha’Allah.',
    rightStar: (n) => `Juste ! Masha’Allah – une nouvelle étoile brille dans ton ciel (${n} ⭐).`,
    wrong: 'Presque ! Regarde encore une fois la réponse verte.',
    list: {
      nuh: {
        name: 'Nouh et l’arche', sub: 'Patience et confiance',
        s: {
          build: ['Nouh construit un bateau', 'Il y a très, très longtemps vivait le prophète Nouh, que la paix soit sur lui. Pendant de nombreuses années, il a gentiment demandé aux gens : soyez bons les uns envers les autres et priez Allah seul. Mais la plupart se moquaient de lui. Alors Allah a dit à Nouh : construis un grand bateau. Et Nouh a construit – au beau milieu de la terre sèche.'],
          animals: ['Les animaux arrivent', 'Quand le bateau fut terminé, les animaux sont arrivés : un couple de chaque espèce. Éléphants, lions, girafes, chameaux, moutons et chevaux sont montés à bord. La famille de Nouh et tous ceux qui croyaient en Allah sont montés aussi. Allah avait pensé à tous – aux hommes et aux animaux.'],
          rain: ['La grande pluie', 'Puis le ciel s’est ouvert, et il a plu, plu et encore plu. De l’eau jaillissait de la terre. Le bateau s’est soulevé du sol et s’est mis à flotter. Nouh a dit : Au nom d’Allah, qu’il vogue et qu’il accoste.', 'Bismillāhi majrāhā wa mursāhā', 'Au nom d’Allah, qu’il vogue et qu’il accoste.'],
          sea: ['Sur les vagues', 'Il y avait de l’eau partout, et les vagues étaient hautes comme des montagnes. Mais dans le bateau, tout le monde était en sécurité. Nouh n’avait pas peur, car il faisait confiance à Allah. Celui qui est patient et fait confiance à Allah n’est jamais seul.'],
          cudi: ['Le bateau se pose', 'Enfin, la pluie s’est arrêtée et l’eau s’est retirée. Le bateau s’est posé doucement sur le mont Djoudi. Le soleil est revenu, les oiseaux se sont envolés. Allah a dit à Nouh : descends en paix et avec des bénédictions. Les hommes et les animaux sont descendus et ont commencé une nouvelle vie.'],
        },
        lesson: 'Nouh a été patient et gentil pendant de nombreuses années, même quand les autres se moquaient de lui. Il faisait confiance à Allah – et Allah l’a sauvé, lui, sa famille, les croyants et les animaux.',
        q: ['Qu’est-ce qui a aidé Nouh quand tout le monde se moquait ?', 'La patience et la confiance en Allah', 'Il s’est moqué d’eux aussi', 'Il a abandonné'],
      },
      ibrahim: {
        name: 'Ibrahim et le feu', sub: 'Courage, vérité et paix',
        s: {
          sky: ['Ibrahim cherche son Créateur', 'Ibrahim, que la paix soit sur lui, regardait le ciel la nuit. Il a vu une étoile brillante, puis la lune, et le matin le soleil. Mais tous finissaient par disparaître. Alors il a su : mon Seigneur est Allah, qui a créé le ciel et la terre. Lui ne disparaît jamais.'],
          wood: ['Ibrahim dit la vérité', 'Les gens de sa ville adoraient des statues de pierre et de bois. Ibrahim leur a dit calmement : elles ne peuvent ni vous entendre ni vous aider. Cela a mis les puissants très en colère. Ils ont rassemblé beaucoup, beaucoup de bois pour un feu immense.'],
          fire: ['Le grand feu', 'Le feu était si chaud que personne ne pouvait s’en approcher. Ils y ont jeté Ibrahim. Mais Ibrahim n’avait pas peur. Il a dit : Allah me suffit, et Il est le meilleur des protecteurs.', 'Ḥasbiyallāhu wa niʿma l-wakīl', 'Allah me suffit, et Il est le meilleur des protecteurs.'],
          garden: ['Fraîcheur et paix', 'Alors Allah a dit : Ô feu, sois fraîcheur et paix pour Ibrahim ! Et le feu ne l’a pas brûlé. Ibrahim était en sécurité et calme. Beaucoup racontent que c’était pour lui comme un jardin. Il en est sorti sain et sauf.', 'Yā nāru kūnī bardan wa salāman ʿalā Ibrāhīm', 'Ô feu, sois fraîcheur et paix pour Ibrahim !'],
        },
        lesson: 'Ibrahim a dit la vérité avec courage et gentillesse. Il faisait entièrement confiance à Allah – et Allah a changé le feu en paix.',
        q: ['Qu’a dit Allah au feu ?', '« Sois fraîcheur et paix pour Ibrahim ! »', '« Brûle encore plus fort ! »', '« Va-t’en ailleurs ! »'],
      },
      musa: {
        name: 'Moussa dans le petit panier', sub: 'Allah protège',
        s: {
          home: ['Une maman courageuse', 'En Égypte régnait Pharaon. Il était injuste et ne voulait pas que les petits garçons des enfants d’Israël grandissent. La maman de Moussa, que la paix soit sur lui, avait très peur pour son bébé. Alors Allah lui a inspiré : si tu as peur pour lui, mets-le dans le fleuve.'],
          basket: ['Sur l’eau', 'Elle a couché Moussa dans un petit panier et l’a posé doucement sur le Nil. Allah l’a consolée : n’aie pas peur et ne sois pas triste. Nous te le rendrons.', 'Wa lā takhāfī wa lā taḥzanī, innā rāddūhu ilayki', 'N’aie pas peur et ne sois pas triste – Nous te le rendrons.'],
          float: ['Le fleuve le porte', 'Le petit panier a descendu le grand fleuve. La sœur de Moussa a suivi en cachette le long de la rive pour voir où il allait. Le fleuve a porté le bébé exactement là où Allah le voulait.'],
          palace: ['Au palais', 'Le petit panier est arrivé au palais de Pharaon. Sa femme Asiya a trouvé le bébé et l’a aimé tout de suite. Ne le tuez pas, a-t-elle dit, peut-être qu’il nous apportera de la joie. Mais le bébé ne voulait boire le lait d’aucune nourrice.'],
          back: ['De retour chez sa maman', 'Alors sa sœur a dit : je connais une famille qui prendra bien soin de lui. C’est ainsi que Moussa est revenu chez sa propre maman. Elle était heureuse et elle savait : la promesse d’Allah est vraie.'],
        },
        lesson: 'La maman de Moussa avait peur – et pourtant elle a fait confiance à Allah. Allah a tenu Sa promesse et lui a rendu son bébé.',
        q: ['Qu’est-ce qu’Allah a promis à la maman de Moussa ?', 'Qu’elle retrouverait son bébé', 'Que le fleuve s’arrêterait', 'Qu’elle recevrait un palais'],
      },
      yunus: {
        name: 'Younous et la baleine', sub: 'Ne jamais abandonner – Allah t’entend partout',
        s: {
          ship: ['Younous s’en va', 'Le prophète Younous, que la paix soit sur lui, vivait dans la ville de Ninive. Longtemps, il a appelé les gens au bien, mais ils ne l’écoutaient pas. Triste, il est parti sans attendre la permission d’Allah, et il est monté sur un bateau.'],
          storm: ['La tempête', 'En mer, une forte tempête s’est levée. Le bateau était très chargé et tanguait dangereusement. Les marins ont tiré au sort pour savoir qui devait quitter le bateau – et le sort est tombé sur Younous.'],
          whale: ['La grande baleine', 'Younous s’est retrouvé dans la mer. Alors Allah a envoyé une énorme baleine qui l’a avalé – mais sans lui faire de mal. La baleine ne devait pas le manger, mais le protéger.'],
          dark: ['Dans l’obscurité', 'Dans le ventre de la baleine, au fond de la mer et en pleine nuit, il faisait tout noir. Younous s’est repenti et a prié : il n’y a de dieu que Toi, gloire à Toi. J’ai mal agi. Allah l’a entendu – même là-bas.', 'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn', 'Il n’y a de dieu que Toi, gloire à Toi – j’ai été injuste.'],
          shore: ['Sur la plage', 'Allah a sauvé Younous. La baleine l’a déposé sur une plage. Younous était faible, mais Allah a fait pousser une plante de courge aux grandes feuilles qui lui donnait de l’ombre. Plus tard, il est retourné auprès de son peuple – et cette fois, ils ont cru.'],
        },
        lesson: 'Même quand tout semble sombre : Allah entend chaque prière, partout. Celui qui fait une erreur peut demander pardon et recommencer.',
        q: ['Où Allah a-t-Il entendu la prière de Younous ?', 'Même dans le ventre de la baleine – partout', 'Seulement à la mosquée', 'Seulement pendant la journée'],
      },
      suleyman: {
        name: 'Soulayman et la fourmi', sub: 'Le respect de toutes les créatures',
        s: {
          gift: ['Un cadeau spécial', 'Allah a offert au prophète Soulayman, que la paix soit sur lui, la sagesse et un grand royaume. Il comprenait même la langue des oiseaux et des animaux. Un jour, il traversait le pays avec sa grande armée.'],
          ant: ['La petite fourmi', 'Maintenant, tu es tout petit ! Ils sont arrivés dans une vallée pleine de fourmis. Une petite fourmi a crié : Ô fourmis, entrez dans vos demeures, pour que Soulayman et son armée ne vous écrasent pas sans s’en rendre compte ! Elle prenait soin de toutes les autres.', 'Yā ayyuha n-namlu dkhulū masākinakum', 'Ô fourmis, entrez dans vos demeures !'],
          smile: ['Soulayman sourit', 'Soulayman a entendu la petite fourmi. Il a souri et a arrêté son armée pour qu’il n’arrive rien à aucune fourmi. Puis il a remercié Allah : mon Seigneur, aide-moi à être reconnaissant pour Tes bienfaits et à faire le bien qui Te plaît.', 'Rabbi awziʿnī an ashkura niʿmataka', 'Mon Seigneur, aide-moi à être reconnaissant pour Tes bienfaits.'],
        },
        lesson: 'Soulayman était un roi puissant – et pourtant il faisait attention à la plus petite fourmi. Une bonne personne est douce envers toutes les créatures et reconnaissante.',
        q: ['Qu’a fait Soulayman quand il a entendu la fourmi ?', 'Il a souri, s’est arrêté et a remercié Allah', 'Il a continué son chemin', 'Il s’est mis en colère'],
      },
      hijra: {
        name: 'La grotte, l’araignée et la colombe', sub: 'Allah est avec nous – l’Hégire',
        s: {
          night: ['Départ dans la nuit', 'Notre Prophète Muhammad, paix et bénédictions sur lui, invitait les gens de La Mecque au bien. Mais certains voulaient lui faire du mal. Allah lui a permis de partir pour Médine. Dans la nuit, il s’est mis en route avec son meilleur ami, Abou Bakr.'],
          cave: ['La grotte de Thawr', 'Tous les deux se sont cachés dans une grotte sur le mont Thawr. Ils y sont restés trois jours. Dehors, des hommes de La Mecque les cherchaient partout.'],
          web: ['L’araignée et la colombe', 'Voici ce qui est rapporté : une araignée a tissé une toile devant l’entrée de la grotte, et une colombe y a construit son nid et pondu des œufs. Regarde comme la toile grandit, fil après fil. De petits animaux ont aidé – comme Allah le voulait.'],
          search: ['Allah est avec nous', 'Les poursuivants sont arrivés tout près. Abou Bakr a chuchoté, inquiet : si l’un d’eux regarde vers le bas, il nous verra. Le Prophète a dit calmement : ne sois pas triste, Allah est avec nous. Les hommes ont vu la toile et le nid – et sont repartis.', 'Lā taḥzan innallāha maʿanā', 'Ne sois pas triste, Allah est avec nous.'],
          medina: ['Arrivée à Médine', 'Après un long voyage, ils sont arrivés à Médine. Les gens étaient très heureux, et on raconte que les enfants chantaient pour les accueillir : la pleine lune s’est levée sur nous. À Médine, les gens sont devenus comme des frères et sœurs et ont partagé entre eux.', 'Ṭalaʿa l-badru ʿalaynā', 'La pleine lune s’est levée sur nous.'],
        },
        lesson: 'Même dans les moments difficiles, le Prophète est resté calme et a fait confiance à Allah. Allah protège qui Il veut – même avec une toile d’araignée.',
        q: ['Qu’a dit le Prophète à Abou Bakr dans la grotte ?', '« Ne sois pas triste, Allah est avec nous. »', '« Cours vite ! »', '« Nous sommes perdus. »'],
      },
    },
  },
  sky: {
    menu: '✨ Ciel étoilé', title: 'Mon ciel étoilé', count: (a, b) => `${a} étoile${a > 1 ? 's' : ''} sur ${b} brille${a > 1 ? 'nt' : ''}`,
    lookUp: 'Regarde en haut : chaque prière, chaque sourate et chaque histoire que tu as apprise brille comme une étoile.',
    lookUpMobile: 'Là-haut dans le ciel brillent tes étoiles : chaque prière, chaque sourate et chaque histoire que tu as apprise.',
    prayers: 'Prières', suras: 'Sourates', stories: 'Histoires', badges: 'Badges', days: 'Jours avec les 5 prières',
    next: 'Ta prochaine étoile :', allDone: 'Toutes les étoiles brillent – Masha’Allah !',
  },
};
