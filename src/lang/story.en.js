// Stories of the prophets (English) and the star sky.
export default {
  story: {
    menu: '📖 Stories', title: 'Stories of the Prophets', sub: 'travel along – for children and families',
    intro: [
      'Visit the places: the ark, the fire, the Nile, the sea, the valley of the ants and the cave.',
      'Out of respect the prophets are not shown – you see the places and hear the story. It follows the Qur’an (sura:verse is shown) and, where noted, the tradition.',
    ],
    soundsSub: 'wind, rain, waves, crickets – made in the browser',
    quran: (ref) => `Qur’an ${ref}`, told: 'according to tradition',
    done: 'What do we learn?', listen: '🔊 Read aloud', more: '📖 More', right: 'Correct! Masha’Allah.',
    rightStar: (n) => `Correct! Masha’Allah – a new star shines in your sky (${n} ⭐).`,
    wrong: 'Almost! Take another look at the green answer.',
    list: {
      nuh: {
        name: 'Nuh and the Ark', sub: 'Patience and trust',
        s: {
          build: ['Nuh builds a ship', 'A very long time ago lived the Prophet Nuh (Noah), peace be upon him. For many, many years he kindly asked the people: Be good to one another and worship Allah alone. But most of them laughed at him. Then Allah said to Nuh: Build a big ship. And Nuh built it – right in the middle of dry land.'],
          animals: ['The animals arrive', 'When the ship was ready, the animals came: a pair of every kind. Elephants, lions, giraffes, camels, sheep and horses went on board. Nuh’s family and everyone who believed in Allah came too. Allah had thought of everyone – people and animals.'],
          rain: ['The great rain', 'Then the sky opened, and it rained and rained. Water gushed from the earth. The ship rose from the ground and began to float. Nuh said: In the name of Allah it sails and it anchors.', 'Bismillāhi majrāhā wa mursāhā', 'In the name of Allah it sails and it anchors.'],
          sea: ['On the waves', 'There was water everywhere, and the waves were as high as mountains. But inside the ship everyone was safe. Nuh was not afraid, because he trusted Allah. Whoever is patient and trusts Allah is never alone.'],
          cudi: ['The ship comes to rest', 'At last the rain stopped and the water went down. The ship settled gently on Mount Judi. The sun came out and the birds flew. Allah said to Nuh: Go down in peace and with blessings. People and animals stepped out and began a new life.'],
        },
        lesson: 'Nuh stayed patient and kind for many years, even when others laughed at him. He trusted Allah – and Allah saved him, his family, the believers and the animals.',
        q: ['What helped Nuh when everyone laughed?', 'Patience and trust in Allah', 'He laughed back', 'He gave up'],
      },
      ibrahim: {
        name: 'Ibrahim and the Fire', sub: 'Courage, truth and peace',
        s: {
          sky: ['Ibrahim looks for his Creator', 'Ibrahim (Abraham), peace be upon him, looked up at the night sky. He saw a bright star, then the moon, and in the morning the sun. But they all set again. Then he knew: My Lord is Allah, who created the heavens and the earth. He never sets.'],
          wood: ['Ibrahim tells the truth', 'The people in his town worshipped statues of stone and wood. Ibrahim told them calmly: They can neither hear you nor help you. This made the powerful very angry. They gathered lots and lots of wood for a huge fire.'],
          fire: ['The great fire', 'The fire was so hot that nobody could come near it. They threw Ibrahim into it. But Ibrahim was not afraid. He said: Allah is enough for me, and He is the best protector.', 'Ḥasbiyallāhu wa niʿma l-wakīl', 'Allah is enough for me, and He is the best protector.'],
          garden: ['Cool and peaceful', 'Then Allah said: O fire, be cool and peaceful for Ibrahim! And the fire did not burn him. Ibrahim was safe and calm. Many tell that it was like a garden for him. He came out unharmed.', 'Yā nāru kūnī bardan wa salāman ʿalā Ibrāhīm', 'O fire, be cool and peaceful for Ibrahim!'],
        },
        lesson: 'Ibrahim spoke the truth bravely and kindly. He trusted Allah completely – and Allah turned the fire into peace.',
        q: ['What did Allah say to the fire?', '“Be cool and peaceful for Ibrahim!”', '“Burn even hotter!”', '“Move somewhere else!”'],
      },
      musa: {
        name: 'Musa in the Basket', sub: 'Allah protects',
        s: {
          home: ['A brave mother', 'In Egypt the Pharaoh ruled. He was unjust and did not want the little boys of the Children of Israel to grow up. The mother of Musa (Moses), peace be upon him, was very afraid for her baby. Then Allah inspired her: If you fear for him, place him in the river.'],
          basket: ['Into the water', 'She laid Musa in a basket and gently set it on the Nile. Allah comforted her: Do not fear and do not grieve. We will bring him back to you.', 'Wa lā takhāfī wa lā taḥzanī, innā rāddūhu ilayki', 'Do not fear and do not grieve – We will bring him back to you.'],
          float: ['The river carries him', 'The basket floated down the great river. Musa’s sister secretly walked along the bank and watched where it went. The river carried the baby exactly where Allah wanted.'],
          palace: ['In the palace', 'The basket reached the Pharaoh’s palace. His wife Asiya found the baby and loved him at once. Do not kill him, she said, perhaps he will be a joy for us. But the baby would not drink from any nurse.'],
          back: ['Back with his mother', 'Then his sister said: I know a family who will take good care of him. So Musa came back to his own mother. She was happy and knew: Allah’s promise is true.'],
        },
        lesson: 'Musa’s mother was afraid – and still she trusted Allah. Allah kept His promise and brought the baby back to her.',
        q: ['What did Allah promise Musa’s mother?', 'That she would get her baby back', 'That the river would stop', 'That she would get a palace'],
      },
      yunus: {
        name: 'Yunus and the Whale', sub: 'Never give up – Allah hears you everywhere',
        s: {
          ship: ['Yunus leaves', 'The Prophet Yunus (Jonah), peace be upon him, lived in the city of Nineveh. For a long time he called the people to goodness, but they did not listen. Sad, he left without waiting for Allah’s permission and boarded a ship.'],
          storm: ['The storm', 'At sea a strong storm came. The ship was heavily loaded and rocked dangerously. The sailors drew lots to decide who must leave the ship – and the lot fell on Yunus.'],
          whale: ['The great whale', 'Yunus went into the sea. Then Allah sent a huge whale that swallowed him – but without hurting him. The whale was not there to eat him, but to protect him.'],
          dark: ['In the darkness', 'In the belly of the whale, deep in the sea and in the middle of the night, it was completely dark. Yunus was sorry and prayed: There is no god but You, glory be to You. I did wrong. Allah heard him – even there.', 'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn', 'There is no god but You, glory be to You – I have done wrong.'],
          shore: ['On the beach', 'Allah saved Yunus. The whale brought him to a beach. Yunus was weak, but Allah made a gourd plant with large leaves grow to give him shade. Later he went back to his people – and this time they believed.'],
        },
        lesson: 'Even when everything seems dark: Allah hears every prayer, everywhere. Whoever makes a mistake may ask for forgiveness and start again.',
        q: ['Where did Allah hear the prayer of Yunus?', 'Even in the belly of the whale – everywhere', 'Only in the mosque', 'Only during the day'],
      },
      suleyman: {
        name: 'Sulayman and the Ant', sub: 'Respect for all creatures',
        s: {
          gift: ['A special gift', 'Allah gave the Prophet Sulayman (Solomon), peace be upon him, wisdom and a great kingdom. He even understood the language of birds and animals. One day he travelled through the land with his great army.'],
          ant: ['The little ant', 'Now you are very small! They came to a valley full of ants. A little ant called out: O ants, go into your homes, so that Sulayman and his army do not crush you without noticing! She cared for all the others.', 'Yā ayyuha n-namlu dkhulū masākinakum', 'O ants, go into your homes!'],
          smile: ['Sulayman smiles', 'Sulayman heard the little ant. He smiled and stopped his army so that no ant would be harmed. Then he thanked Allah: My Lord, help me to be grateful for Your gifts and to do good that pleases You.', 'Rabbi awziʿnī an ashkura niʿmataka', 'My Lord, help me to be grateful for Your gifts.'],
        },
        lesson: 'Sulayman was a mighty king – and still he cared about the smallest ant. A good person is gentle with all creatures and grateful.',
        q: ['What did Sulayman do when he heard the ant?', 'He smiled, stopped and thanked Allah', 'He just kept going', 'He got angry'],
      },
      hijra: {
        name: 'The Cave, the Spider and the Dove', sub: 'Allah is with us – the Hijra',
        s: {
          night: ['Setting out at night', 'Our Prophet Muhammad, peace and blessings be upon him, invited the people of Mecca to goodness. But some wanted to harm him. Allah allowed him to go to Medina. At night he set out with his best friend Abu Bakr.'],
          cave: ['The cave of Thawr', 'The two hid in a cave on Mount Thawr. They stayed there for three days. Outside, men from Mecca were searching everywhere for them.'],
          web: ['The spider and the dove', 'It is told that a spider spun a web across the entrance of the cave, and a dove built its nest there and laid eggs. Watch how the web grows thread by thread. Small creatures helped – just as Allah willed.'],
          search: ['Allah is with us', 'The pursuers came very close. Abu Bakr whispered worriedly: If one of them looks down, he will see us. The Prophet said calmly: Do not be sad, Allah is with us. The men saw the web and the nest – and went away.', 'Lā taḥzan innallāha maʿanā', 'Do not be sad, Allah is with us.'],
          medina: ['Arriving in Medina', 'After a long journey they reached Medina. The people were overjoyed, and it is told that the children sang in welcome: The full moon has risen over us. In Medina people became brothers and sisters and shared with one another.', 'Ṭalaʿa l-badru ʿalaynā', 'The full moon has risen over us.'],
        },
        lesson: 'Even in hard moments the Prophet stayed calm and trusted Allah. Allah protects whom He wills – even with a spider’s web.',
        q: ['What did the Prophet say to Abu Bakr in the cave?', '“Do not be sad, Allah is with us.”', '“Run away quickly!”', '“We are lost.”'],
      },
    },
  },
  sky: {
    menu: '✨ Star sky', title: 'My star sky', count: (a, b) => `${a} of ${b} stars are shining`,
    lookUp: 'Look up: every prayer, every sura and every story you have learned shines as a star.',
    lookUpMobile: 'Your stars shine in the sky above: every prayer, sura and story you have learned.',
    prayers: 'Prayers', suras: 'Suras', stories: 'Stories', badges: 'Badges', days: 'Days with all 5 prayers',
    next: 'Your next star:', allDone: 'All stars are shining – Masha’Allah!',
  },
};
