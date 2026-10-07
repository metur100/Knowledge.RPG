import * as Speech from 'expo-speech';

import type { Language } from '@/models';

/**
 * Optional audio layer. Everything here uses the device's own offline text-to-speech engine,
 * so no audio files are bundled and nothing is downloaded. If a voice is missing, calls do nothing.
 *
 * A future version can swap `NarrationProvider` for recorded narration by human readers.
 */
export interface NarrationProvider {
  speak(text: string, language: Language): void;
  stop(): void;
}

const LOCALES: Record<Language, string> = { bs: 'bs-BA', de: 'de-DE', en: 'en-GB' };

export const deviceNarration: NarrationProvider = {
  speak(text, language) {
    try {
      Speech.stop();
      Speech.speak(text, { language: LOCALES[language], rate: 0.95 });
    } catch {
      // Narration is optional.
    }
  },
  stop() {
    try {
      Speech.stop();
    } catch {
      // ignore
    }
  },
};

/** Arabic pronunciation for letters and words. */
export function speakArabic(text: string): void {
  try {
    Speech.stop();
    Speech.speak(text, { language: 'ar', rate: 0.75 });
  } catch {
    // Pronunciation is optional.
  }
}

export function stopSpeaking(): void {
  deviceNarration.stop();
}
