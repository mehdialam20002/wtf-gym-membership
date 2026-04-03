import { motion } from 'framer-motion';
import { Edit2, Trash2, Building2, ListChecks, ToggleLeft, ToggleRight } from 'lucide-react';

function formatINR(v) {
  return v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—';
}

export default function PlansTable({ plans, loading, onEdit, onDelete, onToggleVisibility, onAssignGyms, onManageBenefits }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
              <div className="h-4 bg-gray-100 rounded w-32" />
              <div className="h-4 bg-gray-100 rounded w-20" />
              <div className="h-4 bg-gray-100 rounded w-16" />
              <div className="h-4 bg-gray-100 rounded w-12 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <p className="text-gray-400 text-sm">No plans found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mapped</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.map((plan, i) => {
              const gymCount = plan._count?.gymPlans ?? 0;
              const category = plan.category || null;
              const categoryStyle = category === 'WTF Starter'
                ? 'bg-blue-50 text-blue-700 ring-blue-200'
                : category === 'WTF Plus'
                ? 'bg-purple-50 text-purple-700 ring-purple-200'
                : category === 'WTF Ultra'
                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                : 'bg-gray-100 text-gray-500 ring-gray-200';
              return (
                <motion.tr
                  key={plan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Plan name + duration */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-4">
                    {category ? (
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${categoryStyle}`}>
                        {category}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{formatINR(plan.discountedPrice ?? plan.price)}</p>
                    {plan.discountedPrice && (
                      <p className="text-xs text-gray-400 line-through">{formatINR(plan.price)}</p>
                    )}
                  </td>

                  {/* Active toggle */}
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => onToggleVisibility(plan)} title={plan.isVisible ? 'Click to hide' : 'Click to show'} className="inline-flex items-center justify-center transition-colors">
                      {plan.isVisible
                        ? <ToggleRight size={28} className="text-green-500" />
                        : <ToggleLeft size={28} className="text-gray-300" />
                      }
                    </button>
                  </td>

                  {/* Mapped gyms */}
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${gymCount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      <Building2 size={11} />
                      {gymCount} gym{gymCount !== 1 ? 's' : ''}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(plan)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => onAssignGyms(plan)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all border border-transparent hover:border-green-100">
                        <Building2 size={13} /> Gyms
                      </button>
                      <button onClick={() => onManageBenefits(plan)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all border border-transparent hover:border-purple-100">
                        <ListChecks size={13} /> Benefits
                      </button>
                      <button onClick={() => onDelete(plan)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
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
