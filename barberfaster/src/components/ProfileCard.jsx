import { useRef, useState } from 'react';
import './ProfileCard.css';

const initialsFromName = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('es');

export default function ProfileCard({
  name = 'Barbero',
  title = 'Especialista en barbería',
  contactText = 'Elegir barbero',
  avatarUrl = '',
  showUserInfo = true,
  enableTilt = true,
  onContactClick,
  behindGlowColor = 'rgba(43, 207, 206, 0.38)',
  innerGradient = 'linear-gradient(145deg, #dff7f6 0%, #b8eeee 100%)',
  className = '',
}) {
  const wrapperRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);
  const cardName = name || 'Barbero';

  const handlePointerMove = (event) => {
    if (!enableTilt || event.pointerType !== 'mouse' || !wrapperRef.current) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    wrapperRef.current.style.setProperty('--pointer-x', `${x * 100}%`);
    wrapperRef.current.style.setProperty('--pointer-y', `${y * 100}%`);
    wrapperRef.current.style.setProperty('--rotate-x', `${(0.5 - y) * 10}deg`);
    wrapperRef.current.style.setProperty('--rotate-y', `${(x - 0.5) * 12}deg`);
    wrapperRef.current.style.setProperty('--card-opacity', '1');
  };

  const handlePointerLeave = () => {
    if (!wrapperRef.current) return;
    wrapperRef.current.style.setProperty('--rotate-x', '0deg');
    wrapperRef.current.style.setProperty('--rotate-y', '0deg');
    wrapperRef.current.style.setProperty('--card-opacity', '0');
  };

  return (
    <div
      ref={wrapperRef}
      className={`pc-card-wrapper ${className}`.trim()}
      style={{ '--behind-glow-color': behindGlowColor, '--inner-gradient': innerGradient }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="pc-behind" aria-hidden="true" />
      <div className="pc-card-shell">
        <article className="pc-card">
          <div className="pc-inside">
            <div className="pc-shine" aria-hidden="true" />
            <div className="pc-glare" aria-hidden="true" />
            <div className="pc-avatar-content">
              {avatarUrl && !avatarError ? (
                <img
                  className="avatar"
                  src={avatarUrl}
                  alt={`Foto de ${cardName}`}
                  loading="lazy"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="pc-avatar-placeholder" aria-hidden="true">
                  <span>{initialsFromName(cardName)}</span>
                </div>
              )}
            </div>
            {showUserInfo && (
              <div className="pc-user-info">
                <div className="pc-user-details">
                  {avatarUrl && !avatarError && (
                    <div className="pc-mini-avatar" aria-hidden="true">
                      <img src={avatarUrl} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="pc-user-text">
                    <span className="pc-name">{cardName}</span>
                    <span className="pc-specialty">{title || 'Especialista en barbería'}</span>
                  </div>
                </div>
                <button
                  className="pc-contact-btn"
                  onClick={onContactClick}
                  type="button"
                  aria-label={`${contactText}: ${cardName}`}
                >
                  {contactText}
                </button>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
