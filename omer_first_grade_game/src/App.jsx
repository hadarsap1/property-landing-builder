// App.jsx - היישום הראשי של מסע ההרים של עומר במפת ישראל

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import IsraelMountainMap from './components/IsraelMountainMap';
import GameModal from './components/GameModal';
import ShareModal from './components/ShareModal';
import { ISRAEL_MOUNTAINS } from './utils/questionsData';
import { loadGameState, saveGameState, resetGameState } from './utils/storage';
import { playSound } from './utils/soundEffects';

export default function App() {
  const [gameState, setGameState] = useState(loadGameState());
  const [activeMountainId, setActiveMountainId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const handleUpdateState = (updates) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  };

  const handleSoundPlay = (type) => {
    playSound(type, gameState.soundEnabled);
  };

  const handleSelectMountain = (mountainId) => {
    setActiveMountainId(mountainId);
  };

  const handleMountainComplete = (mountainId) => {
    setGameState((prev) => {
      const nextUnlocked = Math.max(prev.unlockedMountain, mountainId + 1);
      const isNewCompletion = !prev.completedMountains.includes(mountainId);
      const updatedCompleted = isNewCompletion
        ? [...prev.completedMountains, mountainId]
        : prev.completedMountains;

      return {
        ...prev,
        unlockedMountain: Math.min(nextUnlocked, ISRAEL_MOUNTAINS.length),
        currentMountain: Math.min(mountainId + 1, ISRAEL_MOUNTAINS.length),
        completedMountains: updatedCompleted,
        totalStars: isNewCompletion ? prev.totalStars + 1 : prev.totalStars
      };
    });

    setActiveMountainId(null);
  };

  const handleResetGame = () => {
    if (window.confirm('האם את/ה בטוח/ה שברצונך להתחיל מסע חדש מאפס?')) {
      const newState = resetGameState();
      setGameState(newState);
      setActiveMountainId(null);
      handleSoundPlay('car_honk');
    }
  };

  const activeMountain = ISRAEL_MOUNTAINS.find((m) => m.id === activeMountainId);

  return (
    <div className="app-main-container">
      {/* סרגל ניווט עליון */}
      <Navbar
        gameState={gameState}
        onUpdateState={handleUpdateState}
        onOpenShare={() => setShowShareModal(true)}
        onResetGame={handleResetGame}
        playSound={handleSoundPlay}
      />

      {/* מפת ישראל והמכונית */}
      <main className="main-content">
        <IsraelMountainMap
          gameState={gameState}
          onSelectMountain={handleSelectMountain}
          playSound={handleSoundPlay}
        />
      </main>

      {/* מודאל חידה/משחק של הר פעיל */}
      {activeMountain && (
        <GameModal
          mountain={activeMountain}
          gameState={gameState}
          onClose={() => setActiveMountainId(null)}
          onMountainComplete={handleMountainComplete}
          playSound={handleSoundPlay}
        />
      )}

      {/* מודאל שיתוף עם חברים */}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          playerName={gameState.playerName}
          playSound={handleSoundPlay}
        />
      )}
    </div>
  );
}
