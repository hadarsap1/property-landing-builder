// FeedbackOverlay.jsx - פידבק לאחר תשובה עם הקראה קולית ועיצוב מודרני

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Award, RefreshCw, ArrowRight } from 'lucide-react';
import { speakHebrew, stopSpeech } from '../utils/speechUtils';

export default function FeedbackOverlay({
  isCorrect,
  isFinalStep,
  message,
  playerName,
  voiceType,
  soundEnabled,
  onNext,
  onRetry,
  playSound
}) {
  useEffect(() => {
    if (isCorrect) {
      playSound('correct');
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      if (soundEnabled) {
        const praises = [
          `כל הכבוד ${playerName}! תשובה מצוינת!`,
          `איזו עבודה נפלאה ${playerName}! אלוף!`,
          `כל הכבוד ${playerName}! מעולה!`
        ];
        const praise = praises[Math.floor(Math.random() * praises.length)];
        speakHebrew(praise, voiceType || 'woman');
      }
    } else {
      playSound('mistake');
      if (soundEnabled) {
        speakHebrew(`ניסיון מעולה ${playerName}! נסה שוב בסבלנות.`, voiceType || 'woman');
      }
    }
    // ההקראה ב-useEffect עובדת כי היא מגיבה ללחיצת המשתמש שהביאה לרינדור פידבק
  }, [isCorrect]);

  return (
    <div className="feedback-overlay-backdrop" onClick={(e) => e.stopPropagation()}>
      <div className={`feedback-card-modal ${isCorrect ? 'success' : 'constructive'}`}>

        {isCorrect ? (
          <>
            <div className="feedback-badge-icon">
              <Award size={56} color="#10B981" />
            </div>
            <h2 className="feedback-title success-text">כל הכבוד {playerName}! 🎉</h2>
            <div className="stars-earned-row">
              <Star size={36} fill="#FBBF24" color="#F59E0B" />
              <span className="stars-earned-text">+1 כוכב זהב!</span>
            </div>
            <p className="feedback-message">{message}</p>
            <button
              type="button"
              className="feedback-action-btn primary-btn"
              onClick={(e) => { e.stopPropagation(); stopSpeech(); onNext(); }}
            >
              {isFinalStep ? <>להר הבא 🚗 <ArrowRight size={20} /></> : <>לשאלה הבאה 🚗 <ArrowRight size={20} /></>}
            </button>
          </>
        ) : (
          <>
            <div className="feedback-badge-icon">💡</div>
            <h2 className="feedback-title constructive-text">ניסיון מעולה {playerName}!</h2>
            <p className="feedback-message">{message}</p>
            <button
              type="button"
              className="feedback-action-btn retry-btn"
              onClick={(e) => { e.stopPropagation(); stopSpeech(); onRetry(); }}
            >
              <RefreshCw size={18} /> נסה שוב בסבלנות
            </button>
          </>
        )}
      </div>
    </div>
  );
}
