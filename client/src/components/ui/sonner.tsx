import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className: 'bg-background text-foreground border-border shadow-lg',
      }}
    />
  );
};
