import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function LiveDigitalClock() {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time (e.g. 09:42 AM)
  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Format date (e.g. Wednesday, 14 October 2026)
  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/70 backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_24px_rgba(20,108,148,0.06)]">
      {/* Soft Ambient Light Gradient */}
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-gradient-to-tr from-[#18A6A6]/10 to-[#146C94]/10 blur-xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#146C94] font-mono">
              {timeString}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-bold text-[#64798B]">
            {dateString}
          </p>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[#EBF5FB] border border-[#DCE8EE] text-[#146C94] shadow-xs">
            <Clock size={20} className="animate-pulse" />
          </div>
          <span className="mt-2 text-[0.625rem] sm:text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#64798B]">
            Sri Lanka Time
          </span>
        </div>
      </div>
    </div>
  );
}
