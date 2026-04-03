import { Link } from 'react-router-dom';
import { MapPin, Instagram, Youtube, Twitter, Phone, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1 mb-3">
              <span className="font-display font-black text-2xl text-gray-900 tracking-tighter">WTF</span>
              <span className="font-display font-black text-2xl text-green-600 tracking-tighter">Gyms</span>
            </div>
            <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase mb-2">Stop Wasting Time. Start Evolving.</p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Delhi NCR's fastest growing gym network. Science-backed training, premium equipment, expert coaches.
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <MapPin size={12} className="text-green-600" />
              <span className="text-green-600 text-xs font-semibold">40+ Locations · Delhi NCR</span>
            </div>
            <div className="flex gap-2.5 mt-4">
              {[Instagram, Youtube, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-300 transition-all">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-4 text-xs tracking-widest uppercase">Navigate</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '#hero' },
                { label: 'Our Gyms', href: '#gyms' },
                { label: 'Plans', href: '#plans' },
                { label: 'Join Now', href: '#join' },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-gray-400 hover:text-green-600 text-sm transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-4 text-xs tracking-widest uppercase">Contact</h4>
            <ul className="space-y-2.5 mb-6">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone size={13} /> +91 90906 39005
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock size={13} /> 05:30 AM – 11:00 PM
              </li>
            </ul>
            <h4 className="font-semibold text-gray-700 mb-2 text-xs tracking-widest uppercase">Admin</h4>
            <ul className="space-y-2">
              <li><Link to="/admin/login" className="text-gray-400 hover:text-green-600 text-sm transition-colors">Admin Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-400 text-xs">© {new Date().getFullYear()} WTF Gyms. All rights reserved.</p>
          <p className="text-gray-300 text-xs">Delhi NCR's Elite Fitness Network</p>
        </div>
      </div>
    </footer>
  );
}
