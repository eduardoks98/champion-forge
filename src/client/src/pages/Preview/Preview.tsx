// ==========================================
// PREVIEW PAGE - Minimal visual for iframe embedding
// No UI, no buttons, just animated visuals
// ==========================================

import './Preview.css';

export default function Preview() {
  return (
    <div className="preview">
      <div className="preview__content">
        <h1 className="preview__title">
          CHAMPION<span className="preview__accent">FORGE</span>
        </h1>

        <div className="preview__icon">
          <svg viewBox="0 0 100 100" width="150" height="150">
            {/* Outer rings */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#d4a418" strokeWidth="2" opacity="0.3" className="preview__ring preview__ring--outer"/>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#d4a418" strokeWidth="1" opacity="0.2" className="preview__ring preview__ring--inner"/>

            {/* Crossed swords with animation */}
            <g className="preview__swords">
              <path d="M25 75 L75 25" stroke="#d4a418" strokeWidth="3" strokeLinecap="round" className="preview__sword preview__sword--1"/>
              <path d="M75 75 L25 25" stroke="#d4a418" strokeWidth="3" strokeLinecap="round" className="preview__sword preview__sword--2"/>
            </g>

            {/* Sword handles/pommels */}
            <circle cx="25" cy="75" r="5" fill="#d4a418" opacity="0.8" className="preview__pommel"/>
            <circle cx="75" cy="75" r="5" fill="#d4a418" opacity="0.8" className="preview__pommel"/>
            <circle cx="25" cy="25" r="5" fill="#d4a418" opacity="0.8" className="preview__pommel"/>
            <circle cx="75" cy="25" r="5" fill="#d4a418" opacity="0.8" className="preview__pommel"/>

            {/* Center gem */}
            <circle cx="50" cy="50" r="10" fill="#d4a418" opacity="0.6" className="preview__center"/>
            <circle cx="50" cy="50" r="6" fill="#fff" opacity="0.3" className="preview__center-glow"/>
          </svg>
        </div>

        <p className="preview__tagline">MOBA Arena Multiplayer</p>
      </div>

      {/* Decorative elements */}
      <div className="preview__glow preview__glow--1" />
      <div className="preview__glow preview__glow--2" />
    </div>
  );
}
