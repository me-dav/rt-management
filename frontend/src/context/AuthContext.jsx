import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getMe, logout as logoutApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try { await logoutApi(); } catch {}
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);