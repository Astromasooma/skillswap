import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, User, Wallet, Calendar, MessageSquare, Power, Sun, Moon, FileText } from 'lucide-react';
import './Sidebar.css';
import { useState, useEffect } from 'react';

import Logo from './Logo';

function Sidebar({ onLogout }) {
  const [theme, setTheme] = useState('dark');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' }}>SkillSwap</h2>
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
        <NavLink to="/files" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FileText size={20} />
          <span>Files</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MessageSquare size={20} />
          <span>Comms Line</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="theme-icon-btn" onClick={toggleTheme} aria-label="Toggle Theme" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <button className="theme-icon-btn" onClick={() => setShowLogoutModal(true)} aria-label="Logout" title="Logout" style={{ color: '#EA4335' }}>
          <Power size={24} />
        </button>
      </div>

      {showLogoutModal && (
        <div className="logout-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card glass" style={{ padding: '2rem', textAlign: 'center', maxWidth: '350px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Logging out</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Do you want to save your password for next login?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-outline" onClick={onLogout}>No</button>
              <button className="btn-primary" onClick={onLogout}>Yes, Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
