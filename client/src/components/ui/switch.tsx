import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      <span aria-hidden="true" className={cn('relative inline-flex h-[26px] w-[46px] items-center rounded-full transition-colors',checked?'bg-brand-600':'bg-slate-300')}><span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out',
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
        )}
      />
      </span>
    </button>
  );
};

export interface SwitchRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({
  checked,
  onChange,
  title,
  description,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-2.5', className)}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
};
