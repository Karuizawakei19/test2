import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Register() {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('receiver'); // default role
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  
  const navigate = useNavigate();

  async function handleRegister(e) {
    // stops the page from refreshing when form is submitted
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // creates the user in Firebase and saves to db
      const res = await api.post('/auth/register', {
        email,
        password,
        name,
        role,
      });

      // Registration successful
      // they need to go to login again
      alert(`Account created! Welcome ${res.data.name}. Please log in.`);
      navigate('/'); 

    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Create Account</h2>

      {/* Show error if any */}
      {error && (
        <p style={{ color: 'red', background: '#fff0f0', padding: '10px', borderRadius: '4px' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '12px' }}>
          <label>Name</label><br />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Email</label><br />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Password</label><br />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>I am a...</label><br />
          {/* select = dropdown menu */}
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          >
            <option value="receiver">Receiver — I want to find food</option>
            <option value="provider">Provider — I have food to share</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: '16px' }}>
        Already have an account? <a href="/">Login here</a>
      </p>
    </div>
  );
}

export default Register;