// Navbar.jsx - סרגל עליון עם פרופיל עומר, כוכבים, דרגת קושי, בחירת קול הקראה ושיתוף

import React, { useState } from 'react';
import { Star, Volume2, VolumeX, Share2, RotateCcw, Edit2, Check, Mic } from 'lucide-react';
import { DIFFICULTY_LEVELS } from '../utils/questionsData';
import { VOICE_TYPES, speakHebrew } from '../utils/speechUtils';

export default function Navbar({
  gameState,
  onUpdateState,
  onOpenShare,
  onResetGame,
  playSound
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(gameState.playerName || 'עומר');

  const handleNameSave = () => {
    if (nameInput.trim()) {
      onUpdateState({ playerName: nameInput.trim() });
    }
    setIsEditingName(false);
  };

  const handleDifficultyChange = (e) => {
    const newDiff = e.target.value;
    onUpdateState({ difficulty: newDiff });
    playSound('click');
  };

  const handleVoiceChange = (e) => {
    const newVoice = e.target.value;
    onUpdateState({ voiceType: newVoice });
    playSound('click');
    speakHebrew('שלום, אני המקריא/ה שלך במשחק!', newVoice);
  };

  const toggleSound = () => {
    onUpdateState({ soundEnabled: !gameState.soundEnabled });
    playSound('click');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">

        {/* פרופיל השחקן / עומר */}
        <div className="player-profile">
          <div className="car-avatar" onClick={() => playSound('car_honk')} title="לחץ לצפצוף!">
            🚗
          </div>
          {isEditingName ? (
            <div className="name-edit-box">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="name-input"
                autoFocus
              />
              <button onClick={handleNameSave} className="icon-btn check-btn" title="שמור שם">
                <Check size={18} />
              </button>
            </div>
          ) : (
            <div className="name-display" onClick={() => setIsEditingName(true)} title="לחץ לשינוי שם">
              <span className="player-name">שלום, {gameState.playerName}!</span>
              <Edit2 size={14} className="edit-icon" />
            </div>
          )}
        </div>

        {/* מילון כוכבים והישגים */}
        <div className="stars-badge" title="כוכבי זהב שאספת במסע!">
          <Star className="star-icon" fill="#FBBF24" color="#F59E0B" size={24} />
          <span className="stars-count">{gameState.totalStars}</span>
        </div>

        {/* בחירת דרגת קושי */}
        <div className="difficulty-selector">
          <label htmlFor="diff-select" className="diff-label">רמה:</label>
          <select
            id="diff-select"
            value={gameState.difficulty}
            onChange={handleDifficultyChange}
            className="diff-dropdown"
            style={{ borderColor: DIFFICULTY_LEVELS[gameState.difficulty]?.color }}
          >
            {Object.values(DIFFICULTY_LEVELS).map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.name}
              </option>
            ))}
          </select>
        </div>

        {/* בחירת קול ההקראה (גבר/אישה/ילד/ילדה) */}
        <div className="voice-selector">
          <Mic size={18} color="#0284C7" />
          <select
            value={gameState.voiceType || 'woman'}
            onChange={handleVoiceChange}
            className="voice-dropdown"
            title="בחר/י קול הקראה"
          >
            {Object.values(VOICE_TYPES).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* כפתורי פעולה: סאונד, שיתוף, איפוס */}
        <div className="navbar-actions">
          <button
            onClick={toggleSound}
            className={`action-btn ${gameState.soundEnabled ? 'active' : ''}`}
            title={gameState.soundEnabled ? 'כבה צלילים' : 'הפעל צלילים'}
          >
            {gameState.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button
            onClick={onOpenShare}
            className="action-btn share-btn"
            title="שתף את המשחק עם חברים"
          >
            <Share2 size={20} />
            <span className="btn-text">שתף חבר/ה</span>
          </button>

          <button
            onClick={onResetGame}
            className="action-btn reset-btn"
            title="התחל מסע חדש"
          >
            <RotateCcw size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}
