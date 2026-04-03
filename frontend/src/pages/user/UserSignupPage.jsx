import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUserAuth } from '../../context/UserAuthContext';

export default function UserSignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useUserAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(form.name, form.email, form.phone, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-display font-bold text-neon-green">WTF GYM</h1>
          </Link>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="9876543210"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="Re-enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neon-green text-dark-900 font-bold py-3 rounded-lg hover:shadow-neon-green transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-neon-green hover:underline">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
