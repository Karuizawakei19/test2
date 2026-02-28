

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function PostFood() {

  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // When the page loads, try to get the user's GPS location automatically
  useState(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Success
        setLatitude(pos.coords.latitude.toString());
        setLongitude(pos.coords.longitude.toString());
      },
      () => {
        // User denied location — they can type coordinates manually
        console.log('Location not available, user can enter manually');
      }
    );
  });

  async function handleSubmit(e) {
    e.preventDefault(); 
    setLoading(true);
    setError('');

    // Get the token from localStorage 
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/'); // not logged in, go back to login
      return;
    }

    try {
      // Send the form data to the backend
      const res = await api.post('/listings', {
        foodName,
        quantity,
        originalPrice,
        expiresAt,
        address,
        latitude,
        longitude,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Success
      alert(`"${res.data.listing.foodName}" has been listed!`);
      navigate('/dashboard');

    } catch (err) {
      // Show the error from the server 
      setError(err.response?.data?.error || 'Failed to post listing. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h2> Post Food Listing</h2>
      <p style={{ color: '#666' }}>List food that needs to be rescued before it expires.</p>

      {error && (
        <p style={{ color: 'red', background: '#fff0f0', padding: '10px', borderRadius: '4px' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>

        <div style={{ marginBottom: '12px' }}>
          <label>Food Name</label><br />
          <input
            type="text"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
            placeholder="e.g. Leftover Pasta,  Pandesal"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Quantity (servings or pieces)</label><br />
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="e.g. 5"
            min="1"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Price (₱)</label><br />
          <input
            type="number"
            value={originalPrice}
            onChange={e => setOriginalPrice(e.target.value)}
            placeholder="e.g. 50"
            min="0"
            step="0.01"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Expires At</label><br />
          {/* datetime-local gives a date + time picker in the browser */}
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          <small style={{ color: '#888' }}>Must be within the next 72 hours</small>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Address</label><br />
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. Lahug, Cebu City"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        {/* Latitude and Longitude — auto-filled by GPS or typed manually */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label>Latitude</label><br />
            <input
              type="number"
              value={latitude}
              onChange={e => setLatitude(e.target.value)}
              placeholder="e.g. 14.6507"
              step="any"
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Longitude</label><br />
            <input
              type="number"
              value={longitude}
              onChange={e => setLongitude(e.target.value)}
              placeholder="e.g. 121.073"
              step="any"
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
        </div>
        <small style={{ color: '#888', display: 'block', marginBottom: '20px' }}>
          📍 Coordinates are auto-filled if you allow location access. Otherwise type them in.
          You can find your coordinates at maps.google.com — right-click your location.
        </small>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}
        >
          {loading ? 'Posting...' : 'Post Food Listing'}
        </button>

      </form>

      <p style={{ marginTop: '16px' }}>
        <a href="/dashboard">← Back to Dashboard</a>
      </p>
    </div>
  );
}

export default PostFood;