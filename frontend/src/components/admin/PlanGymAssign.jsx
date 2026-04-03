import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatDuration, durationColorObj } from '../../utils/duration';

function formatINR(v) { return `₹${Number(v).toLocaleString('en-IN')}`; }

export default function PlanGymAssign({ gym, allPlans, onSave, onCancel }) {
  const [selectedPlanIds, setSelectedPlanIds] = useState(new Set());
  const [activeDuration, setActiveDuration] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only show plans matching this gym's category
  const matchingPlans = useMemo(() => {
    if (!gym.category) return allPlans;
    return allPlans.filter(p => p.category === gym.category);
  }, [allPlans, gym.category]);

  // Get unique durations sorted ascending
  const durations = useMemo(() => {
    const unique = [...new Set(matchingPlans.map(p => p.durationDays))].sort((a, b) => a - b);
    return unique;
  }, [matchingPlans]);

  useEffect(() => {
    if (gym) {
      const currentIds = (gym.gymPlans || []).map(gp => gp.planId);
      setSelectedPlanIds(new Set(currentIds));
    }
  }, [gym]);

  useEffect(() => {
    if (durations.length > 0 && activeDuration === null) {
      setActiveDuration(durations[0]);
    }
  }, [durations]);

  const toggle = (id) => {
    setSelectedPlanIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleDuration = (days) => {
    const ids = allPlans.filter(p => p.durationDays === days).map(p => p.id);
    const allOn = ids.every(id => selectedPlanIds.has(id));
    setSelectedPlanIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => allOn ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/gyms/${gym.id}/plans`, { planIds: [...selectedPlanIds] });
      toast.success(`Plans updated for ${gym.name}`);
      onSave();
    } catch {
      toast.error('Failed to update plans');
    } finally {
      setLoading(false);
    }
  };

  const plansForDuration = (days) => matchingPlans.filter(p => p.durationDays === days);
  const enabledForDuration = (days) => plansForDuration(days).filter(p => selectedPlanIds.has(p.id)).length;

  return (
    <div className="flex flex-col gap-0">
      {/* Gym info header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 mb-5">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
          <MapPin size={15} className="text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-bold text-sm truncate">{gym.name}</p>
          <p className="text-gray-500 text-xs">{gym.area}, {gym.city}</p>
        </div>
        <div className="text-right">
          <p className="text-green-600 font-black text-xl leading-none">{selectedPlanIds.size}</p>
          <p className="text-gray-400 text-xs">/ {matchingPlans.length} plans</p>
        </div>
      </div>

      {/* No matching plans warning */}
      {matchingPlans.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
          {gym.category
            ? `No plans found for category "${gym.category}". Create plans with this category first.`
            : 'This gym has no category set. Edit the gym to assign a category.'}
        </div>
      )}

      {/* Duration Tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {durations.map(days => {
          const enabled = enabledForDuration(days);
          const total = plansForDuration(days).length;
          const isActive = activeDuration === days;
          const allEnabled = enabled === total && total > 0;
          const c = durationColorObj(days);
          return (
            <button
              key={days}
              onClick={() => setActiveDuration(days)}
              className={`relative flex flex-col items-start px-4 py-2.5 rounded-xl border transition-all duration-200 flex-1 min-w-[100px] ${
                isActive ? `${c.active}` : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className={`text-xs font-bold ${isActive ? c.text : 'text-gray-600'}`}>
                  {formatDuration(days)}
                </span>
                <span className={`text-xs font-black ${allEnabled ? 'text-green-600' : enabled > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                  {enabled}/{total}
                </span>
              </div>
              <span className="text-xs text-gray-400">{days} days</span>
              <div className="w-full h-0.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${allEnabled ? 'bg-green-500' : enabled > 0 ? 'bg-yellow-400' : 'bg-gray-200'}`}
                  style={{ width: total > 0 ? `${(enabled / total) * 100}%` : '0%' }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bulk toggle */}
      {activeDuration !== null && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {formatDuration(activeDuration)} Plans
          </p>
          <button
            onClick={() => toggleDuration(activeDuration)}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all border border-gray-200"
          >
            {plansForDuration(activeDuration).every(p => selectedPlanIds.has(p.id)) ? 'Disable All' : 'Enable All'}
          </button>
        </div>
      )}

      {/* Plan Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDuration}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 gap-3"
        >
          {activeDuration === null || plansForDuration(activeDuration).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No plans for this duration.</p>
          ) : (
            plansForDuration(activeDuration).map((plan, i) => {
              const isOn = selectedPlanIds.has(plan.id);
              const benefits = Array.isArray(plan.benefits) ? plan.benefits : [];
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => toggle(plan.id)}
                  className={`relative flex gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isOn ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-10 h-6 rounded-full transition-all duration-300 relative ${isOn ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${isOn ? 'left-5' : 'left-1'}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-gray-900 font-bold text-base leading-tight">{plan.name}</p>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-lg text-gray-900">{formatINR(plan.discountedPrice ?? plan.price)}</p>
                        {plan.discountedPrice && (
                          <p className="text-gray-400 line-through text-xs">{formatINR(plan.price)}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{benefits.length} benefits</p>
                    <div className="space-y-0.5">
                      {benefits.slice(0, 2).map((b, bi) => (
                        <p key={bi} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Check size={10} className="text-gray-400 flex-shrink-0" /> {b}
                        </p>
                      ))}
                      {benefits.length > 2 && <p className="text-xs text-gray-400">+{benefits.length - 2} more benefits</p>}
                    </div>
                  </div>

                  {isOn && (
                    <div className="absolute top-3 right-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Summary + Save */}
      <div className="mt-5 pt-4 border-t border-gray-200 space-y-3">
        <div className="flex flex-wrap gap-2">
          {durations.map(days => {
            const enabled = enabledForDuration(days);
            const total = plansForDuration(days).length;
            return (
              <div key={days} className="text-center px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 flex-1 min-w-[80px]">
                <p className="text-xs text-gray-400 mb-0.5">{formatDuration(days)}</p>
                <p className={`font-bold text-sm ${enabled === total && total > 0 ? 'text-green-600' : enabled > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                  {enabled}/{total}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <motion.button onClick={handleSave} disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
            Save — {selectedPlanIds.size}/{matchingPlans.length} Plans Enabled
          </motion.button>
          <button onClick={onCancel} className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancel</button>
        </div>
      </div>
    </div>
  );
}
