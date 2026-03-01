
import { useState } from 'react';
import api from '../api';
import { showToast } from './Toast';

export default function RatingModal({ reservation, onClose, onSubmitted }) {
  const [score,     setScore]     = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  async function handleSubmit() {
    if (!score) return;
    setSubmitting(true);
    try {
      await api.post('/ratings', {
        reservationId: reservation.id,
        score,
        comment: comment.trim() || null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      showToast(`Thanks for rating ${reservation.listing?.provider?.name}! ⭐`, 'success');
      onSubmitted();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit rating.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '20px',
          padding: '28px 24px', maxWidth: '380px', width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>⭐</div>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#1e293b' }}>
            Rate {reservation.listing?.provider?.name}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            How was your pickup of {reservation.listing?.foodName}?
          </p>
        </div>

        {/* Star picker */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              onClick={() => setScore(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '40px', padding: '4px',
                color: i <= (hovered || score) ? '#f59e0b' : '#e2e8f0',
                transform: i <= (hovered || score) ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.1s',
              }}
            >
              ★
            </button>
          ))}
        </div>

        {/* Label */}
        <p style={{ textAlign: 'center', margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#f59e0b', minHeight: '20px' }}>
          {starLabels[hovered || score] || ''}
        </p>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Leave a comment (optional)…"
          maxLength={200}
          rows={3}
          style={{
            width: '100%', padding: '10px 12px',
            borderRadius: '10px', border: '1.5px solid #e2e8f0',
            fontSize: '14px', resize: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box', outline: 'none', color: '#1e293b',
            marginBottom: '16px',
          }}
        />
        <p style={{ margin: '-10px 0 16px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
          {comment.length}/200
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!score || submitting}
            style={{
              flex: 2, padding: '12px',
              background: score ? '#f59e0b' : '#e2e8f0',
              color: score ? 'white' : '#94a3b8',
              border: 'none', borderRadius: '10px',
              cursor: score ? 'pointer' : 'not-allowed',
              fontWeight: '700', fontSize: '14px',
            }}
          >
            {submitting ? 'Submitting...' : `Submit ${score ? '⭐'.repeat(score) : 'Rating'}`}
          </button>
        </div>
      </div>
    </div>
  );
}