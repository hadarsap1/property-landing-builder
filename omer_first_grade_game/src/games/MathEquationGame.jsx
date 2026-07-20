// MathEquationGame.jsx - משחק חיבור וחיסור אינטראקטיבי בתמונות ובכתב דפוס

import React, { useState } from 'react';

export default function MathEquationGame({ config, onCorrect, onMistake, playSound }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionSelect = (opt) => {
    setSelectedOption(opt);
    playSound('click');
    if (opt === config.correctAnswer) {
      onCorrect(config.explanation);
    } else {
      onMistake('ניסיון מעולה! השתמש/י בתמונות או בספירת האצבעות כדי למצוא את התשובה.');
    }
  };

  return (
    <div className="game-box math-game">
      <h3 className="game-question-title">{config.title}</h3>

      {/* תרגילי חיבור/חיסור ויזואליים */}
      {config.equationStr ? (
        <div className="equation-banner">
          <span className="equation-text-large">{config.equationStr}</span>
        </div>
      ) : (
        <div className="visual-math-display">
          <div className="math-group">
            <span className="group-num">{config.num1}</span>
            <div className="emojis-wrap">
              {Array.from({ length: config.num1 }).map((_, i) => (
                <span key={i} className="math-item-emoji">{config.emoji1}</span>
              ))}
            </div>
          </div>

          <div className="operator-symbol">{config.op}</div>

          <div className="math-group">
            <span className="group-num">{config.num2}</span>
            <div className="emojis-wrap">
              {Array.from({ length: config.num2 }).map((_, i) => (
                <span key={i} className="math-item-emoji">{config.emoji2 || config.emoji1}</span>
              ))}
            </div>
          </div>

          <div className="operator-symbol">=</div>

          <div className="question-mark-box">?</div>
        </div>
      )}

      {/* אפשרויות תשובה */}
      <div className="options-grid">
        {config.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleOptionSelect(opt)}
            className={`option-button math-option ${selectedOption === opt ? 'selected' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
