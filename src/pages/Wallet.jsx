import { Wallet as WalletIcon, ArrowRightLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

function Wallet() {
  return (
    <div className="wallet-container" style={{ maxWidth: '900px' }}>
      <header className="page-header">
        <h1>Swap Wallet</h1>
        <p>1 Credit = 1 Hour of equivalent exchange. Track your grid economy.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
          <div style={{ background: 'rgba(255, 106, 0, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem', border: '1px solid var(--primary-color)', boxShadow: '0 0 20px var(--primary-glow)' }}>
            <WalletIcon size={48} className="text-primary" />
          </div>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Current Balance</h2>
          <div style={{ fontSize: '3rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-heading)', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>
            12.5 C
          </div>
          <button className="btn-primary" style={{ marginTop: '2rem', width: '100%' }}>Transfer Credits</button>
        </div>

        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <ArrowRightLeft className="text-primary" /> Ledger History
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--surface-highlight)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(0, 255, 204, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                  <ArrowDownLeft className="text-accent" />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>Taught React Hooks</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)' }}>To: Marcus | Today</p>
                </div>
              </div>
              <div style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>+1.0 C</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--surface-highlight)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(255, 106, 0, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                  <ArrowUpRight className="text-primary" />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>Learned Advanced CSS</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)' }}>From: Sarah | Yesterday</p>
                </div>
              </div>
              <div style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>-2.0 C</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
