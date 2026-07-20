// LetterRecognition.jsx - משח׫ זיהוי אותיות דפוס וצלילים פותחים

import React, { useState } from 'react';

export default function LetterRecognition({ config, onCorrect, onMistake, playSound }) {
  const [selectedLetter, setSelectedLetter] = useState(null);

  const handleSelect = (letter) => {
    setSelectedLetter(letter);
    playSound('click');
    if (letter === config.correctAnswer) {
      onCorrect(config.explanation);
    } else {
      onMistake('קרוב מאוד! הקשב/י לצליל הפותח ונסה/י שוב.');
    }
  };

  return (
    <div className="game-box letter-rec-game">
      <h3 className="game-question-title">{config.title}</h3>
      
      <div className="word-card-highlight">
        <span className="card-emoji-large">{config.targetEmoji}</span>
        <span className="card-word-print">{config.targetWord}</span>
      </div>

      <p className="game-prompt">{config.question}</p>

      {/* כפתורי אותיות דפוס */}
      <div className="letter-options-grid">
        {config.options.map((letter) => (
          <button
            key={letter}
            onClick={() => handleSelect(letter)}
            className={`letter-option-btn print-script ${selectedLetter === letter ? 'selected' : ''}`}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
