import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { formatDuration, durationColor } from '../../utils/duration';

function formatINR(v) {
  return `₹${Number(v).toLocaleString('en-IN')}`;
}

export default function PlanCard({ plan, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-250"
    >
      {/* Top accent */}
      <div className="h-1 w-full bg-gray-900" />

      <div className="p-6 flex flex-col flex-1">
        {/* Duration badge */}
        <div className="mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${durationColor(plan.durationDays)}`}>
            {formatDuration(plan.durationDays)}
            <span className="ml-1 opacity-60">· {plan.durationDays}d</span>
          </span>
        </div>

        {/* Plan name */}
        <h3 className="font-bold text-xl text-gray-900 mb-4">{plan.name}</h3>

        {/* Price */}
        <div className="mb-5">
          {plan.discountedPrice ? (
            <div className="flex items-baseline gap-2">
              <span className="font-black text-3xl text-gray-900">
                {formatINR(plan.discountedPrice)}
              </span>
              <div>
                <span className="text-gray-400 line-through text-sm">{formatINR(plan.price)}</span>
                <p className="text-green-600 text-xs font-semibold">
                  Save {formatINR(plan.price - plan.discountedPrice)}
                </p>
              </div>
            </div>
          ) : (
            <span className="font-black text-3xl text-gray-900">
              {formatINR(plan.price)}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-4" />

        {/* Benefits */}
        <ul className="space-y-2.5 flex-1 mb-5">
          {(Array.isArray(plan.benefits) ? plan.benefits : []).map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
              <Check size={14} className="flex-shrink-0 mt-0.5 text-gray-900" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <motion.a
          href="#join"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all border border-gray-200 text-gray-900 hover:bg-gray-50"
        >
          Choose Plan <ArrowRight size={14} />
        </motion.a>
      </div>
    </motion.div>
  );
}
