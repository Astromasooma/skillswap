import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, User, Wallet, Calendar, MessageSquare, Power, Sun, Moon, FileText } from 'lucide-react';
import './Sidebar.css';
import { useState, useEffect } from 'react';

import Logo from './Logo';

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
      <div className="sidebar-header">
        <div className="logo-icon">
          <Power size={24} className="text-primary" />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>SkillSwap</h2>
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

      <div className="sidebar-footer">
        <button className="theme-icon-btn" onClick={toggleTheme} aria-label="Toggle Theme" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
