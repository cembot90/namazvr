// Geschichten der Propheten (Deutsch) und Sternenhimmel.
// Schritt: [Titel, Erzählung, Umschrift des Verses, Bedeutung]. Frage q: [Frage, richtige Antwort, andere, andere].
export default {
  story: {
    menu: '📖 Geschichten', title: 'Geschichten der Propheten', sub: 'zum Mitreisen – für Kinder und Familien',
    intro: [
      'Reise mit an die Orte: zur Arche, ans Feuer, an den Nil, aufs Meer, ins Tal der Ameisen und zur Höhle.',
      'Aus Respekt werden die Propheten nicht gezeigt – du siehst die Orte und hörst die Geschichte. Sie folgt dem Koran (Sure:Vers steht dabei) und, wo angegeben, der Überlieferung.',
    ],
    soundsSub: 'Wind, Regen, Wellen, Grillen – im Browser erzeugt',
    quran: (ref) => `Koran ${ref}`, told: 'nach der Überlieferung',
    done: 'Was lernen wir?', listen: '🔊 Vorlesen', more: '📖 Weitere', right: 'Richtig! Masha’Allah.',
    rightStar: (n) => `Richtig! Masha’Allah – ein neuer Stern leuchtet an deinem Himmel (${n} ⭐).`,
    wrong: 'Fast! Schau noch einmal auf die grüne Antwort.',
    list: {
      nuh: {
        name: 'Nuh und die Arche', sub: 'Geduld und Vertrauen',
        s: {
          build: ['Nuh baut ein Schiff', 'Vor sehr langer Zeit lebte der Prophet Nuh, Friede sei mit ihm. Viele, viele Jahre bat er die Menschen freundlich: Seid gut zueinander und betet zu Allah allein. Doch die meisten lachten ihn aus. Da sagte Allah zu Nuh: Baue ein großes Schiff. Und Nuh baute – mitten auf dem trockenen Land.'],
          animals: ['Die Tiere kommen', 'Als das Schiff fertig war, kamen die Tiere: von jeder Art ein Paar. Elefanten, Löwen, Giraffen, Kamele, Schafe und Pferde gingen an Bord. Auch die Familie von Nuh und alle, die an Allah glaubten, stiegen ein. Allah hatte an alle gedacht – an die Menschen und an die Tiere.'],
          rain: ['Der große Regen', 'Dann öffnete sich der Himmel, und es regnete und regnete. Aus der Erde sprudelte Wasser. Das Schiff hob sich vom Boden und begann zu schwimmen. Nuh sprach: Im Namen Allahs fährt es und legt es an.', 'Bismillāhi majrāhā wa mursāhā', 'Im Namen Allahs fährt es und legt es an.'],
          sea: ['Auf den Wellen', 'Überall war Wasser, und die Wellen waren hoch wie Berge. Doch im Schiff waren alle sicher. Nuh hatte keine Angst, denn er vertraute auf Allah. Wer geduldig ist und auf Allah vertraut, ist nie allein.'],
          cudi: ['Das Schiff landet', 'Endlich hörte der Regen auf, und das Wasser ging zurück. Das Schiff blieb sanft auf dem Berg Cudi stehen. Die Sonne kam heraus, die Vögel flogen. Allah sagte zu Nuh: Steig aus in Frieden und mit Segen. Menschen und Tiere stiegen aus und begannen ein neues Leben.'],
        },
        lesson: 'Nuh war viele Jahre geduldig und freundlich, auch als andere über ihn lachten. Er vertraute auf Allah – und Allah rettete ihn, seine Familie, die Gläubigen und die Tiere.',
        q: ['Was hat Nuh geholfen, als alle lachten?', 'Geduld und Vertrauen auf Allah', 'Er hat zurückgelacht', 'Er hat aufgegeben'],
      },
      ibrahim: {
        name: 'Ibrahim und das Feuer', sub: 'Mut, Wahrheit und Frieden',
        s: {
          sky: ['Ibrahim sucht seinen Schöpfer', 'Ibrahim, Friede sei mit ihm, schaute nachts in den Himmel. Er sah einen hellen Stern, dann den Mond und am Morgen die Sonne. Doch alle gingen wieder unter. Da wusste er: Mein Herr ist Allah, der den Himmel und die Erde erschaffen hat. Er geht niemals unter.'],
          wood: ['Ibrahim sagt die Wahrheit', 'Die Menschen in seiner Stadt beteten Statuen aus Stein und Holz an. Ibrahim sagte ihnen ruhig: Sie können euch weder hören noch helfen. Das machte die Mächtigen sehr wütend. Sie sammelten viel, viel Holz für ein riesiges Feuer.'],
          fire: ['Das große Feuer', 'Das Feuer war so heiß, dass niemand in seine Nähe kommen konnte. Sie warfen Ibrahim hinein. Doch Ibrahim hatte keine Angst. Er sagte: Allah genügt mir, und Er ist der beste Beschützer.', 'Ḥasbiyallāhu wa niʿma l-wakīl', 'Allah genügt mir, und Er ist der beste Beschützer.'],
          garden: ['Kühl und Frieden', 'Da sprach Allah: O Feuer, sei kühl und Frieden für Ibrahim! Und das Feuer verbrannte ihn nicht. Ibrahim war sicher und ruhig. Viele erzählen, es war für ihn wie ein Garten. Er kam heil heraus.', 'Yā nāru kūnī bardan wa salāman ʿalā Ibrāhīm', 'O Feuer, sei kühl und Frieden für Ibrahim!'],
        },
        lesson: 'Ibrahim sagte mutig und freundlich die Wahrheit. Er vertraute ganz auf Allah – und Allah machte das Feuer zu Frieden.',
        q: ['Was sagte Allah zum Feuer?', '„Sei kühl und Frieden für Ibrahim!“', '„Brenne noch heißer!“', '„Wandere weiter!“'],
      },
      musa: {
        name: 'Musa im Körbchen', sub: 'Allah beschützt',
        s: {
          home: ['Eine mutige Mutter', 'In Ägypten herrschte der Pharao. Er war ungerecht und wollte nicht, dass die kleinen Jungen der Kinder Israels aufwachsen. Die Mutter von Musa, Friede sei mit ihm, hatte große Angst um ihr Baby. Da gab Allah ihr ein: Wenn du um ihn fürchtest, lege ihn in den Fluss.'],
          basket: ['Ab ins Wasser', 'Sie legte Musa in ein Körbchen und setzte es sanft auf den Nil. Allah tröstete sie: Fürchte dich nicht und sei nicht traurig. Wir bringen ihn dir zurück.', 'Wa lā takhāfī wa lā taḥzanī, innā rāddūhu ilayki', 'Fürchte dich nicht und sei nicht traurig – Wir bringen ihn dir zurück.'],
          float: ['Der Fluss trägt ihn', 'Das Körbchen schwamm den großen Fluss hinunter. Die Schwester von Musa lief heimlich am Ufer mit und schaute, wohin es treibt. Der Fluss brachte das Baby genau dorthin, wohin Allah es wollte.'],
          palace: ['Im Palast', 'Das Körbchen kam zum Palast des Pharao. Seine Frau Asiya fand das Baby und hatte es sofort lieb. Tötet ihn nicht, sagte sie, vielleicht wird er uns eine Freude sein. Doch das Baby wollte von keiner Amme trinken.'],
          back: ['Zurück bei der Mutter', 'Da sagte seine Schwester: Ich kenne eine Familie, die gut für ihn sorgen wird. So kam Musa zurück zu seiner eigenen Mutter. Sie war glücklich und wusste: Allahs Versprechen ist wahr.'],
        },
        lesson: 'Die Mutter von Musa hatte Angst – und vertraute trotzdem auf Allah. Allah hielt Sein Versprechen und brachte ihr das Baby zurück.',
        q: ['Was versprach Allah der Mutter von Musa?', 'Dass sie ihr Baby zurückbekommt', 'Dass der Fluss stehen bleibt', 'Dass sie einen Palast bekommt'],
      },
      yunus: {
        name: 'Yunus und der Wal', sub: 'Nie aufgeben – Allah hört dich überall',
        s: {
          ship: ['Yunus geht fort', 'Der Prophet Yunus, Friede sei mit ihm, lebte in der Stadt Ninive. Lange rief er die Menschen zum Guten, doch sie hörten nicht auf ihn. Traurig ging er fort, ohne auf Allahs Erlaubnis zu warten, und stieg auf ein Schiff.'],
          storm: ['Der Sturm', 'Auf dem Meer kam ein starker Sturm. Das Schiff war schwer beladen und schaukelte gefährlich. Die Seeleute losten, wer das Schiff verlassen muss – und das Los fiel auf Yunus.'],
          whale: ['Der große Wal', 'Yunus kam ins Meer. Da schickte Allah einen riesigen Wal, der ihn verschluckte – aber ohne ihm wehzutun. Der Wal sollte ihn nicht fressen, sondern beschützen.'],
          dark: ['In der Dunkelheit', 'Im Bauch des Wals, tief im Meer und mitten in der Nacht, war es ganz dunkel. Yunus bereute und betete: Es gibt keinen Gott außer Dir, gepriesen seist Du. Ich habe falsch gehandelt. Allah hörte ihn – sogar dort.', 'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn', 'Es gibt keinen Gott außer Dir, gepriesen seist Du – ich habe Unrecht getan.'],
          shore: ['Am Strand', 'Allah rettete Yunus. Der Wal brachte ihn an einen Strand. Yunus war schwach, doch Allah ließ eine Kürbispflanze mit großen Blättern wachsen, die ihm Schatten gab. Später ging er zurück zu seinem Volk – und diesmal glaubten sie.'],
        },
        lesson: 'Auch wenn alles dunkel scheint: Allah hört jedes Gebet, überall. Wer einen Fehler macht, darf um Verzeihung bitten und neu anfangen.',
        q: ['Wo hat Allah das Gebet von Yunus gehört?', 'Sogar im Bauch des Wals – überall', 'Nur in der Moschee', 'Nur am Tag'],
      },
      suleyman: {
        name: 'Süleyman und die Ameise', sub: 'Respekt vor allen Geschöpfen',
        s: {
          gift: ['Ein besonderes Geschenk', 'Allah schenkte dem Propheten Süleyman, Friede sei mit ihm, Weisheit und ein großes Reich. Er verstand sogar die Sprache der Vögel und der Tiere. Eines Tages zog er mit seinem großen Heer durch das Land.'],
          ant: ['Die kleine Ameise', 'Du bist jetzt ganz klein! Sie kamen zu einem Tal voller Ameisen. Eine kleine Ameise rief: Ihr Ameisen, geht in eure Wohnungen, damit Süleyman und sein Heer euch nicht zertreten, ohne es zu merken! Sie kümmerte sich um alle anderen.', 'Yā ayyuha n-namlu dkhulū masākinakum', 'Ihr Ameisen, geht in eure Wohnungen!'],
          smile: ['Süleyman lächelt', 'Süleyman hörte die kleine Ameise. Er lächelte und hielt sein Heer an, damit keiner Ameise etwas passiert. Dann dankte er Allah: Mein Herr, hilf mir, dankbar zu sein für Deine Gaben und Gutes zu tun, das Dir gefällt.', 'Rabbi awziʿnī an ashkura niʿmataka', 'Mein Herr, hilf mir, für Deine Gaben dankbar zu sein.'],
        },
        lesson: 'Süleyman war ein mächtiger König – und trotzdem achtete er auf die kleinste Ameise. Ein guter Mensch ist sanft zu allen Geschöpfen und dankbar.',
        q: ['Was tat Süleyman, als er die Ameise hörte?', 'Er lächelte, hielt an und dankte Allah', 'Er ging einfach weiter', 'Er wurde wütend'],
      },
      hijra: {
        name: 'Die Höhle, die Spinne und die Taube', sub: 'Allah ist mit uns – die Hidschra',
        s: {
          night: ['Aufbruch in der Nacht', 'Unser Prophet Muhammad, Friede und Segen seien auf ihm, lud die Menschen in Mekka zum Guten ein. Doch einige wollten ihm schaden. Allah erlaubte ihm, nach Medina zu gehen. In der Nacht brach er mit seinem besten Freund Abu Bakr auf.'],
          cave: ['Die Höhle Thawr', 'Die beiden versteckten sich in einer Höhle auf dem Berg Thawr. Drei Tage blieben sie dort. Draußen suchten Männer aus Mekka überall nach ihnen.'],
          web: ['Die Spinne und die Taube', 'So wird überliefert: Eine Spinne webte ein Netz über den Eingang der Höhle, und eine Taube baute dort ihr Nest und legte Eier. Schau, wie das Netz Faden für Faden wächst. Kleine Tiere halfen – so, wie Allah es wollte.'],
          search: ['Allah ist mit uns', 'Die Verfolger kamen ganz nah. Abu Bakr flüsterte besorgt: Wenn einer nach unten schaut, sieht er uns. Der Prophet sagte ruhig: Sei nicht traurig, Allah ist mit uns. Die Männer sahen das Netz und das Nest – und gingen wieder.', 'Lā taḥzan innallāha maʿanā', 'Sei nicht traurig, Allah ist mit uns.'],
          medina: ['Ankunft in Medina', 'Nach einer langen Reise kamen sie in Medina an. Die Menschen freuten sich sehr, und man erzählt, dass die Kinder zur Begrüßung sangen: Der Vollmond ist über uns aufgegangen. In Medina wurden die Menschen Geschwister und teilten miteinander.', 'Ṭalaʿa l-badru ʿalaynā', 'Der Vollmond ist über uns aufgegangen.'],
        },
        lesson: 'Auch in schweren Momenten blieb der Prophet ruhig und vertraute auf Allah. Allah beschützt, wen Er will – sogar mit einem Spinnennetz.',
        q: ['Was sagte der Prophet in der Höhle zu Abu Bakr?', '„Sei nicht traurig, Allah ist mit uns.“', '„Lauf schnell weg!“', '„Wir sind verloren.“'],
      },
    },
  },
  sky: {
    menu: '✨ Sternenhimmel', title: 'Mein Sternenhimmel', count: (a, b) => `${a} von ${b} Sternen leuchten`,
    lookUp: 'Schau nach oben: Jedes Gebet, jede Sure und jede Geschichte, die du gelernt hast, leuchtet als Stern.',
    lookUpMobile: 'Oben am Himmel leuchten deine Sterne: Jedes Gebet, jede Sure und jede Geschichte, die du gelernt hast.',
    prayers: 'Gebete', suras: 'Suren', stories: 'Geschichten', badges: 'Abzeichen', days: 'Tage mit allen 5 Gebeten',
    next: 'Dein nächster Stern:', allDone: 'Alle Sterne leuchten – Masha’Allah!',
  },
};
