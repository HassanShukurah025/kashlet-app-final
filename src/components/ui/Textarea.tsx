import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { classNames } from '../../lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-body-m font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={classNames(
            'w-full rounded-sm bg-base-bg border px-3 py-2 text-body-m text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-base-border-focus min-h-[80px] resize-y',
            error ? 'border-status-error' : 'border-base-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-caption text-status-error">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
