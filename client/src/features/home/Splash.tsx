import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MediTrackLockup, Wordmark } from '@/components/Brand';

export function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 40);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-white via-[#FBFDFD] to-brand-50/50 px-6">
      <div className="relative flex flex-1 w-full items-center justify-center">
        <div className="absolute grid h-[300px] w-[300px] place-items-center rounded-full border-[16px] border-[#EDF2F9]">
          <div className="absolute inset-[-16px] rounded-full bg-gradient-to-br from-brand-50/70 to-[#F3F7FC] opacity-80" />
        </div>

        <div className="relative z-10">
          <MediTrackLockup size={104} />
        </div>
      </div>

      <div className="relative z-10 -mt-6 text-center">
        <Wordmark size="lg" />
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">Your Health, Zero Wait</p>
      </div>

      <div className="mt-auto w-full max-w-sm pb-10">
        <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-brand-100">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
        <button
          onClick={() => navigate('/portal')}
          className="flex w-full items-center justify-center h-[52px] rounded-xl bg-brand-600 text-[15px] font-semibold text-white shadow-soft transition hover:bg-brand-700 active:scale-[0.985]"
        >
          Get Started
        </button>
        <p className="mt-8 text-center text-[12px] font-medium text-ink-faint">Version 1.0.0</p>
      </div>
    </div>
  );
}
