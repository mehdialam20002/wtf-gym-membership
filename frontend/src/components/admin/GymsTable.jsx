import { motion } from 'framer-motion';
import { Edit2, Trash2, MapPin, Star, Users, Dumbbell, ToggleLeft, ToggleRight } from 'lucide-react';

export default function GymsTable({ gyms, loading, onEdit, onDelete, onManagePlans, onToggleActive }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
              <div className="h-4 bg-gray-100 rounded w-40" />
              <div className="h-4 bg-gray-100 rounded w-28" />
              <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gyms.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <p className="text-gray-400 text-sm">No gyms found. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gym</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Seats</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plans</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gyms.map((gym, i) => {
              const planCount = gym.gymPlans?.length ?? 0;
              return (
                <motion.tr
                  key={gym.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{gym.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-400">{gym.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {gym.category ? (
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                        {gym.category}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700 text-sm">{gym.area}</p>
                        <p className="text-gray-400 text-xs">{gym.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-gray-400" />
                      <span className="text-gray-700 text-sm">{gym.seatsLeft}/{gym.totalSeats}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => onManagePlans(gym)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-xs font-semibold border border-blue-100"
                    >
                      <Dumbbell size={12} />
                      {planCount} Plans
                    </button>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => onToggleActive(gym)} title={gym.isActive ? 'Deactivate' : 'Activate'}>
                      {gym.isActive
                        ? <ToggleRight size={28} className="text-green-500" />
                        : <ToggleLeft size={28} className="text-gray-300" />
                      }
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(gym)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => onDelete(gym)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
