import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gym_user_token');
    if (token) {
      api.get('/user/profile')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('gym_user_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = async (name, email, phone, password) => {
    const res = await api.post('/user/signup', { name, email, phone, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('gym_user_token', token);
    setUser(userData);
    return userData;
  };

  const login = async (email, password) => {
    const res = await api.post('/user/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('gym_user_token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('gym_user_token');
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      setUser(res.data);
    } catch {
      // ignore
    }
  };

  return (
    <UserAuthContext.Provider value={{ user, loading, signup, login, logout, refreshProfile, isAuthenticated: !!user }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
};
