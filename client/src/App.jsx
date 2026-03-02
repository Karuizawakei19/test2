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
import ReceiverProfile   from './pages/ReceiverProfile';
import { Leaf, LayoutDashboard, ShoppingBasket, BookMarked, UserCircle2 } from 'lucide-react';

const NO_NAV_PAGES = ['/', '/register'];

const navStyles = {
  nav: {
    background: '#f5f0e8',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    height: '56px',
    boxShadow: '0 2px 8px rgba(139, 109, 56, 0.10)',
    borderBottom: '1.5px solid #e2d9c8',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#7c5c2e',
    fontWeight: '700',
    fontSize: '18px',
    textDecoration: 'none',
    marginRight: '32px',
    letterSpacing: '0.01em',
  },
  logoIcon: {
    color: '#c8862a',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#7c5c2e',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14.5px',
    padding: '6px 14px',
    borderRadius: '20px',
    transition: 'background 0.18s, color 0.18s',
    background: 'transparent',
  },
  right: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  profileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#7c5c2e',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px',
    padding: '6px 12px',
    borderRadius: '20px',
    background: '#ede4d3',
    border: '1.5px solid #d6c9b0',
    transition: 'background 0.18s',
  },
};

function NavLink({ href, icon: Icon, children }) {
  return (
    <a
      href={href}
      style={navStyles.link}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#ede4d3';
        e.currentTarget.style.color = '#5a3e1b';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#7c5c2e';
      }}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </a>
  );
}

function NavBar() {
  const location = useLocation();
  const role  = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  if (NO_NAV_PAGES.includes(location.pathname)) return null;
  if (!token) return null;

  const profileHref = role === 'provider' ? '/dashboard' : '/receiver';

  return (
    <nav style={navStyles.nav}>
      {/* Logo */}
      <a href={role === 'provider' ? '/dashboard' : '/browse'} style={navStyles.logo}>
        <Leaf size={22} style={navStyles.logoIcon} strokeWidth={2.5} />
        RescueBite
      </a>

      {/* Nav links */}
      <div style={navStyles.links}>
        {role === 'receiver' && (
          <>
            <NavLink href="/browse" icon={ShoppingBasket}>Browse Food</NavLink>
            <NavLink href="/receiver" icon={BookMarked}>My Reservations</NavLink>
          </>
        )}

        {role === 'provider' && (
          <>
            <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
            <NavLink href="/browse" icon={ShoppingBasket}>Browse</NavLink>
          </>
        )}
      </div>

      {/* Right side */}
      <div style={navStyles.right}>
        <NotificationBell />
        <a
          href={profileHref}
          style={navStyles.profileLink}
          onMouseEnter={e => { e.currentTarget.style.background = '#d6c9b0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ede4d3'; }}
        >
          <UserCircle2 size={18} strokeWidth={2} />
        </a>
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
        <Route path="/receiver/:receiverId" element={<ReceiverProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;