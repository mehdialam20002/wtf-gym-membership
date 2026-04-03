import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTestMode from '../../hooks/useTestMode';

function formatDateInput(date) {
  return date.toISOString().split('T')[0];
}

export default function FreezeModal({ isOpen, membership, onClose, onSubmit }) {
  const [startDate, setStartDate] = useState('');
  const [freezeDays, setFreezeDays] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { testMode, unit, unitFull } = useTestMode();

  useEffect(() => {
    if (isOpen) {
      setStartDate(formatDateInput(new Date()));
      setFreezeDays(1);
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !membership) return null;

  const maxDaysRemaining = membership.plan.maxFreezeDays - membership.totalFreezeDaysUsed;
  const today = formatDateInput(new Date());

  // Calculate freeze end date for preview
  const msPerUnit = testMode ? 60 * 1000 : 24 * 60 * 60 * 1000;
  const freezeEndDate = startDate
    ? formatDateInput(new Date(new Date(startDate).getTime() + freezeDays * msPerUnit))
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (freezeDays > maxDaysRemaining) {
      setError(`Maximum ${maxDaysRemaining} freeze ${unitFull} remaining`);
      return;
    }

    if (freezeDays < 1) {
      setError(`Minimum 1 ${testMode ? 'minute' : 'day'} freeze required`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(membership.id, { startDate, freezeDays: parseInt(freezeDays), reason });
    } catch (err) {
      setError(err.message || 'Failed to freeze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-dark-800 border border-dark-500 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <h3 className="text-xl font-display font-bold text-white mb-1">Freeze Membership</h3>
            <p className="text-gray-400 text-sm mb-6">
              {membership.plan.name} at {membership.gym.name}
            </p>

            {/* Quota Info */}
            <div className="bg-dark-700 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Freezes Remaining</p>
                <p className="text-neon-green font-bold">
                  {membership.plan.maxFreezeCount - membership.totalFreezeCountUsed} of {membership.plan.maxFreezeCount}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">{testMode ? 'Minutes' : 'Days'} Remaining</p>
                <p className="text-neon-green font-bold">{maxDaysRemaining} of {membership.plan.maxFreezeDays}</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-4">
                <p className="font-bold text-sm mb-1">Freeze Not Allowed</p>
                <p className="text-xs">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  {startDate === today ? 'Freeze will start immediately' : 'Freeze will be scheduled'}
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Number of {testMode ? 'Minutes' : 'Days'} <span className="text-gray-500">(max {maxDaysRemaining})</span>
                </label>
                <input
                  type="number"
                  value={freezeDays}
                  onChange={e => {
                    const val = e.target.value;
                    setFreezeDays(val);
                    if (val > maxDaysRemaining) {
                      setError(`You only have ${maxDaysRemaining} freeze ${unitFull} remaining out of ${membership.plan.maxFreezeDays}. You cannot schedule more than ${maxDaysRemaining} ${unitFull}.`);
                    } else if (val < 1 && val !== '') {
                      setError(`Minimum 1 ${testMode ? 'minute' : 'day'} freeze required`);
                    } else {
                      setError('');
                    }
                  }}
                  className={`w-full bg-dark-700 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
                    freezeDays > maxDaysRemaining ? 'border-red-500 focus:border-red-500' : 'border-dark-500 focus:border-neon-green'
                  }`}
                  required
                />
                {/* Slider */}
                <input
                  type="range"
                  value={Math.min(freezeDays, maxDaysRemaining)}
                  min={1}
                  max={maxDaysRemaining}
                  onChange={e => { setFreezeDays(e.target.value); setError(''); }}
                  className="w-full mt-2 accent-[#39FF14]"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                  placeholder="e.g. Travelling, Injury, etc."
                />
              </div>

              {/* Preview */}
              <div className="bg-dark-700/50 border border-dark-500 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-2">Freeze Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">From:</span>
                  <span className="text-white">{startDate || '-'}</span>
                  <span className="text-gray-500">To:</span>
                  <span className="text-white">{freezeEndDate || '-'}</span>
                  <span className="text-gray-500">Duration:</span>
                  <span className="text-white">{freezeDays} {unitFull}</span>
                  <span className="text-gray-500">Type:</span>
                  <span className={startDate === today ? 'text-neon-green' : 'text-yellow-400'}>
                    {startDate === today ? 'Immediate' : 'Scheduled'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-dark-500 text-gray-400 py-3 rounded-lg hover:text-white hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || freezeDays > maxDaysRemaining || freezeDays < 1}
                  className="flex-1 bg-neon-green text-dark-900 font-bold py-3 rounded-lg hover:shadow-neon-green transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Freeze'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
