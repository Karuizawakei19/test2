import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function PostFood() {
  const [foodName, setFoodName]           = useState('');
  const [quantity, setQuantity]           = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [expiresAt, setExpiresAt]         = useState('');
  const [address, setAddress]             = useState('');
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [allowFree, setAllowFree]         = useState(true);   
  const [minimumPrice, setMinimumPrice]   = useState('');

  const [coords, setCoords]               = useState(null);   
  const [locationStatus, setLocationStatus] = useState('asking');  'denied'

  const navigate = useNavigate();

  useEffect(() => {
    setLocationStatus('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
       
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => {
        
        setCoords(false);
        setLocationStatus('denied');
      }
    );
  }, []); 

  async function handleSubmit(e) {
    e.preventDefault();

    // hard block if no GPS
    if (!coords) {
      setError('Location access is required to post food. Please allow location in your browser and reload.');
      return;
    }

    if (!allowFree) {
      const min = parseFloat(minimumPrice);
      if (!minimumPrice || min <= 0) {
        setError('Please set a minimum price greater than ₱0.');
        return;
      }
      if (min >= parseFloat(originalPrice)) {
        setError('Minimum price must be lower than the original price.');
        return;
      }
    }

    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    try {
      const res = await api.post('/listings', {
        foodName,
        quantity,
        originalPrice,
        expiresAt,
        address,
        latitude: coords.lat,             
        longitude: coords.lng,
        allowFree,                         
        minimumPrice: allowFree ? 0 : parseFloat(minimumPrice), 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`"${res.data.listing.foodName}" has been listed!`);
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post listing. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────
  //
  // ─────────────────────────────────────────
  if (locationStatus === 'denied') {
    return (
      <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        
        <h2>Location Access Required</h2>
        <p style={{ color: '#555', marginTop: '12px', lineHeight: '1.6' }}>
          RescueBite needs your location to let receivers find your food nearby.
          Without it, we can't post your listing.
        </p>
        <p style={{ marginTop: '16px', color: '#888', fontSize: '14px' }}>
          To fix this: click the 🔒 lock icon in your browser's address bar →
          find "Location" → set it to "Allow" → reload this page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '24px', padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}
        >
          I've allowed location - Reload
        </button>
        <p style={{ marginTop: '16px' }}>
          <a href="/dashboard">← Back to Dashboard</a>
        </p>
      </div>
    );
  }

  // While waiting for GPS response
  if (locationStatus === 'asking') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>📍 Getting your location...</p>
      </div>
    );
  }

  // GPS granted — show the full form
  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Post Food Listing</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>List food that needs to be rescued before it expires.</p>

      {/* GPS confirmation badge */}
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '8px 12px', marginBottom: '20px', fontSize: '14px', color: '#166534' }}>
        Location detected - your listing will appear on the map for nearby receivers.
      </div>

      {error && (
        <p style={{ color: 'red', background: '#fff0f0', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>

        {/* Food Name */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontWeight: '500' }}>Food Name</label><br />
          <input
            type="text"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
            placeholder="e.g. Leftover Pasta, Pandesal"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Quantity */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontWeight: '500' }}>Quantity (servings or pieces)</label><br />
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="e.g. 5"
            min="1"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Original Price */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontWeight: '500' }}>Original Price (₱)</label><br />
          <input
            type="number"
            value={originalPrice}
            onChange={e => setOriginalPrice(e.target.value)}
            placeholder="e.g. 80"
            min="1"
            step="1"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#888' }}>Price will decrease every 15 minutes as expiry approaches.</small>
        </div>

        {/* FIX 2: Allow Free Question */}
        <div style={{ marginBottom: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
          <label style={{ fontWeight: '500', display: 'block', marginBottom: '8px' }}>
            Allow this food to become <strong>FREE</strong> when near expiry?
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="allowFree"
                checked={allowFree === true}
                onChange={() => { setAllowFree(true); setMinimumPrice(''); }}
              />
              <span>Yes - drop to ₱0 if needed</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="allowFree"
                checked={allowFree === false}
                onChange={() => setAllowFree(false)}
              />
              <span> No - set a minimum price</span>
            </label>
          </div>
        </div>

        {/* FIX 3: Minimum Price — only shows when allowFree = false */}
        {allowFree === false && (
          <div style={{ marginBottom: '14px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', padding: '12px' }}>
            <label style={{ fontWeight: '500' }}>Minimum Price (₱)</label><br />
            <input
              type="number"
              value={minimumPrice}
              onChange={e => setMinimumPrice(e.target.value)}
              placeholder="e.g. 20"
              min="1"
              step="1"
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #fbbf24' }}
            />
            <small style={{ color: '#92400e' }}>
              Price will decay every 15 minutes but will stop at this amount and never go lower.
            </small>
          </div>
        )}

        {/* Expiry — FIX 5: no hint about 72 hours */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontWeight: '500' }}>Expires At</label><br />
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#888' }}>When does this food expire or need to be picked up by?</small>
        </div>

        {/* Address */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: '500' }}>Pickup Address</label><br />
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. Katipunan Ave, Quezon City"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#888' }}>Write where receivers should come to pick up the food.</small>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        >
          {loading ? 'Posting...' : ' Post Food Listing'}
        </button>

      </form>

      <p style={{ marginTop: '16px' }}>
        <a href="/dashboard">← Back to Dashboard</a>
      </p>
    </div>
  );
}

export default PostFood;