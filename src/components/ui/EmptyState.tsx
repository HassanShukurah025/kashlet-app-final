import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      <h3 className="text-h3 font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-body-m text-text-secondary max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
