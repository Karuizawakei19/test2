// client/src/pages/ReceiverProfile.jsx
// Public profile for a receiver — providers can visit this from their reservation cards

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const categoryEmoji = {
  prepared_meal: '🍛', baked_goods: '🍞',
  fresh_produce: '🥦', packaged: '📦', other: '🍽️',
};

export default function ReceiverProfile() {
  const { receiverId } = useParams();
  const navigate       = useNavigate();
  const token          = localStorage.getItem('token');

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    api.get(`/receivers/${receiverId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setData(res.data))
      .catch(() => setError('Could not load receiver profile.'))
      .finally(() => setLoading(false));
  }, [receiverId]);

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>👤</div>
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

  const { receiver, stats, recentPickups } = data;

  // Reliability colour
  const reliabilityColor =
    stats.reliabilityPct === null ? '#94a3b8' :
    stats.reliabilityPct >= 80    ? '#22c55e' :
    stats.reliabilityPct >= 50    ? '#f59e0b' : '#ef4444';

  const reliabilityLabel =
    stats.reliabilityPct === null ? 'No data yet' :
    stats.reliabilityPct >= 80    ? 'Reliable' :
    stats.reliabilityPct >= 50    ? 'Average' : 'Low';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* ════════════════════════════════
          HERO BANNER — blue theme
          (distinct from provider's green)
      ════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 60%, #2563eb 100%)',
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

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            border: '3px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '800', color: 'white',
            flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}>
            {receiver.name?.[0]?.toUpperCase() || '?'}
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'white', lineHeight: 1.2 }}>
              {receiver.name}
            </h1>

            {/* Reliability badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '3px 10px' }}>
              <span style={{ fontSize: '12px', color: 'white', opacity: 0.85 }}>Reliability:</span>
              <span style={{
                fontSize: '13px', fontWeight: '700',
                color: stats.reliabilityPct === null ? 'rgba(255,255,255,0.5)' :
                       stats.reliabilityPct >= 80 ? '#86efac' :
                       stats.reliabilityPct >= 50 ? '#fde68a' : '#fca5a5',
              }}>
                {stats.reliabilityPct !== null ? `${stats.reliabilityPct}%` : '—'} {reliabilityLabel}
              </span>
            </div>

            {/* Member since */}
            {receiver.memberSince && (
              <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                🗓️ Member since {new Date(receiver.memberSince).toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </p>
            )}

            {/* Contact */}
            {receiver.contactNumber && (
              <a
                href={`tel:${receiver.contactNumber}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '5px', fontSize: '13px', color: '#93c5fd', fontWeight: '600', textDecoration: 'none' }}
              >
                📞 {receiver.contactNumber}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          CONTENT
      ════════════════════════════════ */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* ── Stats grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <StatCard emoji="🍱" value={stats.totalRescued}      label="Meals Rescued"  color="#22c55e" />
          <StatCard emoji="📋" value={stats.totalReservations} label="Total Reserved" color="#3b82f6" />
          <StatCard
            emoji={stats.reliabilityPct === null ? '📊' : stats.reliabilityPct >= 80 ? '🏆' : stats.reliabilityPct >= 50 ? '📈' : '⚠️'}
            value={stats.reliabilityPct !== null ? `${stats.reliabilityPct}%` : '—'}
            label="Reliability"
            color={reliabilityColor}
          />
          <StatCard emoji="❌" value={stats.totalCancelled}  label="Cancelled"     color="#ef4444" />
          <StatCard emoji="🚫" value={stats.totalDeclined}   label="Declined"      color="#94a3b8" />
          <StatCard emoji="⭐" value={stats.ratingsGiven}    label="Reviews Given" color="#f59e0b" />
          {/* ── No-Show stat card (NEW) ── */}
          <StatCard
            emoji={receiver.noShowCount === 0 ? '✅' : receiver.noShowCount >= 3 ? '🚫' : '⚠️'}
            value={receiver.noShowCount}
            label="No-Shows"
            color={receiver.noShowCount === 0 ? '#22c55e' : receiver.noShowCount >= 3 ? '#ef4444' : '#f59e0b'}
          />
        </div>

        {/* ── No-Show warning banner (NEW) — only shown if noShowCount >= 2 ── */}
        {receiver.noShowCount >= 2 && (
          <div style={{
            background: receiver.noShowCount >= 3 ? '#fee2e2' : '#fffbeb',
            border: `1px solid ${receiver.noShowCount >= 3 ? '#fca5a5' : '#fcd34d'}`,
            borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>
              {receiver.noShowCount >= 3 ? '🚫' : '⚠️'}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: receiver.noShowCount >= 3 ? '#991b1b' : '#92400e' }}>
                {receiver.noShowCount >= 3 ? 'High No-Show Risk' : 'No-Show Warning'}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: receiver.noShowCount >= 3 ? '#b91c1c' : '#a16207', lineHeight: '1.5' }}>
                This receiver has {receiver.noShowCount} recorded no-show{receiver.noShowCount !== 1 ? 's' : ''}.
                {receiver.noShowCount >= 3 ? ' Consider declining their reservation.' : ' Use your judgement when accepting their reservation.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Reliability explanation ── */}
        <div style={{
          background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
          padding: '14px 16px', marginBottom: '24px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>
            {stats.reliabilityPct === null ? '📊' : stats.reliabilityPct >= 80 ? '🏆' : stats.reliabilityPct >= 50 ? '📈' : '⚠️'}
          </span>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
              {stats.reliabilityPct === null
                ? 'No pickup data yet'
                : `${stats.reliabilityPct}% pickup reliability`
              }
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
              {stats.reliabilityPct === null
                ? 'This receiver has not yet completed any reservations.'
                : `${receiver.name} has completed ${stats.totalRescued} out of ${stats.totalRescued + stats.totalCancelled} reservations (excl. provider-declined).`
              }
            </p>
          </div>
        </div>

        {/* ── Recent Pickups ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
              Recent Rescues ({recentPickups.length})
            </h2>
          </div>

          {recentPickups.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: '12px',
              border: '1px solid #e2e8f0', padding: '32px',
              textAlign: 'center', color: '#94a3b8',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🫙</div>
              <p style={{ margin: 0, fontSize: '14px' }}>No rescues yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentPickups.map((r, i) => (
                <div key={i} style={{
                  background: 'white', borderRadius: '12px',
                  border: '1px solid #e2e8f0', padding: '12px 14px',
                  display: 'flex', gap: '12px', alignItems: 'center',
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '8px',
                    flexShrink: 0, overflow: 'hidden',
                    background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px',
                  }}>
                    {r.listing.imageUrl
                      ? <img src={r.listing.imageUrl} alt={r.listing.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (categoryEmoji[r.listing.foodCategory] || '🍽️')
                    }
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.listing.foodName}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      from{' '}
                      <span
                        onClick={() => navigate(`/provider/${r.listing.provider?.id}`)}
                        style={{ color: '#22c55e', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {r.listing.provider?.name}
                      </span>
                      {' '}· {r.listing.address}
                    </p>
                  </div>

                  {/* Date */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(r.reservedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                    <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', borderRadius: '20px', padding: '2px 8px', fontWeight: '600' }}>
                      ✅ Rescued
                    </span>
                  </div>
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
function StatCard({ emoji, value, label, color }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0',
      borderRadius: '12px', padding: '14px 10px',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{emoji}</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{label}</div>
    </div>
  );
}