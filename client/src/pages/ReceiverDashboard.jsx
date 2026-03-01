import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const categoryLabel = {
  prepared_meal: '🍛 Prepared Meal',
  baked_goods:   '🍞 Baked Goods',
  fresh_produce: '🥦 Fresh Produce',
  packaged:      '📦 Packaged',
  other:         '🍽️ Food',
};

const categoryEmoji = {
  prepared_meal: '🍛',
  baked_goods:   '🍞',
  fresh_produce: '🥦',
  packaged:      '📦',
  other:         '🍽️',
};

// ─────────────────────────────────────────
// RECEIVER DASHBOARD
// ─────────────────────────────────────────
function ReceiverDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const navigate = useNavigate();
  const name  = localStorage.getItem('name');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchReservations();
  }, []);

  async function fetchReservations() {
    try {
      const res = await api.get('/reservations/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(res.data.reservations);
    } catch {
      setError('Could not load your reservation history.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(reservationId) {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.patch(`/reservations/${reservationId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(prev => prev.filter(r => r.id !== reservationId));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel. Try again.');
    }
  }

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#888' }}>Loading your history...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '40px' }}>
      <p style={{ color: 'red', background: '#fff0f0', padding: '12px', borderRadius: '8px' }}>{error}</p>
    </div>
  );

  // Count by status
  const active    = reservations.filter(r => ['pending', 'accepted'].includes(r.status));
  const completed = reservations.filter(r => r.status === 'confirmed');
  const declined  = reservations.filter(r => r.status === 'declined');

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>
              👋 {name || 'Receiver'}'s Dashboard
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              Your food reservation history
            </p>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/'); }}
            style={{ padding: '8px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#64748b', fontWeight: '500' }}
          >
            Logout
          </button>
        </div>

        {/* ── Browse button ── */}
        <button
          onClick={() => navigate('/browse')}
          style={{ width: '100%', padding: '14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginBottom: '24px' }}
        >
          🍱 Browse Available Food
        </button>

        {/* ── Summary pills ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <SummaryPill emoji="📋" label="Total"     value={reservations.length} color="#3b82f6" />
          <SummaryPill emoji="⏳" label="Active"    value={active.length}       color="#f59e0b" />
          <SummaryPill emoji="✅" label="Picked Up" value={completed.length}    color="#22c55e" />
          <SummaryPill emoji="❌" label="Declined"  value={declined.length}     color="#ef4444" />
        </div>

        {/* ── Empty state ── */}
        {reservations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🫙</div>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>No reservations yet.</p>
            <p style={{ fontSize: '14px', marginTop: '6px' }}>Browse available food and reserve something nearby!</p>
          </div>
        )}

        {/* ── Active reservations (pending + accepted) ── */}
        {active.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>
              ⏳ Active Reservations ({active.length})
            </h3>
            {active.map(r => (
              <ReservationCard key={r.id} reservation={r} onCancel={handleCancel} navigate={navigate} />
            ))}
          </section>
        )}

        {/* ── Declined reservations ── */}
        {declined.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>
              ❌ Declined ({declined.length})
            </h3>
            {declined.map(r => (
              <ReservationCard key={r.id} reservation={r} onCancel={handleCancel} navigate={navigate} dimmed />
            ))}
          </section>
        )}

        {/* ── Completed pickups ── */}
        {completed.length > 0 && (
          <section>
            <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>
              ✅ Past Pickups ({completed.length})
            </h3>
            {completed.map(r => (
              <ReservationCard key={r.id} reservation={r} onCancel={handleCancel} navigate={navigate} dimmed />
            ))}
          </section>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// RESERVATION CARD
// ─────────────────────────────────────────
function ReservationCard({ reservation, onCancel, navigate, dimmed = false }) {
  const { listing, status, reservedAt, receiverNote, providerNote, acceptedAt, declinedAt } = reservation;

  // Status bar config
  const statusConfig = {
    pending:   { bg: '#fef9c3', border: '#fbbf24', color: '#854d0e', icon: '⏳', label: 'Waiting for provider to accept' },
    accepted:  { bg: '#dcfce7', border: '#86efac', color: '#166534', icon: '✅', label: 'Accepted — Go pick it up!' },
    declined:  { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '❌', label: 'Declined by provider' },
    confirmed: { bg: '#f1f5f9', border: '#e2e8f0', color: '#475569', icon: '📦', label: 'Picked up successfully' },
    cancelled: { bg: '#f1f5f9', border: '#e2e8f0', color: '#94a3b8', icon: '🚫', label: 'Cancelled' },
  };
  const s = statusConfig[status] || statusConfig.pending;

  return (
    <div style={{ background: 'white', border: `1px solid ${s.border}`, borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', opacity: dimmed ? 0.75 : 1 }}>

      {/* ── Status bar at top ── */}
      <div style={{ background: s.bg, padding: '8px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: s.color }}>
          {s.icon} {s.label}
        </span>
        {status === 'accepted' && acceptedAt && (
          <span style={{ fontSize: '11px', color: s.color, opacity: 0.8 }}>
            {new Date(acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {status === 'declined' && declinedAt && (
          <span style={{ fontSize: '11px', color: s.color, opacity: 0.8 }}>
            {new Date(declinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* ── OPEN CHAT BUTTON — only when accepted ── */}
      {status === 'accepted' && (
        <div style={{ padding: '10px 14px 0' }}>
          <button
            onClick={() => navigate(`/chat/${reservation.id}`)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            💬 Open Chat & View Map
          </button>
        </div>
      )}

      {/* ── Card body ── */}
      <div style={{ padding: '12px 14px', display: 'flex', gap: '12px' }}>

        {/* Image / emoji */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '10px', flexShrink: 0,
          overflow: 'hidden', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
        }}>
          {listing?.imageUrl
            ? <img src={listing.imageUrl} alt={listing.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (categoryEmoji[listing?.foodCategory] || '🍽️')
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>
            {listing?.foodName || 'Unknown Food'}
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            by {listing?.provider?.name} · {new Date(reservedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {categoryLabel[listing?.foodCategory] || '🍽️ Food'}
            &nbsp;·&nbsp;
            {listing?.quantity} serving{listing?.quantity !== 1 ? 's' : ''}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            📍 {listing?.address}
          </p>

          {/* Your note to provider */}
          {receiverNote && (
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
              Your note: "{receiverNote}"
            </p>
          )}

          {/* Provider's decline reason */}
          {status === 'declined' && providerNote && (
            <div style={{ marginTop: '8px', background: '#fee2e2', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', color: '#991b1b' }}>
              Provider's reason: "{providerNote}"
            </div>
          )}

          {/* Cancel button — only for pending */}
          {status === 'pending' && (
            <button
              onClick={() => onCancel(reservation.id)}
              style={{ marginTop: '10px', padding: '6px 14px', background: 'white', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              Cancel Reservation
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SUMMARY PILL
// ─────────────────────────────────────────
function SummaryPill({ emoji, label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: '80px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '18px' }}>{emoji}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

export default ReceiverDashboard;