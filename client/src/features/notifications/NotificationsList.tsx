import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  Clock3,
  Ticket,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationApiService, type NotificationData } from '@/services/notificationApi';
import { useAuthSession } from '@/config/api';
import { LoadingState } from '@/components/ui/feedback';
import { SwipeableNotificationCard } from './components/SwipeableNotificationCard';

export function NotificationsList() {
  const authSession = useAuthSession();
  const queryKey = ['myNotifications', authSession];
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Dismissed items tracking for instant optimistic UI + Undo snackbar
  const [dismissedNotification, setDismissedNotification] = useState<NotificationData | null>(null);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: notifications = [],
    isLoading,
  } = useQuery<NotificationData[]>({
    queryKey,
    queryFn: () => NotificationApiService.getUserNotifications(),
    refetchInterval: 12000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
  });

  const markRead = useMutation({
    mutationFn: NotificationApiService.markAsRead,
    onSuccess: (notification) => {
      queryClient.setQueryData<NotificationData[]>(queryKey, (items) =>
        items?.map((item) => (item._id === notification._id ? notification : item))
      );
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAll = useMutation({
    mutationFn: NotificationApiService.markAllAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => NotificationApiService.dismiss(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => NotificationApiService.restore(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleDismiss = (item: NotificationData) => {
    // Add to dismissing set for animation collapse
    setDismissingIds((prev) => new Set(prev).add(item._id));
    setDismissedNotification(item);

    // Call backend dismiss
    dismissMutation.mutate(item._id);

    // Setup auto-dismiss snackbar timer (6 seconds)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setDismissedNotification(null);
    }, 6000);
  };

  const handleUndo = () => {
    if (!dismissedNotification) return;
    const restoredItem = dismissedNotification;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    // Remove from dismissing state
    setDismissingIds((prev) => {
      const next = new Set(prev);
      next.delete(restoredItem._id);
      return next;
    });
    setDismissedNotification(null);

    // Call backend restore
    restoreMutation.mutate(restoredItem._id);
  };

  // Exclude actively dismissing items from visible list
  const activeNotifications = notifications.filter(
    (item) => !dismissingIds.has(item._id) && !item.isDismissed
  );

  const unreadCount = activeNotifications.filter((item) => !item.isRead).length;

  const filtered = activeNotifications
    .filter((item) => filter === 'all' || !item.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'YOUR_TURN':
        return { icon: CheckCircle2, tone: 'bg-[#20A779]/10 text-[#20A779]', label: 'Your Turn' };
      case 'ALMOST_TURN':
        return { icon: Bell, tone: 'bg-[#E9A23B]/10 text-[#E9A23B]', label: 'Almost Your Turn' };
      case 'QUEUE_CREATED':
      case 'QUEUE_UPDATE':
        return { icon: Ticket, tone: 'bg-[#146C94]/10 text-[#146C94]', label: 'Queue Update' };
      default:
        return { icon: Clock3, tone: 'bg-[#64798B]/10 text-[#64798B]', label: 'Notification' };
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-md space-y-4 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-xl font-black text-[#183247]">Notifications</h1>
          <p className="text-xs font-semibold text-[#64798B]">
            {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
            className="text-xs font-bold text-[#146C94] hover:bg-[#EBF5FB]"
          >
            <CheckCheck size={14} className="mr-1.5" />
            Mark all read
          </Button>
        )}
      </header>

      {/* Filter Tabs: All vs Unread */}
      <div className="flex rounded-2xl bg-[#EBF2F6] p-1 text-xs font-bold text-[#64798B]">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 rounded-xl py-2 transition-all ${
            filter === 'all' ? 'bg-white text-[#146C94] shadow-sm' : 'hover:text-[#183247]'
          }`}
        >
          All ({activeNotifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`flex-1 rounded-xl py-2 transition-all ${
            filter === 'unread' ? 'bg-white text-[#146C94] shadow-sm' : 'hover:text-[#183247]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Swipe Tip Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-[#EBF5FB] px-4 py-2 text-[0.6875rem] font-bold text-[#146C94]">
        <span>💡 Tip: Swipe card left or right to dismiss</span>
      </div>

      {isLoading ? (
        <LoadingState label="Loading CareFlow notifications..." />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6FAFD] text-[#64798B]">
            <Bell size={24} />
          </div>
          <h2 className="mt-4 text-base font-bold text-[#183247]">No notifications</h2>
          <p className="mt-1 text-xs text-[#64798B]">
            {filter === 'unread' ? 'You have read all notifications.' : 'Queue and appointment updates will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map((item) => {
            const { icon, tone, label } = getCategoryTheme(item.category);
            const formattedTime = new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const formattedDate = new Date(item.createdAt).toLocaleDateString([], {
              day: '2-digit',
              month: 'short',
            });

            return (
              <SwipeableNotificationCard
                key={item._id}
                notification={item}
                categoryIcon={icon}
                categoryTone={tone}
                categoryLabel={label}
                formattedDate={formattedDate}
                formattedTime={formattedTime}
                isDismissing={dismissingIds.has(item._id)}
                onRead={() => markRead.mutate(item._id)}
                onDismiss={() => handleDismiss(item)}
              />
            );
          })}
        </div>
      )}

      {/* Floating Undo Snackbar */}
      {dismissedNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm flex items-center justify-between rounded-2xl bg-[#183247] px-4 py-3 text-white shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span>Notification dismissed</span>
          </div>

          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-[#18A6A6] hover:bg-white/25 active:scale-95 transition"
          >
            <RotateCcw size={13} />
            <span>Undo</span>
          </button>
        </div>
      )}
    </div>
  );
}
