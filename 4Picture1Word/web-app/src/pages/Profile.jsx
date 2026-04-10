import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const [stats, setStats] = useState({ solvedCount: 0, attempts: 0 });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetch('http://localhost:5200/profile/progress', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(e => console.error(e));
  }, [token]);

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container flex-center" style={{ minHeight: '60vh' }}>
      <div className="panel" style={{ minWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '2rem' }}>Your Profile</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Puzzles Solved</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.solvedCount}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Attempts</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.attempts}</span>
        </div>
      </div>
    </div>
  );
}
