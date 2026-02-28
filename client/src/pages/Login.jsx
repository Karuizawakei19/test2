import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseClient';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Firebase checks the email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      //  Get the token from Firebase
      const token = await userCredential.user.getIdToken();

      // Save token to localStorage
      localStorage.setItem('token', token);

      //  Ask backend for the user's profile (name, role)
      const res = await api.post('/auth/me', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = res.data;

      // Save user info to localStorage
      localStorage.setItem('userId', user.id);
      localStorage.setItem('role', user.role);
      localStorage.setItem('name', user.name);

      // Redirect based on role
      if (user.role === 'provider') {
        navigate('/dashboard');
      } else {
        navigate('/browse');
      }

    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Wrong email or password.');
      } else {
        setError('Login failed. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ color: '#22c55e' }}>   RescueBite</h1>
      <h2>Login</h2>

      {error && (
        <p style={{ color: 'red', background: '#fff0f0', padding: '10px', borderRadius: '4px' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleLogin}>
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

        <div style={{ marginBottom: '20px' }}>
          <label>Password</label><br />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '16px' }}>
        No account yet? <a href="/register">Register here</a>
      </p>
    </div>
  );
}

export default Login;