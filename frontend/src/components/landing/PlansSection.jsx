import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import PlanCard from './PlanCard';
import { usePlans } from '../../hooks/usePlans';

export default function PlansSection() {
  const { plans, loading, error } = usePlans(false, null);

  // Show first 3 visible plans as a sample overview
  const samplePlans = plans.slice(0, 3);

  return (
    <section id="plans" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-4 text-center">
          <span className="text-green-600 text-xs font-semibold tracking-widest uppercase mb-2 block">Membership Plans</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-gray-900 mb-3">Choose Your Level</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            General plan overview. Select a gym to see all plans and exact pricing at that location.
          </p>
        </motion.div>

        {/* Nudge */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="flex justify-center mb-10">
          <a href="#gyms"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition-all">
            <MapPin size={12} />
            Pick a gym for location-specific plans & pricing
          </a>
        </motion.div>

        {/* Plans */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-6 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-100 rounded w-1/3 mb-5" />
                <div className="space-y-2">
                  {[1,2,3,4].map(j => <div key={j} className="h-3 bg-gray-100 rounded w-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-red-500 text-sm">{error}</p>
        ) : samplePlans.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No plans available. Select a gym to view plans.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {samplePlans.map((plan, i) => <PlanCard key={plan.id} plan={plan} index={i} />)}
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-8">
          * Plans and pricing vary by location. Click a gym to see all plans available there.
        </p>
      </div>
    </section>
  );
}
