import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ── Beige theme tokens ──
const T = {
  bg:         '#f5f0e8',
  sidebar:    '#faf7f2',
  card:       '#fffdf9',
  border:     '#e8e0d0',
  accent:     '#c8a96e',
  accentDark: '#a07840',
  text:       '#2c2418',
  textMuted:  '#7a6a54',
  white:      '#ffffff',
  urgent:     '#c0392b',
  warning:    '#d4890a',
  fresh:      '#4a7c59',
};

const categoryLabel = {
  prepared_meal: 'Prepared Meal',
  baked_goods:   'Baked Goods',
  fresh_produce: 'Fresh Produce',
  packaged:      'Packaged',
  other:         'Food',
};

// ── Minimal SVG icons ──
const Icon = {
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  pin: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  clock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  star: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  tag: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  chevronDown: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronUp: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  thermometer: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  store: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  empty: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
    </svg>
  ),
};

function getTimeInfo(expiresAt) {
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return { label: 'Expired', badge: null, color: T.textMuted };
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  if (h === 0)  return { label: `${m}m left`, badge: 'URGENT',  badgeColor: T.urgent,  color: T.urgent };
  if (h < 3)    return { label: `${h}h ${m}m left`, badge: 'EXPIRING SOON', badgeColor: T.warning, color: T.warning };
  if (h < 12)   return { label: `${h}h ${m}m left`, badge: null, color: T.fresh };
  return              { label: `${h}h left`,         badge: null, color: T.textMuted };
}

// ── Collapsible sidebar section ──
function SideSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '14px', marginBottom: '14px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', fontWeight: '700', color: T.textMuted,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '0 0 10px', marginBottom: open ? '8px' : 0,
        }}
      >
        {title}
        {open ? Icon.chevronUp : Icon.chevronDown}
      </button>
      {open && children}
    </div>
  );
}

