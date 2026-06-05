import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getHouses, createHouse, updateHouse, deleteHouse, getHouseHistory, getResidents } from '../services/api';
import { formatDate, RESIDENT_STATUS_LABELS } from '../utils/helpers';
import { Plus, Home, User, Phone, Pencil, Trash2, History, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { house_number: '', status: 'vacant', resident_id: '', house_image: null };

export default function Houses() {
  const [houses, setHouses]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [residents, setResidents]   = useState([]);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const [historyHouse, setHistoryHouse] = useState(null);
  const [historyData, setHistoryData]   = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHouses();
      setHouses(res.data);
    } catch { toast.error('Gagal memuat data rumah'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHouses(); }, [fetchHouses]);
  useEffect(() => {
    getResidents({ per_page: 100 }).then(r => setResidents(r.data.data));
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (h) => {
    setEditItem(h);
    setForm({
      house_number: h.house_number,
      status: h.status,
      resident_id: h.current_resident?.id ?? '',
      house_image: null,
    });
    setModalOpen(true);
  };

  const openHistory = async (h) => {
    setHistoryHouse(h);
    setHistoryLoading(true);
    try {
      const res = await getHouseHistory(h.id);
      setHistoryData(res.data);
    } catch { toast.error('Gagal memuat riwayat'); }
    finally { setHistoryLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('house_number', form.house_number);
      fd.append('status', form.resident_id ? 'occupied' : form.status);
      if (form.resident_id) fd.append('resident_id', form.resident_id);
      if (form.house_image) fd.append('house_image', form.house_image);

      if (editItem) {
        await updateHouse(editItem.id, fd);
        toast.success('Data rumah diperbarui');
      } else {
        await createHouse(fd);
        toast.success('Rumah berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchHouses();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
      else toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteHouse(deleteId);
      toast.success('Rumah berhasil dihapus');
      setDeleteId(null);
      fetchHouses();
    } catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(false); }
  };

  const occupied = houses.filter(h => h.status === 'occupied').length;
  const vacant   = houses.filter(h => h.status === 'vacant').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rumah</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {houses.length} total · <span className="text-green-600">{occupied} dihuni</span> · <span className="text-gray-400">{vacant} kosong</span>
            </p>
          </div>
          <button onClick={openAdd} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition duration-200">
             + Tambah Rumah
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="card h-48 bg-gray-50 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {houses.map(house => (
              <div key={house.id} className="card hover:shadow-md rounded-lg transition-shadow p-0 overflow-hidden">
                <div className={`px-4 pt-4 pb-3 ${house.status === 'occupied' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${house.status === 'occupied' ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <Building size={16} className={house.status === 'occupied' ? 'text-blue-600' : 'text-gray-400'} />
                      </div>
                      <span className="font-bold text-xl text-gray-900">{house.house_number}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      house.status === 'occupied' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {house.status === 'occupied' ? 'Dihuni' : 'Kosong'}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3 min-h-[80px] bg-neutral-100">
                  {house.current_resident ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">{house.current_resident.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">{house.current_resident.phone}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        house.current_resident.resident_status === 'permanent' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {RESIDENT_STATUS_LABELS[house.current_resident.resident_status]}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-400">Tidak ada penghuni</p>
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4 flex gap-2 border-t border-gray-200 pt-3 bg-neutral-100">
                  <button onClick={() => openHistory(house)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors flex-1 justify-center">
                    <History size={13} /> Riwayat
                  </button>
                  <button onClick={() => openEdit(house)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(house.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Rumah' : 'Tambah Rumah'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rumah *</label>
            <input className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" placeholder="Contoh: A-01" value={form.house_number} onChange={e => setForm(f => ({ ...f, house_number: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Penghuni</label>
            <select className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" value={form.resident_id} onChange={e => setForm(f => ({ ...f, resident_id: e.target.value }))}>
              <option value="">-- Tidak Ada Penghuni --</option>
              {residents
                .filter(r => !r.house_id || r.id === editItem?.current_resident?.id)
                .map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto Rumah (opsional)</label>
            <input type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, house_image: e.target.files[0] }))} className="w-full outline-none focus:ring-0 px-4 py-2 border border-gray-300 rounded-lg" />
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
        isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Hapus Rumah" message="Apakah Anda yakin ingin menghapus rumah ini?"
      />

      <Modal isOpen={!!historyHouse} onClose={() => setHistoryHouse(null)} title={`Riwayat Penghuni - Rumah ${historyHouse?.house_number}`} size="md">
        {historyLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : !historyData?.history?.length ? (
          <p className="text-gray-400 text-center py-8">Belum ada riwayat penghuni</p>
        ) : (
          <div className="space-y-3">
            {historyData.history.map((h, i) => (
              <div key={h.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 ${h.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {i < historyData.history.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <p className="font-medium text-gray-900">{h.resident?.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(h.start_date)} — {h.end_date ? formatDate(h.end_date) : 'Sekarang'}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    h.resident?.resident_status === 'permanent' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {RESIDENT_STATUS_LABELS[h.resident?.resident_status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  );
}