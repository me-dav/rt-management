import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Hapus', confirmClass = 'btn-danger', loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Batal</button>
        <button onClick={onConfirm} className={confirmClass} disabled={loading}>
          {loading ? 'Memproses...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}