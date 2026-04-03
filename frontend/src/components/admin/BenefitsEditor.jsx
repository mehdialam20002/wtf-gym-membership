import { useState } from 'react';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BenefitsEditor({ plan, onSave, onCancel }) {
  const [benefits, setBenefits] = useState(
    Array.isArray(plan.benefits) ? [...plan.benefits] : []
  );
  const [newBenefit, setNewBenefit] = useState('');
  const [loading, setLoading] = useState(false);

  const add = () => {
    const trimmed = newBenefit.trim();
    if (!trimmed) return;
    setBenefits(prev => [...prev, trimmed]);
    setNewBenefit('');
  };

  const remove = (i) => setBenefits(prev => prev.filter((_, idx) => idx !== i));

  const edit = (i, val) => setBenefits(prev => prev.map((b, idx) => idx === i ? val : b));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(plan.id, benefits.filter(b => b.trim()));
      toast.success('Benefits updated');
    } catch {
      toast.error('Failed to update benefits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Plan header */}
      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
        <p className="font-semibold text-gray-900 text-sm">{plan.name}</p>
        <p className="text-gray-500 text-xs capitalize">{plan.category} · {plan.tier}</p>
      </div>

      {/* Current benefits list */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Benefits ({benefits.length})
        </p>
        {benefits.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No benefits yet. Add some below.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                <input
                  value={b}
                  onChange={e => edit(i, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-gray-800"
                />
                <button
                  onClick={() => remove(i)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new benefit */}
      <div className="flex gap-2">
        <input
          value={newBenefit}
          onChange={e => setNewBenefit(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a benefit (press Enter)"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-gray-800 placeholder-gray-400"
        />
        <button
          onClick={add}
          disabled={!newBenefit.trim()}
          className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Save */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Save size={14} />}
          Save Benefits
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
