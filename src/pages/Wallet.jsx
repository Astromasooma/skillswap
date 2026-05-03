import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Plus, Send, X, CreditCard, Clock, CheckCircle } from 'lucide-react';

function Wallet({ currentUser }) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showTopup, setShowTopup] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [amount, setAmount] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('sandbox');

  const fetchWalletData = async () => {
    if (!currentUser?.username) return;
    try {
      const bRes = await fetch(`/api/wallet/balance/${currentUser.username}`);
      const bData = await bRes.json();
      setBalance(bData.balance || 0);

      const hRes = await fetch(`/api/wallet/history/${currentUser.username}`);
      const hData = await hRes.json();
      setHistory(Array.isArray(hData) ? hData : []);

      const pRes = await fetch(`/api/connections/pending-payment/${currentUser.username}`);
      const pData = await pRes.json();
      setPendingPayments(Array.isArray(pData) ? pData : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchWalletData();
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) verifyStripeSession(sessionId);
  }, [currentUser]);

  const verifyStripeSession = async (sessionId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/verify-session/${sessionId}`);
      if ((await res.json()).success) {
        window.history.replaceState({}, document.title, "/wallet");
        fetchWalletData();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (paymentMethod === 'stripe') {
        const res = await fetch('/api/wallet/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, amount: Number(amount) })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      } else {
        const res = await fetch('/api/wallet/topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, amount: Number(amount) })
        });
        if (res.ok) {
          setShowTopup(false);
          fetchWalletData();
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handlePayConnection = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/connections/pay/${id}`, { method: 'POST' });
      if (res.ok) {
        alert('Payment successful! Connection activated.');
        fetchWalletData();
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="wallet-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header className="page-header">
        <h1>Swap Wallet</h1>
        <p>Manage your credits and unlock grid connections.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Balance Card */}
          <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ fontSize: '0.8rem', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '1rem' }}>Total Balance</h2>
            <div style={{ fontSize: '4rem', fontWeight: '800', color: 'var(--text-heading)' }}>{balance} <span style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>CREDITS</span></div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-primary" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowTopup(true)}>Top Up</button>
              <button className="btn-outline" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowTransfer(true)}>Transfer</button>
            </div>
          </div>

          {/* Pending Service Payments */}
          <div className="card">
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} className="text-accent" /> Grid Service Payments
            </h3>
            {pendingPayments.length === 0 ? (
              <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No pending connection payments.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingPayments.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,106,0,0.05)', border: '1px solid var(--overlay-border)', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{p.type === 'learn' ? `Learn from ${p.receiver}` : `Teach ${p.sender}`}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Fee: 50 Credits</div>
                    </div>
                    <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => handlePayConnection(p.id)} disabled={loading}>Pay 50 Credits</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--overlay-border)' }}>
            <h3 style={{ margin: 0 }}>Transaction Ledger</h3>
          </div>
          <div style={{ padding: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
            {history.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '0.5rem', background: 'var(--overlay-bg)', borderRadius: '10px' }}>
                <div style={{ background: tx.to === currentUser.username ? 'rgba(52,168,83,0.1)' : 'rgba(234,67,53,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                  {tx.to === currentUser.username ? <ArrowDownLeft size={16} color="#34A853" /> : <ArrowUpRight size={16} color="#EA4335" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{tx.description}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(tx.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ fontWeight: 'bold', color: tx.to === currentUser.username ? '#34A853' : '#EA4335' }}>
                  {tx.to === currentUser.username ? '+' : '-'}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showTopup && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card glass" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowTopup(false)}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>Top Up Credits</h2>
            <form onSubmit={handleTopup}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div onClick={() => setPaymentMethod('sandbox')} style={{ flex: 1, padding: '1rem', borderRadius: '10px', border: `2px solid ${paymentMethod === 'sandbox' ? 'var(--primary-color)' : 'transparent'}`, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }}>Sandbox</div>
                <div onClick={() => setPaymentMethod('stripe')} style={{ flex: 1, padding: '1rem', borderRadius: '10px', border: `2px solid ${paymentMethod === 'stripe' ? 'var(--primary-color)' : 'transparent'}`, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }}>Stripe</div>
              </div>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount..." style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem' }} required />
              <button className="btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>Proceed</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallet;


