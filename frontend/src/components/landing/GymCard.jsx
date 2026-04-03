import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, ChevronRight } from 'lucide-react';

export default function GymCard({ gym, index }) {
  const amenities = Array.isArray(gym.amenities) ? gym.amenities : [];
  const planCount = gym.gymPlans?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Link
        to={`/gym/${gym.slug}`}
        className="flex flex-col bg-white rounded-2xl border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-250 group overflow-hidden"
      >
        {/* Colored top strip */}
        <div className="h-1.5 w-full bg-green-500" />

        <div className="p-5 flex flex-col flex-1">
          {/* Name + rating */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base text-gray-900 group-hover:text-green-700 transition-colors leading-snug">
              {gym.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-gray-700">{gym.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Location + hours */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <MapPin size={11} className="flex-shrink-0 text-green-500" />
            <span>{gym.area}, {gym.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <Clock size={11} className="flex-shrink-0" />
            <span>{gym.hours}</span>
          </div>


          {/* Amenities tags */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {amenities.slice(0, 3).map(a => (
                <span key={a} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100">
                  {a}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="text-xs text-gray-400 py-0.5 px-1">+{amenities.length - 3} more</span>
              )}
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {planCount === 0 ? 'No plans yet' : `${planCount} plans available`}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 group-hover:gap-2 transition-all">
              View <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
