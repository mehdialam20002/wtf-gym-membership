import { useState, useEffect } from 'react';
import api from '../services/api';

export function useGyms(adminMode = false) {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGyms = async () => {
    try {
      setLoading(true);
      const res = await api.get(adminMode ? '/gyms/all' : '/gyms');
      setGyms(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load gyms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGyms(); }, [adminMode]);

  const createGym = async (data) => {
    const res = await api.post('/gyms', data);
    setGyms(prev => [...prev, res.data]);
    return res.data;
  };

  const updateGym = async (id, data) => {
    const res = await api.put(`/gyms/${id}`, data);
    setGyms(prev => prev.map(g => g.id === id ? res.data : g));
    return res.data;
  };

  const deleteGym = async (id) => {
    await api.delete(`/gyms/${id}`);
    setGyms(prev => prev.filter(g => g.id !== id));
  };

  const setGymPlans = async (gymId, planIds) => {
    const res = await api.put(`/gyms/${gymId}/plans`, { planIds });
    setGyms(prev => prev.map(g => g.id === gymId ? res.data : g));
    return res.data;
  };

  return { gyms, loading, error, fetchGyms, createGym, updateGym, deleteGym, setGymPlans };
}