// ── Filter pill button ──
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 11px', borderRadius: '4px', fontSize: '13px',
        fontWeight: active ? '600' : '400',
        background: active ? T.accent : 'transparent',
        color: active ? T.white : T.text,
        border: active ? 'none' : `1px solid transparent`,
        cursor: 'pointer', display: 'block', width: '100%',
        textAlign: 'left', marginBottom: '2px',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.border; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Browse() {
  const [listings,    setListings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [hasLocation, setHasLocation] = useState(false);

  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [filterStore, setFilterStore] = useState('all');
  const [filterDist,  setFilterDist]  = useState('all');
  const [sortBy,      setSortBy]      = useState('expiry');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setHasLocation(true); fetchListings(pos.coords.latitude, pos.coords.longitude); },
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

  const filtered = useMemo(() => {
    let result = [...listings];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.foodName.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.provider?.name?.toLowerCase().includes(q)
      );
    }
    if (filterCat !== 'all')    result = result.filter(l => l.foodCategory === filterCat);
    if (filterPrice === 'free')      result = result.filter(l => l.currentPrice === 0);
    if (filterPrice === 'under50')   result = result.filter(l => l.currentPrice < 50);
    if (filterPrice === 'under100')  result = result.filter(l => l.currentPrice < 100);
    if (filterStore !== 'all')  result = result.filter(l => l.storageCondition === filterStore);
    if (filterDist !== 'all') {
      const maxKm = parseFloat(filterDist);
      result = result.filter(l => l.distanceKm != null && l.distanceKm <= maxKm);
    }
    result = result.filter(l => new Date(l.expiresAt) > new Date());
    if (sortBy === 'expiry')    result.sort((a, b) => { const d = new Date(a.expiresAt) - new Date(b.expiresAt); return d !== 0 ? d : (a.distanceKm ?? 999) - (b.distanceKm ?? 999); });
    if (sortBy === 'price_asc') result.sort((a, b) => a.currentPrice - b.currentPrice);
    if (sortBy === 'price_desc')result.sort((a, b) => b.currentPrice - a.currentPrice);
    if (sortBy === 'distance')  result.sort((a, b) => { const d = (a.distanceKm ?? 999) - (b.distanceKm ?? 999); return d !== 0 ? d : new Date(a.expiresAt) - new Date(b.expiresAt); });
    if (sortBy === 'rating')    result.sort((a, b) => (b.provider?.avgRating ?? 0) - (a.provider?.avgRating ?? 0));
    return result;
  }, [listings, search, filterCat, filterPrice, filterStore, filterDist, sortBy]);

  const clearAll = () => { setSearch(''); setFilterCat('all'); setFilterPrice('all'); setFilterStore('all'); setFilterDist('all'); setSortBy('expiry'); };
  const activeFilterCount = [filterCat !== 'all', filterPrice !== 'all', filterStore !== 'all', filterDist !== 'all', sortBy !== 'expiry'].filter(Boolean).length;

  if (loading) return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: '14px' }}>
      Finding food near you...
    </div>
  );
  if (error) return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '40px', color: T.urgent }}>{error}</div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top search bar ── */}
      <div style={{ background: T.sidebar, borderBottom: `1px solid ${T.border}`, padding: '14px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none', display: 'flex' }}>
            {Icon.search}
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Know what you want? Search it!"
            style={{
              width: '100%', padding: '11px 40px 11px 40px',
              borderRadius: '30px', border: `1.5px solid ${T.border}`,
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              background: T.white, color: T.text,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 0 }}
            >
              {Icon.x}
            </button>
          )}
        </div>
      </div>

      {/* ── Body: sidebar + grid ── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside  style={{
    width: '200px',
    flexShrink: 0,
    background: T.bg, // Match the main background color
    
    marginLeft: '50px', // Add spacing from the left
    padding: '20px 16px',
     // Light shadow to give depth
 // Optional for visual blending
  }}>

          {/* Filters header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: T.text, letterSpacing: '0.04em' }}>
              {Icon.filter} Filters
            </span>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: T.urgent, fontWeight: '600', padding: 0 }}>
                Clear all
              </button>
            )}
          </div>

          {/* Category */}
          <SideSection title="Category">
            {[
              ['all',           'All'],
              ['prepared_meal', 'Prepared Meal'],
              ['baked_goods',   'Baked Goods'],
              ['fresh_produce', 'Fresh Produce'],
              ['packaged',      'Packaged'],
              ['other',         'Other'],
            ].map(([val, lbl]) => (
              <Pill key={val} active={filterCat === val} onClick={() => setFilterCat(val)}>{lbl}</Pill>
            ))}
          </SideSection>

          {/* Price */}
          <SideSection title="Price">
            {[
              ['all',      'Any price'],
              ['free',     'Free only'],
              ['under50',  'Under ₱50'],
              ['under100', 'Under ₱100'],
            ].map(([val, lbl]) => (
              <Pill key={val} active={filterPrice === val} onClick={() => setFilterPrice(val)}>{lbl}</Pill>
            ))}
          </SideSection>

          {/* Storage */}
          <SideSection title="Storage">
            {[
              ['all',         'Any'],
              ['room_temp',   'Room Temp'],
              ['refrigerated','Chilled'],
              ['frozen',      'Frozen'],
            ].map(([val, lbl]) => (
              <Pill key={val} active={filterStore === val} onClick={() => setFilterStore(val)}>{lbl}</Pill>
            ))}
          </SideSection>

          {/* Distance */}
          <SideSection title="Distance">
            {[
              ['all', 'Any distance'],
              ['1',   'Within 1 km'],
              ['3',   'Within 3 km'],
              ['5',   'Within 5 km'],
            ].map(([val, lbl]) => (
              <Pill
                key={val}
                active={filterDist === val}
                onClick={() => hasLocation || val === 'all' ? setFilterDist(val) : null}
              >
                {lbl}{!hasLocation && val !== 'all' ? ' (no GPS)' : ''}
              </Pill>
            ))}
          </SideSection>

          {/* Sort */}
          <SideSection title="Sort by" defaultOpen={false}>
            {[
              ['expiry',     'Expiring soon'],
              ['distance',   'Nearest first'],
              ['price_asc',  'Price: low to high'],
              ['price_desc', 'Price: high to low'],
              ['rating',     'Top rated'],
            ].map(([val, lbl]) => (
              <Pill key={val} active={sortBy === val} onClick={() => setSortBy(val)}>{lbl}</Pill>
            ))}
          </SideSection>

        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, padding: '20px 24px', minWidth: 0 }}>

          {/* Result count + active badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: T.textMuted }}>
              {filtered.length === listings.length
                ? `${listings.length} listing${listings.length !== 1 ? 's' : ''} near you`
                : `${filtered.length} of ${listings.length} listings`
              }
              {search && <> for "<strong style={{ color: T.text }}>{search}</strong>"</>}
            </span>
            {filterDist !== 'all' && (
              <span style={{ fontSize: '12px', background: T.accent, color: T.white, borderRadius: '20px', padding: '2px 10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {Icon.pin} Within {filterDist} km
              </span>
            )}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: T.textMuted }}>
              <div style={{ marginBottom: '16px', opacity: 0.4 }}>{Icon.empty}</div>
              <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px', color: T.text }}>
                {listings.length === 0 ? 'No food available near you right now.' : 'No results match your filters.'}
              </p>
              {listings.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{ padding: '8px 20px', background: T.accent, color: T.white, border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginTop: '8px' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* 3-column card grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 400px)', gap: '32px', justifyContent: 'space-evenly',  margin: '0 auto',}}>
            {filtered.map(listing => (
              <FoodCard key={listing.id} listing={listing} />
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// FOOD CARD
// ─────────────────────────────────────────
function FoodCard({ listing }) {
  const navigate = useNavigate();
  const { label: timeLabel, badge, badgeColor, color: timeColor } = getTimeInfo(listing.expiresAt);

  const distDisplay = listing.distanceKm != null
    ? listing.distanceKm < 1
      ? `${Math.round(listing.distanceKm * 1000)}m`
      : `${listing.distanceKm} km`
    : null;

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      style={{
        background: T.card, borderRadius: '10px', overflow: 'hidden',
        border: `1px solid ${T.border}`,
        cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
    >
      {/* Image area */}
      <div style={{ width: '100%', height: '300px', position: 'relative', overflow: 'hidden', background: '#e8dcc8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {listing.imageUrl
          ? <img src={listing.imageUrl} alt={listing.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
        }

        {/* Urgency badge — top left, like reference image */}
        {badge && (
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            background: badgeColor, color: T.white,
            fontSize: '10px', fontWeight: '800',
            padding: '3px 8px', borderRadius: '4px',
            letterSpacing: '0.06em',
          }}>
            {badge}
          </div>
        )}

        {/* Free badge — top right */}
        {listing.currentPrice === 0 && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: T.fresh, color: T.white,
            fontSize: '10px', fontWeight: '800',
            padding: '3px 8px', borderRadius: '4px',
            letterSpacing: '0.06em',
          }}>
            FREE
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px 14px' }}>

        {/* Food name */}
        <h3 style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: '700', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {listing.foodName}
        </h3>

        {/* Provider */}
        <p
          onClick={e => { e.stopPropagation(); navigate(`/provider/${listing.provider?.id}`); }}
          style={{ margin: '0 0 8px', fontSize: '12px', color: T.accentDark, fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {Icon.store} {listing.provider?.name}
          {listing.provider?.avgRating && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px', color: T.accent, fontWeight: '700' }}>
              {Icon.star} {listing.provider.avgRating}
            </span>
          )}
        </p>

        {/* Meta row: category + time */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '2px 7px', borderRadius: '3px', background: T.bg, color: T.textMuted, fontWeight: '500', border: `1px solid ${T.border}` }}>
            {Icon.tag} {categoryLabel[listing.foodCategory] || 'Food'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '2px 7px', borderRadius: '3px', background: T.bg, color: timeColor, fontWeight: '600', border: `1px solid ${T.border}` }}>
            {Icon.clock} {timeLabel}
          </span>
        </div>

        {/* Price + distance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            {listing.currentPrice === 0
              ? <strong style={{ color: T.fresh, fontSize: '15px' }}>FREE</strong>
              : <>
                  <strong style={{ fontSize: '15px', color: T.text }}>₱{listing.currentPrice}</strong>
                  {listing.currentPrice < listing.originalPrice && (
                    <s style={{ color: T.textMuted, marginLeft: '6px', fontSize: '11px' }}>₱{listing.originalPrice}</s>
                  )}
                </>
            }
          </div>
          {distDisplay && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: listing.distanceKm <= 1 ? T.fresh : listing.distanceKm <= 3 ? T.warning : T.textMuted, fontWeight: listing.distanceKm <= 1 ? '700' : '400' }}>
              {Icon.pin} {distDisplay}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default Browse;