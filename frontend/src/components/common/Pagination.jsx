import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, lastPage, onPageChange, total, perPage }) {
  if (lastPage <= 1) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to   = Math.min(currentPage * perPage, total);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-600">
        Menampilkan {from}–{to} dari {total} data
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: lastPage }, (_, i) => i + 1)
          .filter(p => p === 1 || p === lastPage || Math.abs(p - currentPage) <= 2)
          .map((page, idx, arr) => (
            <span key={page}>
              {idx > 0 && arr[idx - 1] !== page - 1 && (
                <span className="px-1 text-gray-400">…</span>
              )}
              <button
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            </span>
          ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}