


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function ProviderDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const name = localStorage.getItem('name');

  // Fetch provider's listings 
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchMyListings(token);
  }, []);

  async function fetchMyListings(token) {
    try {
      const res = await api.get('/listings/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(res.data.listings);
    } catch (err) {
      setError('Could not load your listings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(listingId) {
    const token = localStorage.getItem('token');

    try {
      await api.patch(`/listings/${listingId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update the listing status in the local state without refetching
      setListings(prev =>
        prev.map(l =>
          l.id === listingId ? { ...l, status: 'picked_up' } : l
        )
      );

      alert('Pickup confirmed! Food has been rescued.');

    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm. Try again.');
    }
  }

  // ─────────────────────────────────────────
  // STATUS BADGE
  // ─────────────────────────────────────────
  function StatusBadge({ status }) {
    const styles = {
      available: { background: '#dcfce7', color: '#166534' },
      reserved:  { background: '#fef9c3', color: '#854d0e' },
      picked_up: { background: '#f1f5f9', color: '#475569' },
    };
    const labels = {
      available: 'Available',
      reserved:  'Reserved — waiting for pickup',
      picked_up: 'Picked Up',
    };

    return (
      <span style={{
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        ...styles[status],
      }}>
        {labels[status] || status}
      </span>
    );
  }

  // ─────────────────────────────────────────
  // TIME LEFT LABEL (same logic as Browse)
  // ─────────────────────────────────────────
  function getTimeLabel(expiresAt) {
    const msLeft = new Date(expiresAt) - new Date();
    if (msLeft <= 0) return 'Expired';
    const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
    const minsLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    if (hoursLeft === 0) return `${minsLeft}m left`;
    if (hoursLeft < 3) return `${hoursLeft}h ${minsLeft}m left`;
    return ` ${hoursLeft}h ${minsLeft}m left`;
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  if (loading) {
    return <div style={{ padding: '40px' }}><p>Loading your listings...</p></div>;
  }

  if (error) {
    return <div style={{ padding: '40px' }}><p style={{ color: 'red' }}>{error}</p></div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '650px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}> {name || 'Provider'}'s Dashboard</h2>
          <p style={{ color: '#888', margin: '4px 0 0' }}>Manage your food listings</p>
        </div>
        <button
          onClick={() => { localStorage.clear(); navigate('/'); }}
          style={{ background: 'none', border: '1px solid #ccc', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {/* Post new listing button */}
      <button
        onClick={() => navigate('/post')}
        style={{ marginTop: '20px', padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}
      >
        + Post New Food Listing
      </button>

      {/* Listings */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>Your Listings ({listings.length})</h3>

        {listings.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', color: '#888' }}>
            <p>You haven't posted any food yet.</p>
            <p>Click "Post New Food Listing" to get started.</p>
          </div>
        )}

        {listings.map(listing => (
          <div
            key={listing.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '14px',
              background: listing.status === 'picked_up' ? '#f8fafc' : 'white',
              opacity: listing.status === 'picked_up' ? 0.7 : 1,
            }}
          >
            {/* Food name and status badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>{listing.foodName}</h3>
              <StatusBadge status={listing.status} />
            </div>

            {/* Time left */}
            <p style={{ margin: '8px 0 4px', fontWeight: 'bold' }}>
              {getTimeLabel(listing.expiresAt)}
            </p>

            {/* Details row */}
            <p style={{ margin: '4px 0', color: '#555', fontSize: '14px' }}>
               Qty: {listing.quantity} &nbsp;|&nbsp;
               ₱{listing.currentPrice}
              {listing.currentPrice < listing.originalPrice && (
                <s style={{ color: '#aaa', marginLeft: '6px' }}>₱{listing.originalPrice}</s>
              )}
              &nbsp;|&nbsp;  {listing.address}
            </p>

            {/* Confirm Pickup button — only shows when status is "reserved" */}
            {listing.status === 'reserved' && (
              <button
                onClick={() => handleConfirm(listing.id)}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '15px',
                }}
              >
                Confirm Pickup - Mark as Received
              </button>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}

export default ProviderDashboard;