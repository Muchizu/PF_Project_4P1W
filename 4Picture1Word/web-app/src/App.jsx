import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PackGrid from './pages/PackGrid';
import GameView from './pages/GameView';
import Profile from './pages/Profile';
import AdminLayout from './pages/admin/AdminLayout';
import AdminImages from './pages/admin/AdminImages';
import AdminPacks from './pages/admin/AdminPacks';
import AdminPuzzles from './pages/admin/AdminPuzzles';

// Mock components until implemented
const AdminTags = () => <div className="panel">Admin Tags</div>;

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { token, isAdmin } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  return children;
};

function Navbar() {
  const { token, isAdmin, logout } = useAuth();
  
  if (!token) return null;

  return (
    <nav className="navbar">
      <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>4Pics1Word</div>
      <div className="nav-links">
        <Link to="/">Packs</Link>
        <Link to="/profile">Profile</Link>
        {isAdmin && <Link to="/admin" style={{ color: 'var(--primary)' }}>CMS</Link>}
        <button onClick={logout} className="btn-ghost" style={{ padding: '0.4rem 1rem' }}>Logout</button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<ProtectedRoute><PackGrid /></ProtectedRoute>} />
          <Route path="/play/:packId" element={<ProtectedRoute><GameView /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="images" />} />
            <Route path="images" element={<AdminImages />} />
            <Route path="tags" element={<AdminTags />} />
            <Route path="puzzles" element={<AdminPuzzles />} />
            <Route path="packs" element={<AdminPacks />} />
          </Route>
        </Routes>
      </main>
    </Router>
  );
}

export default App;
