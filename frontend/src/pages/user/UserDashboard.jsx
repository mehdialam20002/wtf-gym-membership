import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import api from '../../services/api';
import FreezeModal from '../../components/user/FreezeModal';
import FreezeHistory from '../../components/user/FreezeHistory';
import MembershipCard from '../../components/user/MembershipCard';

export default function UserDashboard() {
  const { user, logout, refreshProfile } = useUserAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [freezeModal, setFreezeModal] = useState({ open: false, membership: null });
  const [historyModal, setHistoryModal] = useState({ open: false, membershipId: null });
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchMemberships = async () => {
    try {
      const res = await api.get('/memberships/my');
      setMemberships(res.data);
    } catch (err) {
      console.error('Error fetching memberships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleFreeze = async (membershipId, data) => {
    try {
      const res = await api.post(`/memberships/${membershipId}/freeze`, data);
      showMessage(res.data.message);
      setFreezeModal({ open: false, membership: null });
      fetchMemberships();
      refreshProfile();
    } catch (err) {
      // Re-throw so FreezeModal catches it and shows error inside modal
      throw new Error(err.response?.data?.error || 'Failed to freeze');
    }
  };

  const handleUnfreeze = async (membershipId) => {
    if (!confirm('Are you sure you want to unfreeze? Your membership will resume.')) return;
    try {
      const res = await api.post(`/memberships/${membershipId}/unfreeze`);
      showMessage(`Unfrozen! Extended by ${res.data.actualFreezeDays} days. New expiry: ${new Date(res.data.newEndDate).toLocaleDateString('en-IN')}`);
      fetchMemberships();
      refreshProfile();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to unfreeze', 'error');
    }
  };

  const handleCancelFreeze = async (freezeId) => {
    if (!confirm('Cancel this scheduled freeze?')) return;
    try {
      await api.post(`/memberships/cancel/${freezeId}`);
      showMessage('Scheduled freeze cancelled');
      fetchMemberships();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to cancel', 'error');
    }
  };

  const activeMemberships = memberships.filter(m => m.status === 'ACTIVE' || m.status === 'FROZEN');
  const pastMemberships = memberships.filter(m => m.status === 'EXPIRED' || m.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-600 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold text-neon-green">WTF GYM</Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm hidden sm:block">Hi, {user?.name}</span>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm border border-dark-500 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Message Toast */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-sm font-medium ${
              message.type === 'error'
                ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                : 'bg-neon-green/20 border border-neon-green/40 text-neon-green'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-display font-bold text-white mb-6">My Memberships</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : memberships.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No memberships yet</p>
            <Link
              to="/"
              className="inline-block bg-neon-green text-dark-900 font-bold px-8 py-3 rounded-lg hover:shadow-neon-green transition-all"
            >
              Browse Plans
            </Link>
          </div>
        ) : (
          <>
            {/* Active Memberships */}
            {activeMemberships.length > 0 && (
              <div className="space-y-6 mb-10">
                {activeMemberships.map(membership => (
                  <MembershipCard
                    key={membership.id}
                    membership={membership}
                    onFreeze={() => setFreezeModal({ open: true, membership })}
                    onUnfreeze={() => handleUnfreeze(membership.id)}
                    onCancelFreeze={handleCancelFreeze}
                    onViewHistory={() => setHistoryModal({ open: true, membershipId: membership.id })}
                  />
                ))}
              </div>
            )}

            {/* Past Memberships */}
            {pastMemberships.length > 0 && (
              <div>
                <h3 className="text-lg font-display font-semibold text-gray-400 mb-4">Past Memberships</h3>
                <div className="space-y-4">
                  {pastMemberships.map(membership => (
                    <MembershipCard
                      key={membership.id}
                      membership={membership}
                      isPast
                      onViewHistory={() => setHistoryModal({ open: true, membershipId: membership.id })}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Freeze Modal */}
      <FreezeModal
        isOpen={freezeModal.open}
        membership={freezeModal.membership}
        onClose={() => setFreezeModal({ open: false, membership: null })}
        onSubmit={handleFreeze}
      />

      {/* Freeze History Modal */}
      <FreezeHistory
        isOpen={historyModal.open}
        membershipId={historyModal.membershipId}
        onClose={() => setHistoryModal({ open: false, membershipId: null })}
      />
    </div>
  );
}
