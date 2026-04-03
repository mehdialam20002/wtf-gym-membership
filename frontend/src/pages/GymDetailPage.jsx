import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, Phone, Star, ChevronDown,
  Wifi, Car, ShowerHead, Lock, Zap, Shield, Dumbbell,
  Share2, ChevronRight, Check, Navigation, Users, Award, Cpu
} from 'lucide-react';
import api from '../services/api';
import { useUserAuth } from '../context/UserAuthContext';

function getDurationLabel(days) {
  if (days === 30)  return '1 Month';
  if (days === 90)  return '3 Months';
  if (days === 180) return '6 Months';
  if (days === 365) return '12 Months';
  if (days % 30 === 0) return `${days / 30} Months`;
  return `${days} Days`;
}

function getDurationColor(days) {
  if (days === 30)  return { heading: 'text-blue-600',   bg: 'bg-blue-600',   accent: 'border-blue-300',   glow: 'bg-blue-50',   btnFrom: 'from-blue-500',   btnTo: 'to-blue-700'   };
  if (days === 90)  return { heading: 'text-violet-600', bg: 'bg-violet-600', accent: 'border-violet-300', glow: 'bg-violet-50', btnFrom: 'from-violet-500', btnTo: 'to-violet-700' };
  if (days === 180) return { heading: 'text-orange-500', bg: 'bg-orange-500', accent: 'border-orange-300', glow: 'bg-orange-50', btnFrom: 'from-orange-400', btnTo: 'to-red-500'    };
  if (days === 365) return { heading: 'text-rose-600',   bg: 'bg-rose-600',   accent: 'border-rose-300',   glow: 'bg-rose-50',   btnFrom: 'from-rose-500',   btnTo: 'to-rose-700'   };
  return             { heading: 'text-gray-700',   bg: 'bg-gray-700',   accent: 'border-gray-300',   glow: 'bg-gray-50',   btnFrom: 'from-gray-600',   btnTo: 'to-gray-800'   };
}

const AMENITY_ICONS = {
  'Parking': Car, 'Free WiFi': Wifi, 'Showers': ShowerHead,
  'Lockers': Lock, 'Sauna': Zap, 'CCTV': Shield,
  'AC': Zap, 'Changing Rooms': Users,
};

// Icon + label for "What's Included" grid
const INCLUDED_ITEMS = [
  { icon: Dumbbell, label: 'Gym Access' },
  { icon: Users,    label: 'Trainer Access' },
  { icon: Award,    label: 'Workout Plan' },
  { icon: Cpu,      label: 'BCA Test' },
  { icon: Wifi,     label: 'Free WiFi' },
  { icon: Lock,     label: 'Locker' },
];

function fmt(v) { return `₹${Number(v).toLocaleString('en-IN')}`; }
function perDay(price, days) {
  return `₹${Math.round(price / (days || 30))}/day`;
}


