import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProviderDashboard() {
  const navigate = useNavigate();

  
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');

  // If not logged in or not a provider, redirect to login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, []); 

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h2> Welcome, {name || 'Provider'}!</h2>
      <p style={{ color: '#666' }}>Manage your food listings here.</p>

      <div style={{ marginTop: '24px' }}>
        <button
          onClick={() => navigate('/post')}
          style={{ padding: '12px 24px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}
        >
          + Post New Food Listing
        </button>
      </div>

      <div style={{ marginTop: '32px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
        <p style={{ color: '#888' }}>Your listings will appear here.</p>
      </div>

      <p style={{ marginTop: '24px' }}>
        <button
          onClick={() => {
            // Clear everything from localStorage 
            localStorage.clear();
            navigate('/');
          }}
          style={{ background: 'none', border: '1px solid #ccc', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </p>
    </div>
  );
}

export default ProviderDashboard;