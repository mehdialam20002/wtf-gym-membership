import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES = ['Noida', 'New Delhi', 'Gurugram', 'Ghaziabad', 'Faridabad', 'Greater Noida'];
const COMMON_AMENITIES = ['Parking', 'Showers', 'Lockers', 'Changing Rooms', 'CCTV', 'Sanitizers', 'Free WiFi', 'Sauna', 'Steam Room', 'AC', 'Cafeteria', 'Shoe Racks'];
const GYM_CATEGORIES = ['WTF Starter', 'WTF Plus', 'WTF Ultra'];

const INITIAL = {
  name: '', slug: '', area: '', city: 'Noida', address: '',
  phone: '', hours: '06:00 AM - 10:00 PM',
  rating: '5.0', totalSeats: '30', seatsLeft: '15',
  category: '', amenities: [], isActive: true,
};

export default function GymForm({ gym, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(INITIAL);
  const [customAmenity, setCustomAmenity] = useState('');

  useEffect(() => {
    if (gym) {
      setForm({
        ...INITIAL,
        ...gym,
        rating: String(gym.rating),
        totalSeats: String(gym.totalSeats),
        seatsLeft: String(gym.seatsLeft),
        category: gym.category || '',
        amenities: Array.isArray(gym.amenities) ? gym.amenities : [],
      });
    } else {
      setForm(INITIAL);
    }
  }, [gym]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleAmenity = (a) => {
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter(x => x !== a)
        : [...p.amenities, a],
    }));
  };

  const addCustom = () => {
    const a = customAmenity.trim();
    if (!a) return;
    if (!form.amenities.includes(a)) {
      setForm(p => ({ ...p, amenities: [...p.amenities, a] }));
    }
    setCustomAmenity('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.area || !form.address) {
      toast.error('Name, area, and address are required');
      return;
    }
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await onSubmit({ ...form, slug });
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Gym Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="WTF Sector 18, Noida" className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>URL Slug (auto-generated)</label>
          <input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="wtf-sector-18-noida" className={inputCls} />
        </div>
      </div>

      {/* Area + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Area *</label>
          <input value={form.area} onChange={e => set('area', e.target.value)} placeholder="Sector 18" className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>City *</label>
          <select value={form.city} onChange={e => set('city', e.target.value)} className={inputCls}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className={labelCls}>Full Address *</label>
        <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Plot A-22, Sector 18, Noida, UP 201301" className={inputCls} required />
      </div>

      {/* Phone + Hours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98100 12345" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Operating Hours</label>
          <input value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="06:00 AM - 10:00 PM" className={inputCls} />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Gym Category</label>
        <div className="flex flex-wrap gap-2">
          {GYM_CATEGORIES.map(cat => (
            <button
              key={cat} type="button" onClick={() => set('category', form.category === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                form.category === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {form.category && (
          <p className="text-xs text-gray-400 mt-1.5">
            Selected: <span className="font-semibold text-gray-600">{form.category}</span>
          </p>
        )}
      </div>

      {/* Rating + Seats */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Rating (0-5)</label>
          <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set('rating', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Total Seats</label>
          <input type="number" min="1" value={form.totalSeats} onChange={e => set('totalSeats', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Seats Left</label>
          <input type="number" min="0" value={form.seatsLeft} onChange={e => set('seatsLeft', e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div onClick={() => set('isActive', !form.isActive)}
          className={`w-11 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${form.isActive ? 'bg-green-500' : 'bg-gray-200'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${form.isActive ? 'left-6' : 'left-1'}`} />
        </div>
        <span className="text-sm text-gray-700">Active (visible on website)</span>
      </label>

      {/* Amenities */}
      <div>
        <label className={`${labelCls} uppercase tracking-wider`}>Amenities</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_AMENITIES.map(a => (
            <button
              key={a} type="button" onClick={() => toggleAmenity(a)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                form.amenities.includes(a)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={customAmenity}
            onChange={e => setCustomAmenity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            placeholder="Add custom amenity..."
            className={`${inputCls} flex-1`}
          />
          <button type="button" onClick={addCustom} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm transition-all flex items-center gap-1 border border-gray-200">
            <Plus size={14} /> Add
          </button>
        </div>
        {form.amenities.filter(a => !COMMON_AMENITIES.includes(a)).map(a => (
          <span key={a} className="inline-flex items-center gap-1.5 mt-2 mr-2 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg border border-blue-200">
            {a}
            <button type="button" onClick={() => toggleAmenity(a)}><Trash2 size={10} /></button>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <motion.button
          type="submit" disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          {gym ? 'Update Gym' : 'Add Gym'}
        </motion.button>
        <button type="button" onClick={onCancel} className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">Cancel</button>
      </div>
    </form>
  );
}
