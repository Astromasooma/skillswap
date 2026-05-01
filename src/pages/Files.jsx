import React, { useState, useRef } from 'react';
import { File as FileIcon, Download, Search } from 'lucide-react';

function Files() {
  const [files, setFiles] = useState([
    { id: 1, name: 'Project_Brief_1.pdf', size: 2.4 * 1024 * 1024, url: '#' },
    { id: 2, name: 'Design_Assets.zip', size: 15.2 * 1024 * 1024, url: '#' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const newFiles = uploadedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      fileObj: file
    }));
    setFiles(prev => [...newFiles, ...prev]);
    // Reset input so the same file can be uploaded again if needed
    e.target.value = null;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDownload = (file) => {
    if (file.url === '#') {
      alert("This is a mockup file and cannot be downloaded.");
      return;
    }
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="files-page">
      <h1>File Repository</h1>
      <p>Manage and share your project files securely.</p>
      
      <div className="card mt-4">
        <div className="flex gap-4 mb-4" style={{ alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-main)' }} />
            <input 
              type="text" 
              placeholder="Search files..." 
              style={{ paddingLeft: '3rem' }} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            multiple 
          />
          <button className="btn-primary" onClick={handleUploadClick}>Upload File</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {filteredFiles.map((file) => (
            <div key={file.id} className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <FileIcon size={48} className="text-primary" />
              <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={file.name}>
                  {file.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{formatSize(file.size)}</span>
              </div>
              <button 
                className="btn-outline" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => handleDownload(file)}
              >
                <Download size={16} /> Download
              </button>
            </div>
          ))}
          {filteredFiles.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-main)' }}>
              No files found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Files;
