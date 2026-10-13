interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function CircularProgress({
  percentage,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
  className = '',
}: CircularProgressProps) {
  // Ensure strict mathematical square viewBox coordinates
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  const center = size / 2;
  const displayLabel = label ?? `${safePercentage}%`;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="progressbar"
      aria-valuenow={safePercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${safePercentage} percent progress`}
    >
      <svg
        className="h-full w-full -rotate-90 transform overflow-visible"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id="careFlowRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18A6A6" />
            <stop offset="100%" stopColor="#146C94" />
          </linearGradient>
        </defs>

        {/* Outer Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E5F3F7"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Dynamic Animated Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#careFlowRingGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Mathematically Centered Text Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none p-1">
        <span
          style={{
            fontSize:
              size >= 160
                ? '3.5rem'
                : size >= 120
                ? '2.25rem'
                : size >= 100
                ? '1.45rem'
                : size >= 80
                ? '1.25rem'
                : '0.95rem',
          }}
          className="font-black tracking-tight text-[#183247] leading-none"
        >
          {displayLabel}
        </span>
        {sublabel && (
          <span
            style={{ fontSize: size >= 160 ? '0.8125rem' : '0.625rem' }}
            className="mt-1 font-bold text-[#64798B] leading-tight"
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
