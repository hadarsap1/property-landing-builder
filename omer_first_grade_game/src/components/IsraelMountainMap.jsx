// IsraelMountainMap.jsx - מפת ישראל אינטראקטיבית מרהיבה עם אפקט נסיעה מונפש

import React, { useEffect, useState } from 'react';
import { Lock, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { ISRAEL_MOUNTAINS } from '../utils/questionsData';

export default function IsraelMountainMap({
  gameState,
  onSelectMountain,
  playSound
}) {
  const currentMountainId = gameState.currentMountain || 1;
  const unlockedMountainId = gameState.unlockedMountain || 1;

  const [isDriving, setIsDriving] = useState(false);
  const [carPosition, setCarPosition] = useState({ top: 8, left: 65 });

  // עדכון מיקום המכונית על מפת ישראל עם אפקט נסיעה מונפש
  useEffect(() => {
    const currentM = ISRAEL_MOUNTAINS.find((m) => m.id === currentMountainId) || ISRAEL_MOUNTAINS[0];
    setIsDriving(true);
    playSound('drive');

    const timer = setTimeout(() => {
      setCarPosition({ top: currentM.topPercent, left: currentM.leftPercent });
      setIsDriving(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [currentMountainId]);

  const handleMountainClick = (m) => {
    if (m.id <= unlockedMountainId) {
      playSound('jump');
      onSelectMountain(m.id);
    } else {
      playSound('mistake');
    }
  };

  return (
    <div className="israel-map-wrapper">

      {/* כותרת המפה */}
      <div className="map-header-box">
        <h1 className="israel-map-title">
          מסע ההרים של {gameState.playerName || 'עומר'} במפת ישראל 🚗🗺️
        </h1>
        <p className="israel-map-subtitle">
          סע/י עם המכונית מהחרמון בצפון ועד הרי אילת בדרום! בכל הר מחכה סדרת תרגילים!
        </p>
      </div>

      {/* לוח המפה של ישראל */}
      <div className="israel-map-board">

        {/* תווי מפת ישראל וים תיכון */}
        <div className="mediterranean-sea-label">הים התיכון 🌊</div>
        <div className="kinneret-lake-visual" title="ים הכנרת 💧">💧 הכנרת</div>
        <div className="dead-sea-visual" title="ים המלח 🧂">🧂 ים המלח</div>

        {/* נתיב הכביש המפותל בין ההרים */}
        <svg className="israel-highway-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M 65 8 Q 55 15, 55 22 T 40 35 T 62 48 T 52 62 T 42 78 T 48 92"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
        </svg>

        {/* המכונית של עומר נוסעת על המפה */}
        <div
          className={`israel-map-car ${isDriving ? 'driving-motion' : 'bouncing-idle'}`}
          style={{
            top: `${carPosition.top}%`,
            left: `${carPosition.left}%`
          }}
          onClick={() => playSound('car_honk')}
          title="לחץ לצפצוף!"
        >
          <div className="car-emoji">🚗</div>
          <div className="car-pulse-ring"></div>
        </div>

        {/* פסגות ההרים על מפת ישראל */}
        {ISRAEL_MOUNTAINS.map((m) => {
          const isUnlocked = m.id <= unlockedMountainId;
          const isCurrent = m.id === currentMountainId;
          const isCompleted = gameState.completedMountains?.includes(m.id);

          return (
            <div
              key={m.id}
              className={`israel-mountain-node ${isUnlocked ? 'unlocked' : 'locked'} ${
                isCurrent ? 'active-target' : ''
              }`}
              style={{
                top: `${m.topPercent}%`,
                left: `${m.leftPercent}%`
              }}
              onClick={() => handleMountainClick(m)}
            >
              {/* אייקון ההר */}
              <div className="mountain-peak-icon">
                <span className="peak-snow-emoji">{m.icon}</span>
              </div>

              {/* כרטיס מידע צף ליד ההר */}
              <div className="mountain-info-card">
                <div className="mountain-region-tag">{m.region}</div>
                <div className="mountain-title-text">{m.name}</div>

                <div className="mountain-status-row">
                  {isCompleted ? (
                    <span className="status-chip completed">
                      <CheckCircle2 size={14} /> הושלם <Star size={12} fill="#FBBF24" color="#F59E0B" />
                    </span>
                  ) : isUnlocked ? (
                    <span className="status-chip ready">
                      <Sparkles size={14} /> 3 תרגילים!
                    </span>
                  ) : (
                    <span className="status-chip locked">
                      <Lock size={14} /> נעול
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
