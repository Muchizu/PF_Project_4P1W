import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5100/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      // Pass a success message to the login page so the user knows it worked
      navigate('/login', { state: { successMessage: 'Account created successfully! Please log in.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh' }}>
      <div className="panel" style={{ width: '400px' }}>
        <h2 className="text-center">Create Account</h2>
        <form onSubmit={handleRegister} style={{ marginTop: '2rem' }}>
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div style={{ position: 'relative', margin: '2rem 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--panel-bg)', padding: '0 10px', color: 'var(--text-muted)' }}>or</span>
        </div>

        <button 
          onClick={() => navigate('/login')} 
          className="btn-ghost" 
          style={{ width: '100%' }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
