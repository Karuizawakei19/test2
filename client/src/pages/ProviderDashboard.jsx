import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ── Status badge ──
function StatusBadge({ status }) {
  const map = {
    available: { bg: '#dcfce7', color: '#166534',  label: '🟢 Available' },
    reserved:  { bg: '#fef9c3', color: '#854d0e',  label: '⏳ Pending Acceptance' },
    accepted:  { bg: '#dbeafe', color: '#1e40af',  label: '✅ Accepted — Awaiting Pickup' },
    picked_up: { bg: '#f1f5f9', color: '#475569',  label: '📦 Picked Up' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: '600',
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function getTimeLabel(expiresAt) {
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return 'Expired';
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const minsLeft  = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  if (hoursLeft === 0) return `${minsLeft}m left`;
  if (hoursLeft < 3)   return `${hoursLeft}h ${minsLeft}m left`;
  return `${hoursLeft}h ${minsLeft}m left`;
}

function ProviderDashboard() {
  const [listings,     setListings]     = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [declineId,    setDeclineId]    = useState(null);
  const [declineNote,  setDeclineNote]  = useState('');

  const navigate = useNavigate();
  const name  = localStorage.getItem('name');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [listingsRes, reservationsRes] = await Promise.all([
        api.get('/listings/mine',        { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/reservations/pending', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setListings(listingsRes.data.listings);
      setReservations(reservationsRes.data.reservations);
    } catch {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(reservationId) {
    try {
      await api.patch(`/reservations/${reservationId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept.');
    }
  }

  async function handleDecline(reservationId) {
    try {
      await api.patch(`/reservations/${reservationId}/decline`,
        { providerNote: declineNote || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeclineId(null);
      setDeclineNote('');
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to decline.');
    }
  }

  async function handleConfirmPickup(listingId) {
    try {
      await api.patch(`/listings/${listingId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAll();
      alert('Pickup confirmed! Food has been rescued. 🎉');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm.');
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><p>Loading dashboard...</p></div>;
  if (error)   return <div style={{ padding: '40px' }}><p style={{ color: 'red' }}>{error}</p></div>;

  const pendingRes  = reservations.filter(r => r.status === 'pending');
  const acceptedRes = reservations.filter(r => r.status === 'accepted');

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>🍱 {name || 'Provider'}'s Dashboard</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Manage your listings and reservations</p>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/'); }}
            style={{ padding: '8px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}
          >
            Logout
          </button>
        </div>

        {/* ── Post button ── */}
        <button
          onClick={() => navigate('/post')}
          style={{ width: '100%', padding: '14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginBottom: '28px' }}
        >
          + Post New Food Listing
        </button>

        {/* ══════════════════════════════════════
            SECTION 1 — PENDING: accept or decline
        ══════════════════════════════════════ */}
        {pendingRes.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
              🔔 Pending Reservations ({pendingRes.length})
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0, marginBottom: '16px' }}>
              These receivers are waiting for your response.
            </p>

            {pendingRes.map(r => (
              <div key={r.id} style={{ background: 'white', border: '2px solid #fbbf24', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>

                {/* Food name + time reserved */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>{r.listing.foodName}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Reserved {new Date(r.reservedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <StatusBadge status="reserved" />
                </div>

                {/* Receiver info card */}
                <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '12px', marginBottom: '12px', border: '1px solid #fde68a' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    👤 {r.receiver.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                    {r.receiver.email}
                  </p>
                  {r.receiverNote && (
                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#475569', fontStyle: 'italic', borderTop: '1px solid #fde68a', paddingTop: '8px' }}>
                      💬 "{r.receiverNote}"
                    </p>
                  )}
                </div>

                {/* Decline reason input — shown only when this card's decline is open */}
                {declineId === r.id && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                      Reason for declining <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(optional)</span>
                    </label>
                    <textarea
                      value={declineNote}
                      onChange={e => setDeclineNote(e.target.value)}
                      placeholder="e.g. Sorry, food was already given away."
                      rows={2}
                      maxLength={200}
                      style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {/* Accept / Decline buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {declineId === r.id ? (
                    <>
                      <button
                        onClick={() => handleDecline(r.id)}
                        style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                      >
                        Confirm Decline
                      </button>
                      <button
                        onClick={() => { setDeclineId(null); setDeclineNote(''); }}
                        style={{ padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAccept(r.id)}
                        style={{ flex: 1, padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => setDeclineId(r.id)}
                        style={{ flex: 1, padding: '10px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                      >
                        ❌ Decline
                      </button>
                    </>
                  )}
                </div>

              </div>
            ))}
          </section>
        )}

        {/* ══════════════════════════════════════
            SECTION 2 — ACCEPTED: waiting for pickup
            ↑ THIS IS WHERE THE OPEN CHAT BUTTON IS
        ══════════════════════════════════════ */}
        {acceptedRes.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '12px' }}>
              🚶 Accepted — Waiting for Pickup ({acceptedRes.length})
            </h3>

            {acceptedRes.map(r => (
              <div key={r.id} style={{ background: 'white', border: '2px solid #3b82f6', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>{r.listing.foodName}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Accepted {new Date(r.acceptedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <StatusBadge status="accepted" />
                </div>

                {/* Receiver info */}
                <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '12px', marginBottom: '14px', border: '1px solid #bfdbfe' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    👤 {r.receiver.name} is on the way
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>{r.receiver.email}</p>
                  {r.receiverNote && (
                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#475569', fontStyle: 'italic', borderTop: '1px solid #bfdbfe', paddingTop: '8px' }}>
                      💬 "{r.receiverNote}"
                    </p>
                  )}
                </div>

                {/* ── OPEN CHAT BUTTON ── */}
                <button
                  onClick={() => navigate(`/chat/${r.id}`)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: '10px',
                  }}
                >
                  💬 Open Chat with {r.receiver.name}
                </button>

                {/* Confirm pickup */}
                <button
                  onClick={() => handleConfirmPickup(r.listingId)}
                  style={{ width: '100%', padding: '11px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  📦 Confirm Food Was Picked Up
                </button>

              </div>
            ))}
          </section>
        )}

        {/* ══════════════════════════════════════
            SECTION 3 — ALL LISTINGS
        ══════════════════════════════════════ */}
        <section>
          <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '12px' }}>
            📋 Your Listings ({listings.length})
          </h3>

          {listings.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
              <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>No listings yet.</p>
              <p style={{ fontSize: '14px', marginTop: '6px' }}>Click "+ Post New Food Listing" to get started.</p>
            </div>
          )}

          {listings.map(listing => (
            <div key={listing.id} style={{
              background: listing.status === 'picked_up' ? '#f8fafc' : 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              opacity: listing.status === 'picked_up' ? 0.65 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>{listing.foodName}</h4>
                <StatusBadge status={listing.status} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                {getTimeLabel(listing.expiresAt)}
                {' · '}Qty: {listing.quantity}
                {' · '}₱{listing.currentPrice}
                {listing.currentPrice < listing.originalPrice && (
                  <s style={{ color: '#aaa', marginLeft: '6px' }}>₱{listing.originalPrice}</s>
                )}
                {' · '}{listing.address}
              </p>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}

export default ProviderDashboard;