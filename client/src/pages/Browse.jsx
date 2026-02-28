import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Browse() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
  }, []);

  return (
    <div style={{ padding: '40px' }}>
      <h2> Browse Available Food</h2>
      <p style={{ color: '#888' }}>Food listings with distance and urgency — placeholder</p>
    </div>
  );
}

export default Browse;