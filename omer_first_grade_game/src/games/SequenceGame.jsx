// SequenceGame.jsx - משחק השלמת סדרות מספרים ואותיות דפוס

import React, { useState } from 'react';

export default function SequenceGame({ config, onCorrect, onMistake, playSound }) {
  const [selectedOpt, setSelectedOpt] = useState(null);

  const handleSelect = (opt) => {
    setSelectedOpt(opt);
    playSound('click');
    if (opt === config.correctAnswer) {
      onCorrect(config.explanation);
    } else {
      onMistake('קרוב מאוד! עקוב/י אחרי הסדרה מתחילתה ועד סופה.');
    }
  };

  return (
    <div className="game-box sequence-game">
      <h3 className="game-question-title">{config.title}</h3>

      {/* תצוגת הרצף */}
      <div className="sequence-chain">
        {config.sequence.map((item, idx) => (
          <div
            key={idx}
            className={`sequence-card ${item === '?' ? 'missing-target' : ''}`}
          >
            {item === '?' ? (selectedOpt || '?') : item}
          </div>
        ))}
      </div>

      <p className="game-prompt">בחר/י את האיבר החסר ברצף:</p>

      <div className="options-grid">
        {config.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className={`option-button print-script ${selectedOpt === opt ? 'selected' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
