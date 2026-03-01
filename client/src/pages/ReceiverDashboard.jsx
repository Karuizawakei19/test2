

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
const categoryLabel = {
  prepared_meal: 'Prepared Meal',
  baked_goods:   'Baked Goods',
  fresh_produce: 'Fresh Produce',
  packaged:      'Packaged',
  other:         'Food',
};

const categoryEmoji = {
  prepared_meal: '',
  baked_goods:   '',
  fresh_produce: '',
  packaged:      '',
  other:         '',
};

function StatusBadge({ status }) {
  const map = {
    pending:   { bg: '#fef9c3', color: '#854d0e', label: 'Pending Pickup' },
    confirmed: { bg: '#dcfce7', color: '#166534', label: 'Picked Up' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────
// RECEIVER DASHBOARD
// ─────────────────────────────────────────
function ReceiverDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const navigate = useNavigate();
  const name = localStorage.getItem('name');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    api.get('/reservations/mine', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setReservations(res.data.reservations))
      .catch(() => setError('Could not load your reservation history.'))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    localStorage.clear();
    navigate('/');
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#888' }}>Loading your history...</p>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ padding: '40px' }}>
      <p style={{ color: 'red', background: '#fff0f0', padding: '12px', borderRadius: '8px' }}>{error}</p>
    </div>
  );

  const pending   = reservations.filter(r => r.status === 'pending');
  const confirmed = reservations.filter(r => r.status === 'confirmed');

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>
               {name || 'Receiver'}'s Dashboard
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              Your food reservation history
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 18px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '500',
            }}
          >
            Logout
          </button>
        </div>

        {/* ── Browse button ── */}
        <button
          onClick={() => navigate('/browse')}
          style={{
            width: '100%',
            padding: '14px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '28px',
          }}
        >
          🍱 Browse Available Food
        </button>

        {/* ── Summary pills ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <SummaryPill emoji="" label="Total Reserved" value={reservations.length} color="#3b82f6" />
          <SummaryPill emoji="" label="Pending Pickup" value={pending.length}   color="#f59e0b" />
          <SummaryPill emoji="" label="Successfully Picked Up" value={confirmed.length} color="#22c55e" />
        </div>

        {/* ── Empty state ── */}
        {reservations.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            color: '#94a3b8',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}></div>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>No reservations yet.</p>
            <p style={{ fontSize: '14px', marginTop: '6px' }}>
              Browse available food and reserve something nearby!
            </p>
          </div>
        )}

        {/* ── Pending pickups section ── */}
        {pending.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>
               Waiting for Pickup ({pending.length})
            </h3>
            {pending.map(r => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </section>
        )}

        {/* ── Past pickups section ── */}
        {confirmed.length > 0 && (
          <section>
            <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>
               Past Pickups ({confirmed.length})
            </h3>
            {confirmed.map(r => (
              <ReservationCard key={r.id} reservation={r} dimmed />
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
function ReservationCard({ reservation, dimmed = false }) {
  const { listing, status, reservedAt } = reservation;

  return (
    <div style={{
      display: 'flex',
      gap: '14px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '14px',
      marginBottom: '12px',
      opacity: dimmed ? 0.7 : 1,
    }}>

      {/* Image placeholder */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
        flexShrink: 0,
      }}>
        {categoryEmoji[listing?.foodCategory] || ''}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {listing?.foodName || 'Unknown Food'}
          </h4>
          <StatusBadge status={status} />
        </div>

        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
          by {listing?.provider?.name || 'Unknown Provider'}
        </p>

        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
          {categoryLabel[listing?.foodCategory] || '🍽️ Food'}
          &nbsp;·&nbsp;
          {listing?.quantity} serving{listing?.quantity !== 1 ? 's' : ''}
        </p>

        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
          {listing?.address}
        </p>

        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>
          Reserved on {new Date(reservedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          {' at '}
          {new Date(reservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────
// SUMMARY PILL
// ─────────────────────────────────────────
function SummaryPill({ emoji, label, value, color }) {
  return (
    <div style={{
      flex: 1,
      minWidth: '100px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '12px 16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '20px' }}>{emoji}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

export default ReceiverDashboard;