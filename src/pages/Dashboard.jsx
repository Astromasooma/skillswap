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
            <p className="stat-value">12.5 C</p>
          </div>
        </div>
        <div className="card glass stat-card">
          <div className="stat-icon"><Users className="text-accent" size={24} /></div>
          <div className="stat-info">
            <h3>Connections</h3>
            <p className="stat-value">48</p>
          </div>
        </div>
        <div className="card glass stat-card">
          <div className="stat-icon"><TrendingUp className="text-primary" size={24} /></div>
          <div className="stat-info">
            <h3>Hours Swapped</h3>
            <p className="stat-value">124</p>
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
          
          <div className="matches-list">
            <div className="match-item">
              <div className="avatar">DR</div>
              <div className="match-details">
                <h4>Dr. Rivera</h4>
                <p>Offers: Medical First Aid | Needs: Web Development</p>
                <div className="match-score">98% Compatibility</div>
              </div>
              <button className="btn-primary">Initiate</button>
            </div>
            
            <div className="match-item">
              <div className="avatar">AS</div>
              <div className="match-details">
                <h4>Alex Smith</h4>
                <p>Offers: Advanced Calculus | Needs: Figma Prototyping</p>
                <div className="match-score">92% Compatibility</div>
              </div>
              <button className="btn-outline">Initiate</button>
            </div>

            <div className="match-item">
              <div className="avatar">ML</div>
              <div className="match-details">
                <h4>Mia Lin</h4>
                <p>Offers: Digital Illustration | Needs: React Basics</p>
                <div className="match-score">88% Compatibility</div>
              </div>
              <button className="btn-outline">Initiate</button>
            </div>
          </div>
        </div>

        <div className="card activity-feed glass">
          <h2>Recent Grid Activity</h2>
          <ul className="feed-list">
            <li><strong>+1.0 C</strong> System Architecture lesson completed with Marcus.</li>
            <li><strong>-2.0 C</strong> Advanced CSS styling booked with Sarah.</li>
            <li><strong>Alert:</strong> Profile verification (Multimodal AI) successful.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
