import * as React from 'react';
import { Button } from './button';

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default',
}) => {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  React.useLayoutEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) {
      returnFocus.current = document.activeElement as HTMLElement;
      element.showModal();
    }
    return () => {
      if (element?.open) element.close();
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    };
  }, [open]);
  const close = () => {
    dialog.current?.close();
    onOpenChange(false);
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
  };
  if (!open) return null;

  return (
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClick={(e) => { if (e.target === dialog.current) close(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-background p-6 shadow-lg backdrop:bg-black/50">
        <h3 id={titleId} className="text-lg font-bold text-foreground">{title}</h3>
        <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={close}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
              close();
            }}
          >
            {confirmText}
          </Button>
        </div>
    </dialog>
  );
};

export { AlertDialog };
