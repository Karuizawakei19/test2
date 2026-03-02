import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/Toast';
import api from '../api';
import '../styles/dashboard.css';
import {
  LayoutDashboard, PlusCircle, Bell, Clock, CheckCircle2,
  Package, User, Phone, MessageCircle, LogOut, ChevronRight,
  Inbox, UtensilsCrossed,
} from 'lucide-react';

// ── Status badge ──
const BADGE_CLASS = {
  available: 'db-badge db-badge-available',
  reserved:  'db-badge db-badge-reserved',
  accepted:  'db-badge db-badge-accepted',
  picked_up: 'db-badge db-badge-picked_up',
  confirmed: 'db-badge db-badge-confirmed',
};
const BADGE_ICON = {
  available: <CheckCircle2 size={11} />,  
  reserved:  <Clock size={11} />,  
  accepted:  <CheckCircle2 size={11} />,  
  picked_up: <Package size={11} />, 
};
const BADGE_LABEL = {
  available: 'Available',  
  reserved:  'Pending Acceptance',  
  accepted:  'Awaiting Pickup',  
  picked_up: 'Picked Up',
};

function StatusBadge({ status }) {
  return (
    <span className={BADGE_CLASS[status] || 'db-badge'}>
      {BADGE_ICON[status]}
      {BADGE_LABEL[status] || status}
    </span>
  );
}

function getTimeLabel(expiresAt) {
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return 'Expired';
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  return h === 0 ? `${m}m left` : `${h}h ${m}m left`;
}

