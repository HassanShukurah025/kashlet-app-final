import { classNames } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'card' | 'row';
}

export default function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={classNames('rounded-card border border-base-border p-4 space-y-3', className)}>
        <div className="h-4 w-1/3 rounded bg-base-border skeleton-pulse" />
        <div className="h-8 w-2/3 rounded bg-base-border skeleton-pulse" />
        <div className="h-3 w-1/2 rounded bg-base-border skeleton-pulse" />
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className={classNames('flex items-center gap-4 py-3', className)}>
        <div className="h-4 w-24 rounded bg-base-border skeleton-pulse" />
        <div className="h-4 w-32 rounded bg-base-border skeleton-pulse" />
        <div className="h-4 w-20 rounded bg-base-border skeleton-pulse" />
        <div className="h-4 w-16 rounded bg-base-border skeleton-pulse" />
        <div className="h-4 w-10 rounded bg-base-border skeleton-pulse" />
      </div>
    );
  }

  return (
    <div className={classNames('h-4 rounded bg-base-border skeleton-pulse', className)} />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-base-border">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="row" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return <Skeleton variant="card" />;
}
