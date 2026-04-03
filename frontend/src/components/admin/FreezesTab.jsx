import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';

const statusColors = {
  SCHEDULED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  AUTO_COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-gray-50 text-gray-500 border-gray-200',
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FreezesTab() {
  const [freezes, setFreezes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchFreezes = async () => {
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/memberships/admin/all', { params });
      setFreezes(res.data);
    } catch (err) {
      console.error('Failed to fetch freezes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreezes();
  }, [statusFilter]);

  const filtered = freezes.filter(f => {
    const term = search.toLowerCase();
    return (
      f.membership?.user?.name?.toLowerCase().includes(term) ||
      f.membership?.user?.email?.toLowerCase().includes(term) ||
      f.membership?.gym?.name?.toLowerCase().includes(term) ||
      f.membership?.plan?.name?.toLowerCase().includes(term)
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
            placeholder="Search freezes..."
            className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-800 border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'AUTO_COMPLETED', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                statusFilter === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', count: freezes.length, color: 'bg-gray-100 text-gray-700' },
          { label: 'Scheduled', count: freezes.filter(f => f.status === 'SCHEDULED').length, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Active', count: freezes.filter(f => f.status === 'ACTIVE').length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Completed', count: freezes.filter(f => f.status === 'COMPLETED' || f.status === 'AUTO_COMPLETED').length, color: 'bg-green-50 text-green-700' },
          { label: 'Cancelled', count: freezes.filter(f => f.status === 'CANCELLED').length, color: 'bg-gray-50 text-gray-500' },
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan / Gym</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Freeze Period</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Days</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">No freeze records found</td>
                </tr>
              ) : (
                filtered.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{f.membership?.user?.name}</p>
                      <p className="text-gray-400 text-xs">{f.membership?.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{f.membership?.plan?.name}</p>
                      <p className="text-gray-400 text-xs">{f.membership?.gym?.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-xs">{formatDate(f.freezeStartDate)}</p>
                      <p className="text-gray-400 text-xs">to {formatDate(f.freezeEndDate)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{f.requestedDays} req</p>
                      <p className="text-gray-400 text-xs">{f.actualDays} actual</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">
                      {f.reason || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusColors[f.status]}`}>
                        {f.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(f.createdAt)}</td>
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
