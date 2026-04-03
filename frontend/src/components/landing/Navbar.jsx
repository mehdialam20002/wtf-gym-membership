import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useUserAuth();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Our Gyms', href: '#gyms' },
    { label: 'Plans', href: '#plans' },
    { label: 'Join Now', href: '#join' },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white border-b border-gray-200 shadow-sm' : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2 group">
            <span className="font-display font-black text-2xl tracking-tighter text-gray-900">WTF</span>
            <span className="font-display font-black text-2xl tracking-tighter text-green-600">Gyms</span>
          </a>

          {/* Delhi NCR badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
            <MapPin size={12} className="text-green-600" />
            <span className="text-xs text-green-700 font-semibold">Delhi NCR · 40+ Locations</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <a key={link.label} href={link.href}
                className="text-gray-500 hover:text-gray-900 transition-colors duration-200 text-sm font-medium">
                {link.label}
              </a>
            ))}
            {isAuthenticated ? (
              <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                <User size={14} /> Dashboard
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                <User size={14} /> Login
              </Link>
            )}
            <Link to="/admin/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Admin</Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-200">
            <div className="px-4 py-3 space-y-0.5">
              {navLinks.map(link => (
                <a key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all">
                  {link.label}
                </a>
              ))}
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all">
                  <User size={14} /> Dashboard
                </Link>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all">
                  <User size={14} /> Login / Signup
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
