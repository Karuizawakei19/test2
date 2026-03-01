

export default function DisclaimerModal({ onAccept, onDecline }) {
  return (
    // Backdrop
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Modal */}
      <div style={{
        background: 'white', borderRadius: '16px',
        maxWidth: '440px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '20px 24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            Food Safety Notice
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#92400e' }}>
            Please read before your first pickup
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#374151', lineHeight: '1.65' }}>
            <strong>RescueBite</strong> is a community platform that connects people with surplus food. By reserving food you acknowledge:
          </p>

          {[
            { icon: '🧑‍🍳', text: 'Food safety is the responsibility of the <strong>provider</strong> who listed it.' },
            { icon: '👁️', text: 'Always <strong>inspect food before consuming</strong> it. If it looks, smells, or feels off — do not eat it.' },
            { icon: '🌡️', text: 'Follow the stated <strong>storage conditions</strong> (room temperature, refrigerated, or frozen).' },
            { icon: '⏰', text: 'Respect <strong>expiry dates and pickup windows</strong>. Late pickups may result in a no-show record.' },
            { icon: '🚫', text: '<strong>RescueBite is not liable</strong> for any food-related illness or damages arising from community food sharing.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
              <p
                style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.55' }}
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            </div>
          ))}

          <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534' }}>
            🌱 By accepting, you join our mission to rescue good food from going to waste. Thank you!
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => {
              localStorage.setItem('hasAcceptedDisclaimer', 'true');
              onAccept();
            }}
            style={{
              width: '100%', padding: '13px',
              background: '#22c55e', color: 'white',
              border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '15px', fontWeight: '700',
            }}
          >
            ✅ I Understand — Continue to Reserve
          </button>
          <button
            onClick={onDecline}
            style={{
              width: '100%', padding: '11px',
              background: 'white', color: '#64748b',
              border: '1px solid #e2e8f0', borderRadius: '10px',
              cursor: 'pointer', fontSize: '14px', fontWeight: '500',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}