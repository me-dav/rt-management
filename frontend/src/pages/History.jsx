import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { getPaymentHistory } from '../services/api';
import { MONTHS } from '../utils/helpers';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function History() {
  const now   = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [month, year]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getPaymentHistory({ month, year });
      setData(res.data);
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const paid   = data.filter(r => r.has_security && r.has_cleanliness).length;
  const unpaid = data.filter(r => !r.has_security && !r.has_cleanliness).length;
  const partial= data.filter(r => (r.has_security || r.has_cleanliness) && !(r.has_security && r.has_cleanliness)).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">History Pembayaran</h1>
            <p className="text-gray-500 text-sm mt-0.5">Status iuran semua penghuni per bulan</p>
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

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Lunas', count: paid, color: 'bg-green-50 border-green-100', textColor: 'text-green-600', icon: CheckCircle },
            { label: 'Sebagian', count: partial, color: 'bg-yellow-50 border-yellow-100', textColor: 'text-yellow-600', icon: AlertCircle },
            { label: 'Belum Bayar', count: unpaid, color: 'bg-red-50 border-red-100', textColor: 'text-red-600', icon: XCircle },
          ].map(s => (
            <div key={s.label} className={`card border ${s.color} text-center py-4`}>
              <s.icon size={24} className={`${s.textColor} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${s.textColor}`}>{s.count}</p>
              <p className={`text-xs ${s.textColor} opacity-80`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">
              Status Pembayaran — {MONTHS[month-1]} {year}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['No','Nama Penghuni','Rumah','Satpam','Kebersihan','Status Keseluruhan'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Tidak ada data</td></tr>
                ) : (
                  data.map((r, i) => {
                    const bothPaid = r.has_security && r.has_cleanliness;
                    const somePaid = r.has_security || r.has_cleanliness;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500">{i+1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                        <td className="px-4 py-3 text-gray-600">{r.house_number}</td>
                        <td className="px-4 py-3">
                          {r.has_security ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle size={12} /> Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle size={12} /> Belum
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.has_cleanliness ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle size={12} /> Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle size={12} /> Belum
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {bothPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <CheckCircle size={12} /> Lunas
                            </span>
                          ) : somePaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <AlertCircle size={12} /> Sebagian
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle size={12} /> Belum Bayar
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}