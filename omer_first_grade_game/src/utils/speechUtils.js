// speechUtils.js - הקראה קולית בעברית באמצעות Web Speech API של הדפדפן.
// עובד בכל דפדפן מודרני ללא שרת חיצוני (ללא תלות ב-macOS `say` או ResponsiveVoice).

export const VOICE_TYPES = {
  woman: { id: 'woman', name: 'אישה 👩', pitch: 1.15, rate: 0.9 },
  man:   { id: 'man',   name: 'גבר 👨',  pitch: 0.75, rate: 0.9 },
  boy:   { id: 'boy',   name: 'ילד 👦',  pitch: 1.4,  rate: 0.95 },
  girl:  { id: 'girl',  name: 'ילדה 👧', pitch: 1.55, rate: 0.95 }
};

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

// רשימת הקולות נטענת אסינכרונית בחלק מהדפדפנים — נשמור אותה ברגע שהיא זמינה.
let cachedVoices = [];

function refreshVoices() {
  if (!synth) return;
  const voices = synth.getVoices();
  if (voices && voices.length) cachedVoices = voices;
}

if (synth) {
  refreshVoices();
  // 'voiceschanged' נורה כשהקולות מוכנים (בעיקר ב-Chrome).
  if (typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', refreshVoices);
  } else {
    synth.onvoiceschanged = refreshVoices;
  }
}

// בחירת הקול העברי הטוב ביותר מבין הקולות המותקנים במערכת.
function pickHebrewVoice() {
  if (!cachedVoices.length) refreshVoices();
  return (
    cachedVoices.find((v) => v.lang === 'he-IL') ||
    cachedVoices.find((v) => (v.lang || '').toLowerCase().startsWith('he')) ||
    cachedVoices.find((v) => /hebrew|carmit|ivrit/i.test(v.name || '')) ||
    null
  );
}

export function speakHebrew(text, voiceType = 'woman') {
  if (!text || !synth) return;
  stopSpeech();

  const cleanText = String(text).replace(/[_]/g, ' ').trim();
  if (!cleanText) return;

  const profile = VOICE_TYPES[voiceType] || VOICE_TYPES.woman;
  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = 'he-IL';
  utter.pitch = profile.pitch;
  utter.rate = profile.rate;
  utter.volume = 1.0;

  const hebrewVoice = pickHebrewVoice();
  if (hebrewVoice) utter.voice = hebrewVoice;

  try {
    synth.speak(utter);
  } catch (err) {
    console.warn('[TTS] שגיאה בהשמעה:', err && err.message);
  }
}

export function stopSpeech() {
  if (!synth) return;
  try {
    synth.cancel();
  } catch (_) {
    // no-op
  }
}
