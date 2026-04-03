export default function Badge({ children, variant = 'default' }) {
  const variants = {
    popular: 'bg-neon-green text-dark-900',
    bestValue: 'bg-cyan-400 text-dark-900',
    default: 'bg-white/10 text-white',
    monthly: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    quarterly: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    halfyearly: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    yearly: 'bg-neon-green/20 text-neon-green border border-neon-green/30',
    Base: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    Plus: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    Ultra: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}
