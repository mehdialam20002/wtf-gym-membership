import { useState, useEffect } from 'react';
import { Building2, Save, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PlanAssignGyms({ plan, gyms, onSave, onCancel }) {
  const [selectedGymIds, setSelectedGymIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Only show gyms whose category matches this plan's category
  const matchingGyms = plan.category
    ? gyms.filter(g => g.category === plan.category)
    : gyms;

  useEffect(() => {
    if (plan && gyms) {
      const assigned = matchingGyms
        .filter(g => (g.gymPlans || []).some(gp => gp.planId === plan.id))
        .map(g => g.id);
      setSelectedGymIds(new Set(assigned));
    }
  }, [plan, gyms]);

  const toggle = (gymId) => {
    setSelectedGymIds(prev => {
      const next = new Set(prev);
      next.has(gymId) ? next.delete(gymId) : next.add(gymId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedGymIds.size === matchingGyms.length) {
      setSelectedGymIds(new Set());
    } else {
      setSelectedGymIds(new Set(matchingGyms.map(g => g.id)));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/plans/${plan.id}/gyms`, { gymIds: [...selectedGymIds] });
      toast.success(`Updated gym assignments for "${plan.name}"`);
      onSave();
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const allSelected = selectedGymIds.size === matchingGyms.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Plan info */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Building2 size={15} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{plan.name}</p>
          <p className="text-gray-500 text-xs">{plan.category} · {plan.durationDays} days</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900 text-sm">{selectedGymIds.size}</p>
          <p className="text-gray-400 text-xs">/ {matchingGyms.length} gyms</p>
        </div>
      </div>

      {/* Select all */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gym Locations</p>
        <button
          onClick={toggleAll}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Gyms list */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {matchingGyms.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">
            No gyms with category "{plan.category}" found.
          </p>
        )}
        {matchingGyms.map(gym => {
          const isOn = selectedGymIds.has(gym.id);
          return (
            <label
              key={gym.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                isOn
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => toggle(gym.id)}
                className="w-4 h-4 rounded accent-green-600 cursor-pointer flex-shrink-0"
              />
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={13} className={isOn ? 'text-green-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${isOn ? 'text-green-800' : 'text-gray-800'}`}>{gym.name}</p>
                <p className="text-xs text-gray-400 truncate">{gym.area}, {gym.city}</p>
              </div>
              {!gym.isActive && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>
              )}
            </label>
          );
        })}
      </div>

      {/* Save */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Save size={14} />}
          Save — {selectedGymIds.size} Gyms
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
