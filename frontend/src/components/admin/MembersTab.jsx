import { useState, useEffect } from 'react';
import { Search, Eye, Snowflake } from 'lucide-react';
import api from '../../services/api';

const statusColors = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  FROZEN: 'bg-blue-50 text-blue-700 border-blue-200',
  EXPIRED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-50 text-gray-500 border-gray-200',
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MembersTab({ onForceUnfreeze }) {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchMemberships = async () => {
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/memberships/all', { params });
      setMemberships(res.data);
    } catch (err) {
      console.error('Failed to fetch memberships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [statusFilter]);

  const handleForceUnfreeze = async (membershipId) => {
    if (!confirm('Force unfreeze this membership?')) return;
    try {
      await api.post(`/memberships/admin/${membershipId}/force-unfreeze`);
      fetchMemberships();
      onForceUnfreeze?.();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const filtered = memberships.filter(m => {
    const term = search.toLowerCase();
    return (
      m.user?.name?.toLowerCase().includes(term) ||
      m.user?.email?.toLowerCase().includes(term) ||
      m.user?.phone?.includes(term) ||
      m.gym?.name?.toLowerCase().includes(term) ||
      m.plan?.name?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, gym..."
            className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-800 border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'ACTIVE', 'FROZEN', 'EXPIRED', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                statusFilter === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: memberships.length, color: 'bg-gray-100 text-gray-700' },
          { label: 'Active', count: memberships.filter(m => m.status === 'ACTIVE').length, color: 'bg-green-50 text-green-700' },
          { label: 'Frozen', count: memberships.filter(m => m.status === 'FROZEN').length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Expired', count: memberships.filter(m => m.status === 'EXPIRED').length, color: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gym</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Freeze Used</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">No memberships found</td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{m.user?.name}</p>
                      <p className="text-gray-400 text-xs">{m.user?.email}</p>
                      <p className="text-gray-400 text-xs">{m.user?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{m.plan?.name}</p>
                      <p className="text-gray-400 text-xs">{m.plan?.durationDays} days</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{m.gym?.name}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-xs">{formatDate(m.startDate)}</p>
                      <p className="text-gray-400 text-xs">to {formatDate(m.endDate)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-xs">
                        {m.totalFreezeCountUsed}/{m.plan?.maxFreezeCount} freezes
                      </p>
                      <p className="text-gray-400 text-xs">
                        {m.totalFreezeDaysUsed}/{m.plan?.maxFreezeDays} days
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusColors[m.status]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.status === 'FROZEN' && (
                        <button
                          onClick={() => handleForceUnfreeze(m.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          title="Force Unfreeze"
                        >
                          <Snowflake size={13} /> Unfreeze
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
