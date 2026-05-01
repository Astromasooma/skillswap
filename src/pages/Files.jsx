import React, { useState, useRef, useEffect } from 'react';
import { File as FileIcon, Download, Search, Loader2 } from 'lucide-react';

function Files() {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);

    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    // Refresh file list after uploads complete
    await fetchFiles();
    setIsUploading(false);
    
    // Reset input
    e.target.value = null;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDownload = async (file) => {
    try {
      // Mockup fallback
      if (file.url === '#') {
        alert("This is a mockup file and cannot be downloaded.");
        return;
      }

      // Fetch the signed URL from our backend
      const response = await fetch(`/api/files/download/${file.id}`);
      if (!response.ok) {
        throw new Error('Failed to get download link');
      }
      
      const data = await response.json();
      
      // Navigate to the signed URL to trigger native download
      const a = document.createElement('a');
      a.href = data.url;
      // Note: The backend Signed URL explicitly sets responseDisposition to force a download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file. It may no longer exist in the cloud.');
    }
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
          <button className="btn-primary" onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 size={18} className="spin" style={{ marginRight: '0.5rem' }} /> 
                Uploading...
              </>
            ) : 'Upload File'}
          </button>
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
