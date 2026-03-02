// client/src/pages/ReceiverProfile.jsx
// Public profile for a receiver — providers can visit this from their reservation cards

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, UtensilsCrossed, CheckCircle2,
  ChevronRight, Calendar, TrendingUp, AlertTriangle,
  XCircle, Star, BarChart3,
} from 'lucide-react';
import api from '../api';

const B = {
  pageBg:  '#f5f0e8',
  heroBg:  'linear-gradient(135deg, #5a3e1b 0%, #7c5c2e 60%, #a07040 100%)',
  card:    '#fffdf8',
  border:  '#e2d9c8',
  brown:   '#7c5c2e',
  amber:   '#c8862a',
  muted:   '#9c8a6e',
  text:    '#3d2b0e',
  subtext: '#7a6040',
};

const categoryEmoji = {
  prepared_meal: 'Prepared Meal', baked_goods: 'Baked Good',
  fresh_produce: 'Fresh Produce', packaged: 'Packaged', other: 'Other',
};

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div style={{
      background: B.card, border: `1px solid ${B.border}`,
      borderRadius: '12px', padding: '14px 10px',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(139,109,56,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
        <Icon size={18} strokeWidth={1.8} color={color} />
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: B.subtext, marginTop: '4px', fontWeight: '500' }}>{label}</div>
    </div>
  );
}

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
        <button
          onClick={() => navigate(-1)}
          style={{ marginTop: '16px', padding: '10px 24px', background: B.amber, color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
        >
          Go Back
        </button>
      </div>
    </div>
  );

  const { receiver, stats, recentPickups } = data;

  const reliabilityColor =
    stats.reliabilityPct === null ? B.muted :
    stats.reliabilityPct >= 80    ? '#5a8a4a' :
    stats.reliabilityPct >= 50    ? B.amber : '#c0392b';

  const reliabilityLabel =
    stats.reliabilityPct === null ? 'No data yet' :
    stats.reliabilityPct >= 80    ? 'Reliable' :
    stats.reliabilityPct >= 50    ? 'Average' : 'Low';

  const ReliabilityIcon =
    stats.reliabilityPct === null ? BarChart3 :
    stats.reliabilityPct >= 80    ? TrendingUp :
    stats.reliabilityPct >= 50    ? TrendingUp : AlertTriangle;

  return (
    <div style={{ background: B.pageBg, minHeight: '100vh' }}>

      <div style={{ background: B.heroBg, padding: '20px 24px 28px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.18)', border: 'none',
            color: 'white', borderRadius: '8px',
            padding: '7px 14px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '500',
            marginBottom: '24px', display: 'inline-flex',
            alignItems: 'center', gap: '6px',
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            border: '3px solid rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '800', color: 'white',
            flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}>
            {receiver.name?.[0]?.toUpperCase() || '?'}
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'white', lineHeight: 1.2 }}>
              {receiver.name}
            </h1>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              marginTop: '6px', background: 'rgba(255,255,255,0.15)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              <span style={{ fontSize: '12px', color: 'white', opacity: 0.85 }}>Reliability:</span>
              <span style={{
                fontSize: '13px', fontWeight: '700',
                color: stats.reliabilityPct === null ? 'rgba(255,255,255,0.5)' :
                       stats.reliabilityPct >= 80 ? '#d4edbe' :
                       stats.reliabilityPct >= 50 ? '#fde68a' : '#fca5a5',
              }}>
                {stats.reliabilityPct !== null ? `${stats.reliabilityPct}%` : ''} {reliabilityLabel}
              </span>
            </div>

            {receiver.memberSince && (
              <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> Member since {new Date(receiver.memberSince).toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </p>
            )}

            {receiver.contactNumber && (
              <a
                href={`tel:${receiver.contactNumber}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  marginTop: '5px', fontSize: '13px',
                  color: 'rgba(255,255,255,0.85)', fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                <Phone size={13} /> {receiver.contactNumber}
              </a>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 40px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <StatCard icon={CheckCircle2}    value={stats.totalRescued}      label="Meals Rescued"  color="#5a8a4a" />
          <StatCard icon={UtensilsCrossed} value={stats.totalReservations} label="Total Reserved" color={B.brown} />
          <StatCard icon={ReliabilityIcon} value={stats.reliabilityPct !== null ? `${stats.reliabilityPct}%` : ''} label="Reliability" color={reliabilityColor} />
          <StatCard icon={XCircle}         value={stats.totalCancelled}    label="Cancelled"      color="#c0392b" />
          <StatCard icon={AlertTriangle}   value={stats.totalDeclined}     label="Declined"       color={B.muted} />
          <StatCard icon={Star}            value={stats.ratingsGiven}      label="Reviews Given"  color={B.amber} />
        </div>

        {receiver.noShowCount >= 2 && (
          <div style={{
            background: receiver.noShowCount >= 3 ? '#fee8e0' : '#fdf3e0',
            border: `1px solid ${receiver.noShowCount >= 3 ? '#f4a48a' : B.border}`,
            borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <AlertTriangle size={20} color={receiver.noShowCount >= 3 ? '#c0392b' : B.amber} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: receiver.noShowCount >= 3 ? '#c0392b' : '#92400e' }}>
                {receiver.noShowCount >= 3 ? 'High No-Show Risk' : 'No-Show Warning'}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: receiver.noShowCount >= 3 ? '#b91c1c' : B.subtext, lineHeight: '1.5' }}>
                This receiver has {receiver.noShowCount} recorded no-show{receiver.noShowCount !== 1 ? 's' : ''}.
                {receiver.noShowCount >= 3 ? ' Consider declining their reservation.' : ' Use your judgement when accepting.'}
              </p>
            </div>
          </div>
        )}

        <div style={{
          background: B.card, borderRadius: '12px', border: `1px solid ${B.border}`,
          padding: '14px 16px', marginBottom: '24px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <ReliabilityIcon size={20} color={reliabilityColor} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: B.text }}>
              {stats.reliabilityPct === null
                ? 'No pickup data yet'
                : `${stats.reliabilityPct}% pickup reliability`
              }
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: B.subtext, lineHeight: '1.5' }}>
              {stats.reliabilityPct === null
                ? 'This receiver has not yet completed any reservations.'
                : `${receiver.name} has completed ${stats.totalRescued} out of ${stats.totalRescued + stats.totalCancelled} reservations (excl. provider-declined).`
              }
            </p>
          </div>
        </div>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle2 size={18} color="#5a8a4a" strokeWidth={2} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: B.text }}>
              Recent Rescues ({recentPickups.length})
            </h2>
          </div>

          {recentPickups.length === 0 ? (
            <div style={{
              background: B.card, borderRadius: '12px',
              border: `1px solid ${B.border}`, padding: '32px',
              textAlign: 'center', color: B.muted,
            }}>
              <UtensilsCrossed size={32} color={B.border} strokeWidth={1.5} style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No rescues yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentPickups.map((r, i) => (
                <div key={i} style={{
                  background: B.card, borderRadius: '12px',
                  border: `1px solid ${B.border}`, padding: '12px 14px',
                  display: 'flex', gap: '12px', alignItems: 'center',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '8px',
                    flexShrink: 0, overflow: 'hidden',
                    background: 'linear-gradient(135deg,#ede4d3,#d6c9b0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {r.listing.imageUrl
                      ? <img src={r.listing.imageUrl} alt={r.listing.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <UtensilsCrossed size={20} color={B.muted} strokeWidth={1.5} />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: B.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.listing.foodName}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: B.muted }}>
                      from{' '}
                      <span
                        onClick={() => navigate(`/provider/${r.listing.provider?.id}`)}
                        style={{ color: B.amber, fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {r.listing.provider?.name}
                      </span>
                      {' '}b {r.listing.address}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: '11px', color: B.muted }}>
                      {new Date(r.reservedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                    <span style={{
                      fontSize: '11px',
                      background: '#e8f5e2',
                      color: '#5a8a4a',
                      borderRadius: '20px', padding: '2px 8px', fontWeight: '600',
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                    }}>
                      <CheckCircle2 size={10} /> Rescued
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>;
}