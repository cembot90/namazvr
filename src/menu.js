// Hauptmenü: Einträge in vier Gruppen mit Symbol – gemeinsam für die VR-Tafel und die Handy-Ansicht.
import { t } from './i18n.js';

// Führende Symbole aus vorhandenen Beschriftungen entfernen (das Symbol steht in der Kachel getrennt)
const plain = (s) => String(s).replace(/^[^\p{L}\p{N}]+/u, '').trim();

// Höchstens 6 Kacheln je Gruppe – seltener Genutztes liegt eine Ebene tiefer (hubItems, Unterseite „Weitere Gebete“)
export function menuGroups(v, { mobile = false } = {}) {
  const item = (icon, label, action, opt = {}) => ({ icon, label: plain(label), action, ...opt });
  return [
    { label: t('ui.grp.pray'), items: [
      item('🌱', t('path.menu'), 'path', { primary: !!v.beginner }),
      item('🕐', t('ui.menuTimes'), 'times'),
      item('💧', t('pure.menu'), 'purify', { primary: !v.wuduDone && !v.beginner }),
      item('🤲', t('ui.menuMore'), 'hub:prayers', { active: !!v.adapted }),
      item('🧭', mobile ? t('ui.menuQiblaMobile') : t('ui.menuQibla'), 'qibla'),
    ] },
    { label: t('ui.grp.learn'), items: [
      item('📖', t('ui.menuSuras'), 'suras'),
      item('🔤', t('elif.menu'), 'elif'),
      item('✨', t('esma.menu'), 'esma'),
      item('📚', t('story.menu'), 'stories'),
      item('🎓', t('ui.menuLearn'), 'learn'),
      item('🕊️', t('ui.menuPeace'), 'peace'),
    ] },
    { label: t('ui.grp.explore'), items: [
      item('⭐', t('holy.menu'), 'holy', { active: new Date().getDay() === 5 }),
      item('🌙', t('ram.menu'), 'ramadan'),
      item('🕋', t('hajj.menu'), 'pilgrim'),
      item('💰', t('zakat.menu'), 'zakat'),
      item('🕯️', t('alevi.menu'), 'alevi'),
    ] },
    { label: t('ui.grp.me'), items: [
      item('✅', t('track.menu', v.tracked), 'tracker', { active: v.tracked === 5 }),
      ...(v.tasks ? [item('📝', t('hoca.tasks'), 'tasks', { primary: true })] : [item(v.profile.icon, v.profile.name, 'profiles')]),
      item('🧒', t('ui.kidsBtn', v.kids), 'kids', { active: v.kids }),
      item('👪', t('par.menu'), 'parents'),
      item('⚙️', t('ui.menuSettings'), 'settings'),
    ] },
  ];
}

// Unterseite „Weitere Gebete“: Sunnah & besondere Gebete, Nafile, Sitzen & Reise, Kaza, Moschee & Cemaat
export function hubItems(id, v = {}) {
  const item = (icon, label, action, sub = '', opt = {}) => ({ icon, label: plain(label), action, sub, ...opt });
  if (id === 'prayers') {
    return [
      item('🤲', t('ui.menuMore'), 'more', [t('pn.sfajr'), t('pn.witr'), t('pn.jumua'), t('pn.eid'), t('pn.janaza')].join(' · ')),
      item('🌠', t('nfl.menu'), 'nafile', [t('pn.tahajjud'), t('pn.duha'), t('pn.tasbihp')].join(' · ')),
      item('🪑', t('sit.menu'), 'adapt', t('sit.sub'), { active: !!v.adapted }),
      item('📒', t('kaza.menu'), 'kaza', t('kaza.sub')),
      item('🕌', t('ui.menuMosque'), 'mosque', t('ui.cemaat')),
    ];
  }
  return [];
}
