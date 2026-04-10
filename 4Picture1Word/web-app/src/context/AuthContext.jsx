import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('jwt') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);

  const login = (jwt, userRole) => {
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('role', userRole);
    setToken(jwt);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAdmin: role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
