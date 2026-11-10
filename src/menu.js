// Hauptmenü: Einträge in vier Gruppen mit Symbol – gemeinsam für die VR-Tafel und die Handy-Ansicht.
import { t } from './i18n.js';

// Führende Symbole aus vorhandenen Beschriftungen entfernen (das Symbol steht in der Kachel getrennt)
const plain = (s) => String(s).replace(/^[^\p{L}\p{N}]+/u, '').trim();

export function menuGroups(v, { mobile = false } = {}) {
  const item = (icon, label, action, opt = {}) => ({ icon, label: plain(label), action, ...opt });
  return [
    { label: t('ui.grp.pray'), items: [
      item('🕐', t('ui.menuTimes'), 'times'),
      item('💧', t('ui.menuWudu'), 'wudu', { primary: !v.wuduDone }),
      item('🧭', mobile ? t('ui.menuQiblaMobile') : t('ui.menuQibla'), 'qibla'),
      item('🤲', t('ui.menuMore'), 'more'),
      item('🕌', t('ui.menuMosque'), 'mosque'),
    ] },
    { label: t('ui.grp.learn'), items: [
      item('📖', t('ui.menuSuras'), 'suras'),
      item('📚', t('story.menu'), 'stories'),
      item('🎓', t('ui.menuLearn'), 'learn'),
      item('📿', t('ui.menuTasbih'), 'tasbih'),
      item('🕊️', t('ui.menuPeace'), 'peace'),
    ] },
    { label: t('ui.grp.explore'), items: [
      item('🕋', t('hajj.menu'), 'pilgrim'),
      item('🌙', t('ram.menu'), 'ramadan'),
      item('🕯️', t('alevi.menu'), 'alevi'),
      item('✨', t('sky.menu'), 'sky'),
    ] },
    { label: t('ui.grp.me'), items: [
      item('✅', t('track.menu', v.tracked), 'tracker', { active: v.tracked === 5 }),
      item(v.profile.icon, v.profile.name, 'profiles'),
      item('🧒', t('ui.kidsBtn', v.kids), 'kids', { active: v.kids }),
      item('⚙️', t('ui.menuSettings'), 'settings'),
    ] },
  ];
}
