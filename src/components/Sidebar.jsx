import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, User, Wallet, Calendar, MessageSquare, Power } from 'lucide-react';
import './Sidebar.css';
import { useState, useEffect } from 'react';

function Sidebar() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0', marginBottom: '2rem' }}>
        <img src="/logo.png" alt="SkillSwap Logo" style={{ width: '100%', maxWidth: '180px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }} />
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Search size={20} />
          <span>Network Search</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <User size={20} />
          <span>Identity</span>
        </NavLink>
        <NavLink to="/wallet" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Wallet size={20} />
          <span>Swap Wallet</span>
        </NavLink>
        <NavLink to="/scheduler" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Calendar size={20} />
          <span>Scheduler</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MessageSquare size={20} />
          <span>Comms Line</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-outline toggle-theme" onClick={toggleTheme}>
          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
