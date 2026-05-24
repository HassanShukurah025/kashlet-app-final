import Button from './Button';
import Modal from './Modal';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  confirmLabel = 'Delete',
  loading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body-m text-text-secondary">{message}</p>
      {warning && (
        <p className="text-caption text-status-warning mt-2">{warning}</p>
      )}
    </Modal>
  );
}