export default function GymDetailPage() {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const [gym, setGym]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.get(`/gyms/${slug}/details`)
      .then(r => { setGym(r.data); setLoading(false); })
      .catch(e => { setError(e.response?.status === 404 ? 'Gym not found' : 'Failed to load'); setLoading(false); });
  }, [slug]);

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-3">{error}</p>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 underline">← Back</Link>
      </div>
    </div>
  );

  const allPlans  = (gym.gymPlans || []).map(gp => gp.plan).filter(p => p?.isVisible)
    .sort((a, b) => (a.durationDays ?? 0) - (b.durationDays ?? 0));
  const amenities = Array.isArray(gym.amenities) ? gym.amenities : [];
  const mapsUrl   = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.address + ' ' + gym.city)}`;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors group font-medium">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back
          </button>
          <span className="text-gray-200">|</span>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Link to="/"><span className="font-black text-gray-900">WTF</span><span className="font-black text-green-600">Gyms</span></Link>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-500 text-sm truncate">{gym.name}</span>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all font-medium">
            <Share2 size={12} /> {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ════════════════════════════════
              LEFT — Gym Info
          ════════════════════════════════ */}
          <div className="flex-1 min-w-0">

            {/* Gym name + address */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-green-600" />
                <span className="text-green-600 text-sm font-semibold">{gym.area}, {gym.city}</span>
                <span className="text-gray-300 text-xs">·</span>
                <div className="flex items-center gap-1">
                  <Star size={13} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-gray-700">{gym.rating.toFixed(1)}</span>
                </div>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-900 leading-tight mb-3">
                {gym.name}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <p className="text-gray-400 text-sm">{gym.address}</p>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                  <Navigation size={11} /> NAVIGATE
                </a>
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  ⭐ {gym.rating.toFixed(1)} Hygiene Rating
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  🏋️ Certified Trainers
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  ⚙️ Premium Equipment
                </span>
                {amenities.slice(0, 2).map(a => (
                  <span key={a} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    {a}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Hours — accordion */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="border-t border-b border-gray-100">
              <button onClick={() => setHoursOpen(o => !o)}
                className="w-full flex items-center justify-between py-4 text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock size={15} className="text-gray-500" />
                  </div>
                  <span className="text-gray-800 font-semibold text-sm">{gym.hours}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${hoursOpen ? 'rotate-180' : ''}`} />
              </button>
              {hoursOpen && (
                <div className="pb-4 pl-11">
                  {['Monday – Friday', 'Saturday', 'Sunday'].map((day, i) => (
                    <div key={day} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-gray-500">{day}</span>
                      <span className="text-gray-800 font-medium">{i === 2 ? '07:00 AM – 08:00 PM' : gym.hours}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Phone */}
            {gym.phone && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Phone size={15} className="text-gray-500" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium">Contact Gym Support to Assist You More</span>
                </div>
                <a href={`tel:${gym.phone}`} className="text-orange-500 font-bold text-sm hover:text-orange-700 transition-colors flex-shrink-0 ml-4">
                  {gym.phone.startsWith('+') ? gym.phone : `+91 ${gym.phone}`}
                </a>
              </motion.div>
            )}

            {/* What's Included */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-8">
              <h2 className="font-bold text-xl text-gray-900 mb-5">What's Included In Your Plan</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {INCLUDED_ITEMS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <Icon size={18} className="text-gray-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="mt-8">
                <h2 className="font-bold text-xl text-gray-900 mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map(a => {
                    const Icon = AMENITY_ICONS[a] || Check;
                    return (
                      <span key={a} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 font-medium">
                        <Icon size={14} className="text-gray-400" /> {a}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* ════════════════════════════════
              RIGHT — Sticky Scrollable Plans
          ════════════════════════════════ */}
          <div className="w-full lg:w-[380px] xl:w-[400px] flex-shrink-0 lg:sticky lg:top-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">

              {/* Panel header */}
              <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Membership Plans</p>
                <h3 className="font-black text-gray-900 text-lg leading-tight">Choose Your Plan</h3>
                <p className="text-gray-400 text-xs mt-1">{allPlans.length} plan{allPlans.length !== 1 ? 's' : ''} available · Call to enroll</p>
              </div>

              {/* Scrollable plan list with progress bar */}
              <PlansScroller plans={allPlans} phone={gym.phone} gymId={gym.id} />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Plans Scroller with progress bar ─────── */
function PlansScroller({ plans, phone, gymId }) {
  if (plans.length === 0) return (
    <div className="py-16 text-center">
      <Dumbbell size={28} className="text-gray-200 mx-auto mb-3" />
      <p className="text-gray-400 text-sm">No plans assigned yet.</p>
    </div>
  );

  return (
    <div className="overflow-y-auto scrollbar-hide pt-3" style={{ maxHeight: '72vh' }}>
      {plans.map((plan, i) => (
        <PlanCard key={plan.id} plan={plan} index={i} phone={phone} gymId={gymId} />
      ))}
    </div>
  );
}

/* ── Plan Card ─────────────────────────────── */
function PlanCard({ plan, index, phone, gymId }) {
  const { isAuthenticated } = useUserAuth();
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState('');

  const cc          = getDurationColor(plan.durationDays);
  const label       = getDurationLabel(plan.durationDays);
  const benefits    = Array.isArray(plan.benefits) ? plan.benefits : [];
  const price       = plan.discountedPrice ?? plan.price;
  const hasDiscount = !!plan.discountedPrice;

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setPurchasing(true);
    setError('');
    try {
      await api.post('/memberships/purchase', { planId: plan.id, gymId });
      setPurchased(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className={`mx-4 mb-3 last:mb-4 rounded-2xl border-2 ${cc.accent} overflow-hidden shadow-sm`}
    >
      {/* Colored top band */}
      <div className={`${cc.glow} px-4 pt-4 pb-3`}>

        {/* Duration label + Sale badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-2xl font-black uppercase tracking-tight ${cc.heading}`}>
            {label}
          </span>
          {hasDiscount && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white font-bold">
              Sale
            </span>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-end gap-2">
          <span className={`font-black text-3xl leading-none ${cc.heading}`}>{fmt(price)}</span>
          <div className="flex flex-col pb-0.5">
            <span className="text-gray-400 text-xs font-semibold">{perDay(price, plan.durationDays)}</span>
            {hasDiscount && (
              <span className="text-gray-400 text-xs line-through">{fmt(plan.price)}</span>
            )}
          </div>
        </div>

        {/* Plan name */}
        <p className="text-gray-500 text-xs font-medium mt-1 truncate">{plan.name}</p>
      </div>

      {/* Freeze Policy */}
      {plan.maxFreezeCount > 0 && (
        <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 flex items-center gap-3">
          <span className="text-blue-500 text-xs">&#10052;</span>
          <span className="text-xs text-gray-600 font-medium">
            Freeze: {plan.maxFreezeCount} times, up to {plan.maxFreezeDays} days
          </span>
        </div>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <div className="bg-white px-4 pt-3 pb-3">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">What's Included</p>
          <ul className="space-y-2">
            {benefits.map((b, bi) => (
              <li key={bi} className="flex items-start gap-2">
                <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${cc.bg}`}>
                  <Check size={9} className="text-white" strokeWidth={3} />
                </span>
                <span className="text-xs text-gray-600 leading-snug">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Buy Now */}
      <div className="bg-white px-4 pb-4 pt-1">
        {error && (
          <div className="text-center mb-2">
            <p className="text-red-500 text-xs mb-2">{error}</p>
            {error.toLowerCase().includes('already') && (
              <Link to="/dashboard" className="text-xs text-blue-600 font-semibold hover:underline">
                Go to Dashboard &rarr;
              </Link>
            )}
          </div>
        )}
        {purchased ? (
          <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-bold text-sm">
            <Check size={15} /> Purchased! Redirecting...
          </div>
        ) : (
          <button
            onClick={handleBuyNow}
            disabled={purchasing}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r ${cc.btnFrom} ${cc.btnTo} hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50`}
          >
            {purchasing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Dumbbell size={13} />
            )}
            {isAuthenticated ? 'Buy Now' : 'Login to Buy'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Skeleton ─────────────────────────────── */
function Skeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-14 bg-white border-b border-gray-200" />
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-10">
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="flex gap-2 mt-4">
            {[1,2,3].map(i => <div key={i} className="h-8 w-28 bg-gray-100 rounded-full" />)}
          </div>
        </div>
        <div className="w-96 h-96 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}
