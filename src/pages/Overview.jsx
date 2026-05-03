import { useState, useEffect } from 'react';
import { 
  TrendingUp, Clock, CreditCard, Users, Activity, 
  ArrowUpRight, ArrowDownRight, Calendar, Zap 
} from 'lucide-react';

function Overview({ currentUser }) {
  const [data, setData] = useState({
    hoursSpent: 0,
    creditsEarned: 0,
    creditsSpent: 0,
    connectionsCount: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.username) {
      fetch(`/api/overview/${currentUser.username}`)
        .then(res => res.json())
        .then(res => {
          setData(res);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [currentUser]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Syncing with global network...</div>;

  const stats = [
    { label: 'Network Engagement', value: `${data.hoursSpent}h`, sub: 'Hours Spent', icon: Clock, color: '#34A853' },
    { label: 'Value Generated', value: data.creditsEarned, sub: 'Credits Earned', icon: TrendingUp, color: '#4285F4' },
    { label: 'Knowledge Investment', value: data.creditsSpent, sub: 'Credits Spent', icon: Zap, color: '#FBBC05' },
    { label: 'Active Nodes', value: data.connectionsCount, sub: 'Connected Peers', icon: Users, color: 'var(--primary-color)' },
  ];

  return (
    <div className="overview-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header">
        <h1>Node Overview</h1>
        <p>Real-time analytics for your position in the SkillSwap identity matrix.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ 
              width: '52px', height: '52px', borderRadius: '12px', 
              background: `rgba(${stat.color === '#34A853' ? '52,168,83' : stat.color === '#4285F4' ? '66,133,244' : '255,106,0'}, 0.1)`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color 
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.1rem 0' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: stat.color }}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Recent Activity */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--overlay-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} className="text-primary" /> Activity Feed
            </h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Live Stream</span>
          </div>
          <div style={{ padding: '1rem' }}>
            {data.recentActivity.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.4 }}>No activity detected on this node yet.</div>
            ) : data.recentActivity.map((act, idx) => (
              <div key={idx} style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
                borderBottom: idx === data.recentActivity.length - 1 ? 'none' : '1px solid var(--overlay-border)' 
              }}>
                <div style={{ color: act.positive ? '#34A853' : '#EA4335' }}>
                  {act.positive ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{act.title}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(act.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ fontWeight: 'bold', color: act.positive ? '#34A853' : 'inherit' }}>
                  {act.positive ? '+' : '-'}{act.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Node Profile Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass" style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="avatar" style={{ width: '80px', height: '80px', margin: '0 auto 1rem auto', fontSize: '1.5rem' }}>
              {currentUser?.username?.substring(0, 2).toUpperCase()}
            </div>
            <h3 style={{ margin: 0 }}>{currentUser?.username}</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '0.5rem 0 1.5rem 0' }}>Verified Network Node</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <div className="badge">P2P Ready</div>
              <div className="badge">Trust: High</div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary-color)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} /> Quick Tip
            </h4>
            <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.9 }}>
              Completed sessions automatically credit your wallet. Ensure your sessions are marked as complete to finalize transfers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
