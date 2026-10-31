import test from 'node:test';
import assert from 'node:assert/strict';
import { detectTextScriptLang, selectFemaleVoice } from './mayaVoice';

test('detectTextScriptLang detects regional scripts accurately', () => {
  // Gujarati script
  const gujarati = 'નમસ્તે! તમારા જન્મદિવસનું આયોજન કરીએ.';
  assert.equal(detectTextScriptLang(gujarati, 'en'), 'gu-IN');

  // Hindi / Devanagari script
  const hindi = 'नमस्ते! चलिए आपके जन्मदिन की योजना बनाते हैं।';
  assert.equal(detectTextScriptLang(hindi, 'en'), 'hi-IN');

  // Marathi with Devanagari script (with user preference mr)
  const marathi = 'नमस्कार! वाढदिवसाचे नियोजन करूया.';
  assert.equal(detectTextScriptLang(marathi, 'mr'), 'mr-IN');

  // Punjabi / Gurmukhi script
  const punjabi = 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਚਲੋ ਤੁਹਾਡੇ ਸਮਾਗਮ ਦੀ ਯੋਜਨਾ ਬਣਾਈਏ।';
  assert.equal(detectTextScriptLang(punjabi, 'en'), 'pa-IN');

  // Latin / English
  const english = 'Hello! Let us plan your 1st birthday celebration.';
  assert.equal(detectTextScriptLang(english, 'en'), 'en-IN');
});

test('selectFemaleVoice refuses to speak non-English text with wrong English voice', () => {
  // Only English voices installed in browser
  const mockVoices = [
    { name: 'Microsoft David Desktop', lang: 'en-US' } as SpeechSynthesisVoice,
    { name: 'Microsoft Zira Desktop', lang: 'en-US' } as SpeechSynthesisVoice,
  ];

  const result = selectFemaleVoice(mockVoices, 'gu-IN');
  assert.equal(result.hasMatchingVoice, false);
  assert.equal(result.voice, null);
  assert.match(result.unsupportedMessage || '', /Spoken replies in Gujarati need a Gujarati voice on this device/);
});

test('selectFemaleVoice prefers female voices when available', () => {
  const mockVoices = [
    { name: 'Microsoft Hemant', lang: 'hi-IN' } as SpeechSynthesisVoice,
    { name: 'Microsoft Swara Online', lang: 'hi-IN' } as SpeechSynthesisVoice,
    { name: 'Microsoft Kalpana', lang: 'hi-IN' } as SpeechSynthesisVoice,
  ];

  const result = selectFemaleVoice(mockVoices, 'hi-IN');
  assert.equal(result.hasMatchingVoice, true);
  assert.equal(result.voice?.name, 'Microsoft Swara Online');
});

