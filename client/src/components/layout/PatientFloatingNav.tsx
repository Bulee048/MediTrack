import { useMemo, useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  House,
  CalendarDays,
  Clock3,
  UsersRound,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: '/app/home', label: 'Home', icon: House },
  { to: '/app/appointments', label: 'Visits', icon: CalendarDays },
  { to: '/queue', label: 'Queue', icon: Clock3 },
  { to: '/app/family', label: 'Family', icon: UsersRound },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
];

export function PatientFloatingNav() {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  // Determine active item index based on current path
  const activeIndex = useMemo(() => {
    const current = location.pathname;
    const idx = NAV_ITEMS.findIndex((item) => {
      if (item.to === '/app/home') {
        return current === '/app/home' || current === '/app' || current === '/';
      }
      return current.startsWith(item.to);
    });
    return idx >= 0 ? idx : 0;
  }, [location.pathname]);

  // Update floating active indicator position seamlessly across window resizes
  useEffect(() => {
    const updatePosition = () => {
      if (!navRef.current) return;
      const navButtons = navRef.current.querySelectorAll<HTMLAnchorElement>('.careflow-nav-item');
      const activeEl = navButtons[activeIndex];
      if (activeEl) {
        const navRect = navRef.current.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: activeRect.left - navRect.left,
          width: activeRect.width,
          opacity: 1,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [activeIndex]);

  return (
    <nav
      aria-label="Patient navigation dock"
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      {/* Outer Floating Frosted Glass Container */}
      <div
        ref={navRef}
        className="pointer-events-auto relative flex w-full max-w-[460px] items-center justify-between p-1.5 sm:p-2 rounded-[28px] sm:rounded-[32px] bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_36px_-6px_rgba(20,108,148,0.18),0_4px_16px_rgba(20,108,148,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-300"
      >
        {/* Subtle Upper Glass Highlight Reflection */}
        <div className="absolute inset-x-6 top-0 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

        {/* Ambient Medical Blue & Soft Teal Underglow Reflection */}
        <div className="absolute -inset-1 -z-10 rounded-[34px] bg-gradient-to-r from-[#146C94]/10 via-[#18A6A6]/10 to-[#146C94]/10 blur-xl opacity-75 pointer-events-none" />

        {/* Smooth Gliding Active Capsule Highlight */}
        <div
          className="absolute top-1.5 bottom-1.5 sm:top-2 sm:bottom-2 rounded-[22px] sm:rounded-[24px] bg-gradient-to-b from-[#E7F6F8] to-[#D5EFF3] border border-[#BCE4EA]/80 shadow-[0_4px_14px_rgba(24,166,166,0.18),inset_0_1px_2px_rgba(255,255,255,0.9)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
          }}
        />

        {/* 5 Equal-Width Navigation Items */}
        {NAV_ITEMS.map((item, index) => {
          const isActive = index === activeIndex;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`careflow-nav-item group relative z-10 flex flex-1 flex-col items-center justify-center py-2 sm:py-2.5 px-1 min-h-[52px] rounded-[22px] sm:rounded-[24px] select-none outline-none transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#146C94] focus-visible:ring-offset-1 ${
                isActive ? 'text-[#146C94]' : 'text-[#64798B] hover:text-[#183247]'
              }`}
            >
              {/* Icon with Smooth Scale & Color Transition */}
              <div
                className={`relative flex items-center justify-center transition-transform duration-250 ${
                  isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? 'text-[#146C94] drop-shadow-[0_2px_6px_rgba(20,108,148,0.25)]'
                      : 'text-[#64798B] group-hover:text-[#183247]'
                  }`}
                  aria-hidden="true"
                />

                {/* Micro Active Indicator Dot */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-[#18A6A6] shadow-[0_0_6px_#18A6A6]" />
                )}
              </div>

              {/* Label Typography */}
              <span
                className={`mt-1 text-[0.6875rem] leading-none transition-all duration-200 ${
                  isActive
                    ? 'font-black tracking-tight text-[#146C94]'
                    : 'font-semibold tracking-normal text-[#64798B] group-hover:text-[#183247]'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
