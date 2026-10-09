import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
// Page content only. Shared PatientShell owns navigation, viewport and scrolling.
export function FeaturePageContent({ children, title, back, action }: {
  children: ReactNode; title?: string; back?: boolean | (() => void); action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <main className="mx-auto w-full max-w-xl bg-canvas px-5 py-4">
      <header className="mb-4 flex items-center gap-3">
        {back && <button type="button" aria-label="Go back"
          onClick={() => typeof back === 'function' ? back() : navigate(-1)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink shadow-soft">
          <ChevronLeft size={19} />
        </button>}
        <h1 className="min-w-0 flex-1 text-[19px] font-extrabold tracking-tight text-ink">{title}</h1>
        {action}
      </header>
      {children}
    </main>
  );
}
