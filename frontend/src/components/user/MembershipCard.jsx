import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTestMode from '../../hooks/useTestMode';

const statusColors = {
  ACTIVE: 'bg-neon-green/20 text-neon-green border-neon-green/30',
  FROZEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EXPIRED: 'bg-red-500/20 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const statusIcons = {
  ACTIVE: '🟢',
  FROZEN: '🔵',
  EXPIRED: '🔴',
  CANCELLED: '⚫',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysLeft(endDate, testMode, freezeStartDate) {
  // During freeze, show stable remaining time (as of when freeze started)
  const ref = freezeStartDate ? new Date(freezeStartDate) : new Date();
  const diffMs = new Date(endDate) - ref;
  if (testMode) {
    return Math.max(0, Math.ceil(diffMs / (1000 * 60))); // minutes
  }
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))); // days
}

export default function MembershipCard({ membership, isPast, onFreeze, onUnfreeze, onCancelFreeze, onViewHistory }) {
  const { testMode, unit, unitFull } = useTestMode();
  const { plan, gym, freezes = [] } = membership;
  const scheduledFreezes = freezes.filter(f => f.status === 'SCHEDULED');
  const activeFreeze = freezes.find(f => f.status === 'ACTIVE');
  const [showUnfreezeConfirm, setShowUnfreezeConfirm] = useState(false);
  const [cancelFreezeTarget, setCancelFreezeTarget] = useState(null);

  const remainingFreezeCount = plan.maxFreezeCount - membership.totalFreezeCountUsed;
  const remainingFreezeDays = plan.maxFreezeDays - membership.totalFreezeDaysUsed;

  const canFreeze = membership.status === 'ACTIVE' && remainingFreezeCount > 0 && remainingFreezeDays > 0;

  // Calculate wasted days for active freeze
  const getUnfreezeInfo = () => {
    if (!activeFreeze) return { elapsedDays: 0, wastedDays: 0 };
    const diffMs = new Date() - new Date(activeFreeze.freezeStartDate);
    const elapsed = testMode
      ? Math.ceil(diffMs / (1000 * 60))       // minutes
      : Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // days
    const wasted = activeFreeze.requestedDays - elapsed;
    return { elapsedDays: elapsed, wastedDays: Math.max(0, wasted) };
  };

  const handleUnfreezeClick = () => {
    const { wastedDays } = getUnfreezeInfo();
    if (wastedDays > 0) {
      setShowUnfreezeConfirm(true);
    } else {
      onUnfreeze();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-dark-800 border rounded-2xl p-6 ${isPast ? 'border-dark-600 opacity-70' : 'border-dark-500'}`}
    >
      {/* Top: Plan + Gym + Status */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-display font-bold text-white">{plan.name}</h3>
          <p className="text-gray-400 text-sm">{gym.name} &middot; {gym.area}, {gym.city}</p>
          <p className="text-gray-500 text-xs mt-1">{plan.durationDays} {unitFull} plan</p>
        </div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColors[membership.status]}`}>
          {statusIcons[membership.status]} {membership.status}
        </span>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-gray-500 text-xs">Start Date</p>
          <p className="text-white text-sm font-medium">{formatDate(membership.startDate)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">End Date</p>
          <p className="text-white text-sm font-medium">{formatDate(membership.endDate)}</p>
        </div>
        {!isPast && (
          <div>
            <p className="text-gray-500 text-xs">{testMode ? 'Minutes' : 'Days'} Left</p>
            <p className="text-neon-green text-sm font-bold">{daysLeft(membership.endDate, testMode, activeFreeze?.freezeStartDate)} {unit}</p>
          </div>
        )}
        {membership.endDate !== membership.originalEndDate && (
          <div>
            <p className="text-gray-500 text-xs">Original Expiry</p>
            <p className="text-yellow-400 text-sm">{formatDate(membership.originalEndDate)}</p>
          </div>
        )}
      </div>

      {/* Active Freeze Info */}
      {activeFreeze && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 font-semibold text-sm">Membership Frozen</p>
              <p className="text-gray-400 text-xs mt-1">
                Since {formatDate(activeFreeze.freezeStartDate)} &middot;
                Ends {formatDate(activeFreeze.freezeEndDate)} &middot;
                {activeFreeze.requestedDays} {unitFull} requested
              </p>
              {activeFreeze.reason && (
                <p className="text-gray-500 text-xs mt-1">Reason: {activeFreeze.reason}</p>
              )}
            </div>
            {onUnfreeze && (
              <button
                onClick={handleUnfreezeClick}
                className="bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Unfreeze Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scheduled Freezes */}
      {scheduledFreezes.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
          <p className="text-yellow-400 font-semibold text-sm mb-2">Upcoming Freezes</p>
          {scheduledFreezes.map(freeze => (
            <div key={freeze.id} className="flex items-center justify-between py-1">
              <p className="text-gray-300 text-xs">
                {formatDate(freeze.freezeStartDate)} to {formatDate(freeze.freezeEndDate)} ({freeze.requestedDays} {unit})
              </p>
              {onCancelFreeze && (
                <button
                  onClick={() => setCancelFreezeTarget(freeze)}
                  className="text-red-400 text-xs hover:text-red-300 underline"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Freeze Quota + Actions */}
      {!isPast && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dark-600">
          <div className="flex gap-6">
            <div>
              <p className="text-gray-500 text-xs">Freezes Left</p>
              <p className="text-white text-sm font-medium">
                {remainingFreezeCount} / {plan.maxFreezeCount}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Freeze {testMode ? 'Min' : 'Days'} Left</p>
              <p className="text-white text-sm font-medium">
                {remainingFreezeDays} / {plan.maxFreezeDays}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{testMode ? 'Min' : 'Days'} Used</p>
              <p className="text-white text-sm font-medium">{membership.totalFreezeDaysUsed}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {canFreeze && onFreeze && (
              <button
                onClick={onFreeze}
                className="bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm font-bold px-5 py-2 rounded-lg hover:bg-neon-green/20 transition-colors"
              >
                Freeze Membership
              </button>
            )}
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="border border-dark-500 text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-white hover:border-gray-400 transition-colors"
              >
                Freeze History
              </button>
            )}
          </div>
        </div>
      )}

      {isPast && onViewHistory && (
        <div className="pt-4 border-t border-dark-600">
          <button
            onClick={onViewHistory}
            className="border border-dark-500 text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-white hover:border-gray-400 transition-colors"
          >
            Freeze History
          </button>
        </div>
      )}
      {/* Cancel Scheduled Freeze Confirmation Popup */}
      {cancelFreezeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            onClick={() => setCancelFreezeTarget(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative bg-dark-800 border border-dark-500 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-display font-bold text-white mb-3">Cancel Scheduled Freeze?</h3>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
              <p className="text-yellow-400 text-sm font-semibold mb-3">Freeze Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Scheduled From</span>
                  <span className="text-white font-medium">{formatDate(cancelFreezeTarget.freezeStartDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Scheduled To</span>
                  <span className="text-white font-medium">{formatDate(cancelFreezeTarget.freezeEndDate)}</span>
                </div>
                <div className="flex justify-between border-t border-dark-500 pt-2 mt-2">
                  <span className="text-gray-400">Total Duration</span>
                  <span className="text-white font-bold">{cancelFreezeTarget.requestedDays} {unitFull}</span>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm">
                Cancelling this freeze means your <span className="font-bold text-red-300">{cancelFreezeTarget.requestedDays} {unitFull}</span> of scheduled freeze will be removed. Your membership will not be extended for these {unitFull}.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelFreezeTarget(null)}
                className="flex-1 border border-dark-500 text-gray-400 py-3 rounded-lg hover:text-white hover:border-gray-400 transition-colors text-sm"
              >
                Keep Freeze
              </button>
              <button
                onClick={() => {
                  const freezeId = cancelFreezeTarget.id;
                  setCancelFreezeTarget(null);
                  onCancelFreeze(freezeId);
                }}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Cancel Freeze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unfreeze Confirmation Popup */}
      {showUnfreezeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            onClick={() => setShowUnfreezeConfirm(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative bg-dark-800 border border-dark-500 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-display font-bold text-white mb-3">Unfreeze Early?</h3>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm font-semibold mb-2">Warning: Freeze {unitFull} will be wasted!</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total freeze requested</span>
                  <span className="text-white font-medium">{activeFreeze?.requestedDays} {unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{testMode ? 'Min' : 'Days'} used</span>
                  <span className="text-neon-green font-medium">{getUnfreezeInfo().elapsedDays} {unit}</span>
                </div>
                <div className="flex justify-between border-t border-dark-500 pt-1 mt-1">
                  <span className="text-red-400 font-semibold">{testMode ? 'Min' : 'Days'} wasted</span>
                  <span className="text-red-400 font-bold">{getUnfreezeInfo().wastedDays} {unit}</span>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-xs mb-4">
              Your membership will only extend by {getUnfreezeInfo().elapsedDays} {unitFull} instead of {activeFreeze?.requestedDays} {unitFull}. The remaining {getUnfreezeInfo().wastedDays} {unitFull} will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUnfreezeConfirm(false)}
                className="flex-1 border border-dark-500 text-gray-400 py-3 rounded-lg hover:text-white hover:border-gray-400 transition-colors text-sm"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowUnfreezeConfirm(false);
                  onUnfreeze();
                }}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Unfreeze Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
