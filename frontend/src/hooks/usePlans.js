import { useState, useEffect } from 'react';
import api from '../services/api';

export function usePlans(adminMode = false, gymId = null) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = async (overrideGymId) => {
    try {
      setLoading(true);
      let endpoint = adminMode ? '/plans/all' : '/plans';
      const gId = overrideGymId !== undefined ? overrideGymId : gymId;
      if (!adminMode && gId) endpoint += `?gymId=${gId}`;

      const res = await api.get(endpoint);
      setPlans(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, [adminMode, gymId]);

  const createPlan = async (data) => {
    const res = await api.post('/plans', data);
    setPlans(prev => [...prev, res.data]);
    return res.data;
  };

  const updatePlan = async (id, data) => {
    const res = await api.put(`/plans/${id}`, data);
    setPlans(prev => prev.map(p => p.id === id ? res.data : p));
    return res.data;
  };

  const deletePlan = async (id) => {
    await api.delete(`/plans/${id}`);
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const updatePlanGyms = async (planId, gymIds) => {
    await api.put(`/plans/${planId}/gyms`, { gymIds });
    await fetchPlans();
  };

  return { plans, loading, error, fetchPlans, createPlan, updatePlan, deletePlan, updatePlanGyms };
}
