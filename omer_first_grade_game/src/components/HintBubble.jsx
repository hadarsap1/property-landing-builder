// HintBubble.jsx - בועת רמז מכווין לילד חשיפת התשובה

import React from 'react';
import { Lightbulb, X } from 'lucide-react';

export default function HintBubble({ hintText, onClose, playSound }) {
  return (
    <div className="hint-overlay-backdrop" onClick={onClose}>
      <div className="hint-card-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-hint-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="hint-header">
          <div className="lightbulb-icon-wrap">
            <Lightbulb size={32} className="glowing-bulb" color="#F59E0B" fill="#FBBF24" />
          </div>
          <h3>רמז חכם ממכוונין הדרך 💡</h3>
        </div>

        <div className="hint-body">
          <p className="hint-text">{hintText}</p>
        </div>

        <button className="confirm-hint-btn" onClick={() => {
          playSound('click');
          onClose();
        }}>
          הבנתי! אנסה עכשיו ⭐
        </button>
      </div>
    </div>
  );
}
