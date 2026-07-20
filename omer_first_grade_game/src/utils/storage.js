// storage.js - ניהול זיכרון ושמירת התקדמות ב-localStorage

const STORAGE_KEY = 'omer_mountain_adventure_save_v1';

const DEFAULT_SAVE = {
  playerName: 'עומר',
  unlockedMountain: 1, // 1 to 7
  currentMountain: 1,
  totalStars: 0,
  difficulty: 'easy', // 'easy' | 'medium' | 'hard'
  voiceType: 'woman', // 'woman' | 'man' | 'boy' | 'girl'
  autoRead: true,
  completedMountains: [],
  soundEnabled: true,
  createdAt: new Date().toISOString()
};

export function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE;
    const data = JSON.parse(raw);
    return { ...DEFAULT_SAVE, ...data };
  } catch (err) {
    console.error('Error loading game state:', err);
    return DEFAULT_SAVE;
  }
}

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving game state:', err);
  }
}

export function resetGameState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error resetting game state:', err);
  }
  return DEFAULT_SAVE;
}
