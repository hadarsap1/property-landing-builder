// LetterTracing.jsx - משחק כתיבת וציור אותיות דפוס אינטראקטיבי ב-Canvas

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';

export default function LetterTracing({ config, onCorrect, playSound }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    drawGuideLetter();
  }, [config.targetChar]);

  const drawGuideLetter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ציור קו רשת ניר כתיבה
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // ציור אות הדפוס בקווי מתווה מקווקוים (Dotted Print Letter)
    ctx.font = 'bold 160px Rubik, Assistant, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.fillText(config.targetChar, canvas.width / 2, canvas.height / 2 + 10);

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.strokeText(config.targetChar, canvas.width / 2, canvas.height / 2 + 10);
    ctx.setLineDash([]);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#3B82F6'; // Blue magic pen
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    drawGuideLetter();
    setHasDrawn(false);
    playSound('click');
  };

  const handleSubmit = () => {
    playSound('car_honk');
    onCorrect(config.explanation || `איזו אות דפוס מופלאה! כתבת את האות ${config.charName} בצורה מדהימה!`);
  };

  return (
    <div className="game-box letter-tracing-game">
      <h3 className="game-question-title">{config.title}: האות <strong>{config.targetChar}</strong> ({config.charName})</h3>
      <p className="game-instruction">עבור/י עם האצבע או העכבר בתוך קווי המתאר של אות הדפוס:</p>

      {/* משטח הציור */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={300}
          height={260}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="tracing-canvas"
        />
      </div>

      {/* כפתורי פעולה בציור */}
      <div className="tracing-actions">
        <button onClick={clearCanvas} className="action-sub-btn clear-btn">
          <RotateCcw size={18} /> נקה ונסה שוב
        </button>
        <button
          onClick={handleSubmit}
          className="action-sub-btn submit-btn primary-pulse"
          disabled={!hasDrawn}
        >
          <Sparkles size={20} /> סיימתי לכתוב! ✨
        </button>
      </div>
    </div>
  );
}
