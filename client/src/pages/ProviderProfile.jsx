// client/src/pages/ProviderProfile.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const categoryEmoji = {
  prepared_meal: '🍛', baked_goods: '🍞',
  fresh_produce: '🥦', packaged: '📦', other: '🍽️',
};

// ── Star display row ──
function StarRow({ score, size = 15 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px', lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= score ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  );
}

function getTimeLabel(expiresAt) {
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return { text: 'Expired', color: '#6b7280' };
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  if (h === 0) return { text: `${m}m left`, color: '#ef4444' };
  if (h < 3)   return { text: `${h}h ${m}m left`, color: '#f59e0b' };
  return         { text: `${h}h ${m}m left`, color: '#22c55e' };
}

export default function ProviderProfile() {
  const { providerId } = useParams();
  const navigate       = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get(`/providers/${providerId}`)
      .then(res => setData(res.data))
      .catch(() => setError('Could not load provider profile.'))
      .finally(() => setLoading(false));
  }, [providerId]);

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🍱</div>
        <p style={{ margin: 0, fontSize: '14px' }}>Loading profile...</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <p style={{ color: '#ef4444', background: '#fff0f0', padding: '12px 16px', borderRadius: '10px', fontSize: '14px' }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{ marginTop: '16px', padding: '10px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );

  const { provider, stats, activeListings, ratings } = data;

  // Render 0–5 filled stars for the average
  const roundedAvg = stats.avgRating ? Math.round(stats.avgRating) : 0;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* ════════════════════════════════
          HERO — full-bleed green banner
          Avatar sits INSIDE the banner,
          no overlap tricks needed.
      ════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
        padding: '20px 24px 28px',
      }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: 'white', borderRadius: '8px',
            padding: '7px 14px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '500',
            marginBottom: '24px', display: 'inline-block',
          }}
        >
          ← Back
        </button>

        {/* Avatar + name row — all inside banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Big avatar circle */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #34d399, #10b981)',
            border: '3px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '800', color: 'white',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}>
            {provider.name?.[0]?.toUpperCase() || '?'}
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'white', lineHeight: 1.2 }}>
              {provider.name}
            </h1>

            {/* Star rating summary */}
            {stats.avgRating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <StarRow score={roundedAvg} size={16} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fde68a' }}>
                  {stats.avgRating}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                  ({stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''})
                </span>
              </div>
            ) : (
              <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                No ratings yet
              </p>
            )}

            {/* Contact number */}
            {provider.contactNumber && (
              <a
                href={`tel:${provider.contactNumber}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  marginTop: '6px', fontSize: '13px',
                  color: '#6ee7b7', fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                📞 {provider.contactNumber}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          CONTENT
      ══════════════════════════���═════ */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <StatCard
            emoji="🍱"
            value={stats.totalListings}
            label="Total Listed"
            color="#3b82f6"
          />
          <StatCard
            emoji="✅"
            value={stats.totalRescued}
            label="Meals Rescued"
            color="#22c55e"
          />
          <StatCard
            emoji="⭐"
            value={stats.avgRating ? `${stats.avgRating}` : '—'}
            label="Avg Rating"
            color="#f59e0b"
            sub={stats.totalRatings > 0 ? `${stats.totalRatings} reviews` : null}
          />
        </div>

        {/* ── Active Listings ── */}
        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
              Active Listings ({activeListings.length})
            </h2>
          </div>

          {activeListings.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
              padding: '32px', textAlign: 'center', color: '#94a3b8',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🫙</div>
              <p style={{ margin: 0, fontSize: '14px' }}>No active listings right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeListings.map(l => {
                const { text: tText, color: tColor } = getTimeLabel(l.expiresAt);
                const isFree = l.allowFree && l.minimumPrice === 0;
                return (
                  <div
                    key={l.id}
                    onClick={() => navigate(`/listing/${l.id}`)}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      transition: 'box-shadow 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '10px',
                      flexShrink: 0, overflow: 'hidden',
                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '24px',
                    }}>
                      {l.imageUrl
                        ? <img src={l.imageUrl} alt={l.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (categoryEmoji[l.foodCategory] || '🍽️')
                      }
                    </div>

                    {/* Name + time */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.foodName}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: tColor, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: tColor, display: 'inline-block', flexShrink: 0 }} />
                        {tText}
                      </p>
                    </div>

                    {/* Price + qty */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: isFree ? '#22c55e' : '#1e293b' }}>
                        {isFree ? 'FREE' : `₱${l.originalPrice}`}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                        {l.quantity} serving{l.quantity !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Chevron */}
                    <span style={{ color: '#cbd5e1', fontSize: '18px', flexShrink: 0 }}>›</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Reviews ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '18px' }}>⭐</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
              Reviews ({ratings.length})
            </h2>
            {stats.avgRating && (
              <span style={{
                marginLeft: 'auto', background: '#fef9c3',
                border: '1px solid #fde68a', borderRadius: '20px',
                padding: '3px 10px', fontSize: '13px',
                fontWeight: '700', color: '#92400e',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                ★ {stats.avgRating} / 5
              </span>
            )}
          </div>

          {ratings.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: '12px',
              border: '1px solid #e2e8f0', padding: '32px',
              textAlign: 'center', color: '#94a3b8',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
              <p style={{ margin: 0, fontSize: '14px' }}>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ratings.map(r => (
                <div key={r.id} style={{
                  background: 'white', borderRadius: '12px',
                  border: '1px solid #e2e8f0', padding: '14px 16px',
                }}>
                  {/* Reviewer + date + stars */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px', marginBottom: r.comment ? '8px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Mini avatar */}
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: '#1e40af', flexShrink: 0,
                      }}>
                        {r.rater.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>
                          {r.rater.name}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {/* Stars on the right */}
                    <StarRow score={r.score} size={16} />
                  </div>

                  {/* Comment */}
                  {r.comment && (
                    <p style={{
                      margin: 0, fontSize: '13px', color: '#475569',
                      lineHeight: '1.55', fontStyle: 'italic',
                      background: '#f8fafc', borderRadius: '8px',
                      padding: '8px 10px',
                    }}>
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// ── Stat card ──
function StatCard({ emoji, value, label, color, sub = null }) {
  return (
    <div style={{
      flex: 1,
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '14px',
      padding: '16px 12px',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{emoji}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{label}</div>
    </div>
  );
}