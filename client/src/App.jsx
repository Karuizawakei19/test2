

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import PostFood from './pages/PostFood';
import ProviderDashboard from './pages/ProviderDashboard';

function App() {
  return (
    // enables navigation without full page reloads
    <BrowserRouter>

      {/* Temporary nav bar just for test */}
      
      <nav style={{ padding: '10px', background: '#f0f0f0' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Login</Link>
        <Link to="/register" style={{ marginRight: '10px' }}>Register</Link>
        <Link to="/browse" style={{ marginRight: '10px' }}>Browse</Link>
        <Link to="/post" style={{ marginRight: '10px' }}>Post Food</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>

      {/* Routes — only one page renders at a time based on the URL */}
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