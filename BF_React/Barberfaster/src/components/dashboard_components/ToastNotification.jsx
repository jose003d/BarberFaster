import { useEffect } from 'react';

const ToastNotification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgStyle = type === 'success' ? 'var(--bauhaus-cyan-light)' : '#ffcccc';
  const borderStyle = type === 'success' ? 'var(--bauhaus-ink)' : '#c31818';

  return (
    <div className="toast-notification-container">
      <div 
        className="p-3 d-flex align-items-center gap-3" 
        style={{
          backgroundColor: bgStyle,
          border: `3px solid ${borderStyle}`,
          boxShadow: '4px 4px 0 var(--bauhaus-ink)',
          minWidth: '300px',
          fontFamily: 'Satoshi, sans-serif',
          fontWeight: 700
        }}
      >
        <i className="bi bi-check-circle-fill fs-4" style={{ color: borderStyle }}></i>
        <div className="flex-grow-1" style={{ fontSize: '0.9rem', color: 'var(--bauhaus-ink)' }}>
          {message}
        </div>
        <button type="button" className="btn-close" onClick={onClose}></button>
      </div>
    </div>
  );
};

export default ToastNotification;