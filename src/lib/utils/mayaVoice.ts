/**
 * Speech synthesis utilities for Maya
 * - Detects script/language of Maya's response
 * - Selects preferred female voices asynchronously
 * - Prevents mispronouncing regional Indian languages with English voices
 */

export type IndianScriptLang = 'gu-IN' | 'hi-IN' | 'pa-IN' | 'mr-IN' | 'en-IN';

export interface VoiceSelectionResult {
  voice: SpeechSynthesisVoice | null;
  detectedLang: IndianScriptLang;
  hasMatchingVoice: boolean;
  unsupportedMessage?: string;
}

// Female voice name preferences per language
const FEMALE_VOICE_PREFERENCES: Record<IndianScriptLang, string[]> = {
  'en-IN': [
    'microsoft neerja',
    'microsoft heera',
    'google uk english female',
    'google us english',
    'female',
    'zira',
    'samantha',
    'victoria',
  ],
  'hi-IN': [
    'microsoft swara',
    'google हिन्दी',
    'lekha',
    'kalpana',
    'female',
  ],
  'gu-IN': [
    'microsoft dhwani',
    'google ગુજરાતી',
    'female',
  ],
  'mr-IN': [
    'microsoft aarohi',
    'google मराठी',
    'female',
  ],
  'pa-IN': [
    'microsoft vaani',
    'google ਪੰਜਾਬੀ',
    'female',
  ],
};

const LANG_DISPLAY_NAMES: Record<IndianScriptLang, string> = {
  'gu-IN': 'Gujarati',
  'hi-IN': 'Hindi',
  'pa-IN': 'Punjabi',
  'mr-IN': 'Marathi',
  'en-IN': 'English',
};

/**
 * Detect language based on Unicode script ranges first, falling back to user setting
 */
export function detectTextScriptLang(text: string, fallbackLang: string = 'en'): IndianScriptLang {
  if (!text) return 'en-IN';

  // Unicode character counts
  let gujaratiCount = 0; // \u0A80-\u0AFF
  let devanagariCount = 0; // \u0900-\u097F (Hindi / Marathi)
  let gurmukhiCount = 0; // \u0A00-\u0A7F (Punjabi)

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0a80 && code <= 0x0aff) {
      gujaratiCount++;
    } else if (code >= 0x0900 && code <= 0x097f) {
      devanagariCount++;
    } else if (code >= 0x0a00 && code <= 0x0a7f) {
      gurmukhiCount++;
    }
  }

  if (gujaratiCount > 3) return 'gu-IN';
  if (gurmukhiCount > 3) return 'pa-IN';
  if (devanagariCount > 3) {
    return fallbackLang === 'mr' ? 'mr-IN' : 'hi-IN';
  }

  // Fallback to user language setting
  if (fallbackLang === 'gu') return 'gu-IN';
  if (fallbackLang === 'hi') return 'hi-IN';
  if (fallbackLang === 'mr') return 'mr-IN';
  if (fallbackLang === 'pa') return 'pa-IN';
  return 'en-IN';
}

/**
 * Retrieves the available browser voices asynchronously
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const immediate = window.speechSynthesis.getVoices();
    if (immediate.length > 0) {
      resolve(immediate);
      return;
    }

    const handler = () => {
      const voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(voices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);

    // Safety timeout in case voiceschanged never fires
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

/**
 * Pick the best matching female voice for the detected language
 */
export function selectFemaleVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: IndianScriptLang
): VoiceSelectionResult {
  const langPrefix = targetLang.split('-')[0].toLowerCase();
  const langUpper = targetLang.toLowerCase();

  // Find voices matching the target language code
  const langVoices = voices.filter((v) => {
    const vLang = v.lang.replace('_', '-').toLowerCase();
    return vLang === langUpper || vLang.startsWith(langPrefix);
  });

  // If no voice exists for a non-English Indian language, DO NOT speak with English voice!
  if (langVoices.length === 0 && targetLang !== 'en-IN') {
    const langName = LANG_DISPLAY_NAMES[targetLang];
    return {
      voice: null,
      detectedLang: targetLang,
      hasMatchingVoice: false,
      unsupportedMessage: `Spoken replies in ${langName} need a ${langName} voice on this device. Try Microsoft Edge.`,
    };
  }

  const preferredNames = FEMALE_VOICE_PREFERENCES[targetLang] || [];

  // 1. Try matching preferred female names
  for (const pref of preferredNames) {
    const match = langVoices.find((v) => v.name.toLowerCase().includes(pref));
    if (match) {
      return {
        voice: match,
        detectedLang: targetLang,
        hasMatchingVoice: true,
      };
    }
  }

  // 2. Try any voice in language that explicitly contains 'female' in name
  const anyFemale = langVoices.find((v) => v.name.toLowerCase().includes('female'));
  if (anyFemale) {
    return {
      voice: anyFemale,
      detectedLang: targetLang,
      hasMatchingVoice: true,
    };
  }

  // 3. Filter out explicitly male voices if alternatives exist
  const nonMale = langVoices.filter((v) => {
    const n = v.name.toLowerCase();
    return !n.includes('male') && !n.includes('david') && !n.includes('george') && !n.includes('mark') && !n.includes('ravi');
  });

  if (nonMale.length > 0) {
    return {
      voice: nonMale[0],
      detectedLang: targetLang,
      hasMatchingVoice: true,
    };
  }

  // 4. Fallback to any voice in that language
  if (langVoices.length > 0) {
    return {
      voice: langVoices[0],
      detectedLang: targetLang,
      hasMatchingVoice: true,
    };
  }

  // For English only, fallback to first available browser voice
  return {
    voice: voices[0] || null,
    detectedLang: targetLang,
    hasMatchingVoice: true,
  };
}

