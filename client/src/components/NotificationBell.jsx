import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open,          setOpen]          = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();
  const token       = localStorage.getItem('token');

  const unread = notifications.filter(n => !n.read).length;

  // Fetch on mount + every 20 seconds
  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [token]);

  
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications);
    } catch { /* silent fail */ }
  }

  async function handleOpen() {
    setOpen(prev => !prev);
    // Mark all as read when opening
    if (!open && unread > 0) {
      try {
        await api.patch('/notifications/read-all', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch { /* silent */ }
    }
  }

  function handleNotificationClick(n) {
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>

      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'white', fontSize: '20px', position: 'relative',
          padding: '4px 8px', lineHeight: 1,
        }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            background: '#ef4444', color: 'white',
            borderRadius: '10px', fontSize: '11px', fontWeight: '700',
            padding: '1px 5px', minWidth: '18px', textAlign: 'center',
            border: '2px solid #22c55e',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '36px', right: 0,
          width: '320px', maxHeight: '420px',
          background: 'white', borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden', zIndex: 1000,
        }}>

          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>Notifications</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{notifications.length} total</span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '360px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f8fafc',
                    cursor: n.link ? 'pointer' : 'default',
                    background: n.read ? 'white' : '#f0fdf4',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (n.link) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'white' : '#f0fdf4'; }}
                >
                  <p style={{ margin: 0, fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                    {n.message}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}