import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const FEATURES = [
  'Access to gym floor',
  'Locker room access',
  'Basic equipment',
  'Group classes',
  'Personal trainer sessions',
  'Sauna access',
  'Nutrition guidance',
  'Guest passes',
  'Priority booking',
  'Body composition scan',
  'Supplement discount',
  'Dedicated coach',
];

const TIERS = {
  Base: [true, true, true, true, false, false, false, false, false, false, false, false],
  Plus: [true, true, true, true, true, true, true, false, true, false, false, false],
  Ultra: [true, true, true, true, true, true, true, true, true, true, true, true],
};

const BENEFITS_CARDS = [
  { icon: '🏋️', title: 'Premium Equipment', desc: 'State-of-the-art machines and free weights for all fitness levels.' },
  { icon: '👨‍💼', title: 'Expert Coaches', desc: 'Certified personal trainers to guide every step of your journey.' },
  { icon: '🥗', title: 'Nutrition Plans', desc: 'Customized diet plans tailored to your body and fitness goals.' },
  { icon: '🧘', title: 'Group Classes', desc: 'High-energy group sessions — yoga, HIIT, cycling, and more.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Body composition scans and monthly assessments to measure gains.' },
  { icon: '🛡️', title: 'Clean & Safe', desc: 'Professional sanitation, 24/7 security, and AC-cooled spaces.' },
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="relative py-24">
      <div className="absolute inset-0 bg-dark-900 bg-mesh" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-neon-green text-sm font-semibold tracking-widest uppercase mb-3 block">
            Why Choose APEX
          </span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Everything You Need to <span className="text-gradient">Succeed</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            World-class facilities combined with expert guidance to help you achieve your fitness goals faster.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {BENEFITS_CARDS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card border border-white/10 p-6 group hover:border-neon-green/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center text-2xl mb-4 group-hover:bg-neon-green/20 transition-colors">
                {item.icon}
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card border border-neon-green/20 overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <h3 className="font-display font-bold text-2xl text-white text-center">
              Plan Comparison
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm w-1/2">Feature</th>
                  {Object.keys(TIERS).map(tier => (
                    <th key={tier} className="text-center px-6 py-4 font-bold text-sm">
                      <span className={
                        tier === 'Base' ? 'text-gray-400' :
                        tier === 'Plus' ? 'text-blue-400' :
                        'text-purple-400'
                      }>
                        {tier}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => (
                  <motion.tr
                    key={feature}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-gray-300 text-sm">{feature}</td>
                    {Object.values(TIERS).map((checks, ti) => (
                      <td key={ti} className="px-6 py-3.5 text-center">
                        {checks[i] ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-neon-green/20 rounded-full">
                            <Check size={13} className="text-neon-green" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-white/5 rounded-full">
                            <X size={13} className="text-gray-600" />
                          </span>
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
