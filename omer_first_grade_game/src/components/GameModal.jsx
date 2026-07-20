// GameModal.jsx - ניהול תרגילים בהר
// הקראה: רק בלחיצת כפתור "הקרא שאלה" — לא אוטומטי מ-useEffect (נחסם על ידי הדפדפן)

import React, { useState } from 'react';
import { X, Lightbulb, Volume2 } from 'lucide-react';
import CountingGame from '../games/CountingGame';
import MathEquationGame from '../games/MathEquationGame';
import LetterRecognition from '../games/LetterRecognition';
import LetterTracing from '../games/LetterTracing';
import LetterConnectDots from '../games/LetterConnectDots';
import WordBuilderGame from '../games/WordBuilderGame';
import SequenceGame from '../games/SequenceGame';
import HintBubble from './HintBubble';
import FeedbackOverlay from './FeedbackOverlay';
import { getMountainQuestions } from '../utils/questionsData';
import { speakHebrew, stopSpeech } from '../utils/speechUtils';

export default function GameModal({ mountain, gameState, onClose, onMountainComplete, playSound }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const questionsList = getMountainQuestions(mountain.id, gameState.difficulty);
  const currentQuestion = questionsList[currentStepIndex] || questionsList[0];

  // ההקראה השלמה — נקראת רק בלחיצה ישירה על הכפתור (דרישת הדפדפן)
  // חשוב: אין e.preventDefault() — זה חוסם את ה-user gesture הנדרש ל-SpeechSynthesis!
  const handleReadOutLoud = (e) => {
    e.stopPropagation();
    const textToRead = currentQuestion.question || currentQuestion.title || '';
    speakHebrew(textToRead, gameState.voiceType || 'woman');
  };

  const handleStepCorrect = (explanation) => {
    stopSpeech();
    setFeedback({
      isCorrect: true,
      isFinalStep: currentStepIndex >= questionsList.length - 1,
      message: explanation || 'תשובה נכונה!'
    });
  };

  const handleStepMistake = (msg) => {
    stopSpeech();
    setFeedback({
      isCorrect: false,
      message: msg || 'נסה שוב! לחץ על הרמז אם אתה צריך עזרה.'
    });
  };

  const handleNextStep = () => {
    stopSpeech();
    setFeedback(null);
    if (currentStepIndex < questionsList.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onMountainComplete(mountain.id);
    }
  };

  const handleRetry = () => {
    stopSpeech();
    setFeedback(null);
  };

  const renderGame = () => {
    const type = currentQuestion.type;
    const gameKey = `${mountain.id}-${currentStepIndex}-${currentQuestion.id || type}`;
    const props = {
      config: currentQuestion,
      onCorrect: handleStepCorrect,
      onMistake: handleStepMistake,
      playSound
    };

    switch (type) {
      case 'counting':       return <CountingGame key={gameKey} {...props} />;
      case 'math':
      case 'champion_mix':   return <MathEquationGame key={gameKey} {...props} />;
      case 'letter_rec':     return <LetterRecognition key={gameKey} {...props} />;
      case 'letter_tracing': return <LetterTracing key={gameKey} {...props} />;
      case 'word_builder':   return <WordBuilderGame key={gameKey} {...props} />;
      case 'sequence':       return <SequenceGame key={gameKey} {...props} />;
      default:               return <div className="game-box"><p>משחק בפיתוח...</p></div>;
    }
  };

  const progress = ((currentStepIndex + 1) / questionsList.length) * 100;

  return (
    <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
      <div className="game-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* כותרת */}
        <div className="game-modal-header">
          <div className="header-info">
            <span className="header-mountain-badge">{mountain.name}</span>
            <div className="step-progress-indicator">
              תרגיל {currentStepIndex + 1} מתוך {questionsList.length}
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              onClick={handleReadOutLoud}
              className="read-speech-btn"
              title="הקרא את השאלה בקול"
            >
              <Volume2 size={20} />
              <span>הקרא שאלה</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHint(true);
                if (currentQuestion.hint) {
                  speakHebrew(`רמז: ${currentQuestion.hint}`, gameState.voiceType || 'woman');
                }
              }}
              className="hint-trigger-btn"
              title="צריך רמז?"
            >
              <Lightbulb size={20} />
              <span>רמז</span>
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); stopSpeech(); onClose(); }}
              className="close-btn"
              title="סגור"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* סרגל התקדמות */}
        <div className="modal-progress-bar-container">
          <div className="modal-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* תוכן התרגיל */}
        <div className="game-modal-body">
          {renderGame()}
        </div>

        {/* רמז */}
        {showHint && (
          <HintBubble
            hintText={currentQuestion.hint || 'הסתכל היטב וחשוב בסבלנות!'}
            onClose={() => { stopSpeech(); setShowHint(false); }}
            playSound={playSound}
          />
        )}

        {/* פידבק */}
        {feedback && (
          <FeedbackOverlay
            isCorrect={feedback.isCorrect}
            isFinalStep={feedback.isFinalStep}
            message={
              feedback.isCorrect && feedback.isFinalStep
                ? `כל הכבוד ${gameState.playerName}! סיימת את הר ${mountain.name}! 🏔️🚗`
                : feedback.message
            }
            playerName={gameState.playerName}
            voiceType={gameState.voiceType}
            soundEnabled={gameState.soundEnabled}
            onNext={handleNextStep}
            onRetry={handleRetry}
            playSound={playSound}
          />
        )}

      </div>
    </div>
  );
}
