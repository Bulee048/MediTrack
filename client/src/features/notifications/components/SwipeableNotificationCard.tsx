import { useState, useRef, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import type { NotificationData } from '@/services/notificationApi';

interface SwipeableNotificationCardProps {
  notification: NotificationData;
  categoryIcon: React.ElementType;
  categoryTone: string;
  categoryLabel: string;
  formattedDate: string;
  formattedTime: string;
  onRead: () => void;
  onDismiss: () => void;
  isDismissing?: boolean;
}

export function SwipeableNotificationCard({
  notification,
  categoryIcon: Icon,
  categoryTone,
  categoryLabel,
  formattedDate,
  formattedTime,
  onRead,
  onDismiss,
  isDismissing = false,
}: SwipeableNotificationCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwipedOut, setIsSwipedOut] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalScrollRef = useRef<boolean | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(0);

  // Reset swiped out if undo happens
  useEffect(() => {
    if (!isDismissing) {
      setIsSwipedOut(false);
      setOffsetX(0);
    }
  }, [isDismissing]);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isDismissing || isSwipedOut) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    startXRef.current = clientX;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    isHorizontalScrollRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isDismissing || isSwipedOut) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;

    // Detect gesture intent: horizontal swipe vs vertical scroll
    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalScrollRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (!isHorizontalScrollRef.current) {
      return;
    }

    // Apply natural drag resistance
    const resistance = 0.85;
    setOffsetX(deltaX * resistance);
  };

  const handleTouchEnd = () => {
    if (!isDragging || isDismissing || isSwipedOut) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);

    const cardWidth = cardRef.current?.offsetWidth || 340;
    const threshold = cardWidth * 0.35; // 35% dismissal threshold
    const duration = Date.now() - startTimeRef.current;
    const velocity = Math.abs(offsetX) / Math.max(duration, 1);

    // Fast flick (> 0.5px/ms and > 50px displacement) or passed threshold
    const shouldDismiss = Math.abs(offsetX) > threshold || (velocity > 0.5 && Math.abs(offsetX) > 50);

    if (shouldDismiss) {
      const direction = offsetX > 0 ? 'right' : 'left';
      setIsSwipedOut(true);
      setOffsetX(direction === 'right' ? cardWidth + 80 : -cardWidth - 80);

      // Trigger actual dismissal after slide animation completes
      setTimeout(() => {
        onDismiss();
      }, 260);
    } else {
      // Smooth snap back
      setOffsetX(0);
    }
  };

  const absOffset = Math.abs(offsetX);
  const opacityRatio = Math.min(absOffset / 120, 1);
  const rotation = (offsetX / 20); // Subtle 3D tilt

  return (
    <div
      className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${
        isDismissing ? 'max-h-0 opacity-0 mb-0 scale-95 pointer-events-none' : 'max-h-48 opacity-100 mb-3'
      }`}
    >
      {/* Background Action Reveal (Left / Right swipe) */}
      <div
        className={`absolute inset-0 flex items-center justify-between rounded-3xl px-6 transition-colors duration-200 ${
          absOffset > 20 ? 'bg-[#FDECEF]' : 'bg-transparent'
        }`}
      >
        <div
          className="flex items-center gap-2 text-[#DE6470] font-bold text-xs transition-opacity duration-150"
          style={{ opacity: offsetX > 25 ? opacityRatio : 0 }}
        >
          <Trash2 size={20} className="animate-pulse" />
          <span>Dismiss</span>
        </div>

        <div
          className="flex items-center gap-2 text-[#DE6470] font-bold text-xs transition-opacity duration-150"
          style={{ opacity: offsetX < -25 ? opacityRatio : 0 }}
        >
          <span>Dismiss</span>
          <Trash2 size={20} className="animate-pulse" />
        </div>
      </div>

      {/* Foreground Notification Card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px) rotate(${isDragging ? rotation : 0}deg)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
        className={`relative z-10 flex select-none items-start gap-3.5 rounded-3xl border p-4.5 touch-pan-y ${
          notification.isRead
            ? 'border-[#DCE8EE] bg-white shadow-sm'
            : 'border-[#146C94]/30 bg-[#F6FAFD] ring-1 ring-[#146C94]/15 shadow-md'
        }`}
      >
        {/* Category Icon */}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${categoryTone}`}>
          <Icon size={20} />
        </div>

        {/* Content Body */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => !notification.isRead && onRead()}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-black text-[#183247] truncate">{notification.title}</h2>
            <span className="text-[0.625rem] font-semibold text-[#8EA3B0] shrink-0">
              {formattedDate}, {formattedTime}
            </span>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-[#64798B] break-words">
            {notification.message}
          </p>

          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[0.625rem] font-bold uppercase tracking-wider text-[#146C94]">
              {categoryLabel}
            </span>
            {!notification.isRead && (
              <span className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-[#146C94]">
                <span className="h-2 w-2 rounded-full bg-[#146C94] animate-pulse" />
                Unread
              </span>
            )}
          </div>
        </div>

        {/* Accessible dismiss button for non-swipe / keyboard users */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label={`Dismiss notification: ${notification.title}`}
          className="ml-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8EA3B0] hover:bg-[#F6FAFD] hover:text-[#DE6470] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C94]"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
