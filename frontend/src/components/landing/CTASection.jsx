import { motion } from 'framer-motion';
import { Phone, MapPin, Clock } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="join" className="py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-green-400 text-xs font-semibold tracking-widest uppercase mb-4 block">Start Today</span>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-4 leading-tight">
            Your Transformation<br />Starts Right Now.
          </h2>
          <p className="text-gray-400 text-base mb-10 max-w-xl mx-auto">
            Join 50,000+ members evolving across Delhi NCR. First class is on us — no commitment, no risk.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <motion.a href="#gyms" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-xl text-sm tracking-widest uppercase transition-colors">
              Find Your Gym
            </motion.a>
            <motion.a href="tel:+911234567890" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="border border-white/20 text-white font-bold px-10 py-4 rounded-xl text-sm tracking-widest uppercase hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <Phone size={16} /> Call Us
            </motion.a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-green-500" />
              <span>40+ locations across Delhi NCR</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-green-500" />
              <span>Open 5:00 AM – 11:00 PM daily</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-green-500" />
              <span>+91 90906 39005</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
