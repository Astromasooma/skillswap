import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, User, Users, Wallet, Calendar, MessageSquare, Power, Sun, Moon, FileText, Bell } from 'lucide-react';
import './Sidebar.css';
import { useState, useEffect } from 'react';
import Logo from './Logo';

function Sidebar({ onLogout, currentUser }) {
  const [theme, setTheme] = useState('dark');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Poll for connection request notifications every 5 seconds
  useEffect(() => {
    if (!currentUser?.username) return;

    const pollNotifications = async () => {
      try {
        const res = await fetch(`/api/connections/${currentUser.username}`);
        const data = await res.json();
        setRequestCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        // silently fail
      }
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Poll for unread chat messages every 5 seconds
  useEffect(() => {
    if (!currentUser?.username) return;

    const pollUnread = async () => {
      try {
        const lastSeen = localStorage.getItem('lastChatSeen') || '0';
        const res = await fetch(`/api/chat/unread/${currentUser.username}?since=${lastSeen}`);
        const data = await res.json();
        setUnreadMsgCount(data.count || 0);
      } catch (err) {
        // silently fail
      }
    };

    pollUnread();
    const interval = setInterval(pollUnread, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const Badge = ({ count }) => {
    if (!count || count === 0) return null;
    return (
      <span style={{
        background: '#EA4335',
        color: '#fff',
        borderRadius: '999px',
        fontSize: '0.65rem',
        fontWeight: 'bold',
        padding: '0.1rem 0.45rem',
        marginLeft: 'auto',
        minWidth: '18px',
        textAlign: 'center',
        lineHeight: '1.4',
        boxShadow: '0 0 6px rgba(234,67,53,0.7)',
        animation: 'pulse 2s infinite'
      }}>{count}</span>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', marginBottom: '1.5rem' }}>
        <h2 className="sidebar-brand-text" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' }}>SkillSwap</h2>
      </div>

      {currentUser && (
        <div className="sidebar-user-card" style={{ padding: '0.5rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--overlay-bg)', borderRadius: '8px', border: '1px solid var(--overlay-border)' }}>
          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
            {currentUser.username?.substring(0, 2).toUpperCase()}
          </div>
          <span className="sidebar-user-name" style={{ fontSize: '0.85rem', color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.username}</span>
        </div>
      )}

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Search size={18} />
          <span>Network Search</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <User size={18} />
          <span>Identity</span>
        </NavLink>
        <NavLink to="/connections" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Users size={18} />
          <span>Requests</span>
          <Badge count={requestCount} />
        </NavLink>
        <NavLink to="/wallet" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Wallet size={18} />
          <span>Swap Wallet</span>
        </NavLink>
        <NavLink to="/scheduler" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Calendar size={18} />
          <span>Scheduler</span>
        </NavLink>
        <NavLink to="/files" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FileText size={18} />
          <span>Files</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MessageSquare size={18} />
          <span>Comms Line</span>
          <Badge count={unreadMsgCount} />
        </NavLink>
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="theme-icon-btn" onClick={toggleTheme} aria-label="Toggle Theme" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        <button className="theme-icon-btn" onClick={() => setShowLogoutModal(true)} aria-label="Logout" title="Logout" style={{ color: '#EA4335' }}>
          <Power size={22} />
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
