// WordBuilderGame.jsx - משחק הרכבת מילים ואות חסרה בכתב דפוס

import React, { useState } from 'react';

export default function WordBuilderGame({ config, onCorrect, onMistake, playSound }) {
  const [selectedLetter, setSelectedLetter] = useState(null);

  const handleLetterSelect = (letter) => {
    setSelectedLetter(letter);
    playSound('click');
    if (letter === config.missingLetter) {
      onCorrect(config.explanation);
    } else {
      onMistake('ניסיון מעולה! נסה/י להרכיב את הצליל הנכון בדפוס.');
    }
  };

  return (
    <div className="game-box word-builder-game">
      <h3 className="game-question-title">{config.title}</h3>

      <div className="word-preview-box">
        <span className="word-emoji-giant">{config.emoji}</span>

        {/* תצוגת המילה עם האות החסרה */}
        <div className="missing-word-display print-script">
          {selectedLetter ? (
            config.displayWord.replace('_', selectedLetter)
          ) : (
            config.displayWord
          )}
        </div>
      </div>

      <p className="game-prompt">איזו אות דפוס חסרה כדי להשלים את המילה?</p>

      <div className="letter-options-grid">
        {config.options.map((letter) => (
          <button
            key={letter}
            onClick={() => handleLetterSelect(letter)}
            className={`letter-option-btn print-script ${selectedLetter === letter ? 'selected' : ''}`}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
