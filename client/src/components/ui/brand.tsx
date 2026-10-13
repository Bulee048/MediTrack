import { cn } from '@/lib/utils';

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('brand-lockup flex items-center gap-2.5', className)}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18A6A6] via-[#146C94] to-[#105779] p-2 text-white shadow-md shadow-[#146C94]/20">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v16m-8-8h16" />
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-xl font-black tracking-tight text-[#183247]">
            Care<span className="text-[#146C94]">Flow</span>
          </span>
          <span className="block text-[0.6875rem] font-semibold tracking-wide text-[#64798B]">
            Smart OPD Queue
          </span>
        </span>
      )}
    </span>
  );
}
