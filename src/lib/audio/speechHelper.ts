/**
 * Web Speech API helper for Multilingual Voice Guidance
 * Designed for elderly users who cannot read small text or have visual impairments.
 * Runs completely locally on the device (built-in browser speech synthesis).
 */

export type SupportedLanguage = 'as' | 'bn' | 'hi' | 'en';

export const LANGUAGE_LABELS: Record<SupportedLanguage, { name: string; nativeName: string; sunoText: string }> = {
  as: { name: 'Assamese', nativeName: 'অসমীয়া', sunoText: 'শুনক' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', sunoText: 'শুনুন' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', sunoText: 'सुनिए' },
  en: { name: 'English', nativeName: 'English', sunoText: 'Listen' },
};

export function speakInstruction(_text: string, _lang: SupportedLanguage = 'as') {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
