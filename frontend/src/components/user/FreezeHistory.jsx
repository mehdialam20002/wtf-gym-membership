import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import useTestMode from '../../hooks/useTestMode';

const statusConfig = {
  SCHEDULED: { label: 'Scheduled', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: '🕐' },
  ACTIVE: { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: '❄️' },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: '✓' },
  AUTO_COMPLETED: { label: 'Auto Completed', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/20', icon: '✓' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '✕' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
}

export default function FreezeHistory({ isOpen, membershipId, onClose }) {
  const [freezes, setFreezes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { unit } = useTestMode();

  useEffect(() => {
    if (isOpen && membershipId) {
      setLoading(true);
      api.get(`/memberships/${membershipId}/freeze-history`)
        .then(res => setFreezes(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, membershipId]);

  if (!isOpen) return null;

  // Stats
  const totalRequested = freezes.reduce((s, f) => s + f.requestedDays, 0);
  const totalActual = freezes.filter(f => f.status === 'COMPLETED' || f.status === 'AUTO_COMPLETED')
    .reduce((s, f) => s + (f.actualDays || 0), 0);
  const totalWasted = freezes.filter(f => f.status === 'CANCELLED')
    .reduce((s, f) => s + f.requestedDays, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-dark-800 border border-dark-500 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-hide"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold text-white">Freeze History</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : freezes.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No freeze history</p>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-dark-700 rounded-xl p-3 text-center">
                    <p className="text-gray-500 text-xs">Total Freezes</p>
                    <p className="text-white font-bold text-lg">{freezes.length}</p>
                  </div>
                  <div className="bg-dark-700 rounded-xl p-3 text-center">
                    <p className="text-gray-500 text-xs">{unit === 'min' ? 'Min' : 'Days'} Used</p>
                    <p className="text-neon-green font-bold text-lg">{totalActual}</p>
                  </div>
                  <div className="bg-dark-700 rounded-xl p-3 text-center">
                    <p className="text-gray-500 text-xs">{unit === 'min' ? 'Min' : 'Days'} Wasted</p>
                    <p className={`font-bold text-lg ${totalWasted > 0 ? 'text-red-400' : 'text-gray-500'}`}>{totalWasted}</p>
                  </div>
                </div>

                {/* Freeze Records */}
                <div className="space-y-3">
                  {freezes.map((freeze, index) => {
                    const config = statusConfig[freeze.status] || statusConfig.CANCELLED;
                    const isCancelled = freeze.status === 'CANCELLED';
                    const isCompleted = freeze.status === 'COMPLETED' || freeze.status === 'AUTO_COMPLETED';
                    const wastedDays = isCancelled ? freeze.requestedDays :
                      (isCompleted && freeze.actualDays < freeze.requestedDays ? freeze.requestedDays - freeze.actualDays : 0);

                    return (
                      <div
                        key={freeze.id}
                        className={`rounded-xl p-4 border ${config.bg}`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs font-mono">#{freezes.length - index}</span>
                            <span className={`text-xs font-bold ${config.color}`}>
                              {config.icon} {config.label}
                            </span>
                          </div>
                          <span className="text-gray-600 text-xs">{formatDate(freeze.createdAt)} {formatTime(freeze.createdAt)}</span>
                        </div>

                        {/* Date Range Bar */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <p className="text-gray-500 text-xs">From</p>
                            <p className="text-white text-sm font-medium">{formatDate(freeze.freezeStartDate)}</p>
                          </div>
                          <div className="text-gray-600">→</div>
                          <div className="flex-1">
                            <p className="text-gray-500 text-xs">To</p>
                            <p className="text-white text-sm font-medium">{formatDate(freeze.freezeEndDate)}</p>
                          </div>
                        </div>

                        {/* Days Info */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="bg-dark-800/50 rounded-lg px-3 py-1.5">
                            <span className="text-gray-500 text-xs">Requested: </span>
                            <span className="text-white font-medium">{freeze.requestedDays}{unit === 'min' ? 'm' : 'd'}</span>
                          </div>

                          {isCompleted && (
                            <div className="bg-dark-800/50 rounded-lg px-3 py-1.5">
                              <span className="text-gray-500 text-xs">Actual: </span>
                              <span className="text-neon-green font-medium">{freeze.actualDays}{unit === 'min' ? 'm' : 'd'}</span>
                            </div>
                          )}

                          {wastedDays > 0 && (
                            <div className="bg-red-500/10 rounded-lg px-3 py-1.5">
                              <span className="text-red-400 text-xs font-semibold">Wasted: {wastedDays}{unit === 'min' ? 'm' : 'd'}</span>
                            </div>
                          )}

                          {isCancelled && (
                            <div className="bg-red-500/10 rounded-lg px-3 py-1.5">
                              <span className="text-red-400 text-xs font-semibold">All {freeze.requestedDays}{unit === 'min' ? 'm' : 'd'} wasted</span>
                            </div>
                          )}
                        </div>

                        {/* Reason */}
                        {freeze.reason && (
                          <p className="text-gray-500 text-xs mt-2">
                            Reason: <span className="text-gray-300">{freeze.reason}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
