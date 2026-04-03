import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', theme = 'dark' }) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const isLight = theme === 'light';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
              isLight
                ? 'bg-white border border-gray-200'
                : 'glass-card border border-neon-green/20'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-5 border-b ${isLight ? 'border-gray-100' : 'border-white/10'}`}>
              <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white font-display'}`}>{title}</h2>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
