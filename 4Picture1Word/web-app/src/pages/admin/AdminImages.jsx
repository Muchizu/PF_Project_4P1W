import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminImages() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();
  
  const fetchImages = () => {
    fetch('http://localhost:5200/cms/images', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(setImages);
  };
  
  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if(!files.length) return;
    
    setUploading(true);
    const fd = new FormData();
    for(let f of files) fd.append('files', f);
    
    try {
      await fetch('http://localhost:5200/cms/images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      fetchImages();
    } finally {
      setUploading(false);
    }
  };

  const delImage = async (id) => {
    if(!window.confirm("Delete this image permanently?")) return;
    await fetch(`http://localhost:5200/cms/images/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchImages();
  };

  return (
    <div className="panel">
      <h2>Manage Images</h2>
      <div className="mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input type="file" multiple accept="image/*" onChange={handleUpload} disabled={uploading} style={{ maxWidth: '300px' }} />
        {uploading && <span>Uploading...</span>}
      </div>
      
      <div className="puzzle-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {images.map(img => (
          <div key={img.id} style={{ position: 'relative' }}>
            <img src={`http://localhost:5200${img.url}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }} />
            <button onClick={() => delImage(img.id)} style={{ position: 'absolute', top: 5, right: 5, background: 'var(--error)', border: 'none', borderRadius: '50%', width: '25px', height: '25px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              &times;
            </button>
            <div style={{ position: 'absolute', bottom: 5, left: 5, right: 5, background: 'rgba(0,0,0,0.7)', padding: '2px 5px', fontSize: '0.75rem', borderRadius: '4px' }}>
              {img.tags?.map(t => t.name).join(', ') || 'No tags'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
