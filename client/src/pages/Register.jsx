import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { showToast } from '../components/Toast';

function Register() {
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [role,          setRole]          = useState('receiver');
  const [contactNumber, setContactNumber] = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        name,
        role,
        contactNumber: contactNumber.trim() || null,
      });

      // ✅ showToast instead of alert()
      showToast(`Welcome, ${res.data.name}! Account created. Please log in.`, 'success', 4000);
      navigate('/');

    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '36px 32px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
      }}>

        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🍱</div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b', fontWeight: '700' }}>
            Create Account
          </h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Join RescueBite and help reduce food waste
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #fca5a5',
            borderLeft: '4px solid #ef4444',
            borderRadius: '8px', padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex', gap: '8px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>❌</span>
            <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister}>

          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Juan dela Cruz"
              required
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                style={{ ...inputStyle, paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Contact Number */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Contact Number{' '}
              <span style={{ color: '#94a3b8', fontWeight: '400' }}>(optional)</span>
            </label>
            <input
              type="tel"
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
              placeholder="e.g. 09171234567"
              maxLength={13}
              style={inputStyle}
            />
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Shown to your match after a reservation is accepted so they can contact you.
            </p>
          </div>

          {/* Role */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
              I am a...
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>

              {/* Receiver card */}
              <label style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '6px', padding: '14px 10px',
                border: `2px solid ${role === 'receiver' ? '#22c55e' : '#e2e8f0'}`,
                borderRadius: '12px', cursor: 'pointer',
                background: role === 'receiver' ? '#f0fdf4' : 'white',
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="role" value="receiver" checked={role === 'receiver'} onChange={() => setRole('receiver')} style={{ display: 'none' }} />
                <span style={{ fontSize: '28px' }}>🙋</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: role === 'receiver' ? '#166534' : '#374151', textAlign: 'center' }}>
                  Receiver
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.3' }}>
                  I want to find rescued food
                </span>
              </label>

              {/* Provider card */}
              <label style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '6px', padding: '14px 10px',
                border: `2px solid ${role === 'provider' ? '#22c55e' : '#e2e8f0'}`,
                borderRadius: '12px', cursor: 'pointer',
                background: role === 'provider' ? '#f0fdf4' : 'white',
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="role" value="provider" checked={role === 'provider'} onChange={() => setRole('provider')} style={{ display: 'none' }} />
                <span style={{ fontSize: '28px' }}>🍱</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: role === 'provider' ? '#166534' : '#374151', textAlign: 'center' }}>
                  Provider
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.3' }}>
                  I have food to share
                </span>
              </label>

            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#86efac' : '#22c55e',
              color: 'white', border: 'none', borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px', fontWeight: '700',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(34,197,94,0.35)',
              transition: 'all 0.15s',
            }}
          >
            {loading ? '⌛ Creating account...' : '🚀 Create Account'}
          </button>

        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          Already have an account?{' '}
          <a href="/" style={{ color: '#22c55e', fontWeight: '600', textDecoration: 'none' }}>
            Log in here →
          </a>
        </p>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1.5px solid #e2e8f0',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  color: '#1e293b',
  transition: 'border-color 0.15s',
};

export default Register;