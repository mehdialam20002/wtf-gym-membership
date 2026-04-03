import { motion } from 'framer-motion';

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

function daysLeft(endDate) {
  const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function MembershipCard({ membership, isPast, onFreeze, onUnfreeze, onCancelFreeze, onViewHistory }) {
  const { plan, gym, freezes = [] } = membership;
  const scheduledFreezes = freezes.filter(f => f.status === 'SCHEDULED');
  const activeFreeze = freezes.find(f => f.status === 'ACTIVE');

  const remainingFreezeCount = plan.maxFreezeCount - membership.totalFreezeCountUsed;
  const remainingFreezeDays = plan.maxFreezeDays - membership.totalFreezeDaysUsed;

  const canFreeze = membership.status === 'ACTIVE' && remainingFreezeCount > 0 && remainingFreezeDays > 0;

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
          <p className="text-gray-500 text-xs mt-1">{plan.durationDays} days plan</p>
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
            <p className="text-gray-500 text-xs">Days Left</p>
            <p className="text-neon-green text-sm font-bold">{daysLeft(membership.endDate)} days</p>
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
                {activeFreeze.requestedDays} days requested
              </p>
              {activeFreeze.reason && (
                <p className="text-gray-500 text-xs mt-1">Reason: {activeFreeze.reason}</p>
              )}
            </div>
            {onUnfreeze && (
              <button
                onClick={onUnfreeze}
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
                {formatDate(freeze.freezeStartDate)} to {formatDate(freeze.freezeEndDate)} ({freeze.requestedDays} days)
              </p>
              {onCancelFreeze && (
                <button
                  onClick={() => onCancelFreeze(freeze.id)}
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
              <p className="text-gray-500 text-xs">Freeze Days Left</p>
              <p className="text-white text-sm font-medium">
                {remainingFreezeDays} / {plan.maxFreezeDays}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Days Used</p>
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
    </motion.div>
  );
}
