import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import { getResidents, createResident, updateResident, deleteResident, getHouses } from '../services/api';
import { RESIDENT_STATUS_LABELS } from '../utils/helpers';
import { Plus, Search, Pencil, Trash2, User, Phone, Home } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', email: '', phone: '', resident_status: 'permanent',
  is_married: '0', house_id: '', ktp_photo: null,
};

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [houses, setHouses]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, per_page: 10, current_page: 1, last_page: 1 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [saving, setSaving]         = useState(false);

  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const [viewImg, setViewImg] = useState(null);

  const fetchResidents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getResidents({ page, search, status: statusFilter });
      setResidents(res.data.data);
      setPagination({ total: res.data.total, per_page: res.data.per_page, current_page: res.data.current_page, last_page: res.data.last_page });
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchResidents(1); }, [fetchResidents]);
  useEffect(() => { getHouses().then(r => setHouses(r.data)); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setKtpPreview(null);
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditItem(r);
    setForm({
      name: r.name, email: r.email, phone: r.phone,
      resident_status: r.resident_status, is_married: r.is_married ? '1' : '0',
      house_id: r.house_id ?? '', ktp_photo: null,
    });
    setKtpPreview(r.ktp_photo || null);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    setForm(f => ({ ...f, ktp_photo: file }));
    setKtpPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') fd.append(k, v); });

      if (editItem) {
        await updateResident(editItem.id, fd);
        toast.success('Data penghuni diperbarui');
      } else {
        await createResident(fd);
        toast.success('Penghuni berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchResidents(pagination.current_page);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
      else toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteResident(deleteId);
      toast.success('Penghuni berhasil dihapus');
      setDeleteId(null);
      fetchResidents(1);
    } catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(false); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Penghuni</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola data penghuni RT</p>
          </div>
          <button onClick={openAdd} className="flex w-fit items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm transition duration-200">
            <Plus size={16} /> Tambah Penghuni
          </button>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama penghuni..."
                className=" pl-9 pr-4 py-2 outline-none focus:ring-0 shadow-sm rounded-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
              <option value="all">Semua Status</option>
              <option value="permanent">Tetap</option>
              <option value="contract">Kontrak</option>
            </select>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto rounded-tl-xl rounded-tr-xl shadow-md">
            <table className="w-full text-sm ">
              <thead className="bg-gray-100 border-b border-gray-100">
                <tr>
                  {['No','Foto KTP','Nama','Status','Telepon','Menikah','Rumah','Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : residents.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">Tidak ada data penghuni</td></tr>
                ) : (
                  residents.map((r, i) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{(pagination.current_page - 1) * pagination.per_page + i + 1}</td>
                      <td className="px-4 py-3">
                        {r.ktp_photo ? (
                          <img
                            src={r.ktp_photo}
                            alt="KTP"
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                            onClick={() => setViewImg(r.ktp_photo)}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <User size={16} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.resident_status === 'permanent' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {RESIDENT_STATUS_LABELS[r.resident_status] ?? r.resident_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{r.is_married ? 'Menikah' : 'Belum'}</td>
                      <td className="px-4 py-3 text-gray-600">{r.house?.house_number ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(r.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
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
            <Pagination {...pagination} onPageChange={fetchResidents} />
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Penghuni' : 'Tambah Penghuni'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
            <input className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" placeholder="Nama lengkap" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon *</label>
              <input type="tel" className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" placeholder="08xx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" value={form.resident_status} onChange={e => setForm(f => ({ ...f, resident_status: e.target.value }))}>
                <option value="permanent">Tetap</option>
                <option value="contract">Kontrak</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Menikah</label>
              <select className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" value={form.is_married} onChange={e => setForm(f => ({ ...f, is_married: e.target.value }))}>
                <option value="0">Belum Menikah</option>
                <option value="1">Sudah Menikah</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rumah</label>
              <select className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" value={form.house_id} onChange={e => setForm(f => ({ ...f, house_id: e.target.value }))}>
                <option value="">-- Pilih Rumah --</option>
                {houses.filter(h => h.status === 'vacant' || h.id === editItem?.house_id).map(h => (
                  <option key={h.id} value={h.id}>{h.house_number}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto KTP {!editItem && '*'}</label>
            {ktpPreview && (
              <img src={ktpPreview} alt="KTP Preview" className="w-full h-32 object-contain border rounded-lg mb-2" />
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="bg-red-500 py-4 text-white rounded-lg hover:bg-red-600 flex-1">Batal</button>
            <button type="submit" className="bg-blue-500 py-4 text-white rounded-lg hover:bg-blue-600 flex-1" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Penghuni"
        message="Apakah Anda yakin ingin menghapus penghuni ini? Data tidak bisa dikembalikan."
      />

      {viewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewImg(null)}>
          <img src={viewImg} alt="KTP" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </Layout>
  );
}