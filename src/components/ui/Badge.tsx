import type { InvoiceStatus } from '../../lib/types';
import { classNames } from '../../lib/utils';

type BadgeVariant = InvoiceStatus | 'receipt';

const config: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-text-muted/15', text: 'text-text-secondary', label: 'Draft' },
  sent: { bg: 'bg-status-info/15', text: 'text-status-info', label: 'Sent' },
  paid: { bg: 'bg-status-success/15', text: 'text-status-success', label: 'Paid' },
  overdue: { bg: 'bg-status-error/15', text: 'text-status-error', label: 'Overdue' },
  receipt: { bg: 'bg-accent/15', text: 'text-accent', label: 'Receipt' },
};

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

export default function Badge({ variant, className }: BadgeProps) {
  const c = config[variant];
  return (
    <span
      className={classNames(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-caption font-medium',
        c.bg,
        c.text,
        className
      )}
    >
      {c.label}
    </span>
  );
}
