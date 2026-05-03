import { useState, useRef, useEffect } from 'react';
import { User, Camera, ShieldCheck, Upload, FileText, X, DollarSign, Clock, Briefcase, GraduationCap } from 'lucide-react';

function Profile({ currentUser }) {
  const [profile, setProfile] = useState({
    occupation: '', offers: '', needs: '', rates: 0, availability: '', portfolio: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser?.username) {
      fetch(`/api/profile/${currentUser.username}`)
        .then(res => res.json())
        .then(data => setProfile(data));
    }
  }, [currentUser]);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, ...profile })
      });
      if (res.ok) alert('Identity Matrix updated!');
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', currentUser.username);

    try {
      const res = await fetch('/api/profile/portfolio/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(p => ({ ...p, portfolio: [...p.portfolio, { name: file.name, url: data.url }] }));
      }
    } catch (e) { console.error(e); }
    setIsUploading(false);
  };

  return (
    <div className="profile-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="page-header">
        <h1>Identity Matrix</h1>
        <p>Your unique node on the SkillSwap grid. Configure your trade protocols.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Col: Avatar & Portfolio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card glass" style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="avatar" style={{ width: '120px', height: '120px', margin: '0 auto 1.5rem auto', fontSize: '2.5rem' }}>
              {currentUser?.username?.substring(0, 2).toUpperCase()}
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{currentUser?.username}</h2>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Active Node</div>
          </div>

          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', fontSize: '1rem' }}>
              <FileText size={18} className="text-primary" /> Portfolio Docs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.portfolio?.map((file, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--overlay-bg)', borderRadius: '8px', border: '1px solid var(--overlay-border)' }}>
                  <FileText size={16} className="text-primary" />
                  <span style={{ flex: 1, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                </div>
              ))}
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePortfolioUpload} />
              <button className="btn-outline" style={{ width: '100%', fontSize: '0.8rem', marginTop: '0.5rem' }} onClick={() => fileInputRef.current.click()} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card glass">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 2rem 0' }}>
              <Briefcase size={20} className="text-primary" /> Protocol Configuration
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Current Occupation</label>
                <input type="text" value={profile.occupation} onChange={e => setProfile({...profile, occupation: e.target.value})} placeholder="e.g. Senior Software Engineer" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hourly Rate ($)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input type="number" value={profile.rates} onChange={e => setProfile({...profile, rates: e.target.value})} style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Availability</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input type="text" value={profile.availability} onChange={e => setProfile({...profile, availability: e.target.value})} placeholder="e.g. Mon-Fri, 9am-5pm" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Skills You Offer</label>
                <textarea rows="3" value={profile.offers} onChange={e => setProfile({...profile, offers: e.target.value})} placeholder="What skills can you teach?"></textarea>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Skills You Need</label>
                <textarea rows="3" value={profile.needs} onChange={e => setProfile({...profile, needs: e.target.value})} placeholder="What are you looking to learn?"></textarea>
              </div>
            </div>

            <button className="btn-primary" style={{ marginTop: '2rem', width: '100%', padding: '1rem' }} onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? 'Syncing...' : 'Update Identity Matrix'}
            </button>
          </div>

          <div className="card" style={{ background: 'rgba(52, 168, 83, 0.05)', border: '1px solid rgba(52, 168, 83, 0.2)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34A853' }}>
              <ShieldCheck size={18} /> Node Verification
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Your node is active and visible on the global network. Complete your profile to increase your trust score.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

