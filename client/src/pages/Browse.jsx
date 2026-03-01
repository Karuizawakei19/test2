import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ─────────────────────────────────────────
// Category labels
// ─────────────────────────────────────────
const categoryLabel = {
  prepared_meal: 'Prepared Meal',
  baked_goods:   'Baked Goods',
  fresh_produce: 'Fresh Produce',
  packaged:      'Packaged',
  other:         'Food',
};

// ─────────────────────────────────────────
// Time left helper
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

// ─────────────────────────────────────────
// BROWSE PAGE
// ─────────────────────────────────────────
function Browse() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchListings(pos.coords.latitude, pos.coords.longitude),
      ()    => fetchListings(null, null)
    );
  }, []);

  async function fetchListings(lat, lng) {
    try {
      const params = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
      const res = await api.get(`/listings${params}`);
      setListings(res.data.listings);
    } catch {
      setError('Could not load listings. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#888' }}> Finding food near you...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '40px' }}>
      <p style={{ color: 'red' }}>{error}</p>
    </div>
  );

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>
           Available Food Near You
        </h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
          Click any listing to see full details and reserve.
        </p>
      </div>

      {/* Empty state */}
      {listings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🫙</div>
          <p style={{ fontSize: '16px', fontWeight: '500' }}>No food available near you right now.</p>
          <p style={{ fontSize: '14px' }}>Check back soon — providers list food throughout the day.</p>
        </div>
      )}

      {/* Card grid — 2 columns on wide screens, 1 on small */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {listings.map(listing => (
          <FoodCard
            key={listing.id}
            listing={listing}
          />
        ))}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────
// FOOD CARD — click to go to detail page
// ─────────────────────────────────────────
function FoodCard({ listing }) {
  const navigate = useNavigate();
  const { text: timeText, color: timeColor } = getTimeLabel(listing.expiresAt);

  // Urgency-based top bar color
  const msLeft    = new Date(listing.expiresAt) - new Date();
  const hoursLeft = msLeft / (1000 * 60 * 60);
  const urgencyColor = hoursLeft < 1 ? '#ef4444' : hoursLeft < 3 ? '#f59e0b' : '#22c55e';

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        border: '1px solid #e2e8f0',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
      }}
    >
    {/* Image — real photo if available, gradient placeholder if not */}
    <div style={{
      width: '100%',
      height: '160px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '52px',
    }}>
      {listing.imageUrl ? (
        <img
          src={listing.imageUrl}
          alt={listing.foodName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        // Fallback icon when no photo
        <>
          {listing.foodCategory === 'prepared_meal' && ''}
          {listing.foodCategory === 'baked_goods'   && ''}
          {listing.foodCategory === 'fresh_produce' && ''}
          {listing.foodCategory === 'packaged'      && ''}
          {(!listing.foodCategory || listing.foodCategory === 'other') && '🍽️'}
        </>
      )}

      {/* Urgency colour strip — always on top */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '4px',
        background: urgencyColor,
      }} />
    </div>

      {/* Card body */}
      <div style={{ padding: '12px' }}>

        {/* Food name */}
        <h3 style={{
          margin: '0 0 4px',
          fontSize: '15px',
          fontWeight: '600',
          color: '#1e293b',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {listing.foodName}
        </h3>

        {/* Provider name */}
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8' }}>
          by {listing.provider?.name}
        </p>

        {/* Category badge */}
        <span style={{
          display: 'inline-block',
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '20px',
          background: '#f1f5f9',
          color: '#475569',
          fontWeight: '500',
          marginBottom: '8px',
        }}>
          {categoryLabel[listing.foodCategory] || '🍽️ Food'}
        </span>

        {/* Time left */}
        <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: timeColor }}>
          {timeText}
        </p>

        {/* Price */}
        <p style={{ margin: '0 0 6px', fontSize: '14px' }}>
          {listing.currentPrice === 0
            ? <strong style={{ color: '#22c55e', fontSize: '16px' }}>FREE</strong>
            : <>
                <strong style={{ fontSize: '16px', color: '#1e293b' }}>₱{listing.currentPrice}</strong>
                {listing.currentPrice < listing.originalPrice && (
                  <s style={{ color: '#aaa', marginLeft: '6px', fontSize: '12px' }}>₱{listing.originalPrice}</s>
                )}
              </>
          }
        </p>

        {/* Distance + qty row */}
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          {listing.quantity} serving{listing.quantity !== 1 ? 's' : ''}
          {listing.distanceKm !== null && listing.distanceKm !== undefined && (
            <span style={{ marginLeft: '8px' }}>· {listing.distanceKm} km away</span>
          )}
        </p>

      </div>
    </div>
  );
}

export default Browse;