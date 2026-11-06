// Spiritueller Modus: kurze Impulse zur inneren Bedeutung (Khushūʿ), frei formuliert
// in Anlehnung an die Gedanken al-Ghazālīs zu den inneren Dimensionen von Gebet und Waschung.
// Die Texte stehen in der Sprachdatei unter inner.*.
import { t } from './i18n.js';

export function innerMeaning(step) {
  if (step.hajj) return step.inner || '';
  if (step.key === 'shahada') return t('inner.shahada');
  if (step.wudu) return t(`inner.wudu.${step.wudu}`);
  return step.key ? t(`inner.${step.key}`) : '';
}

// Atem-Rhythmus für den Dhikr: Einatmen, dann beim Ausatmen den Dhikr sprechen.
export const BREATH = { inhale: 3, exhale: 3 };
