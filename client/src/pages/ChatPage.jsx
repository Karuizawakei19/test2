// client/src/pages/ChatPage.jsx

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate }       from 'react-router-dom';
import api from '../api';

export default function ChatPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const token  = localStorage.getItem('token');
  const myRole = localStorage.getItem('role');
  const myName = localStorage.getItem('name');

  const [messages,    setMessages]    = useState([]);
  const [reservation, setReservation] = useState(null);
  const [text,        setText]        = useState('');
  const [sending,     setSending]     = useState(false);
  const [myCoords,    setMyCoords]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  const bottomRef   = useRef(null);
  const pollRef     = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadAll();

    // Live GPS — receiver only (we show their pin on the map)
    let watchId = null;
    if (myRole === 'receiver') {
      watchId = navigator.geolocation.watchPosition(
        pos => setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
    }

    // Poll messages every 5 s
    pollRef.current = setInterval(loadMessages, 5000);

    return () => {
      clearInterval(pollRef.current);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [reservationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadAll() {
    try {
      const msgRes = await api.get(`/messages/${reservationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(msgRes.data.messages);

      let found = null;
      if (myRole === 'receiver') {
        const res = await api.get('/reservations/mine', { headers: { Authorization: `Bearer ${token}` } });
        found = res.data.reservations.find(r => r.id === reservationId) || null;
      } else {
        const res = await api.get('/reservations/pending', { headers: { Authorization: `Bearer ${token}` } });
        found = res.data.reservations.find(r => r.id === reservationId) || null;
      }

      if (!found) { setError('Reservation not found or no longer active.'); return; }
      setReservation(found);
    } catch (err) {
      setError('Could not load chat.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const res = await api.get(`/messages/${reservationId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data.messages);
    } catch { /* silent */ }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post(
        `/messages/${reservationId}`,
        { text: text.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, res.data.message]);
      setText('');
      textareaRef.current?.focus();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send.', 'error');
    } finally {
      setSending(false);
    }
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
        <p style={{ margin: 0, fontSize: '14px' }}>Loading chat...</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <p style={{ color: '#ef4444', background: '#fff0f0', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', lineHeight: '1.5' }}>
          {error}
        </p>
        <button
          onClick={() => navigate(myRole === 'provider' ? '/dashboard' : '/receiver')}
          style={{ marginTop: '16px', padding: '10px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  const otherName = myRole === 'receiver'
    ? reservation?.listing?.provider?.name
    : reservation?.receiver?.name;

  const providerLat = reservation?.listing?.latitude;
  const providerLng = reservation?.listing?.longitude;
  const hasMap = !!(providerLat && providerLng);

  function handleMapClick() {
    // Pass coords in URL — MapPage reads from query params
    const params = new URLSearchParams({
      reservationId,
      providerLat,
      providerLng,
      providerAddress: reservation?.listing?.address || '',
      foodName:        reservation?.listing?.foodName || '',
    });
    if (myCoords) {
      params.set('myLat', myCoords.lat);
      params.set('myLng', myCoords.lng);
    }
    navigate(`/map?${params.toString()}`);
  }

  // Group messages by date for date dividers
  function getDateLabel(dateStr) {
    const d = new Date(dateStr);
    const today    = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Build messages with date dividers
  const messageGroups = [];
  let lastDate = '';
  messages.forEach(msg => {
    const dateLabel = getDateLabel(msg.createdAt);
    if (dateLabel !== lastDate) {
      messageGroups.push({ type: 'divider', label: dateLabel, id: `d-${msg.id}` });
      lastDate = dateLabel;
    }
    messageGroups.push({ type: 'message', msg });
  });

  const canChat = ['accepted', 'confirmed'].includes(reservation?.status);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#ece5dd',   // WhatsApp-style warm background
      overflow: 'hidden',
    }}>

      {/* ════════════════════════════════════
          HEADER
      ════════════════════════════════════ */}
      <div style={{
        background: '#075e54',   // WhatsApp dark green
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: '64px',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        {/* Back button */}
        <button
          onClick={() => navigate(myRole === 'provider' ? '/dashboard' : '/receiver')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '20px', padding: '4px', lineHeight: 1, flexShrink: 0 }}
        >
          ←
        </button>

        {/* Avatar */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: '#128c7e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', color: 'white', fontWeight: '700',
          flexShrink: 0,
        }}>
          {otherName?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {otherName || '...'}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#9de0d9' }}>
            {reservation?.listing?.foodName}
            {' · '}
            <span style={{ textTransform: 'capitalize' }}>{reservation?.status}</span>
          </p>
        </div>

        {/* Map button in header */}
        {hasMap && (
          <button
            onClick={handleMapClick}
            title="View map & route"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: '8px',
              cursor: 'pointer', color: 'white',
              padding: '6px 10px', fontSize: '18px',
              flexShrink: 0,
            }}
          >
            🗺️
          </button>
        )}
      </div>

      {/* ════════════════════════════════════
          MAP PREVIEW STRIP
          Clickable → goes to full MapPage
      ════════════════════════════════════ */}
      {hasMap && (
        <button
          onClick={handleMapClick}
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            background: '#128c7e',
            cursor: 'pointer',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Mini static map thumbnail */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '8px',
            background: '#075e54',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.2)',
          }}>
            📍
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'white' }}>
              📦 Pickup Location
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9de0d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {reservation?.listing?.address}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
              Tap to open map{myRole === 'receiver' ? ' & see route' : ''}
            </p>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>›</span>
        </button>
      )}

      {/* ════════════════════════════════════
          MESSAGES
      ════════════════════════════════════ */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        // Subtle chat wallpaper pattern
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b5cec9' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}>

        {/* Empty state */}
        {messageGroups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', margin: 'auto' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.85)',
              borderRadius: '12px',
              padding: '16px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👋</div>
              <p style={{ margin: 0, fontSize: '14px', color: '#555', fontWeight: '500' }}>
                Say hi to {otherName}!
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
                Messages are only visible to you and {otherName}.
              </p>
            </div>
          </div>
        )}

        {messageGroups.map(item => {
          // Date divider
          if (item.type === 'divider') return (
            <div key={item.id} style={{ textAlign: 'center', margin: '10px 0 6px' }}>
              <span style={{
                display: 'inline-block',
                background: 'rgba(225,245,254,0.92)',
                color: '#555',
                fontSize: '12px',
                padding: '3px 12px',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}>
                {item.label}
              </span>
            </div>
          );

          // Message bubble
          const { msg } = item;
          const isMine = msg.sender.role === myRole;

          return (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: isMine ? 'flex-end' : 'flex-start',
              marginBottom: '4px',
            }}>
              <div style={{
                maxWidth: '75%',
                padding: '8px 12px 6px',
                borderRadius: isMine
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
                background: isMine ? '#dcf8c6' : 'white',
                boxShadow: '0 1px 2px rgba(0,0,0,0.13)',
                position: 'relative',
              }}>
                {/* Sender name — only shown for the other person */}
                {!isMine && (
                  <p style={{
                    margin: '0 0 2px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#128c7e',
                  }}>
                    {msg.sender.name}
                  </p>
                )}

                {/* Message text */}
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#1e293b',
                  lineHeight: '1.45',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </p>

                {/* Timestamp + read tick */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '3px',
                  marginTop: '3px',
                }}>
                  <span style={{ fontSize: '11px', color: '#888' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMine && (
                    <span style={{ fontSize: '13px', color: '#4fc3f7' }}>✓✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ════════════════════════════════════
          INPUT BAR
      ════════════════════════════════════ */}
      <div style={{
        background: '#f0f2f5',
        padding: '8px 12px',
        flexShrink: 0,
        borderTop: '1px solid #ddd',
      }}>
        {canChat ? (
          <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>

            {/* Text input */}
            <div style={{ flex: 1, background: 'white', borderRadius: '24px', padding: '10px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => {
                  setText(e.target.value);
                  // Auto-grow — max 5 lines
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }
                }}
                placeholder="Type a message..."
                maxLength={500}
                rows={1}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  fontFamily: 'inherit',
                  color: '#1e293b',
                  background: 'transparent',
                  overflow: 'hidden',
                  maxHeight: '120px',
                  minHeight: '22px',
                }}
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!text.trim() || sending}
              style={{
                width: '48px', height: '48px',
                borderRadius: '50%',
                background: text.trim() ? '#128c7e' : '#c5c5c5',
                color: 'white',
                border: 'none',
                cursor: text.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
                transition: 'background 0.15s',
                boxShadow: text.trim() ? '0 2px 8px rgba(18,140,126,0.4)' : 'none',
              }}
            >
              {sending ? '⌛' : '➤'}
            </button>
          </form>
        ) : (
          <div style={{
            background: '#fff8e1',
            border: '1px solid #fbbf24',
            borderRadius: '12px',
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#854d0e',
          }}>
            🔒 Chat unlocks once the provider accepts the reservation.
          </div>
        )}
      </div>

    </div>
  );
}