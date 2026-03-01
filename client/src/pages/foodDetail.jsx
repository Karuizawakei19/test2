// client/src/pages/FoodDetail.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
function getTimeLabel(expiresAt) {
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return { text: 'Expired', color: '#6b7280' };
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const minsLeft  = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  if (hoursLeft === 0) return { text: `🔴 ${minsLeft}m left — URGENT`, color: '#ef4444' };
  if (hoursLeft < 3)   return { text: `🟡 ${hoursLeft}h ${minsLeft}m left`, color: '#f59e0b' };
  return { text: `🟢 ${hoursLeft}h ${minsLeft}m left`, color: '#22c55e' };
}

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

const storageLabel = {
  room_temp:    '🌡️ Room Temperature',
  refrigerated: '❄️ Refrigerated — pick up quickly',
  frozen:       '🧊 Frozen — handle immediately',
};

// ─────────────────────────────────────────
// FOOD DETAIL PAGE
// ─────────────────────────────────────────
function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing,   setListing]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [agreed,    setAgreed]    = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reserved,  setReserved]  = useState(false);

  const role = localStorage.getItem('role');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    // Fetch all available listings and find the one matching this id
    api.get('/listings')
      .then(res => {
        const found = res.data.listings.find(l => l.id === id);
        if (!found) {
          setError('This listing could not be found. It may have already been reserved or expired.');
        } else {
          setListing(found);
        }
      })
      .catch(() => setError('Could not load listing. Is the server running?'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReserve() {
    // Providers can browse but cannot reserve
    if (role === 'provider') {
      alert('Providers cannot reserve food. Only receiver accounts can reserve listings.');
      return;
    }
    if (!agreed) return;

    setReserving(true);
    try {
      const token = localStorage.getItem('token');
      await api.post(`/listings/${id}/reserve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReserved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reserve. Try again.');
    } finally {
      setReserving(false);
    }
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#888' }}>Loading listing...</p>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ padding: '40px', maxWidth: '540px', margin: '0 auto' }}>
      <p style={{ color: 'red', background: '#fff0f0', padding: '12px', borderRadius: '8px' }}>
        {error}
      </p>
      <a href="/browse" style={{ color: '#22c55e', fontSize: '14px' }}>← Back to Browse</a>
    </div>
  );

  // ── Reserved success screen ──
  if (reserved) return (
    <div style={{ padding: '40px', maxWidth: '540px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ color: '#166534', margin: '0 0 8px' }}>Food Reserved!</h2>
      <p style={{ color: '#555', lineHeight: '1.6', marginTop: '8px' }}>
        Reserved sucessfully. Wait for the provider to accept it.
        {listing.pickupWindowStart && listing.pickupWindowEnd && (
          <> The provider is available from{' '}
            <strong>
              {new Date(listing.pickupWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {new Date(listing.pickupWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </strong>.
          </>
        )}
      </p>
      <button
        onClick={() => navigate('/browse')}
        style={{
          marginTop: '24px',
          padding: '12px 28px',
          background: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: 'bold',
        }}
      >
        ← Back to Browse
      </button>
    </div>
  );

  // ── Main detail view ──
  const { text: timeText, color: timeColor } = getTimeLabel(listing.expiresAt);
  const msLeft       = new Date(listing.expiresAt) - new Date();
  const hoursLeft    = msLeft / (1000 * 60 * 60);
  const urgencyColor = hoursLeft < 1 ? '#ef4444' : hoursLeft < 3 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ padding: '24px', maxWidth: '560px', margin: '0 auto' }}>

      {/* Back link */}
      <a
        href="/browse"
        style={{ color: '#22c55e', fontSize: '14px', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}
      >
        ← Back to Browse
      </a>

        {/* Image — real photo or category emoji placeholder */}
        <div style={{
        width: '100%',
        height: '240px',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '80px',
        position: 'relative',
        }}>
        {listing.imageUrl ? (
            <img
            src={listing.imageUrl}
            alt={listing.foodName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
        ) : (
            categoryEmoji[listing.foodCategory] || '🍽️'
        )}

        {/* Urgency strip at the bottom */}
        <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '6px',
            background: urgencyColor,
        }} />
        </div>

      {/* Food name + provider */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '4px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>
          {listing.foodName}
        </h2>
        <p style={{ margin: '4px 0', fontSize: '14px', color: '#64748b' }}>
        by{' '}
        <span
            onClick={() => navigate(`/provider/${listing.provider?.id}`)}
            style={{
            color: '#22c55e',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            }}
        >
            {listing.provider?.name}
        </span>
        {listing.provider?.avgRating && (
            <span style={{ marginLeft: '8px', fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
            ★ {listing.provider.avgRating}
            </span>
        )}
        </p>
      </div>

      {/* Category badge */}
      <span style={{
        display: 'inline-block',
        fontSize: '12px',
        padding: '3px 10px',
        borderRadius: '20px',
        background: '#f1f5f9',
        color: '#475569',
        fontWeight: '500',
        marginBottom: '16px',
      }}>
        {categoryLabel[listing.foodCategory] || '🍽️ Food'}
      </span>

      {/* Urgency + price row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: timeColor }}>
          {timeText}
        </span>
        <span style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
          {listing.currentPrice === 0
            ? <span style={{ color: '#22c55e' }}>FREE</span>
            : <>
                ₱{listing.currentPrice}
                {listing.currentPrice < listing.originalPrice && (
                  <s style={{ fontSize: '14px', color: '#aaa', marginLeft: '8px' }}>
                    ₱{listing.originalPrice}
                  </s>
                )}
              </>
          }
        </span>
      </div>

      {/* Details table */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '4px 16px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
      }}>
        <DetailRow label="📦 Quantity"
          value={`${listing.quantity} serving${listing.quantity !== 1 ? 's' : ''}`} />

        <DetailRow label="📍 Address"
          value={listing.address} />

        <DetailRow label="🗂️ Storage"
          value={storageLabel[listing.storageCondition] || '🌡️ Room Temperature'} />

        {listing.distanceKm !== null && listing.distanceKm !== undefined && (
          <DetailRow label="📏 Distance"
            value={`${listing.distanceKm} km away`} />
        )}

        {listing.pickupWindowStart && listing.pickupWindowEnd && (
          <DetailRow
            label="🕐 Pickup Window"
            value={`${new Date(listing.pickupWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(listing.pickupWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          />
        )}

        <DetailRow
          label="⏰ Expires"
          value={new Date(listing.expiresAt).toLocaleString([], {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
          last
        />
      </div>

      {/* ── PROVIDER: view-only notice ── */}
      {role === 'provider' && (
        <div style={{
          background: '#fef9c3',
          border: '1px solid #fbbf24',
          borderRadius: '10px',
          padding: '14px 16px',
          fontSize: '14px',
          color: '#92400e',
          textAlign: 'center',
          lineHeight: '1.6',
        }}>
          👀 <strong>You're viewing as a provider.</strong><br />
          <span style={{ fontSize: '13px' }}>
            Providers can browse listings but cannot reserve food.
            Only receiver accounts can reserve.
          </span>
        </div>
      )}

      {/* ── RECEIVER: disclaimer + reserve button ── */}
      {role === 'receiver' && (
        <>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '13px',
            color: '#475569',
            marginBottom: '16px',
            cursor: 'pointer',
            lineHeight: '1.5',
          }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0 }}
            />
            I understand this food is near-expiry and intended for immediate consumption.
            RescueBite is a coordination platform only and does not handle or transport food.
          </label>

          <button
            onClick={handleReserve}
            disabled={!agreed || reserving}
            style={{
              width: '100%',
              padding: '14px',
              background: agreed ? '#22c55e' : '#e2e8f0',
              color: agreed ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: '10px',
              cursor: agreed ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background 0.2s',
            }}
          >
            {reserving
              ? 'Reserving...'
              : agreed
                ? '✅ Reserve This Food'
                : 'Tick the box above to reserve'}
          </button>
        </>
      )}

    </div>
  );
}

// ─────────────────────────────────────────
// DETAIL ROW — reusable table row
// ─────────────────────────────────────────
function DetailRow({ label, value, last = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid #e2e8f0',
      fontSize: '14px',
      gap: '12px',
    }}>
      <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: '#1e293b', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

export default FoodDetail;