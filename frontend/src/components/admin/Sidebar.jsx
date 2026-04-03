import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Building2, LogOut, X, ExternalLink, Users, Snowflake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { key: 'plans', icon: Dumbbell,  label: 'Plans' },
  { key: 'gyms',  icon: Building2, label: 'Gyms' },
  { key: 'members', icon: Users, label: 'Members' },
  { key: 'freezes', icon: Snowflake, label: 'Freezes' },
];

export default function Sidebar({ isOpen, onClose, activeTab, onTabChange }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="font-display font-black text-xl tracking-tighter text-gray-900">WTF</span>
            <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Admin</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-700 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Admin badge */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-black text-sm">
            {admin?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 text-xs font-semibold truncate">{admin?.email}</p>
            <p className="text-green-600 text-xs font-medium">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase px-3 py-2">Manage</p>
        {NAV_ITEMS.map(({ key, icon: Icon, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { onTabChange?.(key); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute inset-0 bg-gray-900 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon size={17} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-0.5 border-t border-gray-100">
        <Link to="/" target="_blank"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          <ExternalLink size={15} />
          View Website
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-56 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        {content}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 28 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-56 bg-white border-r border-gray-200 flex flex-col"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
