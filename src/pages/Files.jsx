import React from 'react';
import { File as FileIcon, Download, Search } from 'lucide-react';

function Files() {
  return (
    <div className="files-page">
      <h1>File Repository</h1>
      <p>Manage and share your project files securely.</p>
      
      <div className="card mt-4">
        <div className="flex gap-4 mb-4" style={{ alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-main)' }} />
            <input type="text" placeholder="Search files..." style={{ paddingLeft: '3rem' }} />
          </div>
          <button className="btn-primary">Upload File</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <FileIcon size={48} className="text-primary" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Project_Brief_{i}.pdf</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>2.4 MB</span>
              </div>
              <button className="btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={16} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Files;
