// Note: Per Stage 1 specs, only greeting, language names, and core welcome strings are localized. The rest of the UI remains in English.

import { IndianLanguage } from '@/types/firestore';

export interface SupportedLanguage {
  code: IndianLanguage;
  label: string;
  nativeLabel: string;
  script: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', script: 'Latin' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', script: 'Devanagari' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', script: 'Devanagari' },
];

export function getGreeting(lang: string = 'en', name: string = 'Aarav & Diya'): string {
  switch (lang) {
    case 'hi':
      return `नमस्ते, ${name}!`;
    case 'gu':
      return `નમસ્તે, ${name}!`;
    case 'pa':
      return `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ, ${name}!`;
    case 'mr':
      return `नमस्कार, ${name}!`;
    case 'en':
    default:
      return `Namaste, ${name}!`;
  }
}

export function getWelcomeTagline(lang: string = 'en'): string {
  switch (lang) {
    case 'hi':
      return 'भारतीय परिवारों के लिए सुंदर, व्यवस्थित और खुशहाल शादी की योजना।';
    case 'gu':
      return 'ભારતીય પરિવારો માટે સુંદર, વ્યવસ્થિત અને આનંદદાયક લગ્નનું આયોજન.';
    case 'pa':
      return 'ਭਾਰਤੀ ਪਰਿਵਾਰਾਂ ਲਈ ਸੁੰਦਰ, ਸੁਚੱਜੀ ਅਤੇ ਖ਼ੁਸ਼ਹਾਲ ਵਿਆਹ ਦੀ ਯੋਜਨਾ।';
    case 'mr':
      return 'भारतीय कुटुंबांसाठी सुंदर, परिपूर्ण आणि आनंददायी लग्न नियोजन.';
    case 'en':
    default:
      return 'Your intelligent wedding planning companion for timeless Indian celebrations.';
  }
}

export function getLanguageName(code: string): string {
  const match = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  if (!match) return code;
  if (match.code === 'en') return 'English';
  return `${match.nativeLabel} (${match.label})`;
}
