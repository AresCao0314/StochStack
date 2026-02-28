import en from '@/i18n/en';
import zh from '@/i18n/zh';
import de from '@/i18n/de';

export const locales = ['en', 'zh', 'de'] as const;
export type Locale = (typeof locales)[number];

export const localeMeta: Record<Locale, { label: string; flag: string }> = {
  en: { label: 'EN', flag: '🇺🇸' },
  zh: { label: '中文', flag: '🇨🇳' },
  de: { label: 'DE', flag: '🇩🇪' }
};

export const dictionaries = { en, zh, de } as const;

export type Dictionary = typeof en;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function t(locale: Locale) {
  return getDictionary(locale);
}