export default function ProviderDashboard() {
  const [listings,     setListings]     = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [declineId,    setDeclineId]    = useState(null);
  const [declineNote,  setDeclineNote]  = useState('');
  const [activeConn,   setActiveConn]   = useState(null); // the accepted reservation shown on right

  const navigate = useNavigate();
  const name  = localStorage.getItem('name');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [lRes, rRes] = await Promise.all([
        api.get('/listings/mine',        { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/reservations/pending', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setListings(lRes.data.listings);
      const all = rRes.data.reservations;
      setReservations(all);
      // auto-select first accepted connection
      const firstAccepted = all.find(r => r.status === 'accepted');
      if (firstAccepted) setActiveConn(firstAccepted);
    } catch {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(reservationId) {
    try {
      await api.patch(`/reservations/${reservationId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast('Reservation accepted!', 'success');
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to accept.', 'error');
    }
  }

  async function handleDecline(reservationId) {
    try {
      await api.patch(`/reservations/${reservationId}/decline`,
        { providerNote: declineNote || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeclineId(null);
      setDeclineNote('');
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to decline.', 'error');
    }
  }

  async function handleConfirmPickup(reservationId) {
    try {
      await api.patch(`/reservations/${reservationId}/provider-confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAll();
      showToast('Pickup confirmed! Food has been rescued.', 'success', 4000);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to confirm.', 'error');
    }
  }

  if (loading) return (
    <div className="db-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#a08050' }}>Loading dashboard...</p>
    </div>
  );
  if (error) return (
    <div className="db-page">
      <p style={{ color: '#ef4444', background: '#fff0f0', padding: '12px', borderRadius: '8px' }}>{error}</p>
    </div>
  );

  const pendingRes  = reservations.filter(r => r.status === 'pending');
  const acceptedRes = reservations.filter(r => r.status === 'accepted');

  return (
    <div className="db-page">

      {/* ���─ Page Header ── */}
      <div className="db-page-header">
        <div>
          <h2><LayoutDashboard size={20} /> {name || 'Provider'}&apos;s Dashboard</h2>
          <p>Manage your listings and reservations</p>
        </div>
        <button className="db-logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="db-layout">

        {/* ══════════════════════════
            LEFT COLUMN
        ══════════════════════════ */}
        <div className="db-left">

          {/* Post button */}
          <button className="db-cta-btn" onClick={() => navigate('/post')}>  
            <PlusCircle size={18} /> Post New Food Listing
          </button>

          {/* ── Pending reservations ── */}
          {pendingRes.length > 0 && (
            <div className="db-panel">
              <div className="db-panel-header">
                <Bell size={15} color="#c8862a" />
                <h3>Pending Reservations</h3>
                <span className="db-count">{pendingRes.length}</span>
              </div>

              {pendingRes.map(r => (
                <div key={r.id} className="db-card" style={{ borderColor: '#fbbf24' }}>

                  <div className="db-card-statusbar reserved">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={13} /> Pending Acceptance
                    </span>
                    <StatusBadge status="reserved" />
                  </div>

                  <div className="db-card-body">
                    <div className="db-thumb">
                      {r.listing.imageUrl
                        ? <img src={r.listing.imageUrl} alt={r.listing.foodName} />
                        : <UtensilsCrossed size={28} color="#c8862a" />}
                    </div>

                    <div className="db-card-info">
                      <h4>{r.listing.foodName}</h4>
                      <p className="db-card-meta">
                        <Clock size={11} />
                        Reserved {new Date(r.reservedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Receiver info */}
                      <div className="db-info-box amber" style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#3d2b0e', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <User size={13} />
                            <span
                              onClick={() => navigate(`/receiver/${r.receiver.id}`)}
                              style={{ color: '#5a7fc4', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {r.receiver.name}
                            </span>
                          </p>
                          <button className="db-btn db-btn-profile" onClick={() => navigate(`/receiver/${r.receiver.id}`)}>
                            View Profile <ChevronRight size={11} />
                          </button>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a08050' }}>{r.receiver.email}</p>
                        {r.receiver.contactNumber && (
                          <a href={`tel:${r.receiver.contactNumber}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: '#c8862a', fontWeight: 600, textDecoration: 'none' }}>
                            <Phone size={12} /> {r.receiver.contactNumber}
                          </a>
                        )}
                        {r.receiverNote && (
                          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#7c5c2e', fontStyle: 'italic', borderTop: '1px solid #fde68a', paddingTop: 7 }}>
                            &ldquo;{r.receiverNote}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Decline textarea */}
                      {declineId === r.id && (
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 12, color: '#7c5c2e', fontWeight: 600 }}>
                            Reason for declining <span style={{ fontWeight: 400, color: '#c8b08a' }}>(optional)</span>
                          </label>
                          <textarea
                            className="db-decline-textarea"
                            value={declineNote}
                            onChange={e => setDeclineNote(e.target.value)}
                            placeholder="e.g. Sorry, food was already given away."
                            rows={2}
                            maxLength={200}
                          />
                        </div>
                      )}

                      {/* Accept / Decline */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {declineId === r.id ? (
                          <>  
                            <button className="db-btn db-btn-decline db-btn-full" onClick={() => handleDecline(r.id)}>
                              Confirm Decline
                            </button>
                            <button className="db-btn db-btn-cancel" onClick={() => { setDeclineId(null); setDeclineNote(''); }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>  
                            <button className="db-btn db-btn-accept" onClick={() => handleAccept(r.id)}>
                              <CheckCircle2 size={14} /> Accept
                            </button>
                            <button className="db-btn db-btn-decline" onClick={() => setDeclineId(r.id)}>
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Listings ── */}
          <div className="db-panel">
            <div className="db-panel-header">
              <Inbox size={15} color="#c8862a" />
              <h3>Your Listings</h3>
              <span className="db-count">{listings.length}</span>
            </div>

            {listings.length === 0 && (
              <div className="db-empty">
                <UtensilsCrossed size={32} />
                <p style={{ fontWeight: 600 }}>No listings yet.</p>
                <p style={{ fontSize: 13 }}>Post a new food listing to get started.</p>
              </div>
            )}

            {listings.map(listing => (
              <div
                key={listing.id}
                className={'db-card' + (listing.status === 'picked_up' ? ' dimmed' : '')}
              >
                <div className="db-card-body">
                  <div className="db-thumb">  
                    {listing.imageUrl
                      ? <img src={listing.imageUrl} alt={listing.foodName} />
                      : <UtensilsCrossed size={24} color="#c8862a" />}
                  </div>
                  <div className="db-card-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <h4>{listing.foodName}</h4>
                      <StatusBadge status={listing.status} />
                    </div>
                    <p className="db-card-meta">
                      <Clock size={11} /> {getTimeLabel(listing.expiresAt)}
                      &nbsp;·&nbsp;Qty: {listing.quantity}
                      &nbsp;·&nbsp;₱{listing.currentPrice}
                      {listing.currentPrice < listing.originalPrice && (
                        <s style={{ color: '#c8b08a', marginLeft: 4 }}>₱{listing.originalPrice}</s>
                      )}
                    </p>
                    <p className="db-card-meta" style={{ marginTop: 2 }}>{listing.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════
            RIGHT COLUMN — Active Connection Panel
        ══════════════════════════ */}
        <div className="db-right">  
          {acceptedRes.length === 0 ? (
            <div className="db-hero-empty">
              <Package size={56} />
              <p style={{ fontWeight: 700, fontSize: 17, color: '#7c5c2e' }}>No active connections yet</p>
              <p>Once you accept a reservation, the receiver&apos;s details and chat will appear here.</p>
            </div>
          ) : (
            <>  
              {/* Tab selector when multiple accepted */}
              {acceptedRes.length > 1 && (
                <div className="db-tabs" style={{ marginBottom: 20 }}>
                  {acceptedRes.map(r => (
                    <button
                      key={r.id}
                      className={'db-tab' + (activeConn?.id === r.id ? ' active' : '')}
                      onClick={() => setActiveConn(r)}
                    >
                      {r.listing.foodName}
                    </button>
                  ))}
                </div>
              )}

              {(() => {
                const r = activeConn || acceptedRes[0];
                return (
                  <div className="db-connection-panel">

                    {/* Header */}
                    <div className="db-connection-header">
                      <div>
                        <p className="db-connection-title">{r.listing.foodName}</p>
                        <p className="db-connection-sub">
                          Accepted {new Date(r.acceptedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <StatusBadge status="accepted" />
                    </div>

                    {/* Receiver card */}
                    <div className="db-info-box blue">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3d2b0e', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={15} />
                          <span
                            onClick={() => navigate(`/receiver/${r.receiver.id}`)}
                            style={{ color: '#5a7fc4', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {r.receiver.name}
                          </span>
                          <span style={{ fontWeight: 400, color: '#a08050', fontSize: 13 }}>is on the way</span>
                        </p>
                        <button className="db-btn db-btn-profile" onClick={() => navigate(`/receiver/${r.receiver.id}`)}>
                          View Profile <ChevronRight size={11} />
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#7c5c2e' }}>{r.receiver.email}</p>
                      {r.receiver.contactNumber && (
                        <a href={`tel:${r.receiver.contactNumber}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 13, color: '#c8862a', fontWeight: 600, textDecoration: 'none' }}>
                          <Phone size={13} /> {r.receiver.contactNumber}
                        </a>
                      )}
                      {r.receiverNote && (
                        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#7c5c2e', fontStyle: 'italic', borderTop: '1px solid #bfdbfe', paddingTop: 8 }}>
                          &ldquo;{r.receiverNote}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Chat button */}
                    <button className="db-btn db-btn-chat db-btn-full" onClick={() => navigate(`/chat/${r.id}`)}>
                      <MessageCircle size={16} /> Open Chat with {r.receiver.name}
                    </button>

                    {/* Confirm pickup */}
                    <button className="db-btn db-btn-confirm db-btn-full" onClick={() => handleConfirmPickup(r.id)}>
                      <Package size={16} /> Confirm Food Was Picked Up
                    </button>

                  </div>
                );
              })()}
            </>
          )}
        </div>

      </div>
    </div>
  );
}