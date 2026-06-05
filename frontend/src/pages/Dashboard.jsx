import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { getSummary, getYearlyReport } from '../services/api';
import { formatRupiah, MONTHS } from '../utils/helpers';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Users, Home, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </div>
);

const STATUS_BADGE = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' };
const STATUS_LABEL = { pending: 'Pending', approved: 'ACC', rejected: 'Ditolak' };
const TYPE_LABEL   = { security: 'Satpam', cleanliness: 'Kebersihan', both: 'Keduanya' };

export default function Dashboard() {
  const { user }   = useAuth();
  const [summary, setSummary]   = useState(null);
  const [yearly, setYearly]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [chartType, setChartType] = useState('line');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, yearRes] = await Promise.all([
        getSummary({ month, year }),
        getYearlyReport({ year }),
      ]);
      setSummary(sumRes.data);
      setYearly(yearRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatYAxis = (v) => {
    if (v >= 1000000) return `${(v/1000000).toFixed(0)}jt`;
    if (v >= 1000) return `${(v/1000).toFixed(0)}rb`;
    return v;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatRupiah(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Selamat datang, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={month} onChange={e => setMonth(+e.target.value)} className="input-field w-auto">
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(+e.target.value)} className="input-field w-auto">
              {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-24 bg-gray-50" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Pemasukan" value={formatRupiah(summary?.income ?? 0)} icon={TrendingUp} color="bg-blue-500" sub={`${MONTHS[month-1]} ${year}`} />
            <StatCard label="Total Pengeluaran" value={formatRupiah(summary?.expense ?? 0)} icon={TrendingDown} color="bg-red-500" sub={`${MONTHS[month-1]} ${year}`} />
            <StatCard label="Saldo Bersih" value={formatRupiah(summary?.balance ?? 0)} icon={Wallet} color={summary?.balance >= 0 ? 'bg-emerald-500' : 'bg-orange-500'} sub="Pemasukan - Pengeluaran" />
            <StatCard label="Total Penghuni" value={summary?.total_residents ?? 0} icon={Users} color="bg-violet-500" sub={`${summary?.occupied_houses ?? 0} rumah dihuni`} />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <Home size={24} className="text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{summary?.occupied_houses ?? 0}</p>
            <p className="text-sm text-gray-500">Rumah Dihuni</p>
          </div>
          <div className="card text-center">
            <Home size={24} className="text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{summary?.vacant_houses ?? 0}</p>
            <p className="text-sm text-gray-500">Rumah Kosong</p>
          </div>
          <div className="card text-center">
            <Clock size={24} className="text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{summary?.pending_payments ?? 0}</p>
            <p className="text-sm text-gray-500">Pembayaran Pending</p>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Laporan Keuangan {year}</h2>
              <p className="text-sm text-gray-500">Pemasukan vs Pengeluaran per bulan</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${chartType === 'bar' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${chartType === 'line' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Line
              </button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={yearly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#3B82F6" name="Pemasukan" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Pengeluaran" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <BarChart data={yearly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="income" fill="#3B82F6" name="Pemasukan" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" fill="#EF4444" name="Pengeluaran" radius={[4,4,0,0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pembayaran Terbaru</h2>
          {!summary?.recent_payments?.length ? (
            <p className="text-gray-500 text-sm text-center py-6">Belum ada pembayaran</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Penghuni</th>
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Rumah</th>
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Jenis</th>
                    <th className="text-right py-2 pr-4 font-medium text-gray-500">Jumlah</th>
                    <th className="text-left py-2 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summary.recent_payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 font-medium text-gray-900">{p.resident}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{p.house_number}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{TYPE_LABEL[p.type]}</td>
                      <td className="py-2.5 pr-4 text-right text-gray-900">{formatRupiah(p.amount)}</td>
                      <td className="py-2.5">
                        <span className={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}