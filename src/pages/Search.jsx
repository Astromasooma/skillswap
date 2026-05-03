import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, User as UserIcon, MessageSquare, UserCheck, Eye, GraduationCap, Briefcase, Clock, DollarSign, X, FileText } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io();


function Search({ currentUser }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedUsers, setConnectedUsers] = useState(new Set());
  const [selectedProfile, setSelectedProfile] = useState(null);

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

  useEffect(() => {
    fetchUsers();
    fetchConnectionStatus();
  }, [currentUser]);

  const handleAction = async (targetUsername, type) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: currentUser.username, receiver: targetUsername, type })
      });
      if (res.ok) {
        socket.emit('notify', { receiver: targetUsername, data: { type: 'connection_request', from: currentUser.username } });
        alert(`${type.toUpperCase()} request sent to ${targetUsername}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };


  const filteredUsers = users.filter(user =>
    user.username !== currentUser?.username && (
      (user.username && user.username.toLowerCase().includes(query.toLowerCase())) ||
      (user.offers && user.offers.toLowerCase().includes(query.toLowerCase())) ||
      (user.occupation && user.occupation.toLowerCase().includes(query.toLowerCase()))
    )
  );

  return (
    <div className="search-container" style={{ maxWidth: '1200px' }}>
      <header className="page-header">
        <h1>Global Network Search</h1>
        <p>Discover industry experts and trade skills across the grid.</p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <SearchIcon style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-main)' }} size={20} />
          <input
            type="text"
            placeholder="Search by name, occupation, or skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-main)' }}>Syncing nodes...</div>
      ) : (
        <div className="search-results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredUsers.map(user => (
            <div key={user.id} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar" style={{ width: '50px', height: '50px' }}>{user.username?.substring(0, 2).toUpperCase()}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{user.username}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>{user.occupation}</div>
                  </div>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-color)' }}>
                  ${user.rates}<span style={{ fontSize: '0.7rem', opacity: 0.7 }}>/hr</span>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', flex: 1 }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ display: 'block', color: 'var(--text-heading)', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Offers</strong>
                  <div style={{ color: 'var(--text-main)' }}>{user.offers}</div>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-heading)', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Needs</strong>
                  <div style={{ color: 'var(--text-main)' }}>{user.needs}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setSelectedProfile(user)}>
                  <Eye size={14} /> View
                </button>
                <button className="btn-primary" style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => handleAction(user.username, 'learn')}>
                  <GraduationCap size={14} /> Learn
                </button>
                <button className="btn-primary" style={{ padding: '0.5rem', fontSize: '0.8rem', background: '#34A853', borderColor: '#34A853' }} onClick={() => handleAction(user.username, 'teach')}>
                  <Briefcase size={14} /> Teach
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedProfile && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2.5rem' }}>
            <button style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setSelectedProfile(null)}>
              <X size={24} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
              <div className="avatar" style={{ width: '100px', height: '100px', fontSize: '2rem' }}>{selectedProfile.username?.substring(0, 2).toUpperCase()}</div>
              <div>
                <h2 style={{ fontSize: '2rem', margin: '0 0 0.25rem 0' }}>{selectedProfile.username}</h2>
                <div style={{ color: 'var(--primary-color)', fontSize: '1.1rem', fontWeight: '600' }}>{selectedProfile.occupation}</div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                    <DollarSign size={18} className="text-primary" /> <strong>${selectedProfile.rates}/hr</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                    <Clock size={18} className="text-primary" /> <strong>{selectedProfile.availability}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
              <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>Skill Offers</h4>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{selectedProfile.offers}</p>
              </div>
              <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '1px' }}>Learning Needs</h4>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{selectedProfile.needs}</p>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} className="text-primary" /> Portfolio Documents
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {selectedProfile.portfolio?.length > 0 ? selectedProfile.portfolio.map((file, idx) => (
                  <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                    <FileText size={32} className="text-primary" />
                    <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>{file.name}</span>
                  </a>
                )) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.5, padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>No documents uploaded yet.</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1, padding: '1rem' }} onClick={() => { handleAction(selectedProfile.username, 'learn'); setSelectedProfile(null); }}>
                Request to Learn
              </button>
              <button className="btn-primary" style={{ flex: 1, padding: '1rem', background: '#34A853', borderColor: '#34A853' }} onClick={() => { handleAction(selectedProfile.username, 'teach'); setSelectedProfile(null); }}>
                Request to Teach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;



