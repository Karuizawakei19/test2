import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Browse() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    //  get the receiver's GPS location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Got coordinates — fetch listings with location
        fetchListings(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Location denied:
        // listings will show without distance filter
        fetchListings(null, null);
      }
    );
  }, []);

  async function fetchListings(lat, lng) {
    try {
      const params = lat && lng ? `?lat=${lat}&lng=${lng}` : '';

      const res = await api.get(`/listings${params}`);
      setListings(res.data.listings);

    } catch (err) {
      setError('Could not load listings. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────
  // HELPER: TIME LEFT LABEL
  // ─────────────────────────────────────────
  function getTimeLabel(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const msLeft = expiry - now; // milliseconds 

    if (msLeft <= 0) return 'Expired';

    // Convert milliseconds to hours and minutes
    const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
    const minsLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft === 0) {
      return ` ${minsLeft}m left - URGENT`;
    } else if (hoursLeft < 3) {
      return ` ${hoursLeft}h ${minsLeft}m left`;
    } else {
      return ` ${hoursLeft}h ${minsLeft}m left`;
    }
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '40px' }}>
        <p>Loading nearby food...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Available Food Near You</h2>
        <button
          onClick={() => {
            localStorage.clear();
            navigate('/');
          }}
          style={{ background: 'none', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {listings.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          <p>No food available near you right now.</p>
          <p>Check back soon!</p>
        </div>
      )}

      {listings.map(listing => (
        <FoodCard
          key={listing.id}
          listing={listing}
          getTimeLabel={getTimeLabel}
          onReserved={(id) => {
            // Remove reserved listing from the list 
            setListings(prev => prev.filter(l => l.id !== id));
          }}
        />
      ))}

    </div>
  );
}

// ─────────────────────────────────────────
// FOOD CARD COMPONENT
// ─────────────────────────────────────────
function FoodCard({ listing, getTimeLabel, onReserved }) {
  const [reserving, setReserving] = useState(false);
  const [agreed, setAgreed] = useState(false); // disclaimer checkbox

  async function handleReserve() {
    if (!agreed) {
      alert('Please confirm you understand this food is near-expiry.');
      return;
    }

    setReserving(true);
    try {
      const token = localStorage.getItem('token');
      await api.post(`/listings/${listing.id}/reserve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Reserved! Head to ${listing.address} to pick it up.`);
      onReserved(listing.id); // remove from list
    } catch (err) {
      alert(err.response?.data?.error || 'Could not reserve. Try again.');
    } finally {
      setReserving(false);
    }
  }

  // Card border color based on urgency
  const msLeft = new Date(listing.expiresAt) - new Date();
  const hoursLeft = msLeft / (1000 * 60 * 60);
  const borderColor = hoursLeft < 1 ? '#ef4444' : hoursLeft < 3 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{
      border: `2px solid ${borderColor}`,
      borderRadius: '10px',
      padding: '16px',
      marginBottom: '16px',
      background: 'white',
    }}>

      {/* Food name and provider */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{listing.foodName}</h3>
        <span style={{ color: '#888', fontSize: '14px' }}>by {listing.provider?.name}</span>
      </div>

      {/* Time left — the urgency indicator */}
      <p style={{ margin: '8px 0', fontWeight: 'bold', fontSize: '15px' }}>
        {getTimeLabel(listing.expiresAt)}
      </p>

      {/* Price — show decay */}
      <p style={{ margin: '4px 0' }}>
         Price:{' '}
        {listing.currentPrice === 0
          ? <strong style={{ color: '#22c55e' }}>FREE</strong>
          : <>
              <strong>₱{listing.currentPrice}</strong>
              {listing.currentPrice < listing.originalPrice && (
                <s style={{ color: '#aaa', marginLeft: '6px' }}>₱{listing.originalPrice}</s>
              )}
            </>
        }
      </p>

      {/* Quantity and distance */}
      <p style={{ margin: '4px 0', color: '#555' }}>
        Qty: {listing.quantity}
        {listing.distanceKm !== null && (
          <span style={{ marginLeft: '16px' }}> {listing.distanceKm} km away</span>
        )}
      </p>

      {/* Address */}
      <p style={{ margin: '4px 0', color: '#555' }}> {listing.address}</p>

      {/* Disclaimer checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0', fontSize: '13px', color: '#555' }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
        />
        I understand this food is near-expiry and for immediate consumption.
      </label>

      {/* Reserve button */}
      <button
        onClick={handleReserve}
        disabled={reserving}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: agreed ? '#22c55e' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: agreed ? 'pointer' : 'not-allowed',
          fontSize: '15px',
        }}
      >
        {reserving ? 'Reserving...' : 'Reserve This Food'}
      </button>

    </div>
  );
}

export default Browse;