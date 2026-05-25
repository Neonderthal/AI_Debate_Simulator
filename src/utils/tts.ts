/**
 * Text-to-Speech utility for AI Debate Arena
 * Uses Web Speech API with natural voices for Aegis (Pro) and Vesper (Con)
 * Provides distinct voice characteristics for each AI agent
 */

import { DebateDurationMode } from '../types';

export interface TTSConfig {
  enabled: boolean;
  proVoice: string | null;
  conVoice: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

// TTS speed multipliers based on debate duration mode
// Faster modes need faster TTS to finish reading before the next turn
export const TTS_SPEED_BY_MODE: Record<DebateDurationMode, number> = {
  flash: 1.4,   // Fast mode - speak quickly to keep up
  pro: 1.1,     // Standard mode - slightly faster than normal
  ultra: 0.9,   // Long mode - relaxed pace for deep listening
  custom: 1.0,  // Custom mode - normal speed
};

// Voice profiles for Proponent (Aegis) and Opponent (Vesper)
export const VOICE_PROFILES = {
  pro: {
    // Prefer higher-pitched, clearer voices for Aegis (knowledgeable, academic)
    preferredVoices: [
      'Google UK English Female',
      'Microsoft Zira',
      'Samantha',
      'Karen',
      'Moira',
      'Veena',
      'Fiona',
      'Google US English',
      'Alex',
    ],
    pitch: 1.1, // Slightly higher for warmth
    rate: 1.0,
  },
  con: {
    // Prefer lower-pitched, authoritative voices for Vesper (skeptical, analytical)
    preferredVoices: [
      'Google UK English Male',
      'Microsoft David',
      'Daniel',
      'Alex',
      'Google US English',
      'James',
      'Arthur',
      'George',
      'Google UK English Female',
    ],
    pitch: 0.9, // Slightly lower for gravitas
    rate: 0.95, // Slightly slower for emphasis
  },
};

let synthesis: SpeechSynthesis | null = null;
let voices: SpeechSynthesisVoice[] = [];
let isInitialized = false;

/**
 * Initialize the speech synthesis engine and load available voices
 */
export function initializeTTS(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[TTS] Web Speech API not available');
      resolve();
      return;
    }

    synthesis = window.speechSynthesis;

    const loadVoices = () => {
      voices = synthesis?.getVoices() || [];
      isInitialized = true;
      console.log(`[TTS] Loaded ${voices.length} voices`);
      resolve();
    };

    // Voices might load immediately or asynchronously
    if (synthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      synthesis.addEventListener('voiceschanged', loadVoices, { once: true });
      // Fallback timeout in case event doesn't fire
      setTimeout(() => {
        if (!isInitialized) {
          loadVoices();
        }
      }, 1000);
    }
  });
}

/**
 * Get the best matching voice from available voices based on preferences
 */
function getBestVoice(preferenceList: string[], speaker: 'pro' | 'con'): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  // English voices are our primary targets
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));

  for (const preferredName of preferenceList) {
    const match = englishVoices.find(v =>
      v.name.toLowerCase().includes(preferredName.toLowerCase())
    );
    if (match) {
      return match;
    }
  }

  // Fallback: pick first English voice, or a different one for variety
  if (speaker === 'pro') {
    return englishVoices.find(v => v.name.includes('Female')) || englishVoices[0] || voices[0];
  } else {
    // Try to get a different voice for Vesper
    const maleVoice = englishVoices.find(v => v.name.includes('Male'));
    const differentVoice = englishVoices.find(v => !voices[0]?.name.includes(v.name));
    return maleVoice || differentVoice || englishVoices[1] || englishVoices[0] || voices[0];
  }
}

/**
 * Speak the given text using TTS
 */
export function speakText(
  text: string,
  speaker: 'pro' | 'con',
  config: TTSConfig,
  durationMode: DebateDurationMode = 'pro',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void
): void {
  if (!config.enabled) {
    onEnd?.();
    return;
  }

  if (!synthesis) {
    // Try to initialize if not ready
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthesis = window.speechSynthesis;
      voices = synthesis.getVoices();
    } else {
      onError?.('Speech synthesis not available');
      onEnd?.();
      return;
    }
  }

  // Cancel any ongoing speech
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const profile = VOICE_PROFILES[speaker];

  // Select voice
  const voiceId = speaker === 'pro' ? config.proVoice : config.conVoice;
  let selectedVoice: SpeechSynthesisVoice | null = null;

  if (voiceId) {
    selectedVoice = voices.find(v => v.voiceURI === voiceId || v.name === voiceId) || null;
  }

  if (!selectedVoice) {
    selectedVoice = getBestVoice(profile.preferredVoices, speaker);
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Apply voice characteristics with mode-based speed adjustment
  const modeSpeedMultiplier = TTS_SPEED_BY_MODE[durationMode];
  utterance.pitch = profile.pitch * config.pitch;
  utterance.rate = profile.rate * config.rate * modeSpeedMultiplier;
  utterance.volume = config.volume;

  // Event handlers
  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (event) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error('[TTS] Speech error:', event.error);
      onError?.(event.error);
    }
    onEnd?.();
  };

  synthesis.speak(utterance);
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if (synthesis) {
    synthesis.cancel();
  }
}

/**
 * Check if TTS is currently speaking
 */
export function isSpeaking(): boolean {
  return synthesis?.speaking || false;
}

/**
 * Get all available voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return voices;
}

/**
 * Check if TTS is supported in this browser
 */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Detect optimal voices for Pro and Con speakers based on available voices
 */
export function detectOptimalVoices(): { proVoice: string | null; conVoice: string | null } {
  const proVoice = getBestVoice(VOICE_PROFILES.pro.preferredVoices, 'pro');
  const conVoice = getBestVoice(VOICE_PROFILES.con.preferredVoices, 'con');

  return {
    proVoice: proVoice?.voiceURI || null,
    conVoice: conVoice?.voiceURI || null,
  };
}
