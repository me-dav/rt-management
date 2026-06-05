import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { getPayments, getPayment, approvePayment, rejectPayment } from '../services/api';
import { formatRupiah, formatDate, PAYMENT_TYPE_LABELS, PERIOD_LABELS, MONTHS } from '../utils/helpers';
import { Search, Eye, CheckCircle, XCircle, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Payments() {
  const now = new Date();
  const [payments, setPayments]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, per_page: 10, current_page: 1, last_page: 1 });
  const [loading, setLoading]       = useState(true);

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [month, setMonth]           = useState('');
  const [year, setYear]             = useState('');

  const [detailModal, setDetailModal] = useState(false);
  const [detail, setDetail]           = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectReason, setRejectReason]   = useState('');
  const [processing, setProcessing]       = useState(false);
  const [zoomImg, setZoomImg]             = useState(null);

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getPayments({ page, search, status: statusFilter, month: month || undefined, year: year || undefined });
      setPayments(res.data.data);
      setPagination({ total: res.data.total, per_page: res.data.per_page, current_page: res.data.current_page, last_page: res.data.last_page });
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, statusFilter, month, year]);

  useEffect(() => { fetchPayments(1); }, [fetchPayments]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetailModal(true);
    setRejectReason('');
    try {
      const res = await getPayment(id);
      setDetail(res.data);
    } catch { toast.error('Gagal memuat detail'); }
    finally { setDetailLoading(false); }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await approvePayment(detail.id);
      toast.success('Pembayaran berhasil di-ACC!');
      setDetailModal(false);
      fetchPayments(pagination.current_page);
    } catch { toast.error('Gagal ACC pembayaran'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await rejectPayment(detail.id, rejectReason);
      toast.success('Pembayaran ditolak');
      setDetailModal(false);
      fetchPayments(pagination.current_page);
    } catch { toast.error('Gagal menolak pembayaran'); }
    finally { setProcessing(false); }
  };

  const statusBadge = (s) => ({
    pending:  <span className="badge-pending">Pending</span>,
    approved: <span className="badge-approved">ACC</span>,
    rejected: <span className="badge-rejected">Ditolak</span>,
  }[s] ?? <span>{s}</span>);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-gray-500 text-sm mt-0.5">Verifikasi pembayaran iuran penghuni</p>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari nama penghuni..." className="  pl-9 pr-4 py-2 outline-none focus:ring-0 shadow-sm rounded-lg" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">ACC</option>
              <option value="rejected">Ditolak</option>
            </select>
            <select value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto">
              <option value="">Semua Bulan</option>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(e.target.value)} className="input-field w-auto">
              <option value="">Semua Tahun</option>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['No','Penghuni','Rumah','Jenis','Periode','Jumlah','Tgl Bayar','Bukti','Status','Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(10)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">Tidak ada data pembayaran</td></tr>
                ) : (
                  payments.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{(pagination.current_page-1)*pagination.per_page+i+1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{p.resident?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.resident?.house_number ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{PAYMENT_TYPE_LABELS[p.payment_type]}</td>
                      <td className="px-4 py-3 text-gray-600">{PERIOD_LABELS[p.period_type]}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatRupiah(p.total_amount)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3">
                        {p.proof_image ? (
                          <img src={p.proof_image} alt="Bukti" className="w-10 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                            onClick={() => setZoomImg(p.proof_image)} />
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(p.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                          <Eye size={12} /> Cek
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination {...pagination} onPageChange={fetchPayments} />
          </div>
        </div>
      </div>

      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Detail Pembayaran" size="lg">
        {detailLoading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
          </div>
        ) : detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Nama Penghuni', value: detail.resident?.name },
                { label: 'Rumah', value: detail.resident?.house_number },
                { label: 'Jenis Iuran', value: PAYMENT_TYPE_LABELS[detail.payment_type] },
                { label: 'Periode', value: PERIOD_LABELS[detail.period_type] },
                { label: 'Tanggal Bayar', value: formatDate(detail.payment_date) },
                { label: 'Tanggal Submit', value: formatDate(detail.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm font-medium text-blue-700">Total Pembayaran</p>
              <p className="text-2xl font-bold text-blue-600">{formatRupiah(detail.total_amount)}</p>
            </div>

            {detail.proof_image && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Bukti Transfer</p>
                <div className="relative group">
                  <img src={detail.proof_image} alt="Bukti" className="w-full max-h-64 object-contain rounded-xl border border-gray-200 cursor-pointer" onClick={() => setZoomImg(detail.proof_image)} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors flex items-center justify-center" onClick={() => setZoomImg(detail.proof_image)}>
                    <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">Klik untuk zoom</p>
              </div>
            )}

            {detail.status === 'pending' ? (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan (opsional)</label>
                  <textarea
                    className="p-4 md:p-4 outline-none focus:ring-0 shadow-sm rounded-lg w-full resize-none"
                    rows={2}
                    placeholder="Isi jika ingin menolak pembayaran..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleReject} className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg text-white flex-1 flex items-center justify-center gap-2" disabled={processing}>
                    <XCircle size={16} /> {processing ? 'Memproses...' : 'Tolak'}
                  </button>
                  <button onClick={handleApprove} className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg text-white flex-1 flex items-center justify-center gap-2" disabled={processing}>
                    <CheckCircle size={16} /> {processing ? 'Memproses...' : 'ACC Pembayaran'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={`rounded-xl px-4 py-3 ${detail.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`font-semibold ${detail.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                  {detail.status === 'approved' ? '✅ Pembayaran telah di-ACC' : '❌ Pembayaran ditolak'}
                </p>
                {detail.rejection_reason && <p className="text-sm text-red-600 mt-1">Alasan: {detail.rejection_reason}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>

      {zoomImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoomImg(null)}>
          <img src={zoomImg} alt="Bukti" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </Layout>
  );
}