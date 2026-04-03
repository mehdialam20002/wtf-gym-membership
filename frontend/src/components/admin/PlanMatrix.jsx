import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Save, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Building2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CATEGORIES = [
  { key: 'monthly',    label: 'Monthly',     short: 'MO', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { key: 'quarterly',  label: 'Quarterly',   short: 'QT', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { key: 'halfyearly', label: 'Half-Yearly', short: 'HY', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { key: 'yearly',     label: 'Annual',      short: 'AN', color: 'text-neon-green',  bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
];

const TIER_CFG = {
  Base:  { label: 'ST', fullLabel: 'Starter', color: 'text-gray-400',   active: 'bg-gray-400' },
  Plus:  { label: 'PR', fullLabel: 'Pro',     color: 'text-blue-400',   active: 'bg-blue-400' },
  Ultra: { label: 'EL', fullLabel: 'Elite',   color: 'text-purple-400', active: 'bg-purple-400' },
};

function formatINR(v) { return `₹${Number(v).toLocaleString('en-IN')}`; }

export default function PlanMatrix({ gyms, allPlans, onRefresh }) {
  // assignments[gymId] = Set of planIds
  const [assignments, setAssignments] = useState({});
  const [pendingGyms, setPendingGyms] = useState(new Set()); // gyms with unsaved changes
  const [savingGyms, setSavingGyms] = useState(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedGym, setExpandedGym] = useState(null);

  // Init from gyms data
  useEffect(() => {
    const init = {};
    gyms.forEach(g => {
      init[g.id] = new Set((g.gymPlans || []).map(gp => gp.planId));
    });
    setAssignments(init);
    setPendingGyms(new Set());
  }, [gyms]);

  const toggle = useCallback((gymId, planId) => {
    setAssignments(prev => {
      const gymSet = new Set(prev[gymId] || []);
      gymSet.has(planId) ? gymSet.delete(planId) : gymSet.add(planId);
      return { ...prev, [gymId]: gymSet };
    });
    setPendingGyms(prev => new Set([...prev, gymId]));
  }, []);

  const toggleRowCategory = (gymId, catKey) => {
    const catPlanIds = filteredPlans(catKey).map(p => p.id);
    const current = assignments[gymId] || new Set();
    const allOn = catPlanIds.every(id => current.has(id));
    setAssignments(prev => {
      const next = new Set(prev[gymId] || []);
      catPlanIds.forEach(id => allOn ? next.delete(id) : next.add(id));
      return { ...prev, [gymId]: next };
    });
    setPendingGyms(prev => new Set([...prev, gymId]));
  };

  const toggleColumnPlan = (planId) => {
    const allOn = gyms.every(g => (assignments[g.id] || new Set()).has(planId));
    setAssignments(prev => {
      const next = { ...prev };
      gyms.forEach(g => {
        const set = new Set(next[g.id] || []);
        allOn ? set.delete(planId) : set.add(planId);
        next[g.id] = set;
      });
      return next;
    });
    setPendingGyms(new Set(gyms.map(g => g.id)));
  };

  const enableAllForGym = (gymId) => {
    setAssignments(prev => ({ ...prev, [gymId]: new Set(allPlans.map(p => p.id)) }));
    setPendingGyms(prev => new Set([...prev, gymId]));
  };

  const disableAllForGym = (gymId) => {
    setAssignments(prev => ({ ...prev, [gymId]: new Set() }));
    setPendingGyms(prev => new Set([...prev, gymId]));
  };

  const saveGym = async (gymId) => {
    setSavingGyms(prev => new Set([...prev, gymId]));
    try {
      await api.put(`/gyms/${gymId}/plans`, { planIds: [...(assignments[gymId] || new Set())] });
      setPendingGyms(prev => { const n = new Set(prev); n.delete(gymId); return n; });
      const gym = gyms.find(g => g.id === gymId);
      toast.success(`Saved: ${gym?.name}`);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingGyms(prev => { const n = new Set(prev); n.delete(gymId); return n; });
    }
  };

  const saveAll = async () => {
    if (pendingGyms.size === 0) { toast('No changes to save'); return; }
    setSavingAll(true);
    try {
      await Promise.all([...pendingGyms].map(gymId =>
        api.put(`/gyms/${gymId}/plans`, { planIds: [...(assignments[gymId] || new Set())] })
      ));
      setPendingGyms(new Set());
      toast.success(`Saved changes for ${pendingGyms.size} gyms`);
      onRefresh?.();
    } catch {
      toast.error('Some saves failed');
    } finally {
      setSavingAll(false);
    }
  };

  const filteredPlans = (catKey) =>
    catKey === 'all' ? allPlans : allPlans.filter(p => p.category === catKey);

  const displayPlans = filteredPlans(activeCategory);

  // Group display plans by category for headers
  const groupedDisplay = CATEGORIES
    .filter(cat => activeCategory === 'all' || activeCategory === cat.key)
    .map(cat => ({
      ...cat,
      plans: allPlans.filter(p => p.category === cat.key),
    }))
    .filter(g => g.plans.length > 0);

  const totalChanges = pendingGyms.size;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-white">Plan Assignment Matrix</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Toggle which plans are available at each gym. Click cells to enable/disable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalChanges > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-semibold"
            >
              <AlertCircle size={13} />
              {totalChanges} unsaved gym{totalChanges !== 1 ? 's' : ''}
            </motion.div>
          )}
          <button
            onClick={() => { setAssignments({}); onRefresh?.(); }}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all"
            title="Reload"
          >
            <RefreshCw size={15} />
          </button>
          <motion.button
            onClick={saveAll}
            disabled={savingAll || totalChanges === 0}
            whileHover={{ scale: savingAll || totalChanges === 0 ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-40"
          >
            {savingAll
              ? <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              : <Save size={14} />}
            Save All Changes
          </motion.button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeCategory === 'all' ? 'bg-white text-dark-900' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/8'
          }`}
        >
          All Periods
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              activeCategory === cat.key
                ? `${cat.bg} ${cat.color} ${cat.border}`
                : 'bg-white/5 text-gray-400 hover:bg-white/8 hover:text-white border-white/8'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="glass-card border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: activeCategory === 'all' ? '900px' : '500px' }}>
            <thead>
              {/* Category header row */}
              <tr className="border-b border-white/10 bg-dark-700/60">
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-52 sticky left-0 bg-dark-700/80 backdrop-blur z-10">
                  Gym Location
                </th>
                <th className="px-2 py-2 text-gray-600 text-xs font-medium w-20">Actions</th>
                {groupedDisplay.map(cat => (
                  <th
                    key={cat.key}
                    colSpan={cat.plans.length}
                    className={`text-center py-2 px-2 font-bold uppercase tracking-widest text-xs ${cat.color} border-l border-white/5`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{cat.label}</span>
                      <span className="text-xs font-normal text-gray-600">({cat.plans.length})</span>
                    </div>
                  </th>
                ))}
              </tr>
              {/* Tier sub-header row */}
              <tr className="border-b border-white/8 bg-dark-700/40">
                <th className="px-4 py-2 sticky left-0 bg-dark-700/60 backdrop-blur z-10" />
                <th className="px-2 py-2" />
                {groupedDisplay.map(cat =>
                  cat.plans.map(plan => {
                    const tcfg = TIER_CFG[plan.tier] || TIER_CFG.Base;
                    const allOn = gyms.every(g => (assignments[g.id] || new Set()).has(plan.id));
                    return (
                      <th key={plan.id} className="text-center px-2 py-2 border-l border-white/5">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-black text-xs ${tcfg.color}`}>{tcfg.label}</span>
                          <button
                            onClick={() => toggleColumnPlan(plan.id)}
                            title={`${allOn ? 'Disable' : 'Enable'} "${plan.name}" for all gyms`}
                            className={`text-xs px-1.5 py-0.5 rounded transition-all ${
                              allOn
                                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30'
                                : 'bg-white/5 text-gray-600 border border-white/8 hover:bg-white/10 hover:text-gray-300'
                            }`}
                          >
                            {allOn ? 'All ✓' : 'All ✗'}
                          </button>
                          <span className="text-gray-700 font-normal text-xs">
                            {formatINR(plan.discountedPrice ?? plan.price)}
                          </span>
                        </div>
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {gyms.map((gym, gi) => {
                const gymAssign = assignments[gym.id] || new Set();
                const isPending = pendingGyms.has(gym.id);
                const isSaving = savingGyms.has(gym.id);
                const enabledCount = displayPlans.filter(p => gymAssign.has(p.id)).length;
                const isExpanded = expandedGym === gym.id;

                return (
                  <>
                    <motion.tr
                      key={gym.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: gi * 0.03 }}
                      className={`transition-colors group ${isPending ? 'bg-yellow-400/3' : 'hover:bg-white/2'}`}
                    >
                      {/* Gym name */}
                      <td className="px-4 py-3 sticky left-0 bg-dark-800/80 backdrop-blur z-10 border-r border-white/5">
                        <div className="flex items-center gap-2">
                          {isPending && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-white text-xs font-semibold truncate leading-tight">{gym.name}</p>
                            <p className="text-gray-600 text-xs truncate">{gym.city}</p>
                          </div>
                        </div>
                      </td>

                      {/* Row actions */}
                      <td className="px-2 py-3 border-r border-white/5">
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`text-xs font-bold ${enabledCount === displayPlans.length ? 'text-neon-green' : enabledCount > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                            {enabledCount}/{displayPlans.length}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => enableAllForGym(gym.id)}
                              title="Enable all"
                              className="p-1 rounded text-gray-600 hover:text-neon-green hover:bg-neon-green/10 transition-all"
                            >
                              <ToggleRight size={13} />
                            </button>
                            <button
                              onClick={() => disableAllForGym(gym.id)}
                              title="Disable all"
                              className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <ToggleLeft size={13} />
                            </button>
                          </div>
                          {isPending && (
                            <button
                              onClick={() => saveGym(gym.id)}
                              disabled={isSaving}
                              className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/30 transition-all disabled:opacity-50"
                            >
                              {isSaving ? '...' : 'Save'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Plan cells */}
                      {groupedDisplay.map(cat =>
                        cat.plans.map(plan => {
                          const isOn = gymAssign.has(plan.id);
                          const tcfg = TIER_CFG[plan.tier] || TIER_CFG.Base;
                          return (
                            <td key={plan.id} className="px-2 py-3 text-center border-l border-white/5">
                              <button
                                onClick={() => toggle(gym.id, plan.id)}
                                className={`w-8 h-8 rounded-lg border transition-all duration-200 flex items-center justify-center mx-auto ${
                                  isOn
                                    ? `${tcfg.active} border-transparent shadow-sm hover:opacity-80`
                                    : 'bg-white/4 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }`}
                                title={`${isOn ? 'Disable' : 'Enable'} ${plan.name} (${cat.label}) at ${gym.name}`}
                              >
                                {isOn && <Check size={13} className="text-white" strokeWidth={3} />}
                              </button>
                            </td>
                          );
                        })
                      )}
                    </motion.tr>

                    {/* Category quick-toggle row (expandable) */}
                    {isExpanded && (
                      <tr className="bg-dark-700/30 border-b border-white/5">
                        <td colSpan={2 + displayPlans.length} className="px-4 py-2">
                          <div className="flex gap-2 flex-wrap">
                            {CATEGORIES.filter(c => activeCategory === 'all' || c.key === activeCategory).map(cat => {
                              const catPlanIds = allPlans.filter(p => p.category === cat.key).map(p => p.id);
                              const allOn = catPlanIds.every(id => gymAssign.has(id));
                              return (
                                <button key={cat.key} onClick={() => toggleRowCategory(gym.id, cat.key)}
                                  className={`text-xs px-3 py-1 rounded-lg border transition-all ${allOn ? `${cat.bg} ${cat.color} ${cat.border}` : 'bg-white/4 text-gray-500 border-white/8 hover:bg-white/8'}`}
                                >
                                  {allOn ? '✓' : '○'} {cat.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-white/8 flex flex-wrap gap-4 items-center bg-dark-700/30">
          <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Legend:</span>
          {Object.entries(TIER_CFG).map(([tier, cfg]) => (
            <div key={tier} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`w-3 h-3 rounded ${cfg.active}`} />
              <span>{cfg.label} = {cfg.fullLabel}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-white/10 border border-white/15" />
            <span>= Disabled</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-yellow-500 ml-auto">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>= Unsaved changes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
