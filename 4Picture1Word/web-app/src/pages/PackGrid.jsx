import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PackGrid() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5200/packs?random=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setPacks(data);
        setLoading(false);
      })
      .catch(e => console.error(e));
  }, [token]);

  if (loading) return <div className="container flex-center"><h3>Loading Packs...</h3></div>;

  return (
    <div className="container">
      <h1 className="text-center mb-4">Select a Puzzle Pack</h1>
      <div className="puzzle-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {packs.map(pack => (
          <div key={pack.id} className="panel" style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '1.5rem' }} 
               onClick={() => navigate(`/play/${pack.id}`)}>
            <h3>{pack.name}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{pack.description}</p>
            <div className="mt-4">
              <button className="btn" style={{ width: '100%' }}>Play Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
