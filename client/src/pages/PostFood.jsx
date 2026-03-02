import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { supabase } from '../supabase';
import { showToast } from '../components/Toast';  

function PostFood() {
  const [foodName,       setFoodName]       = useState('');
  const [quantity,       setQuantity]       = useState('');
  const [originalPrice,  setOriginalPrice]  = useState('');
  const [expiresAt,      setExpiresAt]      = useState('');
  const [address,        setAddress]        = useState('');
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [allowFree,      setAllowFree]      = useState(true);
  const [minimumPrice,   setMinimumPrice]   = useState('');
  const [foodCategory,   setFoodCategory]   = useState('other');
  const [storageCondition, setStorageCondition] = useState('room_temp');
  const [pickupWindowStart, setPickupWindowStart] = useState('');
  const [pickupWindowEnd,   setPickupWindowEnd]   = useState('');

  // Photo upload state
  const [imageFile,      setImageFile]      = useState(null);   
  const [imagePreview,   setImagePreview]   = useState(null);   
  const [uploading,      setUploading]      = useState(false); 

  const [coords,         setCoords]         = useState(null);
  const [locationStatus, setLocationStatus] = useState('asking');

  const navigate = useNavigate();

  // ── Get GPS on mount ──
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

  // ── Handle image file selection ──
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Only allow images
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP).');
      return;
    }
    // Max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  // 
  async function uploadImage(file) {
    // Use a unique filename: timestamp + original name
    const ext      = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(filename, file, { contentType: file.type });

    if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);

    // Get the permanent public URL
    const { data } = supabase.storage
      .from('food-images')
      .getPublicUrl(filename);

    return data.publicUrl;
  }

  // ── Form submit ──
  async function handleSubmit(e) {
    e.preventDefault();

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
      // 1. Upload image first (if one was selected)
      let imageUrl = null;
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      // 2. Post the listing with the image URL
      const res = await api.post('/listings', {
        foodName,
        quantity,
        originalPrice,
        expiresAt,
        address,
        latitude:     coords.lat,
        longitude:    coords.lng,
        allowFree,
        minimumPrice: allowFree ? 0 : parseFloat(minimumPrice),
        foodCategory,
        storageCondition,
        pickupWindowStart: pickupWindowStart || null,
        pickupWindowEnd:   pickupWindowEnd   || null,
        imageUrl,           
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast(`"${res.data.listing.foodName}" has been listed!`, 'success', 4000);
      navigate('/dashboard');

    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.error || err.message || 'Failed to post listing. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Location denied screen ──
  if (locationStatus === 'denied') {
    return (
      <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Location Access Required</h2>
        <p style={{ color: '#555', marginTop: '12px', lineHeight: '1.6' }}>
          RescueBite needs your location to let receivers find your food nearby.
        </p>
        <p style={{ marginTop: '16px', color: '#888', fontSize: '14px' }}>
          Click the 🔒 lock icon → find "Location" → set to "Allow" → reload.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '24px', padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}
        >
          I've allowed location — Reload
        </button>
        <p style={{ marginTop: '16px' }}>
          <a href="/dashboard">← Back to Dashboard</a>
        </p>
      </div>
    );
  }

  if (locationStatus === 'asking') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>📍 Getting your location...</p>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Post Food Listing</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>List food that needs to be rescued before it expires.</p>

      {/* GPS badge */}
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '8px 12px', marginBottom: '20px', fontSize: '14px', color: '#166534' }}>
        📍 Location detected — your listing will appear for nearby receivers.
      </div>

      {error && (
        <p style={{ color: 'red', background: '#fff0f0', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Photo Upload ── */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: '500', display: 'block', marginBottom: '8px' }}>
            Food Photo <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(optional)</span>
          </label>

          {imagePreview ? (
            // Preview the selected image
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'block' }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: 'rgba(0,0,0,0.55)', color: 'white',
                  border: 'none', borderRadius: '20px',
                  padding: '4px 10px', cursor: 'pointer', fontSize: '13px',
                }}
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            // Upload button / drop zone
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: '100%', height: '160px',
              border: '2px dashed #cbd5e1', borderRadius: '10px',
              background: '#f8fafc', cursor: 'pointer',
              color: '#64748b', fontSize: '14px', gap: '8px',
            }}>
              <span style={{ fontSize: '32px' }}></span>
              <span style={{ fontWeight: '500' }}>Click to upload a photo</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>JPG, PNG or WEBP · max 5 MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

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

        {/* Food Category */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontWeight: '500' }}>Food Category</label><br />
          <select
            value={foodCategory}
            onChange={e => setFoodCategory(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
          >
            <option value="prepared_meal">🍛 Prepared Meal</option>
            <option value="baked_goods">🍞 Baked Goods</option>
            <option value="fresh_produce">🥦 Fresh Produce</option>
            <option value="packaged">📦 Packaged / Sealed</option>
            <option value="other">🍽️ Other</option>
          </select>
          {foodCategory === 'prepared_meal' && (
            <div style={{ marginTop: '8px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', padding: '10px', fontSize: '13px', color: '#92400e' }}>
              ⚠️ <strong>Same-day pickup only.</strong> Set the expiry to today's date.
            </div>
          )}
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
          <small style={{ color: '#888' }}>Price decreases every 15 minutes as expiry approaches.</small>
        </div>

        {/* Allow Free */}
        <div style={{ marginBottom: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
          <label style={{ fontWeight: '500', display: 'block', marginBottom: '8px' }}>
            Allow this food to become <strong>FREE</strong> when near expiry?
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="radio" name="allowFree" checked={allowFree === true}
                onChange={() => { setAllowFree(true); setMinimumPrice(''); }} />
              <span>Yes — drop to ₱0 if needed</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="radio" name="allowFree" checked={allowFree === false}
                onChange={() => setAllowFree(false)} />
              <span>No — set a minimum price</span>
            </label>
          </div>
        </div>

        {/* Minimum Price */}
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
              Price decays every 15 minutes but will never go below this amount.
            </small>
          </div>
        )}

        {/* Storage Condition */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontWeight: '500' }}>Storage Condition</label><br />
          <select
            value={storageCondition}
            onChange={e => setStorageCondition(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
          >
            <option value="room_temp">🌡️ Room Temperature</option>
            <option value="refrigerated">❄️ Refrigerated</option>
            <option value="frozen">🧊 Frozen</option>
          </select>
        </div>

        {/* Expires At */}
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

        {/* Pickup Window */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontWeight: '500' }}>
            Pickup Window <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(optional)</span>
          </label>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 8px' }}>
            When are you available? Leave blank if anytime is fine.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <small style={{ color: '#64748b' }}>From</small><br />
              <input type="datetime-local" value={pickupWindowStart}
                onChange={e => setPickupWindowStart(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '2px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ flex: 1 }}>
              <small style={{ color: '#64748b' }}>Until</small><br />
              <input type="datetime-local" value={pickupWindowEnd}
                onChange={e => setPickupWindowEnd(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '2px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
          </div>
        </div>

        {/* Pickup Address */}
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
          <small style={{ color: '#888' }}>Where should receivers come to pick up?</small>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || uploading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        >
          {uploading ? '📤 Uploading photo...' : loading ? 'Posting...' : '🍱 Post Food Listing'}
        </button>

      </form>

      <p style={{ marginTop: '16px' }}>
        <a href="/dashboard">← Back to Dashboard</a>
      </p>
    </div>
  );
}

export default PostFood;