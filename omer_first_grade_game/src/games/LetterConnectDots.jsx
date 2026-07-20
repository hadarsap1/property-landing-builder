// LetterConnectDots.jsx - משחק חיבור נקודות לבניית אות דפוס בצורה קלה ומהנה

import React, { useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function LetterConnectDots({ config, onCorrect, playSound }) {
  const [connectedDots, setConnectedDots] = useState([]);
  const [nextExpectedDot, setNextExpectedDot] = useState(1);

  const dots = config.dots || [
    { id: 1, label: '1', x: 20, y: 20 },
    { id: 2, label: '2', x: 80, y: 20 },
    { id: 3, label: '3', x: 80, y: 80 },
    { id: 4, label: '4', x: 20, y: 80 }
  ];

  const handleDotClick = (dot) => {
    if (connectedDots.includes(dot.id)) return;

    if (dot.id === nextExpectedDot) {
      playSound('click');
      const updated = [...connectedDots, dot.id];
      setConnectedDots(updated);
      setNextExpectedDot(nextExpectedDot + 1);

      if (updated.length === dots.length) {
        playSound('correct');
        setTimeout(() => {
          onCorrect(config.explanation || `איזו אות דפוס מופלאה! בנית את האות ${config.targetChar}!`);
        }, 600);
      }
    } else {
      playSound('mistake');
    }
  };

  const handleReset = () => {
    setConnectedDots([]);
    setNextExpectedDot(1);
    playSound('click');
  };

  return (
    <div className="game-box connect-dots-game">
      <h3 className="game-question-title">{config.title}</h3>
      <p className="game-instruction">
        לחץ/י על הנקודות לפי הסדר (1, 2, 3...) לבניית האות <strong>{config.targetChar}</strong> ({config.charName}) בדפוס:
      </p>

      {/* משטח חיבור נקודות */}
      <div className="dots-board-container">
        {/* אות דפוס שקופה ברקע */}
        <div className="background-print-char print-script">{config.targetChar}</div>

        {/* קווים שנמתחו בין הנקודות */}
        <svg className="lines-svg-layer" viewBox="0 0 100 100">
          {connectedDots.map((dotId, index) => {
            if (index === 0) return null;
            const prevDot = dots.find((d) => d.id === connectedDots[index - 1]);
            const currDot = dots.find((d) => d.id === dotId);
            if (!prevDot || !currDot) return null;

            return (
              <line
                key={`line-${index}`}
                x1={`${prevDot.x}%`}
                y1={`${prevDot.y}%`}
                x2={`${currDot.x}%`}
                y2={`${currDot.y}%`}
                stroke="#3B82F6"
                strokeWidth="5"
                strokeLinecap="round"
                className="animated-draw-line"
              />
            );
          })}
        </svg>

        {/* הנקודות הממוספרות */}
        {dots.map((dot) => {
          const isConnected = connectedDots.includes(dot.id);
          const isNext = dot.id === nextExpectedDot;

          return (
            <div
              key={dot.id}
              onClick={() => handleDotClick(dot)}
              className={`dot-node ${isConnected ? 'connected' : ''} ${isNext ? 'next-target' : ''}`}
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            >
              {isConnected ? (
                <CheckCircle2 size={22} color="white" />
              ) : (
                <span className="dot-label">{dot.label}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="dots-status-bar">
        <span>חברת <strong>{connectedDots.length}</strong> מתוך <strong>{dots.length}</strong> נקודות</span>
        <button onClick={handleReset} className="reset-dots-btn">
          <RotateCcw size={16} /> נסה מחדש
        </button>
      </div>
    </div>
  );
}
