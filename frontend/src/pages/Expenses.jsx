import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/api';
import { formatRupiah, formatDate, EXPENSE_CATEGORY_LABELS, MONTHS } from '../utils/helpers';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { category: 'road_repair', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], proof_image: null };

export default function Expenses() {
  const now = new Date();
  const [expenses, setExpenses]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, per_page: 10, current_page: 1, last_page: 1 });
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading]       = useState(true);

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const [zoomImg, setZoomImg]     = useState(null);

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getExpenses({ page, month, year });
      setExpenses(res.data.data);
      setTotalAmount(res.data.total_amount);
      setPagination({ total: res.data.total, per_page: res.data.per_page, current_page: res.data.current_page, last_page: res.data.last_page });
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchExpenses(1); }, [fetchExpenses]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (e) => {
    setEditItem(e);
    setForm({
      category: e.category,
      description: e.description,
      amount: e.amount,
      expense_date: e.expense_date,
      proof_image: null,
    });
    setModalOpen(true);
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('amount', form.amount);
      fd.append('expense_date', form.expense_date);
      if (form.proof_image) fd.append('proof_image', form.proof_image);

      if (editItem) {
        await updateExpense(editItem.id, fd);
        toast.success('Pengeluaran diperbarui');
      } else {
        await createExpense(fd);
        toast.success('Pengeluaran ditambahkan');
      }
      setModalOpen(false);
      fetchExpenses(pagination.current_page);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
      else toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(deleteId);
      toast.success('Pengeluaran dihapus');
      setDeleteId(null);
      fetchExpenses(1);
    } catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(false); }
  };

  const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
            <p className="text-gray-500 text-sm mt-0.5">Catat semua pengeluaran RT</p>
          </div>
          <button onClick={openAdd} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-fit sm:w-auto py-2 px-4 flex items-center gap-2">
            <Plus size={16} /> Tambah Pengeluaran
          </button>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <select value={month} onChange={e => setMonth(+e.target.value)} className="input-field w-auto">
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={year} onChange={e => setYear(+e.target.value)} className="input-field w-auto">
                {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl">
              <Receipt size={16} className="text-red-500" />
              <span className="text-sm text-red-600">Total: <strong>{formatRupiah(totalAmount)}</strong></span>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['No','Tanggal','Kategori','Deskripsi','Jumlah','Bukti','Dicatat oleh','Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">Tidak ada pengeluaran bulan ini</td></tr>
                ) : (
                  expenses.map((e, i) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{(pagination.current_page-1)*pagination.per_page+i+1}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(e.expense_date)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {EXPENSE_CATEGORY_LABELS[e.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{e.description}</td>
                      <td className="px-4 py-3 font-medium text-red-600">{formatRupiah(e.amount)}</td>
                      <td className="px-4 py-3">
                        {e.proof_image ? (
                          <img src={e.proof_image} alt="Bukti" className="w-10 h-10 object-cover rounded-lg border cursor-pointer hover:opacity-80" onClick={() => setZoomImg(e.proof_image)} />
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{e.created_by}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(e.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination {...pagination} onPageChange={fetchExpenses} />
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
            <input type="date" className=" px-4 py-2 w-full border border-gray-300 outline-none focus:ring-0 rounded-lg" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select className=" px-4 py-2 w-full border border-gray-300 outline-none focus:ring-0 rounded-lg" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi *</label>
            <textarea className="p-2 md:p-4 border border-gray-300 outline-none focus:ring-0 rounded-lg w-full resize-none" rows={3} placeholder="Deskripsi pengeluaran (min 10 karakter)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required minLength={10} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp) *</label>
            <input type="number" className=" px-4 py-2 w-full border border-gray-300 outline-none focus:ring-0 rounded-lg" placeholder="Contoh: 500000" min={1000} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bukti/Kwitansi (opsional)</label>
            <input type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, proof_image: e.target.files[0] }))} className=" px-4 py-2 w-full border border-gray-300 outline-none focus:ring-0 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg w-full py-2 px-4 flex items-center justify-center gap-2">
              Batal
            </button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-full py-2 px-4 flex items-center justify-center gap-2" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Hapus Pengeluaran" message="Yakin ingin menghapus data pengeluaran ini?"
      />

      {zoomImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoomImg(null)}>
          <img src={zoomImg} alt="Bukti" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </Layout>
  );
}