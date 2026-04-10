import { Outlet, NavLink } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="container" style={{ display: 'flex', gap: '2rem' }}>
      <div className="panel" style={{ width: '250px', padding: '1rem', height: 'max-content' }}>
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>CMS Menu</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <NavLink to="/admin/images" className={({isActive}) => isActive ? 'btn' : 'btn btn-ghost'}>Images</NavLink>
          <NavLink to="/admin/tags" className={({isActive}) => isActive ? 'btn' : 'btn btn-ghost'}>Tags</NavLink>
          <NavLink to="/admin/puzzles" className={({isActive}) => isActive ? 'btn' : 'btn btn-ghost'}>Puzzles</NavLink>
          <NavLink to="/admin/packs" className={({isActive}) => isActive ? 'btn' : 'btn btn-ghost'}>Packs</NavLink>
        </nav>
      </div>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}
