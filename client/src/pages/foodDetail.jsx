// client/src/pages/FoodDetail.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import DisclaimerModal from '../components/DisclaimerModal';


const categoryLabel = {
  prepared_meal: 'Prepared Meal', baked_goods: 'Baked Goods',
  fresh_produce:  'Fresh Produce', packaged:    'Packaged',   other: 'Food',
};
const categoryEmoji = {
  prepared_meal: '🍛', baked_goods: '🍞',
  fresh_produce: '🥦', packaged:    '📦', other: '🍽️',
};
const storageLabel = {
  room_temp:    '🌡️ Room Temperature',
  refrigerated: '❄️ Refrigerated',
  frozen:       '🧊 Frozen',
};

function getTimeInfo(expiresAt) {
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return { text: 'Expired', color: '#6b7280', urgent: false };
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  if (h === 0) return { text: `${m}m left — URGENT`, color: '#ef4444', urgent: true };
  if (h < 3)   return { text: `${h}h ${m}m left`,    color: '#f59e0b', urgent: false };
  return         { text: `${h}h ${m}m left`,          color: '#22c55e', urgent: false };
}

export default function FoodDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');
  const role     = localStorage.getItem('role');

  const [listing,        setListing]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [reserving,      setReserving]      = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [reserveError,   setReserveError]   = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchListing();
  }, [id]);

  // ── Fetch single listing directly by ID ──
  async function fetchListing() {
    setLoading(true);
    setError('');
    try {
      // Try to attach location for distance, but don't block on it
      let params = '';
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
        );
        params = `?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`;
      } catch {
        // location denied or timed out — that's fine, distance just won't show
      }

      const res = await api.get(`/listings/${id}${params}`);
      setListing(res.data.listing);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('This listing no longer exists or has been removed.');
      } else {
        setError('Could not load listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Called after disclaimer is accepted (or if already accepted) ──
  async function handleReserve() {
    setReserving(true);
    setReserveError('');
    try {
      await api.post(
        `/listings/${id}/reserve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReserveSuccess(true);
    } catch (err) {
      setReserveError(err.response?.data?.error || 'Failed to reserve. Please try again.');
    } finally {
      setReserving(false);
    }
  }

  // ── Triggered by the Reserve button — checks disclaimer first ──
  function handleReserveClick() {
    const accepted = localStorage.getItem('hasAcceptedDisclaimer') === 'true';
    if (!accepted) {
      setShowDisclaimer(true);
    } else {
      handleReserve();
    }
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
      <p style={{ fontSize: '15px', margin: 0 }}>Loading listing...</p>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>😕</div>
      <p style={{ color: '#ef4444', background: '#fff0f0', padding: '12px 16px', borderRadius: '10px', fontSize: '14px' }}>
        {error}
      </p>
      <button
        onClick={() => navigate('/browse')}
        style={{ marginTop: '16px', padding: '10px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
      >
        ← Back to Browse
      </button>
    </div>
  );

  const { text: timeText, color: timeColor, urgent } = getTimeInfo(listing.expiresAt);
  const isExpired  = new Date(listing.expiresAt) <= new Date();
  const isReceiver = role === 'receiver';
  const canReserve = isReceiver && listing.status === 'available' && !isExpired;

  // ── Reserve success screen ──
  if (reserveSuccess) return (
    <div style={{ padding: '60px 24px', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
      <h2 style={{ margin: '0 0 8px', color: '#1e293b' }}>Reserved!</h2>
      <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>
        Your reservation for <strong>"{listing.foodName}"</strong> has been sent to the provider.
        You'll be notified once they accept.
      </p>
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', textAlign: 'left' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
          📍 <strong>Pickup at:</strong> {listing.address}
        </p>
        {listing.pickupWindowStart && listing.pickupWindowEnd && (
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#166534' }}>
            🕐 <strong>Pickup window:</strong>{' '}
            {new Date(listing.pickupWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {new Date(listing.pickupWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
      <button
        onClick={() => navigate('/receiver')}
        style={{ width: '100%', padding: '13px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}
      >
        View My Reservations
      </button>
      <button
        onClick={() => navigate('/browse')}
        style={{ width: '100%', padding: '11px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}
      >
        ← Back to Browse
      </button>
    </div>
  );

  return (
    <>
      {/* ── Disclaimer modal ── */}
      {showDisclaimer && (
        <DisclaimerModal
          onAccept={() => {
            setShowDisclaimer(false);
            handleReserve();
          }}
          onDecline={() => setShowDisclaimer(false)}
        />
      )}

      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

        {/* ── Hero image ── */}
        <div style={{
          width: '100%', height: '260px', position: 'relative',
          background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '80px', overflow: 'hidden',
        }}>
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : (categoryEmoji[listing.foodCategory] || '🍽️')
          }

          {/* Urgency colour bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: timeColor }} />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              position: 'absolute', top: '14px', left: '14px',
              background: 'rgba(0,0,0,0.45)', border: 'none', color: 'white',
              borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '500',
            }}
          >
            ← Back
          </button>

          {/* Status badge — shown if not available */}
          {listing.status !== 'available' && (
            <div style={{
              position: 'absolute', top: '14px', right: '14px',
              background: listing.status === 'reserved' ? '#fef9c3' : '#f1f5f9',
              color:      listing.status === 'reserved' ? '#854d0e' : '#475569',
              borderRadius: '20px', padding: '5px 12px',
              fontSize: '12px', fontWeight: '700',
            }}>
              {listing.status === 'reserved'  && '⏳ Reserved'}
              {listing.status === 'accepted'  && '✅ Accepted'}
              {listing.status === 'picked_up' && '📦 Picked Up'}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 40px' }}>

          {/* Name + category + provider */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ display: 'inline-block', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontWeight: '600', marginBottom: '8px' }}>
              {categoryEmoji[listing.foodCategory]} {categoryLabel[listing.foodCategory] || 'Food'}
            </span>
            <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>
              {listing.foodName}
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              by{' '}
              <span
                onClick={() => navigate(`/provider/${listing.provider?.id}`)}
                style={{ color: '#22c55e', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {listing.provider?.name}
              </span>
              {listing.provider?.avgRating && (
                <span style={{ color: '#f59e0b', fontWeight: '700', marginLeft: '8px' }}>
                  ★ {listing.provider.avgRating}
                </span>
              )}
            </p>
          </div>

          {/* Urgent banner */}
          {urgent && !isExpired && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🔴</span>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>
                Expiring very soon — grab it now!
              </p>
            </div>
          )}

          {/* Price + time */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Price</p>
              {listing.currentPrice === 0
                ? <p style={{ margin: '2px 0 0', fontSize: '28px', fontWeight: '800', color: '#22c55e' }}>FREE</p>
                : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>₱{listing.currentPrice}</span>
                    {listing.currentPrice < listing.originalPrice && (
                      <s style={{ fontSize: '15px', color: '#94a3b8' }}>₱{listing.originalPrice}</s>
                    )}
                  </div>
                )
              }
              {!listing.allowFree && listing.minimumPrice > 0 && (
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Floor: ₱{listing.minimumPrice}</p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time Left</p>
              <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: '700', color: timeColor }}>{timeText}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>drops every 15 min</p>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <DetailCard icon="🍽️" label="Quantity"  value={`${listing.quantity} serving${listing.quantity !== 1 ? 's' : ''}`} />
            <DetailCard icon="🌡️" label="Storage"   value={storageLabel[listing.storageCondition] || listing.storageCondition} />
            <DetailCard
              icon="⏰" label="Expires"
              value={new Date(listing.expiresAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            />
            {listing.distanceKm != null && (
              <DetailCard icon="📍" label="Distance" value={`${listing.distanceKm} km away`} />
            )}
          </div>

          {/* Pickup window */}
          {listing.pickupWindowStart && listing.pickupWindowEnd && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#166534' }}>🕐 Pickup Window</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#166534' }}>
                {new Date(listing.pickupWindowStart).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(listing.pickupWindowEnd).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* Address */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>📍</span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Pickup Address</p>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>{listing.address}</p>
            </div>
          </div>

          {/* Reserve error */}
          {reserveError && (
            <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#ef4444' }}>{reserveError}</p>
            </div>
          )}

          {/* ── CTA ── */}
          {isReceiver ? (
            canReserve ? (
              <button
                onClick={handleReserveClick}
                disabled={reserving}
                style={{
                  width: '100%', padding: '15px',
                  background: reserving ? '#86efac' : '#22c55e',
                  color: 'white', border: 'none', borderRadius: '12px',
                  cursor: reserving ? 'not-allowed' : 'pointer',
                  fontSize: '16px', fontWeight: '800',
                  boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                }}
              >
                {reserving ? '⏳ Reserving...' : `🍱 Reserve — ${listing.currentPrice === 0 ? 'FREE' : `₱${listing.currentPrice}`}`}
              </button>
            ) : (
              <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                  {isExpired                          ? '⏰ This listing has expired.'
                  : listing.status === 'reserved'    ? '⏳ This food has already been reserved.'
                  : listing.status === 'accepted'    ? '✅ This food has been claimed.'
                  : listing.status === 'picked_up'   ? '📦 This food has already been picked up.'
                  :                                    'This listing is no longer available.'}
                </p>
              </div>
            )
          ) : (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                👁️ You're viewing as a provider. Only receivers can reserve food.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ── Small detail card ──
function DetailCard({ icon, label, value }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{value}</p>
      </div>
    </div>
  );
}