import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminPacks() {
  const [packs, setPacks] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const { token } = useAuth();

  const fetchPacks = () => {
    fetch('http://localhost:5200/cms/packs', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(setPacks);
  };
  useEffect(() => { fetchPacks(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5200/cms/packs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc, order: 0 })
    });
    setName(''); setDesc('');
    fetchPacks();
  };

  const traverse = async (id) => {
    await fetch(`http://localhost:5200/cms/packs/${id}/publish`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchPacks();
  };

  const del = async (id) => {
    if(!window.confirm("Are you sure you want to delete this pack?")) return;
    await fetch(`http://localhost:5200/cms/packs/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchPacks();
  };

  return (
    <div className="panel">
      <h2>Manage Packs</h2>
      <form onSubmit={create} className="mb-4" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label>Pack Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div style={{ flex: 2 }}>
          <label>Description</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <button type="submit">Create Pack</button>
      </form>

      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.5rem' }}>ID</th>
            <th>Name</th>
            <th>Published</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {packs.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '0.5rem' }}>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.isPublished ? <span className="success-text">YES</span> : <span className="error-text">NO</span>}</td>
              <td>
                <button onClick={() => traverse(p.id)} className="btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>
                  Toggle Publish
                </button>
                <button onClick={() => del(p.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', backgroundColor: 'var(--error)' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
