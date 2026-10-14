import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const dialog = React.useRef<HTMLDialogElement>(null);
  React.useLayoutEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previous = document.activeElement as HTMLElement;
    element.showModal();
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  if (!open) return null;

  return (
    <dialog ref={dialog} className="ui-dialog" aria-label="Dialog" onCancel={e => { e.preventDefault(); onOpenChange(false); }} onClick={e => { if (e.target === dialog.current) onOpenChange(false); }}>
        {children}
    </dialog>
  );
};

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props} />
);

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
);

const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)} {...props} />
);

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
