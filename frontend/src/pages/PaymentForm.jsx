import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPayment } from '../services/api';
import { formatRupiah, calculateTotal, getPeriodEndDate, PAYMENT_TYPE_LABELS, PERIOD_LABELS } from '../utils/helpers';
import { Home, Upload, CheckCircle, LogOut, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function PaymentForm() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    payment_type: 'security',
    period_type: '1_month',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [proofFile, setProofFile]       = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = calculateTotal(form.payment_type, form.period_type);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofFile) { toast.error('Harap upload bukti pembayaran'); return; }

    setLoading(true);
    try {
      const periodStart = form.payment_date;
      const periodEnd   = getPeriodEndDate(periodStart, form.period_type);

      const fd = new FormData();
      fd.append('payment_type', form.payment_type);
      fd.append('period_type',  form.period_type);
      fd.append('total_amount', total);
      fd.append('payment_date', form.payment_date);
      fd.append('period_start', periodStart);
      fd.append('period_end',   periodEnd);
      fd.append('proof_image',  proofFile);

      await createPayment(fd);
      setSuccess(true);
      toast.success('Pembayaran berhasil dikirim!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim pembayaran';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Terkirim!</h2>
          <p className="text-gray-500 mb-2">
            Pembayaran <strong>{PAYMENT_TYPE_LABELS[form.payment_type]}</strong> untuk periode <strong>{PERIOD_LABELS[form.period_type]}</strong> sebesar <strong>{formatRupiah(total)}</strong> berhasil dikirim.
          </p>
          <p className="text-sm text-gray-400 mb-6">Menunggu konfirmasi dari admin RT</p>
          <button
            onClick={() => { setSuccess(false); setProofFile(null); setProofPreview(null); }}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-full py-3 text-base"
          >
            Kirim Pembayaran Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">RT Management</p>
              <p className="text-xs text-gray-500">Form Pembayaran</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Rumah {user?.house?.house_number ?? '-'}</p>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Keluar">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bayar Iuran</h1>
          <p className="text-gray-500 text-sm mt-1">Halo, <strong>{user?.name}</strong>! Silakan lengkapi form berikut.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Payment Type */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Jenis Iuran</h3>
            <div className="space-y-3">
              {[
                { value: 'security',    label: 'Satpam',   price: 100000, desc: 'Iuran keamanan lingkungan' },
                { value: 'cleanliness', label: 'Kebersihan',price: 15000, desc: 'Iuran kebersihan lingkungan' },
                { value: 'both',        label: 'Keduanya', price: 115000, desc: 'Satpam + Kebersihan' },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.payment_type === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_type"
                    value={opt.value}
                    checked={form.payment_type === opt.value}
                    onChange={e => setForm({ ...form, payment_type: e.target.value })}
                    className="text-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  <p className="font-semibold text-gray-700">{formatRupiah(opt.price)}/bln</p>
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Periode Pembayaran</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: '1_month',   label: '1 Bulan' },
                { value: '3_months',  label: '3 Bulan' },
                { value: '6_months',  label: '6 Bulan' },
                { value: '1_year',    label: '1 Tahun' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, period_type: opt.value })}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.period_type === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Tanggal Pembayaran</h3>
            <input
              type="date"
              className="input-field"
              value={form.payment_date}
              onChange={e => setForm({ ...form, payment_date: e.target.value })}
              required
            />
          </div>

          <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3 text-sm text-blue-600 mt-1">
              <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Pembayaran</p>
                <p className="text-xs text-blue-400 mt-0.5">
                  {PAYMENT_TYPE_LABELS[form.payment_type]} × {PERIOD_LABELS[form.period_type]}
                </p>
              </div>
              <p className="text-xl md:text-3xl font-bold text-blue-600">{formatRupiah(total)}</p>
            </div>
              <p class="font-bold">BRI: 388301029202539</p>
              <p>A.N: Mas Bahlil</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-1">Bukti Transfer</h3>
            <p className="text-xs text-gray-500 mb-4">Upload screenshot bukti transfer (JPG/PNG, maks 2MB)</p>

            {proofPreview ? (
              <div className="relative">
                <img src={proofPreview} alt="Bukti" className="w-full max-h-64 object-contain rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={() => { setProofFile(null); setProofPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                <Upload size={28} className="text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Klik untuk upload</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP maks 2MB</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-full py-3 text-base" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Mengirim...
              </span>
            ) : `Kirim Pembayaran ${formatRupiah(total)}`}
          </button>
        </form>
      </div>
    </div>
  );
}