// ─── Global voice state ───────────────────────────────────────────────────────
// Stored in localStorage so the preference persists across sessions.
const VOICE_KEY = "tts-voice-name";

let _selectedVoiceName: string | null = localStorage.getItem(VOICE_KEY);

export function getSelectedVoiceName(): string | null {
  return _selectedVoiceName;
}

export function setSelectedVoiceName(name: string | null): void {
  _selectedVoiceName = name;
  if (name) {
    localStorage.setItem(VOICE_KEY, name);
  } else {
    localStorage.removeItem(VOICE_KEY);
  }
}

// ─── Voice loading ────────────────────────────────────────────────────────────

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

/** Returns all voices whose lang starts with "zh" */
export function getChineseVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("zh"));
}

// ─── Speak ────────────────────────────────────────────────────────────────────

export function speak(text: string, rate = 0.8): void {
  if (!("speechSynthesis" in window)) {
    console.warn("Web Speech API not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = rate;
  utterance.pitch = 1;

  const allVoices = window.speechSynthesis.getVoices();

  // 1. Use the user-selected voice if set and still available
  if (_selectedVoiceName) {
    const chosen = allVoices.find((v) => v.name === _selectedVoiceName);
    if (chosen) {
      utterance.voice = chosen;
      window.speechSynthesis.speak(utterance);
      return;
    }
  }

  // 2. Fall back to first available Chinese voice
  const fallback = allVoices.find((v) =>
    v.lang.toLowerCase().startsWith("zh")
  );
  if (fallback) utterance.voice = fallback;

  window.speechSynthesis.speak(utterance);
}
