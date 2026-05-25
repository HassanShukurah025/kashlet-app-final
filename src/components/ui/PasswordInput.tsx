import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helper?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-body-m font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={classNames(
              'h-10 w-full rounded-sm bg-base-bg border px-3 pr-10 text-body-m text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-base-border-focus',
              error ? 'border-status-error' : 'border-base-border',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary focus:text-text-secondary focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-caption text-status-error">{error}</p>}
        {helper && !error && <p className="text-caption text-text-muted">{helper}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
