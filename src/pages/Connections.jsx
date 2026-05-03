import { useState, useEffect } from 'react';
import { Users, Check, X, MessageSquare, GraduationCap, Briefcase, CreditCard, Clock } from 'lucide-react';
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
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleAccept = async (id, sender) => {
    try {
      const res = await fetch(`/api/connections/accept/${id}`, { method: 'POST' });
      if (res.ok) {
        alert(`Accepted! Connection will be fully active once payment is verified.`);
        fetchRequests();
      }
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id) => {
    try {
      await fetch(`/api/connections/reject/${id}`, { method: 'POST' });
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="connections-container" style={{ maxWidth: '900px' }}>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users className="text-primary" size={32} />
          <h1 style={{ margin: 0 }}>Grid Connections</h1>
        </div>
        <p>Coordinate your learning paths and teaching opportunities.</p>
      </header>

      {isLoading && requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-main)' }}>Scanning grid...</div>
      ) : requests.length === 0 ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-main)', opacity: 0.6 }}>
          <Users size={48} style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          No pending connection requests.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {requests.map(req => {
            const isPayer = req.payer === currentUser.username;
            const isPendingPayment = req.status === 'pending_payment';

            return (
              <div key={req.id} className="card glass" style={{ borderLeft: `4px solid ${req.type === 'learn' ? 'var(--primary-color)' : '#34A853'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div className="avatar" style={{ width: '50px', height: '50px' }}>{req.sender?.substring(0, 2).toUpperCase()}</div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem' }}>{req.sender}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {req.type === 'learn' ? <GraduationCap size={16} className="text-primary" /> : <Briefcase size={16} style={{ color: '#34A853' }} />}
                        {req.message}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isPendingPayment ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} /> PENDING PAYMENT
                        </span>
                        {isPayer ? (
                          <button className="btn-primary" onClick={() => navigate('/wallet')} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={16} /> Pay to Unlock
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Waiting for {req.sender}</span>
                        )}
                      </div>
                    ) : (
                      <>
                        <button className="btn-primary" onClick={() => handleAccept(req.id, req.sender)} style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#34A853', borderColor: '#34A853' }}>
                          <Check size={18} /> Accept
                        </button>
                        <button className="btn-outline" onClick={() => handleReject(req.id)} style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EA4335', borderColor: '#EA4335' }}>
                          <X size={18} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Connections;

