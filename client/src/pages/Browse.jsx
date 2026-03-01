import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const categoryLabel = {
  prepared_meal: 'Prepared Meal', baked_goods: 'Baked Goods',
  fresh_produce: 'Fresh Produce', packaged: 'Packaged', other: 'Food',
};
const categoryEmoji = {
  prepared_meal: '🍛', baked_goods: '🍞',
  fresh_produce: '🥦', packaged: '📦', other: '🍽️',
};

function getTimeLabel(expiresAt) {
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return { text: 'Expired', color: '#6b7280' };
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  if (h === 0) return { text: `🔴 ${m}m left — URGENT`, color: '#ef4444' };
  if (h < 3)   return { text: `🟡 ${h}h ${m}m left`, color: '#f59e0b' };
  return         { text: `🟢 ${h}h ${m}m left`, color: '#22c55e' };
}

function Browse() {
  const [listings,    setListings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // ── Filter state ──
  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');  // 'all' | 'free' | 'under50' | 'under100'
  const [filterStore, setFilterStore] = useState('all');  // 'all' | 'room_temp' | 'refrigerated' | 'frozen'
  const [sortBy,      setSortBy]      = useState('distance'); // 'distance' | 'expiry' | 'price_asc' | 'price_desc'
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => fetchListings(pos.coords.latitude, pos.coords.longitude),
      ()  => fetchListings(null, null)
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

  // ── Client-side filter + sort (no extra API calls) ──
  const filtered = useMemo(() => {
    let result = [...listings];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.foodName.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.provider?.name?.toLowerCase().includes(q)
      );
    }

    // Category
    if (filterCat !== 'all') {
      result = result.filter(l => l.foodCategory === filterCat);
    }

    // Price
    if (filterPrice === 'free')     result = result.filter(l => l.currentPrice === 0);
    if (filterPrice === 'under50')  result = result.filter(l => l.currentPrice < 50);
    if (filterPrice === 'under100') result = result.filter(l => l.currentPrice < 100);

    // Storage
    if (filterStore !== 'all') {
      result = result.filter(l => l.storageCondition === filterStore);
    }

    // Sort
    if (sortBy === 'expiry')      result.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    if (sortBy === 'price_asc')   result.sort((a, b) => a.currentPrice - b.currentPrice);
    if (sortBy === 'price_desc')  result.sort((a, b) => b.currentPrice - a.currentPrice);
    if (sortBy === 'distance')    result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    if (sortBy === 'rating')      result.sort((a, b) => (b.provider?.avgRating ?? 0) - (a.provider?.avgRating ?? 0));

    return result;
  }, [listings, search, filterCat, filterPrice, filterStore, sortBy]);

  const activeFilterCount = [
    filterCat !== 'all', filterPrice !== 'all', filterStore !== 'all', sortBy !== 'distance',
  ].filter(Boolean).length;

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
      <p>🔍 Finding food near you...</p>
    </div>
  );
  if (error) return (
    <div style={{ padding: '40px' }}>
      <p style={{ color: 'red' }}>{error}</p>
    </div>
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Sticky search + filter bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by food, address, or provider..."
            style={{
              width: '100%', padding: '10px 40px 10px 38px',
              borderRadius: '12px', border: '1.5px solid #e2e8f0',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              background: '#f8fafc', color: '#1e293b',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}
            >×</button>
          )}
        </div>

        {/* Filter toggle row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowFilters(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '20px',
              background: showFilters || activeFilterCount > 0 ? '#f0fdf4' : '#f1f5f9',
              border: `1.5px solid ${showFilters || activeFilterCount > 0 ? '#86efac' : '#e2e8f0'}`,
              color: activeFilterCount > 0 ? '#166534' : '#64748b',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            }}
          >
            🎛️ Filters
            {activeFilterCount > 0 && (
              <span style={{ background: '#22c55e', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick sort pills */}
          {[
            { key: 'distance',   label: '📍 Nearest' },
            { key: 'expiry',     label: '⏰ Expiring' },
            { key: 'price_asc',  label: '₱ Lowest' },
            { key: 'rating',     label: '⭐ Top Rated' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              style={{
                padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                background: sortBy === s.key ? '#22c55e' : '#f1f5f9',
                color:      sortBy === s.key ? 'white'   : '#64748b',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>

            {/* Category filter */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>CATEGORY</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[['all', '🍽️ All'], ['prepared_meal', '🍛 Prepared'], ['baked_goods', '🍞 Baked'], ['fresh_produce', '🥦 Produce'], ['packaged', '📦 Packaged']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterCat(val)}
                    style={{ padding: '5px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', background: filterCat === val ? '#22c55e' : '#f1f5f9', color: filterCat === val ? 'white' : '#475569' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Price filter */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>PRICE</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[['all', 'Any'], ['free', 'FREE only'], ['under50', 'Under ₱50'], ['under100', 'Under ₱100']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterPrice(val)}
                    style={{ padding: '5px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', background: filterPrice === val ? '#22c55e' : '#f1f5f9', color: filterPrice === val ? 'white' : '#475569' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Storage filter */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>STORAGE</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[['all', '🌡️ Any'], ['room_temp', '🌡️ Room Temp'], ['refrigerated', '❄️ Chilled'], ['frozen', '🧊 Frozen']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterStore(val)}
                    style={{ padding: '5px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', background: filterStore === val ? '#22c55e' : '#f1f5f9', color: filterStore === val ? 'white' : '#475569' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterCat('all'); setFilterPrice('all'); setFilterStore('all'); setSortBy('distance'); }}
                style={{ alignSelf: 'flex-end', padding: '6px 14px', background: '#fff0f0', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div style={{ padding: '16px' }}>

        {/* Result count */}
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b' }}>
          {filtered.length === listings.length
            ? `${listings.length} listing${listings.length !== 1 ? 's' : ''} near you`
            : `${filtered.length} of ${listings.length} listings`
          }
          {search && <span> for "<strong>{search}</strong>"</span>}
        </p>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🫙</div>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px' }}>
              {listings.length === 0 ? 'No food available near you right now.' : 'No results match your filters.'}
            </p>
            {listings.length > 0 && (
              <button
                onClick={() => { setSearch(''); setFilterCat('all'); setFilterPrice('all'); setFilterStore('all'); }}
                style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {filtered.map(listing => (
            <FoodCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// FOOD CARD
// ─────────────────────────────────────────
function FoodCard({ listing }) {
  const navigate = useNavigate();
  const { text: timeText, color: timeColor } = getTimeLabel(listing.expiresAt);
  const msLeft    = new Date(listing.expiresAt) - new Date();
  const hoursLeft = msLeft / 3600000;
  const urgencyColor = hoursLeft < 1 ? '#ef4444' : hoursLeft < 3 ? '#f59e0b' : '#22c55e';

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', border: '1px solid #e2e8f0' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
    >
      {/* Image */}
      <div style={{ width: '100%', height: '160px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>
        {listing.imageUrl
          ? <img src={listing.imageUrl} alt={listing.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : (categoryEmoji[listing.foodCategory] || '🍽️')
        }
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: urgencyColor }} />
      </div>

      {/* Body */}
      <div style={{ padding: '12px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {listing.foodName}
        </h3>

        {/* Provider + rating */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <p
            onClick={e => { e.stopPropagation(); navigate(`/provider/${listing.provider?.id}`); }}
            style={{ margin: 0, fontSize: '12px', color: '#22c55e', fontWeight: '600', cursor: 'pointer' }}
          >
            {listing.provider?.name}
          </p>
          {listing.provider?.avgRating && (
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>
              ★ {listing.provider.avgRating}
            </span>
          )}
        </div>

        {/* Category badge */}
        <span style={{ display: 'inline-block', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontWeight: '500', marginBottom: '6px' }}>
          {categoryEmoji[listing.foodCategory]} {categoryLabel[listing.foodCategory] || 'Food'}
        </span>

        <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: timeColor }}>{timeText}</p>

        <p style={{ margin: '0 0 4px', fontSize: '14px' }}>
          {listing.currentPrice === 0
            ? <strong style={{ color: '#22c55e', fontSize: '16px' }}>FREE</strong>
            : <><strong style={{ fontSize: '16px', color: '#1e293b' }}>₱{listing.currentPrice}</strong>
                {listing.currentPrice < listing.originalPrice && <s style={{ color: '#aaa', marginLeft: '6px', fontSize: '12px' }}>₱{listing.originalPrice}</s>}
              </>
          }
        </p>

        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          {listing.quantity} serving{listing.quantity !== 1 ? 's' : ''}
          {listing.distanceKm != null && <span style={{ marginLeft: '6px' }}>· {listing.distanceKm} km away</span>}
        </p>
      </div>
    </div>
  );
}

export default Browse;