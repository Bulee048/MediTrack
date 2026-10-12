import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
// Page content only. Shared PatientShell owns navigation, viewport and scrolling.
export function FeaturePageContent({ children, title, back, action }: {
  children: ReactNode; title?: string; back?: boolean | (() => void); action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <main data-feature-accessibility className="patient-page page-enter">
      <header className="page-header">
        {back && <button type="button" aria-label="Go back"
          onClick={() => typeof back === 'function' ? back() : navigate(-1)}
          className="icon-button">
          <ChevronLeft size={19} />
        </button>}
        <h1 className="page-title min-w-0 flex-1 text-ink">{title}</h1>
        {action}
      </header>
      {children}
    </main>
  );
}
