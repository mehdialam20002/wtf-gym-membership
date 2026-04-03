import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      await login(form.email, form.password);
      toast.success('Welcome back, Admin!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <span className="font-display font-black text-5xl text-white tracking-tighter">WTF</span>
            <span className="font-display font-black text-5xl text-neon-green tracking-tighter" style={{ textShadow: '0 0 20px rgba(57,255,20,0.5)' }}>.</span>
          </div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Admin Panel</p>
          <p className="text-gray-600 text-xs mt-1">Delhi NCR · 40+ Locations</p>
        </div>

        {/* Form card */}
        <div className="glass-card border border-neon-green/20 p-8"
          style={{ boxShadow: '0 0 40px rgba(57,255,20,0.08)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@gym.com"
                  className="w-full bg-dark-700 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-dark-700 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full btn-primary py-3.5 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Sign In to Admin Panel
                </>
              )}
            </motion.button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-dark-700 rounded-xl border border-white/5">
            <p className="text-xs text-gray-600 text-center">
              Demo: <span className="text-gray-400">admin@wtfgyms.com</span> / <span className="text-gray-400">admin123</span>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            ← Back to website
          </a>
        </div>
      </motion.div>
    </div>
  );
}
