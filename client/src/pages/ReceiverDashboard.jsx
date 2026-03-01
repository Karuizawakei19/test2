import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast, showConfirm } from '../components/Toast';
import RatingModal from '../components/RatingModal';
import api from '../api';

const categoryLabel = {
  prepared_meal: '🍛 Prepared Meal', baked_goods: '🍞 Baked Goods',
  fresh_produce: '🥦 Fresh Produce', packaged: '📦 Packaged', other: '🍽️ Food',
};
const categoryEmoji = {
  prepared_meal: '🍛', baked_goods: '🍞', fresh_produce: '🥦', packaged: '📦', other: '🍽️',
};

export default function ReceiverDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratedIds,     setRatedIds]     = useState(new Set());
  const [activeTab,    setActiveTab]    = useState('active'); // 'active' | 'history'

  const navigate = useNavigate();
  const name  = localStorage.getItem('name');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchReservations();
  }, []);

  async function fetchReservations() {
    try {
      const res = await api.get('/reservations/mine', { headers });
      const all = res.data.reservations;
      setReservations(all);

      // Pre-check which confirmed ones are already rated
      const confirmed = all.filter(r => r.status === 'confirmed');
      if (confirmed.length > 0) {
        const checks = await Promise.all(
          confirmed.map(r =>
            api.get(`/ratings/check/${r.id}`, { headers })
              .then(res => res.data.rated ? r.id : null)
              .catch(() => null)
          )
        );
        setRatedIds(new Set(checks.filter(Boolean)));
      }
    } catch {
      setError('Could not load your reservation history.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(reservationId) {
    const yes = await showConfirm('Are you sure you want to cancel this reservation?', {
      confirmLabel: 'Yes, Cancel', cancelLabel: 'Keep It', type: 'warning',
    });
    if (!yes) return;
    try {
      await api.patch(`/reservations/${reservationId}/cancel`, {}, { headers });
      setReservations(prev => prev.filter(r => r.id !== reservationId));
      showToast('Reservation cancelled.', 'info');
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not cancel. Try again.', 'error');
    }
  }

  async function handleReceiverConfirm(reservationId) {
    const yes = await showConfirm(
      'Confirm that you have received the food?',
      { confirmLabel: 'Yes, I got it!', cancelLabel: 'Not yet', type: 'success' }
    );
    if (!yes) return;
    try {
      const res = await api.patch(`/reservations/${reservationId}/receiver-confirm`, {}, { headers });
      showToast(res.data.message, 'success', 4000);
      await fetchReservations();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to confirm receipt.', 'error');
    }
  }

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
      <p>Loading your history...</p>
    </div>
  );
  if (error) return (
    <div style={{ padding: '40px' }}>
      <p style={{ color: 'red', background: '#fff0f0', padding: '12px', borderRadius: '8px' }}>{error}</p>
    </div>
  );

  const active    = reservations.filter(r => ['pending', 'accepted'].includes(r.status));
  const completed = reservations.filter(r => r.status === 'confirmed');
  const declined  = reservations.filter(r => ['declined', 'cancelled'].includes(r.status));

  // Stats
  const totalSaved = completed.length;

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>👋 {name || 'Receiver'}'s Dashboard</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Your food rescue history</p>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/'); }}
            style={{ padding: '8px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#64748b', fontWeight: '500' }}
          >
            Logout
          </button>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { emoji: '📋', label: 'Total',      value: reservations.length, color: '#3b82f6' },
            { emoji: '⏳', label: 'Active',     value: active.length,       color: '#f59e0b' },
            { emoji: '✅', label: 'Rescued',    value: totalSaved,          color: '#22c55e' },
            { emoji: '❌', label: 'Declined',   value: declined.length,     color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: '70px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px' }}>{s.emoji}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Browse button ── */}
        <button
          onClick={() => navigate('/browse')}
          style={{ width: '100%', padding: '14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}
        >
          🍱 Browse Available Food
        </button>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'white', borderRadius: '12px', padding: '6px', border: '1px solid #e2e8f0' }}>
          {[
            { key: 'active',  label: `⏳ Active${active.length > 0 ? ` (${active.length})` : ''}` },
            { key: 'history', label: `📦 History (${completed.length + declined.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '9px 8px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: activeTab === tab.key ? '#22c55e' : 'transparent',
                color:      activeTab === tab.key ? 'white'   : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═════════════��════════════════════════
            TAB: ACTIVE
        ══════════════════════════════════════ */}
        {activeTab === 'active' && (
          <>
            {reservations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🫙</div>
                <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>No reservations yet.</p>
                <p style={{ fontSize: '14px', marginTop: '6px' }}>Browse available food and reserve something nearby!</p>
              </div>
            )}

            {active.length === 0 && reservations.length > 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
                <p style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>No active reservations.</p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Check the History tab to see past pickups.</p>
              </div>
            )}

            {active.map(r => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onCancel={handleCancel}
                onReceiverConfirm={handleReceiverConfirm}
                navigate={navigate}
              />
            ))}
          </>
        )}

        {/* ══════════════════════════════════════
            TAB: HISTORY
        ══════════════════════════════════════ */}
        {activeTab === 'history' && (
          <>
            {/* Summary pills */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'Meals Rescued', value: completed.length, color: '#22c55e', bg: '#f0fdf4', border: '#86efac' },
                { label: 'Declined',      value: declined.filter(r => r.status === 'declined').length,  color: '#ef4444', bg: '#fff0f0', border: '#fca5a5' },
                { label: 'Cancelled',     value: declined.filter(r => r.status === 'cancelled').length, color: '#94a3b8', bg: '#f1f5f9', border: '#e2e8f0' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, minWidth: '80px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: s.color, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {completed.length === 0 && declined.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                <p style={{ margin: 0, fontSize: '14px' }}>No history yet.</p>
              </div>
            )}

            {/* Completed pickups */}
            {completed.length > 0 && (
              <section style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', color: '#22c55e', fontWeight: '700', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ✅ Rescued Meals ({completed.length})
                </h3>
                {completed.map(r => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    onCancel={handleCancel}
                    onReceiverConfirm={handleReceiverConfirm}
                    navigate={navigate}
                    dimmed
                    alreadyRated={ratedIds.has(r.id)}
                    onRate={() => setRatingTarget(r)}
                  />
                ))}
              </section>
            )}

            {/* Declined + cancelled */}
            {declined.length > 0 && (
              <section>
                <h3 style={{ fontSize: '14px', color: '#ef4444', fontWeight: '700', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ❌ Declined / Cancelled ({declined.length})
                </h3>
                {declined.map(r => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    onCancel={handleCancel}
                    onReceiverConfirm={handleReceiverConfirm}
                    navigate={navigate}
                    dimmed
                  />
                ))}
              </section>
            )}
          </>
        )}

      </div>

      {/* ── Rating Modal ── */}
      {ratingTarget && (
        <RatingModal
          reservation={ratingTarget}
          onClose={() => setRatingTarget(null)}
          onSubmitted={() => {
            setRatedIds(prev => new Set([...prev, ratingTarget.id]));
            setRatingTarget(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// RESERVATION CARD
// ─────────────────────────────────────────
function ReservationCard({
  reservation, onCancel, onReceiverConfirm, navigate,
  dimmed = false, alreadyRated = false, onRate = null,
}) {
  const { listing, status, reservedAt, receiverNote, providerNote, acceptedAt, declinedAt } = reservation;

  const statusConfig = {
    pending:   { bg: '#fef9c3', border: '#fbbf24', color: '#854d0e', icon: '⏳', label: 'Waiting for provider to accept' },
    accepted:  { bg: '#dcfce7', border: '#86efac', color: '#166534', icon: '✅', label: 'Accepted — Go pick it up!' },
    declined:  { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '❌', label: 'Declined by provider' },
    confirmed: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '🎉', label: 'Pickup confirmed! Food rescued.' },
    cancelled: { bg: '#f1f5f9', border: '#e2e8f0', color: '#94a3b8', icon: '🚫', label: 'Cancelled' },
  };
  const s = statusConfig[status] || statusConfig.pending;

  return (
    <div style={{ background: 'white', border: `1px solid ${s.border}`, borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', opacity: dimmed ? 0.85 : 1 }}>

      {/* Status bar */}
      <div style={{ background: s.bg, padding: '8px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: s.color }}>
          {s.icon} {s.label}
        </span>
        {status === 'accepted' && acceptedAt && (
          <span style={{ fontSize: '11px', color: s.color, opacity: 0.8 }}>
            {new Date(acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Chat button — only when accepted */}
      {status === 'accepted' && (
        <div style={{ padding: '10px 14px 0' }}>
          <button
            onClick={() => navigate(`/chat/${reservation.id}`)}
            style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
          >
            💬 Open Chat & View Map
          </button>
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: '12px 14px', display: 'flex', gap: '12px' }}>

        {/* Thumbnail */}
        <div style={{ width: '64px', height: '64px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
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
            by{' '}
            <span
              onClick={() => navigate(`/provider/${listing?.provider?.id}`)}
              style={{ color: '#22c55e', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {listing?.provider?.name}
            </span>
            {' '}·{' '}
            {new Date(reservedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {categoryLabel[listing?.foodCategory] || '🍽️ Food'}
            &nbsp;·&nbsp;
            {listing?.quantity} serving{listing?.quantity !== 1 ? 's' : ''}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            📍 {listing?.address}
          </p>

          {receiverNote && (
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
              Your note: "{receiverNote}"
            </p>
          )}

          {status === 'declined' && providerNote && (
            <div style={{ marginTop: '8px', background: '#fee2e2', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', color: '#991b1b' }}>
              Provider's reason: "{providerNote}"
            </div>
          )}

          {/* Cancel — pending only */}
          {status === 'pending' && (
            <button
              onClick={() => onCancel(reservation.id)}
              style={{ marginTop: '10px', padding: '6px 14px', background: 'white', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              Cancel Reservation
            </button>
          )}

          {/* ── Dual confirmation status (accepted state) ── */}
          {status === 'accepted' && (
            <div style={{ marginTop: '10px', background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>PICKUP CONFIRMATION</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <ConfirmPill label="Provider" confirmed={reservation.providerConfirmed} />
                <ConfirmPill label="You"      confirmed={reservation.receiverConfirmed} />
              </div>

              {!reservation.receiverConfirmed ? (
                <button
                  onClick={() => onReceiverConfirm(reservation.id)}
                  style={{ width: '100%', padding: '9px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                >
                  🤝 I Received the Food
                </button>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '13px', color: '#22c55e', fontWeight: '600', padding: '6px 0' }}>
                  ✅ You confirmed receipt
                  {!reservation.providerConfirmed && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#f59e0b', fontWeight: '400' }}>
                      ⏳ Waiting for provider to confirm handoff...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rate button — confirmed + not yet rated */}
          {status === 'confirmed' && !alreadyRated && onRate && (
            <button
              onClick={() => onRate(reservation)}
              style={{ marginTop: '10px', padding: '7px 16px', background: '#fef3c7', border: '1px solid #fbbf24', color: '#92400e', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              ⭐ Rate this provider
            </button>
          )}

          {status === 'confirmed' && alreadyRated && (
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#22c55e', fontWeight: '500' }}>
              ✅ You've rated this pickup
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmPill({ label, confirmed }) {
  return (
    <div style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', textAlign: 'center', background: confirmed ? '#dcfce7' : '#f1f5f9', border: `1px solid ${confirmed ? '#86efac' : '#e2e8f0'}` }}>
      <div style={{ fontSize: '13px' }}>{confirmed ? '✅' : '⬜'}</div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: confirmed ? '#166534' : '#94a3b8', marginTop: '1px' }}>{label}</div>
    </div>
  );
}