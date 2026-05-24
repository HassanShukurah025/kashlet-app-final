import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-status-error/30 bg-status-error/5 px-4 py-3 my-4">
      <AlertCircle className="w-4 h-4 text-status-error shrink-0" />
      <p className="text-body-m text-text-primary flex-1">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
