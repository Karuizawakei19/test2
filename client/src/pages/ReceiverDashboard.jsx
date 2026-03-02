import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast, showConfirm } from '../components/Toast';
import RatingModal from '../components/RatingModal';
import api from '../api';
import '../styles/dashboard.css';
import {
  ClipboardList, ShoppingBag, Clock, CheckCircle2,
  XCircle, Package, MapPin, Star, User, LogOut,
  Handshake, UtensilsCrossed, History,
} from 'lucide-react';

const categoryLabel = {
  prepared_meal: 'Prepared Meal', baked_goods: 'Baked Goods',
  fresh_produce: 'Fresh Produce', packaged: 'Packaged', other: 'Food',
};
const categoryIcon = {
  prepared_meal: <UtensilsCrossed size={28} color="#c8862a" />,  
baked_goods:   <UtensilsCrossed size={28} color="#c8862a" />,  
fresh_produce: <UtensilsCrossed size={28} color="#c8862a" />,  
packaged:      <Package size={28} color="#c8862a" />,  
other:         <UtensilsCrossed size={28} color="#c8862a" />,  
};

export default function ReceiverDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratedIds,     setRatedIds]     = useState(new Set());
  const [activeTab,    setActiveTab]    = useState('active');

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
    <div className="db-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#a08050' }}>Loading your history...</p>
    </div>
  );
  if (error) return (
    <div className="db-page">
      <p style={{ color: '#ef4444', background: '#fff0f0', padding: '12px', borderRadius: '8px' }}>{error}</p>
    </div>
  );

  const active    = reservations.filter(r => ['pending', 'accepted'].includes(r.status));
  const completed = reservations.filter(r => r.status === 'confirmed');
  const declined  = reservations.filter(r => ['declined', 'cancelled'].includes(r.status));
  const totalSaved = completed.length;

  // Pick the first accepted reservation for the right panel hero
  const heroRes = active.find(r => r.status === 'accepted') || active[0] || null;

  return (
    <div className="db-page">

      {/* ── Page Header ── */}
      <div className="db-page-header">
        <div>
          <h2><User size={20} /> {name || 'Receiver'}&apos;s Dashboard</h2>
          <p>Your food rescue history</p>
        </div>
        <button className="db-logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Stats row — full-width above layout */}
      <div style={{ maxWidth: 1200, margin: '0 auto 20px' }}>
        <div className="db-stats">
          {[
            { icon: <ClipboardList size={18} />, label: 'Total',    value: reservations.length, color: '#5a7fc4' },
            { icon: <Clock size={18} />,         label: 'Active',   value: active.length,       color: '#d97706' },
            { icon: <CheckCircle2 size={18} />,  label: 'Rescued',  value: totalSaved,          color: '#16a34a' },
            { icon: <XCircle size={18} />,       label: 'Declined', value: declined.length,     color: '#dc2626' },
          ].map(s => (
            <div key={s.label} className="db-stat-card">
              <div className="db-stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="db-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="db-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="db-layout">

        {/* ══════════════════════════
            LEFT COLUMN
        ══════════════════════════ */}
        <div className="db-left">

          {/* Browse CTA */}
          <button className="db-cta-btn" onClick={() => navigate('/browse')}>  
            <ShoppingBag size={18} /> Browse Available Food
          </button>

          {/* Tab bar */}
          <div className="db-tabs">
            <button
              className={'db-tab' + (activeTab === 'active' ? ' active' : '')}
              onClick={() => setActiveTab('active')}
            >
              <Clock size={14} /> Active{active.length > 0 ? ` (${active.length})` : ''}
            </button>
            <button
              className={'db-tab' + (activeTab === 'history' ? ' active' : '')}
              onClick={() => setActiveTab('history')}
            >
              <History size={14} /> History ({completed.length + declined.length})
            </button>
          </div>

          {/* ── ACTIVE tab ── */}
          {activeTab === 'active' && (
            <div>
              {reservations.length === 0 && (
                <div className="db-empty">
                  <Package size={36} />
                  <p style={{ fontWeight: 600 }}>No reservations yet.</p>
                  <p style={{ fontSize: 13 }}>Browse available food and reserve something nearby!</p>
                </div>
              )}
              {active.length === 0 && reservations.length > 0 && (
                <div className="db-empty">
                  <CheckCircle2 size={36} />
                  <p style={{ fontWeight: 600 }}>No active reservations.</p>
                  <p style={{ fontSize: 13 }}>Check the History tab to see past pickups.</p>
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
            </div>
          )}

          {/* ── HISTORY tab ── */}
          {activeTab === 'history' && (
            <div>
              {/* Summary pills */}
              <div className="db-history-pills">
                {[
                  { label: 'Meals Rescued', value: completed.length, color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
                  { label: 'Declined',      value: declined.filter(r => r.status === 'declined').length,  color: '#dc2626', bg: '#fff0f0', border: '#fca5a5' },
                  { label: 'Cancelled',     value: declined.filter(r => r.status === 'cancelled').length, color: '#a08050', bg: '#f5f0e8', border: '#e2d9c8' },
                ].map(s => (
                  <div key={s.label} className="db-history-pill" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <div className="value" style={{ color: s.color }}>{s.value}</div>
                    <div className="label" style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {completed.length === 0 && declined.length === 0 && (
                <div className="db-empty">
                  <History size={32} />
                  <p>No history yet.</p>
                </div>
              )}

              {completed.length > 0 && (
                <section style={{ marginBottom: 20 }}>
                  <p className="db-section-title" style={{ color: '#16a34a' }}>
                    Rescued Meals ({completed.length})
                  </p>
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

              {declined.length > 0 && (
                <section>
                  <p className="db-section-title" style={{ color: '#dc2626' }}>
                    Declined / Cancelled ({declined.length})
                  </p>
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
            </div>
          )}
        </div>

        {/* ══════════════════════════
            RIGHT COLUMN — Active connection hero
        ══════════════════════════ */}
        <div className="db-right">
          {!heroRes ? (
            <div className="db-hero-empty">
              <ShoppingBag size={56} />
              <p style={{ fontWeight: 700, fontSize: 17, color: '#7c5c2e' }}>Nothing active right now</p>
              <p>When your reservation is accepted, your pickup details will appear here.</p>
              <button className="db-cta-btn" style={{ maxWidth: 240, marginTop: 8 }} onClick={() => navigate('/browse')}>  
                <ShoppingBag size={16} /> Browse Food
              </button>
            </div>
          ) : (
            <div className="db-connection-panel">

              {/* Header */}
              <div className="db-connection-header">
                <div>
                  <p className="db-connection-title">{heroRes.listing?.foodName}</p>
                  <p className="db-connection-sub">
                    by{' '}
                    <span
                      onClick={() => navigate(`/provider/${heroRes.listing?.provider?.id}`)}
                      style={{ color: '#5a7fc4', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      {heroRes.listing?.provider?.name}
                    </span>
                  </p>
                </div>
                <span className={'db-badge ' + (heroRes.status === 'accepted' ? 'db-badge-accepted' : 'db-badge-pending')}>  
                  {heroRes.status === 'accepted' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                  {heroRes.status === 'accepted' ? 'Accepted — Go Pick Up!' : 'Waiting for Acceptance'}
                </span>
              </div>

              {/* Food image */}
              {heroRes.listing?.imageUrl && (
                <div style={{ borderRadius: 14, overflow: 'hidden', maxHeight: 200 }}>
                  <img src={heroRes.listing.imageUrl} alt={heroRes.listing.foodName} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                </div>
              )}

              {/* Details */}
              <div className="db-info-box beige">
                <p style={{ margin: 0, fontSize: 13, color: '#7c5c2e', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={13} /> {heroRes.listing?.address}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7c5c2e', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UtensilsCrossed size={13} /> {categoryLabel[heroRes.listing?.foodCategory] || 'Food'} &nbsp;·&nbsp; {heroRes.listing?.quantity} serving{heroRes.listing?.quantity !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Action buttons for accepted */}
              {heroRes.status === 'accepted' && (
                <>  
                  <button className="db-btn db-btn-chat db-btn-full" onClick={() => navigate(`/chat/${heroRes.id}`)}>
                    <Package size={16} /> Open Chat & View Map
                  </button>

                  {/* Dual confirmation */}
                  <div className="db-confirm-box">
                    <p className="label">Pickup Confirmation</p>
                    <div className="db-confirm-pills">
                      <div className={'db-confirm-pill ' + (heroRes.providerConfirmed ? 'done' : 'waiting')}>  
                        <div className="pill-icon">{heroRes.providerConfirmed ? <CheckCircle2 size={13} color="#166534" /> : <Clock size={13} color="#94a3b8" />}</div>
                        <div className="pill-label">Provider</div>
                      </div>
                      <div className={'db-confirm-pill ' + (heroRes.receiverConfirmed ? 'done' : 'waiting')}>  
                        <div className="pill-icon">{heroRes.receiverConfirmed ? <CheckCircle2 size={13} color="#166534" /> : <Clock size={13} color="#94a3b8" />}</div>
                        <div className="pill-label">You</div>
                      </div>
                    </div>
                    {!heroRes.receiverConfirmed ? (
                      <button className="db-btn db-btn-accept db-btn-full" onClick={() => handleReceiverConfirm(heroRes.id)}>
                        <Handshake size={15} /> I Received the Food
                      </button>
                    ) : (
                      <p style={{ textAlign: 'center', fontSize: 13, color: '#16a34a', fontWeight: 600, margin: 0 }}>
                        <CheckCircle2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        You confirmed receipt
                        {!heroRes.providerConfirmed && (
                          <span style={{ display: 'block', fontSize: 12, color: '#d97706', fontWeight: 400, marginTop: 3 }}>
                            Waiting for provider to confirm handoff...
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Cancel if pending */}
              {heroRes.status === 'pending' && (
                <button className="db-btn db-btn-cancel" onClick={() => handleCancel(heroRes.id)}>
                  Cancel Reservation
                </button>
              )}
            </div>
          )}

        </div>

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
// RESERVATION CARD (left column compact view)
// ─────────────────────────────────────────
function ReservationCard({
  reservation, onCancel, onReceiverConfirm, navigate,
  dimmed = false, alreadyRated = false, onRate = null,
}) {
  const { listing, status, reservedAt, receiverNote, providerNote, acceptedAt } = reservation;

  const statusCfg = {
    pending:   { bar: 'pending',   icon: <Clock size={13} />,        label: 'Waiting for provider to accept' },
    accepted:  { bar: 'accepted',  icon: <CheckCircle2 size={13} />, label: 'Accepted — Go pick it up!' },
    declined:  { bar: 'declined',  icon: <XCircle size={13} />,      label: 'Declined by provider' },
    confirmed: { bar: 'confirmed', icon: <CheckCircle2 size={13} />, label: 'Pickup confirmed! Food rescued.' },
    cancelled: { bar: 'cancelled', icon: <XCircle size={13} />,      label: 'Cancelled' },
  };
  const s = statusCfg[status] || statusCfg.pending;

  return (
    <div className={'db-card' + (dimmed ? ' dimmed' : '')}>

      {/* Status bar */}
      <div className={`db-card-statusbar ${s.bar}`}>  
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{s.icon} {s.label}</span>
        {status === 'accepted' && acceptedAt && (
          <span style={{ fontSize: 11, opacity: 0.8 }}>
            {new Date(acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="db-card-body">
        <div className="db-thumb">
          {listing?.imageUrl
            ? <img src={listing.imageUrl} alt={listing.foodName} />
            : (categoryIcon[listing?.foodCategory] || <UtensilsCrossed size={28} color="#c8862a" />)
          }
        </div>

        <div className="db-card-info">
          <h4>{listing?.foodName || 'Unknown Food'}</h4>
          <p className="db-card-meta">
            by{' '}
            <span
              onClick={() => navigate(`/provider/${listing?.provider?.id}`)}
              style={{ color: '#c8862a', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {listing?.provider?.name}
            </span>
            {' '}·{' '}
            {new Date(reservedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="db-card-meta" style={{ marginTop: 2 }}>
            <UtensilsCrossed size={11} /> {categoryLabel[listing?.foodCategory] || 'Food'}
            &nbsp;·&nbsp;{listing?.quantity} serving{listing?.quantity !== 1 ? 's' : ''}
          </p>
          <p className="db-card-meta" style={{ marginTop: 2 }}>
            <MapPin size={11} /> {listing?.address}
          </p>

          {receiverNote && (
            <p style={{ margin: '5px 0 0', fontSize: 12, color: '#a08050', fontStyle: 'italic' }}>
              Your note: &ldquo;{receiverNote}&rdquo;
            </p>
          )}
          {status === 'declined' && providerNote && (
            <div style={{ marginTop: 7, background: '#fee2e2', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#991b1b' }}>
              Provider&apos;s reason: &ldquo;{providerNote}&rdquo;
            </div>
          )}

          {/* Cancel */}
          {status === 'pending' && (
            <button className="db-btn db-btn-cancel" style={{ marginTop: 8 }} onClick={() => onCancel(reservation.id)}>
              Cancel Reservation
            </button>
          )}

          {/* Rate */}
          {status === 'confirmed' && !alreadyRated && onRate && (
            <button className="db-btn db-btn-rate" style={{ marginTop: 8 }} onClick={() => onRate(reservation)}>
              <Star size={13} /> Rate this provider
            </button>
          )}
          {status === 'confirmed' && alreadyRated && (
            <p style={{ margin: '7px 0 0', fontSize: 12, color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> You&apos;ve rated this pickup
            </p>
          )}
        </div>
      </div>
    </div>
  );
}