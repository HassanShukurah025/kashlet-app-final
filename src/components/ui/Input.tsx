import { type InputHTMLAttributes, forwardRef } from 'react';
import { classNames } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-body-m font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classNames(
            'h-10 w-full rounded-sm bg-base-bg border px-3 text-body-m text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-base-border-focus',
            error ? 'border-status-error' : 'border-base-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-caption text-status-error">{error}</p>}
        {helper && !error && <p className="text-caption text-text-muted">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
