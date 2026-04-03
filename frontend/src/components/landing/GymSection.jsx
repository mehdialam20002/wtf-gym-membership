import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import GymCard from './GymCard';
import { useGyms } from '../../hooks/useGyms';

const CITIES = ['All', 'Noida', 'New Delhi', 'Gurugram', 'Ghaziabad', 'Faridabad', 'Greater Noida'];

export default function GymSection() {
  const { gyms, loading } = useGyms(false);
  const [activeCity, setActiveCity] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = gyms.filter(g => {
    const matchCity = activeCity === 'All' || g.city === activeCity;
    const matchSearch = !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.area.toLowerCase().includes(search.toLowerCase()) ||
      g.city.toLowerCase().includes(search.toLowerCase());
    return matchCity && matchSearch;
  });

  return (
    <section id="gyms" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-green-600 text-xs font-semibold tracking-widest uppercase mb-1">Our Locations</p>
          <h2 className="font-display font-black text-3xl text-gray-900">Find a Gym Near You</h2>
        </div>

        {/* Search + filters in one row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search area or city..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition-all"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CITIES.map(city => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeCity === city
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-52" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No gyms found. Try a different search or city.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((gym, i) => <GymCard key={gym.id} gym={gym} index={i} />)}
          </div>
        )}

        {/* Count */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-gray-400 text-xs mt-6">
            Showing {filtered.length} gym{filtered.length !== 1 ? 's' : ''}
            {activeCity !== 'All' ? ` in ${activeCity}` : ' across Delhi NCR'}
          </p>
        )}
      </div>
    </section>
  );
}
