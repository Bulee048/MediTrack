import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      duration={4500}
      visibleToasts={3}
      toastOptions={{
        style: { borderRadius: '1rem', background: '#fff', color: 'var(--color-ink)', borderColor: 'var(--color-line)', boxShadow: 'var(--shadow-float)' },
      }}
    />
  );
};
