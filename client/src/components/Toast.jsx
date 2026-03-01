import { createRoot } from 'react-dom/client';

// ── Types: 'success' | 'error' | 'info' | 'warning' ──
const TYPE_STYLES = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '✅', accent: '#16a34a' },
  error:   { bg: '#fff0f0', border: '#fca5a5', icon: '❌', accent: '#dc2626' },
  warning: { bg: '#fffbeb', border: '#fcd34d', icon: '⚠️', accent: '#d97706' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: 'ℹ️', accent: '#2563eb' },
};

// ─────────────────────────────────────────
// TOAST — slides in from top, auto-dismisses
// ─────────────────────────────────────────
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  function remove() {
    root.unmount();
    container.remove();
  }

  const s = TYPE_STYLES[type] || TYPE_STYLES.info;

  root.render(
    <ToastUI message={message} s={s} onClose={remove} duration={duration} />
  );
}

function ToastUI({ message, s, onClose, duration }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));
    // Auto-close
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 320);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: visible ? '20px' : '-100px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      transition: 'top 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      maxWidth: '420px',
      width: 'calc(100% - 32px)',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderLeft: `4px solid ${s.accent}`,
      borderRadius: '12px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{s.icon}</span>
      <p style={{ margin: 0, flex: 1, fontSize: '14px', color: '#1e293b', lineHeight: '1.5' }}>
        {message}
      </p>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 320); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', padding: 0, lineHeight: 1, flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// CONFIRM DIALOG — replaces window.confirm()
// Returns a Promise<boolean>
// ─────────────────────────────────────────
export function showConfirm(message, { confirmLabel = 'Confirm', cancelLabel = 'Cancel', type = 'warning' } = {}) {
  return new Promise(resolve => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    function close(result) {
      root.unmount();
      container.remove();
      resolve(result);
    }

    const s = TYPE_STYLES[type] || TYPE_STYLES.warning;
    const ACCENT_COLORS = {
      warning: '#d97706',
      error:   '#dc2626',
      success: '#16a34a',
      info:    '#2563eb',
    };

    root.render(
      <ConfirmUI
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        s={s}
        accentColor={ACCENT_COLORS[type] || ACCENT_COLORS.warning}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    );
  });
}

function ConfirmUI({ message, confirmLabel, cancelLabel, s, accentColor, onConfirm, onCancel }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    // Backdrop
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Dialog card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px 24px',
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          transform: visible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '40px' }}>{s.icon}</span>
        </div>

        {/* Message */}
        <p style={{
          margin: '0 0 24px',
          fontSize: '15px',
          color: '#1e293b',
          textAlign: 'center',
          lineHeight: '1.55',
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px',
              background: 'white', color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '10px', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px',
              background: accentColor, color: 'white',
              border: 'none',
              borderRadius: '10px', cursor: 'pointer',
              fontWeight: '700', fontSize: '14px',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Need React in scope for JSX in this non-.jsx file pattern
import React from 'react';