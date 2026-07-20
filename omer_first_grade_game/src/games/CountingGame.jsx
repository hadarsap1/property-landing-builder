// CountingGame.jsx - משחק ספירה וכמויות אינטראקטיבי

import React, { useState } from 'react';
import { Check } from 'lucide-react';

export default function CountingGame({ config, onCorrect, onMistake, playSound }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [countedItems, setCountedItems] = useState(new Set());

  const handleItemClick = (idx) => {
    const next = new Set(countedItems);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
      playSound('click');
    }
    setCountedItems(next);
  };

  const handleSelectOption = (num) => {
    setSelectedOption(num);
    playSound('click');
    if (num === config.countTarget) {
      onCorrect(config.explanation);
    } else {
      onMistake('ספור שוב בסבלנות! לחץ על כל חפץ כדי לסמן אותו ולהיעזר בספירה.');
    }
  };

  return (
    <div className="game-box counting-game">
      <h3 className="game-question-title">{config.title}</h3>
      <p className="game-instruction">לחץ/י על החפצים כדי לספור אותם ואז בחר/י בתשובה הנכונה:</p>

      {/* אזור ספירת חפצים אינטראקטיבי */}
      <div className="counting-items-grid">
        {Array.from({ length: config.countTarget }).map((_, idx) => {
          const isCounted = countedItems.has(idx);
          return (
            <div
              key={idx}
              className={`count-item-card ${isCounted ? 'counted' : ''}`}
              onClick={() => handleItemClick(idx)}
              title="לחץ לספירה!"
            >
              <span className="count-emoji">{config.emoji}</span>
              {isCounted && <span className="count-badge">{idx + 1}</span>}
            </div>
          );
        })}
      </div>

      <div className="counting-counter-text">
        ספרת <strong>{countedItems.size}</strong> מתוך ? חפצים
      </div>

      {/* אפשרויות תשובה */}
      <div className="options-grid">
        {config.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelectOption(opt)}
            className={`option-button ${selectedOption === opt ? 'selected' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
