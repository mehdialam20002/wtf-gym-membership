import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Menu, Dumbbell, Search, Building2, Users, Snowflake } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/admin/Sidebar';
import PlansTable from '../../components/admin/PlansTable';
import PlanForm from '../../components/admin/PlanForm';
import GymsTable from '../../components/admin/GymsTable';
import GymForm from '../../components/admin/GymForm';
import PlanAssignGyms from '../../components/admin/PlanAssignGyms';
import BenefitsEditor from '../../components/admin/BenefitsEditor';
import MembersTab from '../../components/admin/MembersTab';
import FreezesTab from '../../components/admin/FreezesTab';
import Modal from '../../components/ui/Modal';
import { usePlans } from '../../hooks/usePlans';
import { useGyms } from '../../hooks/useGyms';
import PlanGymAssign from '../../components/admin/PlanGymAssign';

export default function DashboardPage() {
  const { plans, loading: plansLoading, createPlan, updatePlan, deletePlan, fetchPlans } = usePlans(true);
  const { gyms, loading: gymsLoading, createGym, updateGym, deleteGym, setGymPlans, fetchGyms } = useGyms(true);

  const [activeTab, setActiveTab] = useState('plans');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Plan modals
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deletePlanConfirm, setDeletePlanConfirm] = useState(null);
  const [planFormLoading, setPlanFormLoading] = useState(false);
  const [planSearch, setPlanSearch] = useState('');

  // Gym modals
  const [gymModal, setGymModal] = useState(false);
  const [editingGym, setEditingGym] = useState(null);
  const [deleteGymConfirm, setDeleteGymConfirm] = useState(null);
  const [gymFormLoading, setGymFormLoading] = useState(false);
  const [gymSearch, setGymSearch] = useState('');
  const [assignGym, setAssignGym] = useState(null);

  // Plan-centric modals
  const [assignGymsForPlan, setAssignGymsForPlan] = useState(null);
  const [benefitsPlan, setBenefitsPlan] = useState(null);

  // ── PLAN HANDLERS ──
  const handlePlanSubmit = async (data) => {
    setPlanFormLoading(true);
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, data);
        toast.success('Plan updated!');
      } else {
        await createPlan(data);
        toast.success('Plan created!');
      }
      setPlanModal(false); setEditingPlan(null);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed');
    } finally {
      setPlanFormLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletePlanConfirm) return;
    try {
      await deletePlan(deletePlanConfirm.id);
      toast.success('Plan deleted');
      setDeletePlanConfirm(null);
    } catch { toast.error('Failed to delete'); }
  };

  const handleTogglePlanVisibility = async (plan) => {
    try {
      await updatePlan(plan.id, { isVisible: !plan.isVisible });
      toast.success(`Plan ${!plan.isVisible ? 'shown' : 'hidden'}`);
    } catch { toast.error('Failed'); }
  };

  const handleSaveBenefits = async (planId, benefits) => {
    await updatePlan(planId, { benefits });
    setBenefitsPlan(null);
  };

  // ── GYM HANDLERS ──
  const handleGymSubmit = async (data) => {
    setGymFormLoading(true);
    try {
      if (editingGym) {
        await updateGym(editingGym.id, data);
        toast.success('Gym updated!');
      } else {
        await createGym(data);
        toast.success('Gym added!');
      }
      setGymModal(false); setEditingGym(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setGymFormLoading(false);
    }
  };

  const handleDeleteGym = async () => {
    if (!deleteGymConfirm) return;
    try {
      await deleteGym(deleteGymConfirm.id);
      toast.success('Gym deleted');
      setDeleteGymConfirm(null);
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleGymActive = async (gym) => {
    try {
      await updateGym(gym.id, { isActive: !gym.isActive });
      toast.success(`Gym ${!gym.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  const [planCategoryFilter, setPlanCategoryFilter] = useState('All');

  // Filtered lists
  const filteredPlans = plans.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(planSearch.toLowerCase());
    const matchesCategory = planCategoryFilter === 'All' || p.category === planCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredGyms = gyms.filter(g =>
    g.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
    g.city.toLowerCase().includes(gymSearch.toLowerCase()) ||
    g.area.toLowerCase().includes(gymSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3.5 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <Menu size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900">
              {activeTab === 'plans' ? 'Membership Plans' : activeTab === 'gyms' ? 'Gym Locations' : activeTab === 'members' ? 'Members & Memberships' : 'Freeze Management'}
            </h1>
            <p className="text-xs text-gray-400">
              {activeTab === 'plans'
                ? `${plans.length} total · ${plans.filter(p => p.isVisible).length} active`
                : activeTab === 'gyms'
                ? `${gyms.length} total · ${gyms.filter(g => g.isActive).length} active`
                : activeTab === 'members'
                ? 'Manage all member memberships'
                : 'View and manage all freeze records'}
            </p>
          </div>

          {activeTab === 'plans' && (
            <motion.button
              onClick={() => { setEditingPlan(null); setPlanModal(true); }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={15} /> Add Plan
            </motion.button>
          )}
          {activeTab === 'gyms' && (
            <motion.button
              onClick={() => { setEditingGym(null); setGymModal(true); }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={15} /> Add Gym
            </motion.button>
          )}
        </header>

        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">

            {/* ── PLANS TAB ── */}
            {activeTab === 'plans' && (
              <motion.div key="plans" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative max-w-xs w-full sm:w-auto">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={planSearch}
                      onChange={e => setPlanSearch(e.target.value)}
                      placeholder="Search plans..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {['All', 'WTF Starter', 'WTF Plus', 'WTF Ultra'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setPlanCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          planCategoryFilter === cat
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {cat === 'All' ? 'All Plans' : cat}
                        {cat !== 'All' && (
                          <span className="ml-1.5 opacity-60">{plans.filter(p => p.category === cat).length}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <PlansTable
                  plans={filteredPlans}
                  loading={plansLoading}
                  onEdit={p => { setEditingPlan(p); setPlanModal(true); }}
                  onDelete={setDeletePlanConfirm}
                  onToggleVisibility={handleTogglePlanVisibility}
                  onAssignGyms={setAssignGymsForPlan}
                  onManageBenefits={setBenefitsPlan}
                />
              </motion.div>
            )}

            {/* ── GYMS TAB ── */}
            {activeTab === 'gyms' && (
              <motion.div key="gyms" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="relative max-w-xs">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={gymSearch}
                    onChange={e => setGymSearch(e.target.value)}
                    placeholder="Search gyms..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800 placeholder-gray-400"
                  />
                </div>
                <GymsTable
                  gyms={filteredGyms}
                  loading={gymsLoading}
                  onEdit={g => { setEditingGym(g); setGymModal(true); }}
                  onDelete={setDeleteGymConfirm}
                  onManagePlans={setAssignGym}
                  onToggleActive={handleToggleGymActive}
                />
              </motion.div>
            )}

            {/* ── MEMBERS TAB ── */}
            {activeTab === 'members' && (
              <motion.div key="members" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <MembersTab />
              </motion.div>
            )}

            {/* ── FREEZES TAB ── */}
            {activeTab === 'freezes' && (
              <motion.div key="freezes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <FreezesTab />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── PLAN MODALS ── */}
      <Modal theme="light" isOpen={planModal} onClose={() => { setPlanModal(false); setEditingPlan(null); }}
        title={editingPlan ? `Edit Plan` : 'Create New Plan'} size="lg">
        <PlanForm plan={editingPlan} onSubmit={handlePlanSubmit} onCancel={() => { setPlanModal(false); setEditingPlan(null); }} loading={planFormLoading} />
      </Modal>

      <Modal theme="light" isOpen={!!deletePlanConfirm} onClose={() => setDeletePlanConfirm(null)} title="Delete Plan" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Dumbbell size={20} className="text-red-500" />
          </div>
          <p className="text-gray-700 mb-1 text-sm">Delete <strong>"{deletePlanConfirm?.name}"</strong>?</p>
          <p className="text-gray-400 text-xs mb-5">This removes it from all gym assignments.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeletePlanConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleDeletePlan} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Plan-centric assign gyms */}
      <Modal theme="light" isOpen={!!assignGymsForPlan} onClose={() => setAssignGymsForPlan(null)} title="Assign Plan to Gyms" size="md">
        {assignGymsForPlan && (
          <PlanAssignGyms
            plan={assignGymsForPlan}
            gyms={gyms}
            onSave={async () => { setAssignGymsForPlan(null); await fetchPlans(); await fetchGyms(); }}
            onCancel={() => setAssignGymsForPlan(null)}
          />
        )}
      </Modal>

      {/* Benefits editor */}
      <Modal theme="light" isOpen={!!benefitsPlan} onClose={() => setBenefitsPlan(null)} title="Manage Benefits" size="md">
        {benefitsPlan && (
          <BenefitsEditor
            plan={benefitsPlan}
            onSave={handleSaveBenefits}
            onCancel={() => setBenefitsPlan(null)}
          />
        )}
      </Modal>

      {/* ── GYM MODALS ── */}
      <Modal theme="light" isOpen={gymModal} onClose={() => { setGymModal(false); setEditingGym(null); }}
        title={editingGym ? 'Edit Gym' : 'Add New Gym'} size="lg">
        <GymForm gym={editingGym} onSubmit={handleGymSubmit} onCancel={() => { setGymModal(false); setEditingGym(null); }} loading={gymFormLoading} />
      </Modal>

      <Modal theme="light" isOpen={!!deleteGymConfirm} onClose={() => setDeleteGymConfirm(null)} title="Delete Gym" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 size={20} className="text-red-500" />
          </div>
          <p className="text-gray-700 mb-1 text-sm">Delete <strong>"{deleteGymConfirm?.name}"</strong>?</p>
          <p className="text-gray-400 text-xs mb-5">This removes all plan assignments for this gym too.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteGymConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleDeleteGym} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Gym-centric plan assignment (from Gyms tab) */}
      <Modal theme="light" isOpen={!!assignGym} onClose={() => setAssignGym(null)} title="Assign Plans to Gym" size="lg">
        {assignGym && (
          <div className="text-gray-900">
            {/* Reuse existing PlanGymAssign component for gym-centric view */}
            <AssignGymPlans
              gym={assignGym}
              allPlans={plans}
              onSave={async () => { setAssignGym(null); await fetchGyms(); await fetchPlans(); }}
              onCancel={() => setAssignGym(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function AssignGymPlans(props) {
  return <PlanGymAssign {...props} />;
}
