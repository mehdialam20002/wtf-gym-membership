import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDuration } from '../../utils/duration';

const PLAN_CATEGORIES = ['WTF Starter', 'WTF Plus', 'WTF Ultra'];

const INITIAL = {
  name: '',
  category: '',
  durationDays: '',
  price: '',
  discountedPrice: '',
  isVisible: true,
  benefits: [''],
  maxFreezeCount: '',
  maxFreezeDays: '',
};

export default function PlanForm({ plan, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(INITIAL);

  useEffect(() => {
    if (plan) {
      setForm({
        ...INITIAL,
        name: plan.name || '',
        category: plan.category || '',
        durationDays: plan.durationDays != null ? String(plan.durationDays) : '',
        price: plan.price != null ? String(plan.price) : '',
        discountedPrice: plan.discountedPrice != null ? String(plan.discountedPrice) : '',
        isVisible: plan.isVisible ?? true,
        benefits: Array.isArray(plan.benefits) && plan.benefits.length > 0 ? plan.benefits : [''],
        maxFreezeCount: plan.maxFreezeCount != null ? String(plan.maxFreezeCount) : '',
        maxFreezeDays: plan.maxFreezeDays != null ? String(plan.maxFreezeDays) : '',
      });
    } else {
      setForm(INITIAL);
    }
  }, [plan]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const addBenefit    = () => setForm(p => ({ ...p, benefits: [...p.benefits, ''] }));
  const removeBenefit = (i) => setForm(p => ({ ...p, benefits: p.benefits.filter((_, idx) => idx !== i) }));
  const updateBenefit = (i, val) => setForm(p => ({ ...p, benefits: p.benefits.map((b, idx) => idx === i ? val : b) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanBenefits = form.benefits.filter(b => b.trim());
    if (!form.name.trim()) { toast.error('Plan name is required'); return; }
    if (!form.category) { toast.error('Select a plan category'); return; }
    if (!form.durationDays || Number(form.durationDays) < 1) { toast.error('Duration must be at least 1 day'); return; }
    if (!form.price) { toast.error('Price is required'); return; }
    if (cleanBenefits.length === 0) { toast.error('Add at least one benefit'); return; }

    await onSubmit({
      name: form.name.trim(),
      category: form.category,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : null,
      isVisible: form.isVisible,
      benefits: cleanBenefits,
      maxFreezeCount: form.maxFreezeCount ? Number(form.maxFreezeCount) : 0,
      maxFreezeDays: form.maxFreezeDays ? Number(form.maxFreezeDays) : 0,
    });
  };

  const inp = "w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all";
  const lbl = "block text-xs font-semibold text-gray-600 mb-1.5";

  const durationLabel = form.durationDays ? formatDuration(Number(form.durationDays)) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name + Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Plan Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. WTF Plus Monthly" className={inp} required />
        </div>
        <div>
          <label className={lbl}>Duration (Days) *</label>
          <div className="relative">
            <input
              type="number"
              value={form.durationDays}
              onChange={e => set('durationDays', e.target.value)}
              placeholder="e.g. 30, 90, 180, 365"
              className={inp}
              min="1"
              required
            />
            {durationLabel && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full pointer-events-none">
                = {durationLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className={lbl}>Plan Category *</label>
        <div className="flex gap-2">
          {PLAN_CATEGORIES.map(cat => (
            <button
              key={cat} type="button"
              onClick={() => set('category', form.category === cat ? '' : cat)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                form.category === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Website Price (₹) *</label>
          <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="1999" className={inp} required min="0" />
        </div>
        <div>
          <label className={lbl}>Discounted Price (₹)</label>
          <input type="number" value={form.discountedPrice} onChange={e => set('discountedPrice', e.target.value)} placeholder="Optional" className={inp} min="0" />
        </div>
      </div>

      {/* Freeze Policy */}
      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <label className="block text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wider">Freeze Policy</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Max Freeze Count</label>
            <input
              type="number"
              value={form.maxFreezeCount}
              onChange={e => set('maxFreezeCount', e.target.value)}
              placeholder="e.g. 2"
              className={inp}
              min="0"
            />
            <p className="text-gray-400 text-xs mt-1">How many times user can freeze</p>
          </div>
          <div>
            <label className={lbl}>Max Freeze Days</label>
            <input
              type="number"
              value={form.maxFreezeDays}
              onChange={e => set('maxFreezeDays', e.target.value)}
              placeholder="e.g. 15"
              className={inp}
              min="0"
            />
            <p className="text-gray-400 text-xs mt-1">Total freeze days allowed</p>
          </div>
        </div>
      </div>

      {/* Visible toggle */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <div onClick={() => set('isVisible', !form.isVisible)} className={`w-10 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${form.isVisible ? 'bg-green-500' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${form.isVisible ? 'left-5' : 'left-1'}`} />
          </div>
          <span className="text-sm text-gray-700 font-medium">Visible on website</span>
        </label>
      </div>

      {/* Benefits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Benefits *</label>
          <button type="button" onClick={addBenefit} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
            <Plus size={14} /> Add benefit
          </button>
        </div>
        <div className="space-y-2">
          {form.benefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
              <input value={b} onChange={e => updateBenefit(i, e.target.value)} placeholder={`Benefit ${i + 1}`} className={`${inp} flex-1`} />
              {form.benefits.length > 1 && (
                <button type="button" onClick={() => removeBenefit(i)} className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 size={15} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.99 }}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          {plan ? 'Update Plan' : 'Create Plan'}
        </motion.button>
        <button type="button" onClick={onCancel} className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancel</button>
      </div>
    </form>
  );
}
