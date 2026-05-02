import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, Stethoscope, Calculator, Palette, User as UserIcon, MessageSquare, UserCheck } from 'lucide-react';

function Search({ currentUser }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedUsers, setConnectedUsers] = useState(new Set());
  const [pendingUsers, setPendingUsers] = useState(new Set());

  // Fetch just the users list (no auth needed)
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch accepted/pending connections (needs currentUser)
  const fetchConnectionStatus = async () => {
    if (!currentUser?.username) return;
    try {
      const acceptedRes = await fetch(`/api/connections/accepted/${currentUser.username}`);
      const acceptedData = await acceptedRes.json();
      setConnectedUsers(new Set(Array.isArray(acceptedData) ? acceptedData : []));
    } catch (error) {
      console.error('Failed to load connection status:', error);
    }
  };

  // On mount and when currentUser changes, load both in parallel
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchConnectionStatus()]);
      setIsLoading(false);
    };
    loadAll();
  }, [currentUser]);

  const handleSeedDatabase = async () => {
    try {
      const response = await fetch('/api/users/seed', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Database seeded successfully!');
        await fetchUsers(); // reload grid — no auth dependency
      } else {
        alert(data.message || 'Seed failed.');
      }
    } catch (error) {
      console.error('Failed to seed:', error);
      alert('Could not reach server. Is the backend running?');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'medical': return <Stethoscope size={18} />;
      case 'maths': return <Calculator size={18} />;
      case 'arts': return <Palette size={18} />;
      default: return <UserIcon size={18} />;
    }
  };

  const handleConnect = async (targetUsername) => {
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: currentUser?.username, receiver: targetUsername })
      });
      if (res.ok) {
        setPendingUsers(prev => new Set([...prev, targetUsername]));
        alert(`Connection request sent to ${targetUsername}!`);
      } else {
        alert('Failed to send request.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username !== currentUser?.username && (
      (user.username && user.username.toLowerCase().includes(query.toLowerCase())) ||
      (user.offers && user.offers.toLowerCase().includes(query.toLowerCase())) ||
      (user.category && user.category.toLowerCase().includes(query.toLowerCase()))
    )
  );

  const getActionButton = (user) => {
    const isConnected = connectedUsers.has(user.username);
    const isPending = pendingUsers.has(user.username);

    if (isConnected) {
      return (
        <button
          className="btn-primary"
          style={{ marginTop: 'auto', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--accent-color)', borderColor: 'var(--accent-color)', color: '#000' }}
          onClick={() => navigate('/chat', { state: { targetUser: user.username } })}
        >
          <MessageSquare size={16} /> Chat
        </button>
      );
    }

    if (isPending) {
      return (
        <button
          className="btn-outline"
          style={{ marginTop: 'auto', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }}
          disabled
        >
          <UserCheck size={16} /> Request Sent
        </button>
      );
    }

    return (
      <button
        className="btn-primary"
        style={{ marginTop: 'auto', padding: '0.5rem' }}
        onClick={() => handleConnect(user.username)}
      >
        Connect
      </button>
    );
  };

  return (
    <div className="search-container" style={{ maxWidth: '1000px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Global Network Search</h1>
          <p>Find your next skill swap across diverse disciplines.</p>
        </div>
        <button onClick={handleSeedDatabase} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          Seed Mock Data to Cloud
        </button>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <SearchIcon style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-main)' }} size={20} />
          <input
            type="text"
            placeholder="Search by name, skill, or field (e.g. Maths, Arts, Medical)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>
        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} /> Filters
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-main)' }}>Loading network nodes...</div>
      ) : (
        <div className="search-results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredUsers.map(user => (
            <div key={user.id} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                    {user.username?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user.username}</h3>
                    {connectedUsers.has(user.username) && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <UserCheck size={12} /> Connected
                      </span>
                    )}
                  </div>
                </div>
                {user.category && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)', fontSize: '0.8rem', background: 'var(--overlay-bg)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {getCategoryIcon(user.category)} {user.category}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}><strong style={{ color: 'var(--accent-color)' }}>Offers:</strong> {user.offers || 'Not specified'}</p>
                <p style={{ margin: 0, color: 'var(--text-main)' }}><strong style={{ color: 'var(--text-heading)' }}>Needs:</strong> {user.needs || 'Not specified'}</p>
              </div>
              {getActionButton(user)}
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-main)' }}>
              No matching nodes found on the grid.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;


