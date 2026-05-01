import { useState, useEffect } from 'react';
import { Users, Check, X, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Connections({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/connections/${currentUser.username}`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Refresh periodically
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleAccept = async (id, sender) => {
    try {
      await fetch(`/api/connections/accept/${id}`, { method: 'POST' });
      fetchRequests();
      alert(`Accepted connection from ${sender}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await fetch(`/api/connections/reject/${id}`, { method: 'POST' });
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = (sender) => {
    navigate('/chat', { state: { targetUser: sender } });
  };

  return (
    <div className="connections-container" style={{ maxWidth: '800px' }}>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users className="text-primary" size={32} />
          <h1 style={{ margin: 0 }}>Network Requests</h1>
        </div>
        <p>Manage your incoming connection requests.</p>
      </header>

      {isLoading && requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-main)' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-main)' }}>
          No pending connection requests.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(req => (
            <div key={req.id} className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0' }}>{req.sender}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Requested to connect</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-outline" onClick={() => handleChat(req.sender)} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} /> Chat
                </button>
                <button className="btn-primary" onClick={() => handleAccept(req.id, req.sender)} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#34A853', borderColor: '#34A853' }}>
                  <Check size={16} /> Accept
                </button>
                <button className="btn-outline" onClick={() => handleReject(req.id)} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EA4335', borderColor: '#EA4335' }}>
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Connections;
