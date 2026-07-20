// ShareModal.jsx - חלון שיתוף המשחק ללא תחרותיות

import React, { useState } from 'react';
import { X, Copy, Check, Heart, Users } from 'lucide-react';

export default function ShareModal({ onClose, playerName, playSound }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;
  const shareMessage = `בואו לשחק יחד איתי במסע ההרים להכנה לכיתה א'! 🚗⛰️ (מאת ${playerName})`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
    setCopied(true);
    playSound('click');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="share-card-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="share-header">
          <div className="share-icon-circle">
            <Users size={32} color="#3B82F6" />
          </div>
          <h2>שתפו את מסע ההרים עם חברים! 🤝</h2>
          <p className="share-subtitle">
            הזמינו חברים להתנסות באותם השלבים והחידות באופן אישי, בכיף וללא תחרות!
          </p>
        </div>

        <div className="share-card-body">
          <div className="invite-preview-box">
            <div className="invite-emoji">🚗 ⛰️ 🍎 🔤</div>
            <div className="invite-title">הרפתקת ההרים של {playerName}</div>
            <div className="invite-desc">משחק למידת אותיות דפוס וחשבון לכיתה א'</div>
          </div>

          <div className="link-copy-section">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="share-link-input"
            />
            <button
              onClick={handleCopyLink}
              className={`copy-btn ${copied ? 'copied' : ''}`}
            >
              {copied ? (
                <>
                  <Check size={18} /> הועתק!
                </>
              ) : (
                <>
                  <Copy size={18} /> העתק קישור
                </>
              )}
            </button>
          </div>
        </div>

        <div className="share-footer">
          <p className="non-compete-note">
            <Heart size={16} color="#EC4899" fill="#EC4899" /> כל ילד וילדה לומדים בקצב שלהם וברוגע!
          </p>
        </div>
      </div>
    </div>
  );
}
