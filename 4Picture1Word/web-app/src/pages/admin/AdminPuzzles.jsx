import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminPuzzles() {
  const [images, setImages] = useState([]);
  const [packs, setPacks] = useState([]);
  const [puzzles, setPuzzles] = useState([]);
  
  const [selectedPack, setSelectedPack] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  
  const { token } = useAuth();
  
  const vFetch = (url) => fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());

  const loadData = () => {
    vFetch('http://localhost:5200/cms/images').then(setImages);
    vFetch('http://localhost:5200/cms/packs').then(setPacks);
    vFetch('http://localhost:5200/cms/puzzles').then(setPuzzles);
  };
  
  useEffect(() => { loadData(); }, []);

  const toggleImage = (id) => {
    if (selectedImages.includes(id)) {
      setSelectedImages(selectedImages.filter(x => x !== id));
    } else {
      if (selectedImages.length >= 4) return alert("You can only select exactly 4 images!");
      setSelectedImages([...selectedImages, id]);
    }
  };

  const createPuzzle = async (e) => {
    e.preventDefault();
    if(selectedImages.length !== 4) return alert("Select exactly 4 images required for 4Pics1Word!");
    if(!selectedPack) return alert("Please select a Pack first.");

    const res = await fetch('http://localhost:5200/cms/puzzles', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
         answer, hint, difficulty: parseInt(difficulty), packId: parseInt(selectedPack), imageIds: selectedImages
      })
    });
    
    if(!res.ok) return alert("Failed to create puzzle");
    
    setAnswer(''); setHint(''); setSelectedImages([]);
    loadData();
  };

  return (
    <div className="panel">
      <h2>Create a New Puzzle</h2>
      
      <form onSubmit={createPuzzle} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
        <div>
          <label>Assign to Pack</label>
          <select value={selectedPack} onChange={e => setSelectedPack(e.target.value)} required>
            <option value="">-- Choose Pack --</option>
            {packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label>Puzzle Answer (Word)</label>
          <input value={answer} onChange={e => setAnswer(e.target.value)} required />
        </div>
        <div>
          <label>Hint (Optional)</label>
          <input value={hint} onChange={e => setHint(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="btn" style={{ width: '100%' }}>Create Puzzle</button>
        </div>
      </form>

      <h4>Select Exactly 4 Images ({selectedImages.length}/4)</h4>
      <div className="puzzle-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', marginBottom: '2rem' }}>
        {images.map(img => (
          <div key={img.id} onClick={() => toggleImage(img.id)} style={{ cursor: 'pointer', border: selectedImages.includes(img.id) ? '4px solid var(--primary)' : '2px solid transparent', borderRadius: '8px' }}>
            <img src={`http://localhost:5200${img.url}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />
      
      <h3>Existing Puzzles ({puzzles.length})</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th>ID</th>
            <th>Answer</th>
            <th>Pack Assigned To</th>
            <th>Images Connected</th>
          </tr>
        </thead>
        <tbody>
          {puzzles.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '0.5rem' }}>{p.id}</td>
              <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{p.answer}</td>
              <td>{p.pack?.name}</td>
              <td>{p.images?.length || 0}/4</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
