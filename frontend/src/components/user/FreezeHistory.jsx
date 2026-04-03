import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const statusColors = {
  SCHEDULED: 'text-yellow-400 bg-yellow-500/10',
  ACTIVE: 'text-blue-400 bg-blue-500/10',
  COMPLETED: 'text-green-400 bg-green-500/10',
  AUTO_COMPLETED: 'text-neon-green bg-neon-green/10',
  CANCELLED: 'text-gray-400 bg-gray-500/10',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function FreezeHistory({ isOpen, membershipId, onClose }) {
  const [freezes, setFreezes] = useState([]);
  const [loading, setLoading] = useState(false);

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
            className="relative bg-dark-800 border border-dark-500 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto scrollbar-hide"
          >
            <div className="flex items-center justify-between mb-6">
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
              <div className="space-y-4">
                {freezes.map((freeze, index) => (
                  <div
                    key={freeze.id}
                    className="bg-dark-700 rounded-xl p-4 border border-dark-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-xs">#{freezes.length - index}</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[freeze.status]}`}>
                        {freeze.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Start</p>
                        <p className="text-white">{formatDate(freeze.freezeStartDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">End</p>
                        <p className="text-white">{formatDate(freeze.freezeEndDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Requested Days</p>
                        <p className="text-white">{freeze.requestedDays}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Actual Days</p>
                        <p className="text-white">{freeze.actualDays || '-'}</p>
                      </div>
                    </div>

                    {freeze.reason && (
                      <p className="text-gray-500 text-xs mt-2">
                        Reason: <span className="text-gray-300">{freeze.reason}</span>
                      </p>
                    )}

                    <p className="text-gray-600 text-xs mt-2">
                      Created: {formatDate(freeze.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
