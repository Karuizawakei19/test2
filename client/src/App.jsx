import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login              from './pages/Login';
import Register           from './pages/Register';
import Browse             from './pages/Browse';
import FoodDetail         from './pages/FoodDetail';
import PostFood           from './pages/PostFood';
import ProviderDashboard  from './pages/ProviderDashboard';
import ReceiverDashboard  from './pages/ReceiverDashboard';  
import NotificationBell from './components/NotificationBell';
import ChatPage from './pages/ChatPage';
import MapPage from './pages/MapPage';
import ProviderProfile from './pages/ProviderProfile';


const NO_NAV_PAGES = ['/', '/register'];

function NavBar() {
  const location = useLocation();
  const role  = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  if (NO_NAV_PAGES.includes(location.pathname)) return null;
  if (!token) return null;

  return (
    <nav style={{
      background: '#22c55e',
      padding: '10px 20px',
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
    }}>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>🍱 RescueBite</span>

      {/* Receiver links */}
      {role === 'receiver' && (
        <>
          <a href="/browse"    style={{ color: 'white' }}>Browse Food</a>
          <a href="/receiver"  style={{ color: 'white' }}>My Reservations</a>
        </>
      )}

      {/* Provider links — can also browse, but cannot reserve */}
      {role === 'provider' && (
        <>
          <a href="/dashboard" style={{ color: 'white' }}>Dashboard</a>
          
          <a href="/browse"    style={{ color: 'white' }}>Browse</a>
        </>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
  <NotificationBell />
    {/* logout button can move here too later */}
    </div>
    </nav>

    
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/"            element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/browse"      element={<Browse />} />
        <Route path="/listing/:id" element={<FoodDetail />} />
        <Route path="/post"        element={<PostFood />} />
        <Route path="/dashboard"   element={<ProviderDashboard />} />
        <Route path="/receiver"    element={<ReceiverDashboard />} />
        <Route path="/chat/:reservationId" element={<ChatPage />} /> 
        <Route path="/map" element={<MapPage />} />
        <Route path="/provider/:providerId" element={<ProviderProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;