// Format currency
export const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

// Format date
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

export const formatDateShort = (date) =>
  new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });

// Payment calculation
export const SECURITY_FEE    = 100000;
export const CLEANLINESS_FEE = 15000;

export const getPeriodMultiplier = (period) => ({
  '1_month': 1, '3_months': 3, '6_months': 6, '1_year': 12
}[period] ?? 1);

export const calculateTotal = (type, period) => {
  const m = getPeriodMultiplier(period);
  if (type === 'security')    return SECURITY_FEE * m;
  if (type === 'cleanliness') return CLEANLINESS_FEE * m;
  if (type === 'both')        return (SECURITY_FEE + CLEANLINESS_FEE) * m;
  return 0;
};

// Labels
export const PAYMENT_TYPE_LABELS = {
  security: 'Satpam', cleanliness: 'Kebersihan', both: 'Keduanya',
};

export const PERIOD_LABELS = {
  '1_month': '1 Bulan', '3_months': '3 Bulan', '6_months': '6 Bulan', '1_year': '1 Tahun',
};

export const RESIDENT_STATUS_LABELS = {
  permanent: 'Tetap', contract: 'Kontrak',
};

export const EXPENSE_CATEGORY_LABELS = {
  road_repair:      'Perbaikan Jalan',
  drainage:         'Perbaikan Selokan',
  security_salary:  'Gaji Satpam',
  electricity:      'Token Listrik',
  other:            'Lainnya',
};

export const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

export const getPeriodEndDate = (startDate, periodType) => {
  const date = new Date(startDate);
  const months = getPeriodMultiplier(periodType);
  date.setMonth(date.getMonth() + months);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};