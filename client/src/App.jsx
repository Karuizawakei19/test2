

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import PostFood from './pages/PostFood';
import ProviderDashboard from './pages/ProviderDashboard';


function NavBar() {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  if (!token) return null; 

  return (
    <nav style={{
      background: '#22c55e',
      padding: '10px 20px',
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
    }}>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>RescueBite</span>
      {role === 'receiver' && (
        <a href="/browse" style={{ color: 'white' }}>Browse Food</a>
      )}
      {role === 'provider' && (
        <>
          <a href="/dashboard" style={{ color: 'white' }}>Dashboard</a>
          <a href="/post" style={{ color: 'white' }}>Post Food</a>
        </>
      )}
    </nav>
  );
}


function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/post" element={<PostFood />} />
        <Route path="/dashboard" element={<ProviderDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}



export default App;