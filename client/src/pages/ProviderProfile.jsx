// client/src/pages/ProviderProfile.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Star, ListChecks, UtensilsCrossed,
  ChevronRight, Clock, MessageSquare, ShoppingBasket,
} from 'lucide-react';
import api from '../api';

const B = {
  pageBg:  '#f5f0e8',
  heroBg:  'linear-gradient(135deg, #7c5c2e 0%, #a07040 60%, #c8862a 100%)',
  card:    '#fffdf8',
  border:  '#e2d9c8',
  brown:   '#7c5c2e',
  amber:   '#c8862a',
  muted:   '#9c8a6e',
  text:    '#3d2b0e',
  subtext: '#7a6040',
};

function StarRow({ score, size = 15 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', lineHeight: 1 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} strokeWidth={0} fill={i <= score ? '#c8862a' : '#e2d9c8'} />
      ))}
    </span>
  );
}

function getTimeLabel(expiresAt) {
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return { text: 'Expired', color: '#9c8a6e' };
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  if (h === 0) return { text: `${m}m left`, color: '#c0392b' };
  if (h < 3)   return { text: `${h}h ${m}m left`, color: '#c8862a' };
  return         { text: `${h}h ${m}m left`, color: '#5a8a4a' };
}

function StatCard({ icon: Icon, value, label, color, sub = null }) {
  return (
    <div style={{
      flex: 1, background: B.card, border: `1px solid ${B.border}`,
      borderRadius: '14px', padding: '16px 12px', textAlign: 'center',
      boxShadow: '0 1px 4px rgba(139,109,56,0.07)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
        <Icon size={20} strokeWidth={1.8} color={color} />
      </div>
      <div style={{ fontSize: '22px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: B.muted, marginTop: '2px' }}>{sub}</div>}
      <div style={{ fontSize: '11px', color: B.subtext, marginTop: '4px', fontWeight: '500' }}>{label}</div>
    </div>
  );
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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: B.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: B.muted }}>
        <UtensilsCrossed size={36} color={B.amber} strokeWidth={1.5} style={{ marginBottom: '10px' }} />
        <p style={{ margin: 0, fontSize: '14px' }}>Loading profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: B.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <p style={{ color: '#c0392b', background: '#fff0ea', padding: '12px 16px', borderRadius: '10px', fontSize: '14px' }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: '16px', padding: '10px 24px', background: B.amber, color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>
          Go Back
        </button>
      </div>
    </div>
  );

  const { provider, stats, activeListings, ratings } = data;
  const roundedAvg = stats.avgRating ? Math.round(stats.avgRating) : 0;

  return (
    <div style={{ background: B.pageBg, minHeight: '100vh' }}>
      <div style={{ background: B.heroBg, padding: '20px 24px 28px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', border: '3px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: 'white', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
            {provider.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'white', lineHeight: 1.2 }}>{provider.name}</h1>
            {stats.avgRating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <StarRow score={roundedAvg} size={16} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fde68a' }}>{stats.avgRating}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>({stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''})</span>
              </div>
            ) : (
              <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>No ratings yet</p>
            )}
            {provider.contactNumber && (
              <a href={`tel:${provider.contactNumber}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: '600', textDecoration: 'none' }}>
                <Phone size={13} /> {provider.contactNumber}
              </a>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 40px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <StatCard icon={ShoppingBasket} value={stats.totalListings} label="Total Listed" color={B.brown} />
          <StatCard icon={ListChecks} value={stats.totalRescued} label="Meals Rescued" color="#5a8a4a" />
          <StatCard icon={Star} value={stats.avgRating ? `${stats.avgRating}` : '—'} label="Avg Rating" color={B.amber} sub={stats.totalRatings > 0 ? `${stats.totalRatings} reviews` : null} />
        </div>

        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#5a8a4a', display: 'inline-block', flexShrink: 0 }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: B.text }}>Active Listings ({activeListings.length})</h2>
          </div>
          {activeListings.length === 0 ? (
            <div style={{ background: B.card, borderRadius: '12px', border: `1px solid ${B.border}`, padding: '32px', textAlign: 'center', color: B.muted }}>
              <UtensilsCrossed size={32} color={B.border} strokeWidth={1.5} style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No active listings right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeListings.map(l => {
                const { text: tText, color: tColor } = getTimeLabel(l.expiresAt);
                const isFree = l.allowFree && l.minimumPrice === 0;
                return (
                  <div key={l.id} onClick={() => navigate(`/listing/${l.id}`)} style={{ background: B.card, borderRadius: '12px', border: `1px solid ${B.border}`, padding: '12px 14px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', transition: 'box-shadow 0.15s, transform 0.15s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(139,109,56,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ede4d3, #d6c9b0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {l.imageUrl ? <img src={l.imageUrl} alt={l.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UtensilsCrossed size={22} color={B.muted} strokeWidth={1.5} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: B.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.foodName}</p>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: tColor, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} color={tColor} />{tText}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: isFree ? '#5a8a4a' : B.text }}>{isFree ? 'FREE' : `₱${l.originalPrice}`}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: B.muted }}>{l.quantity} serving{l.quantity !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={18} color={B.border} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Star size={18} color={B.amber} fill={B.amber} strokeWidth={0} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: B.text }}>Reviews ({ratings.length})</h2>
            {stats.avgRating && (
              <span style={{ marginLeft: 'auto', background: '#fdf3e0', border: `1px solid ${B.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '13px', fontWeight: '700', color: B.amber, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={12} fill={B.amber} strokeWidth={0} /> {stats.avgRating} / 5
              </span>
            )}
          </div>
          {ratings.length === 0 ? (
            <div style={{ background: B.card, borderRadius: '12px', border: `1px solid ${B.border}`, padding: '32px', textAlign: 'center', color: B.muted }}>
              <MessageSquare size={32} color={B.border} strokeWidth={1.5} style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ratings.map(r => (
                <div key={r.id} style={{ background: B.card, borderRadius: '12px', border: `1px solid ${B.border}`, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px', marginBottom: r.comment ? '8px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ede4d3', border: `1px solid ${B.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: B.brown, flexShrink: 0 }}>
                        {r.rater.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: B.text }}>{r.rater.name}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: B.muted }}>{new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <StarRow score={r.score} size={16} />
                  </div>
                  {r.comment && (
                    <p style={{ margin: 0, fontSize: '13px', color: B.subtext, lineHeight: '1.55', fontStyle: 'italic', background: '#f5f0e8', borderRadius: '8px', padding: '8px 10px', border: `1px solid ${B.border}` }}>
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