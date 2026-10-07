import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children, side = 'right' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />
      <div
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col bg-background p-6 shadow-lg transition-transform border-l border-border w-full max-w-sm sm:max-w-md',
          side === 'right' ? 'right-0' : 'left-0'
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
};

export { Sheet };
