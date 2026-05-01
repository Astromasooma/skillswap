import { Zap, Users, TrendingUp, Cpu } from 'lucide-react';
import Logo from '../components/Logo';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Overview Interface</h1>
        <p>Welcome back to the grid. System functioning nominally.</p>
      </header>

      <div className="stats-grid">
        <div className="card glass stat-card">
          <div className="stat-icon"><Zap className="text-primary" size={24} /></div>
          <div className="stat-info">
            <h3>Credits</h3>
            <p className="stat-value">0 C</p>
          </div>
        </div>
        <div className="card glass stat-card">
          <div className="stat-icon"><Users className="text-accent" size={24} /></div>
          <div className="stat-info">
            <h3>Connections</h3>
            <p className="stat-value">0</p>
          </div>
        </div>
        <div className="card glass stat-card">
          <div className="stat-icon"><TrendingUp className="text-primary" size={24} /></div>
          <div className="stat-info">
            <h3>Hours Swapped</h3>
            <p className="stat-value">0</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card gemini-matchmaker">
          <div className="section-header">
            <Cpu className="text-primary" />
            <h2>Gemini Matching Engine</h2>
          </div>
          <p className="section-desc">AI-powered skill synchronization protocol.</p>
          
          <div className="matches-list" style={{ padding: '1rem', color: 'var(--text-main)' }}>
            No matches found. Make sure your profile is fully verified.
          </div>
        </div>

        <div className="card activity-feed glass">
          <h2>Recent Grid Activity</h2>
          <ul className="feed-list" style={{ color: 'var(--text-main)', padding: '1rem 0' }}>
            <li>No recent activity to display.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
