

import { createRoot } from 'react-dom/client';

// ─────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const colors = {
    success: { bg: '#22c55e', color: 'white' },
    error:   { bg: '#ef4444', color: 'white' },
    info:    { bg: '#3b82f6', color: 'white' },
    warning: { bg: '#f59e0b', color: 'white' },
  };
  const { bg, color } = colors[type] || colors.info;

  root.render(
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(-50%)',
      background: bg, color,
      padding: '12px 20px', borderRadius: '10px',
      fontSize: '14px', fontWeight: '600',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      zIndex: 9999, maxWidth: '360px',
      textAlign: 'center', lineHeight: '1.4',
      animation: 'fadeInUp 0.2s ease',
    }}>
      {message}
    </div>
  );

  setTimeout(() => {
    root.unmount();
    document.body.removeChild(container);
  }, duration);
}

// ─────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────
export function showConfirm(message, {
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  type         = 'danger',  // 'danger' | 'success' | 'warning'
} = {}) {
  return new Promise(resolve => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const confirmColor =
      type === 'success' ? '#22c55e' :
      type === 'warning' ? '#f59e0b' : '#ef4444';

    function cleanup(result) {
      root.unmount();
      document.body.removeChild(container);
      resolve(result);
    }

    root.render(
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '24px',
      }}>
        <div style={{
          background: 'white', borderRadius: '14px',
          padding: '24px 20px', maxWidth: '340px', width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#1e293b', lineHeight: '1.5', fontWeight: '500' }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => cleanup(false)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: '1px solid #e2e8f0', background: 'white',
                color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => cleanup(true)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: 'none', background: confirmColor,
                color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  });
}