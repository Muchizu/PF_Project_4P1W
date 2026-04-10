import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5100/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.status === 401) throw new Error('Invalid email or password');
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      login(data.token, data.role);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh' }}>
      <div className="panel" style={{ width: '400px' }}>
        <h2 className="text-center">Welcome Back</h2>
        
        {successMessage && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', color: 'white', textAlign: 'center', marginTop: '1rem' }}>
            ✅ {successMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ marginTop: '2rem' }}>
          {error && <div className="error-text mb-4 text-center">{error}</div>}
          <div className="form-group">
            <label>Username / Email</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ position: 'relative', margin: '2rem 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--panel-bg)', padding: '0 10px', color: 'var(--text-muted)' }}>or</span>
        </div>

        <button 
          onClick={() => navigate('/register')} 
          className="btn-ghost" 
          style={{ width: '100%' }}
        >
          Create New Account
        </button>
      </div>
    </div>
  );
}
