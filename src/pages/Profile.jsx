import { useState, useRef } from 'react';
import { User, Camera, ShieldCheck, Upload, Image as ImageIcon } from 'lucide-react';

function Profile() {
  const [photoMock, setPhotoMock] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [verified, setVerified] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoMock(url);
    }
  };

  const generatePhoto = () => {
    setGenerating(true);
    setTimeout(() => {
      setPhotoMock('https://api.dicebear.com/7.x/bottts/svg?seed=skillswap&backgroundColor=1f2833');
      setGenerating(false);
    }, 2000);
  };

  const simulateVerification = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setVerified(true);
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="profile-container" style={{ maxWidth: '800px' }}>
      <header className="page-header">
        <h1>Identity Matrix</h1>
        <p>Manage your grid presence and skill verification.</p>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User className="text-primary" /> Profile Node
        </h2>
        
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div 
              style={{ 
                width: '150px', height: '150px', 
                borderRadius: '8px', 
                background: 'var(--overlay-bg)',
                border: '2px dashed var(--primary-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {generating ? (
                <span className="text-primary" style={{ fontFamily: 'var(--font-mono)' }}>GENERATING...</span>
              ) : photoMock ? (
                <img src={photoMock} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={48} className="text-main" opacity={0.5} />
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'center', flexDirection: 'column' }}>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <button className="btn-outline" onClick={() => fileInputRef.current.click()} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Upload size={14} /> Upload Photo
              </button>
              <button className="btn-outline" onClick={generatePhoto} disabled={generating} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <ImageIcon size={14} /> Nano Banana Pro
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>Handle</label>
              <input type="text" defaultValue="NeoCoder" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>Bio / Protocol</label>
              <textarea rows="3" defaultValue="Full stack developer seeking to trade React skills for advanced UI/UX design training."></textarea>
            </div>
            <button className="btn-primary" style={{ alignSelf: 'flex-start' }}>Update Matrix</button>
          </div>
        </div>
      </div>

      <div className="card glass">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck className={verified ? "text-accent" : "text-primary"} /> 
          Skill Verification (Multimodal AI)
        </h2>
        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Upload certificates or portfolio screenshots. Our Multimodal AI will analyze the images and verify your claims.
        </p>

        {verified ? (
          <div style={{ padding: '1rem', background: 'rgba(0, 255, 204, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '8px', color: 'var(--accent-color)' }}>
            <strong>[ VERIFIED ]</strong> Multimodal AI has confirmed the authenticity of your uploaded credentials.
          </div>
        ) : (
          <div 
            style={{ 
              border: '2px dashed var(--surface-highlight)', 
              padding: '2rem', 
              textAlign: 'center',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onClick={simulateVerification}
          >
            <Upload size={32} className="text-primary" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: 0 }}>Click to Upload Documents</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>
              {analyzing ? "ANALYZING IMAGE DATA..." : "Simulate Document Analysis"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
