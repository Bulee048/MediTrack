import { cn } from '@/lib/utils';

export function MediTrackIcon({ size = 40, className, title = 'MediTrack' }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      className={cn('shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="mtFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#63AEF2" />
          <stop offset="45%" stopColor="#2E82D8" />
          <stop offset="100%" stopColor="#1462BE" />
        </linearGradient>
        <linearGradient id="mtArrow" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#2E76C4" />
          <stop offset="55%" stopColor="#17549B" />
          <stop offset="100%" stopColor="#0D3D75" />
        </linearGradient>
        <linearGradient id="mtCross" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#17D3B0" />
          <stop offset="100%" stopColor="#00A98C" />
        </linearGradient>
      </defs>

      <rect x="30" y="30" width="340" height="340" rx="80" fill="url(#mtFrame)" />
      <rect x="38" y="38" width="324" height="324" rx="74" fill="none" stroke="#8CC8F7" strokeOpacity=".5" strokeWidth="3" />
      <rect x="58" y="58" width="284" height="284" rx="56" fill="#FFFFFF" />

      <rect x="177" y="112" width="46" height="160" rx="14" fill="url(#mtCross)" />
      <rect x="120" y="169" width="160" height="46" rx="14" fill="url(#mtCross)" />

      <path
        d="M100 288C145 246 180 208 218 177c24 -18 47 -40 74 -73-18 40 -44 68 -69 91-40 32 -82 74 -112 114-8 10 -14 -6 -11 -21Z"
        fill="url(#mtArrow)"
      />
      <path d="M300 100 266 105 296 134Z" fill="url(#mtArrow)" />

      <g fill="#12C2A4">
        <circle cx="100" cy="292" r="17" />
        <circle cx="128" cy="318" r="17" />
        <circle cx="160" cy="340" r="17" />
      </g>
      <g fill="#FFFFFF">
        <path d="M109 292 94 285 94 299Z" />
        <path d="M137 318 122 311 122 325Z" />
        <path d="M169 340 154 333 154 347Z" />
      </g>
    </svg>
  );
}

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return <MediTrackIcon size={size} className={cn('rounded-[28%]', className)} />;
}

export function Wordmark({ tone = 'dark', size = 'md' }: { tone?: 'dark' | 'light'; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'text-base', md: 'text-xl', lg: 'text-[30px]' }[size];
  return (
    <span className={cn('font-extrabold tracking-tight', s)}>
      <span className={tone === 'dark' ? 'text-ink' : 'text-white'}>Med</span>
      <span className="text-brand-600">Queue</span>
    </span>
  );
}

export function MediTrackWord({ size = 16 }: { size?: number }) {
  return (
    <span style={{ fontSize: size }} className="font-extrabold tracking-tight">
      <span className="text-[#103A66]">Medi</span>
      <span className="text-[#0FA98C]">Track</span>
    </span>
  );
}

export function MediTrackLockup({ size = 96 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <MediTrackIcon size={size} />
      <MediTrackWord size={Math.round(size * 0.2)} />
    </div>
  );
}
