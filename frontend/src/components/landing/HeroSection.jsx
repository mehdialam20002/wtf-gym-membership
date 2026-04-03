import { motion } from 'framer-motion';
import { ArrowDown, MapPin, Star } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] } }),
};

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-16">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #374151 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Green accent top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-green-600" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12 pb-20">
        {/* Location pill */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-200 bg-green-50 mb-8">
          <MapPin size={12} className="text-green-600" />
          <span className="text-green-700 text-xs font-semibold tracking-widest uppercase">40+ Gyms Across Delhi NCR</span>
        </motion.div>

        {/* Main headline */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1} className="mb-4">
          <h1 className="font-display font-black leading-none tracking-tight">
            <span className="block text-5xl sm:text-7xl lg:text-9xl text-gray-900">STOP</span>
            <span className="block text-5xl sm:text-7xl lg:text-9xl text-gray-900">WASTING</span>
            <span className="block text-5xl sm:text-7xl lg:text-9xl text-green-600">TIME.</span>
          </h1>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.3} className="mb-10">
          <h2 className="font-display font-black text-3xl sm:text-5xl lg:text-7xl text-gray-900 leading-none tracking-tight">
            START <span className="text-green-600">EVOLVING.</span>
          </h2>
        </motion.div>

        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={0.45}
          className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Science-backed training. Elite equipment. Expert coaches across every location in Delhi NCR.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.55}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <motion.a href="#gyms" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="bg-gray-900 text-white text-sm font-bold tracking-widest uppercase px-10 py-4 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center hover:bg-gray-800 transition-colors">
            Find Your Gym
          </motion.a>
          <motion.a href="#plans" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="border border-gray-300 text-gray-700 text-sm font-bold tracking-widest uppercase px-10 py-4 rounded-xl w-full sm:w-auto text-center hover:border-gray-400 hover:bg-gray-50 transition-all">
            View Plans
          </motion.a>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.65}
          className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-16">
          {[
            { val: '40+', label: 'Locations' },
            { val: '50,000+', label: 'Members' },
            { val: '500+', label: 'Expert Trainers' },
            { val: '5.0', label: 'Avg Rating', icon: Star },
          ].map(({ val, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {Icon && <Icon size={14} className="text-yellow-500 fill-yellow-500" />}
                <span className="font-display font-black text-2xl sm:text-3xl text-gray-900">{val}</span>
              </div>
              <span className="text-gray-400 text-xs tracking-wider uppercase">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.a href="#gyms"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0], y: [0, 8, 0] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          className="inline-flex flex-col items-center gap-1.5 text-gray-400 hover:text-green-600 transition-colors">
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <ArrowDown size={14} />
        </motion.a>
      </div>
    </section>
  );
}
