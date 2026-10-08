import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CalendarDays, CheckCircle2, Clock3, AlertCircle, Info, CheckCheck, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationApiService, type NotificationData } from '@/services/notificationApi';
import { getAuthErrorStatus, useAuthSession } from '@/config/api';
import { Link, useLocation } from 'react-router-dom';

type Filter = 'all' | 'queue' | 'appointment' | 'system';
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'queue', label: 'Queue' },
  { value: 'appointment', label: 'Appointment' }, { value: 'system', label: 'System' },
];
const categories = {
  QUEUE_CREATED: { group: 'queue', label: 'Queue ticket', icon: Ticket, tone: 'bg-teal-50 text-teal-700' },
  QUEUE_UPDATE: { group: 'queue', label: 'Queue update', icon: Clock3, tone: 'bg-sky-50 text-sky-700' },
  ALMOST_TURN: { group: 'queue', label: 'Almost your turn', icon: Bell, tone: 'bg-amber-50 text-amber-800' },
  YOUR_TURN: { group: 'queue', label: 'Your turn', icon: CheckCircle2, tone: 'bg-teal-100 text-teal-800' },
  APPOINTMENT_CREATED: { group: 'appointment', label: 'Appointment created', icon: CalendarDays, tone: 'bg-sky-50 text-sky-700' },
  APPOINTMENT_UPDATED: { group: 'appointment', label: 'Appointment updated', icon: CalendarDays, tone: 'bg-sky-50 text-sky-700' },
  APPOINTMENT_CANCELLED: { group: 'appointment', label: 'Appointment cancelled', icon: CalendarDays, tone: 'bg-slate-100 text-slate-700' },
  SYSTEM: { group: 'system', label: 'System', icon: Info, tone: 'bg-slate-100 text-slate-700' },
} as const;
const cardStyle = 'min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_-6px_rgba(16,26,46,0.15)]';

/** Uses the notification's actual timestamp; older items retain local date and time. */
export function notificationTime(createdAt: string, now: number): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  const elapsed = now - date.getTime();
  const localTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (elapsed >= 0 && elapsed < 60000) return 'Just now';
  if (elapsed >= 60000 && elapsed < 3600000) return `${Math.floor(elapsed / 60000)} min ago`;
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (elapsed >= 0 && date.toDateString() === today.toDateString()) return `${Math.floor(elapsed / 3600000)} hr ago`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${localTime}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) })}, ${localTime}`;
}

export function NotificationsList() {
  const location = useLocation();
  const authSession = useAuthSession();
  const queryKey = ['myNotifications', authSession];
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const { data: notifications = [], isLoading, isFetching, isError, error, refetch } = useQuery<NotificationData[]>({
    queryKey, queryFn: () => NotificationApiService.getUserNotifications(), refetchInterval: 15000,
  });
  const markRead = useMutation({
    mutationFn: NotificationApiService.markAsRead,
    onMutate: () => setFeedback(null),
    onSuccess: (notification) => {
      // Update only from the server-confirmed response, without assuming ownership.
      queryClient.setQueryData<NotificationData[]>(queryKey, items => items?.map(item => item._id === notification._id ? notification : item));
      setFeedback({ error: false, message: 'Notification marked as read.' });
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => setFeedback({ error: true, message: 'Could not mark the notification as read. Please try again.' }),
  });
  const markAll = useMutation({
    mutationFn: NotificationApiService.markAllAsRead,
    onMutate: () => setFeedback(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      setFeedback({ error: false, message: 'All notifications marked as read.' });
    },
    onError: () => setFeedback({ error: true, message: 'Could not mark all notifications as read. Please try again.' }),
  });
  const pending = markRead.isPending || markAll.isPending;
  const authError = getAuthErrorStatus(error);
  const unread = notifications.filter(item => !item.isRead).length;
  const filtered = notifications.filter(item => filter === 'all' || categories[item.category].group === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto w-full min-w-0 max-w-md space-y-4 text-slate-900">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight">Notifications</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-slate-600">{isLoading ? 'Checking for updates…' : isError && (authError || !notifications.length) ? 'Updates unavailable' : `${unread} unread`}</p>
          <Button variant="ghost" disabled={!unread || pending || isLoading || Boolean(authError)} onClick={() => markAll.mutate()}
            className="min-h-11 whitespace-normal px-2 text-xs font-bold text-teal-700 hover:bg-teal-50 hover:text-teal-800 focus-visible:ring-teal-700">
            <CheckCheck aria-hidden="true" className="mr-1.5 h-4 w-4 shrink-0" />
            {markAll.isPending ? 'Marking all…' : 'Mark all read'}
          </Button>
        </div>
      </header>
      <div role="group" aria-label="Filter notifications" className="flex flex-wrap gap-2">
        {filters.map(item => (
          <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}
            className={`min-h-11 rounded-full border px-3.5 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 ${filter === item.value ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-teal-50'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true">
        {feedback && <p className={`rounded-xl border p-3 text-sm ${feedback.error ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-teal-200 bg-teal-50 text-teal-900'}`}>{feedback.message}</p>}
      </div>
      {isError && (
        <section role="alert" className={`${cardStyle} border-rose-200 text-center`}>
          <AlertCircle aria-hidden="true" className="mx-auto h-8 w-8 text-rose-700" />
          <h2 className="mt-3 text-base font-bold">{authError === 401 ? 'Sign in to view notifications' : authError === 403 ? 'Notification access unavailable' : 'Unable to load notifications'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{authError === 401 ? 'Your session is missing or has expired. Please sign in, then try again.' : authError === 403 ? 'This page is available to patient accounts.' : notifications.length ? 'Your last notifications are shown below. Please try refreshing.' : 'Please check your connection and try again.'}</p>
          {authError === 401 ? (
            <Link to="/login" state={{ from: location.pathname }} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">Sign in</Link>
          ) : <Button variant="outline" disabled={isFetching} aria-label="Retry loading notifications" onClick={() => void refetch()}
            className="mt-4 min-h-11 rounded-xl text-teal-700 focus-visible:ring-teal-700">{isFetching ? 'Retrying…' : 'Try again'}</Button>}
        </section>
      )}
      {isLoading ? (
        <section role="status" aria-live="polite" aria-busy="true" className={`${cardStyle} py-10 text-center`}>
          <Bell aria-hidden="true" className="mx-auto h-8 w-8 text-teal-700" />
          <h2 className="mt-3 text-base font-bold">Loading notifications</h2>
          <p className="mt-2 text-sm text-slate-600">Getting your latest updates.</p>
        </section>
      ) : filtered.length && !authError ? (
        <ul aria-label="Notifications, newest first" className="space-y-3">
          {filtered.map(item => (
            <li key={item._id}>
              <NotificationCard notification={item} now={now} disabled={pending}
                pending={markAll.isPending || (markRead.isPending && markRead.variables === item._id)}
                onRead={() => markRead.mutate(item._id)} />
            </li>
          ))}
        </ul>
      ) : !isError && (
        <section className={`${cardStyle} py-9 text-center`}>
          <Bell aria-hidden="true" className="mx-auto h-9 w-9 text-teal-700" />
          <h2 className="mt-4 text-base font-extrabold">{notifications.length ? `No ${filter} notifications` : 'Nothing new'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{notifications.length ? 'Choose another filter to see your other updates.' : 'Queue and appointment updates will appear here.'}</p>
        </section>
      )}
    </div>
  );
}

function NotificationCard({ notification: item, now, disabled, pending, onRead }: {
  notification: NotificationData; now: number; disabled: boolean; pending: boolean; onRead: () => void;
}) {
  const category = categories[item.category];
  const Icon = category.icon;
  const validTime = !Number.isNaN(new Date(item.createdAt).getTime());
  return (
    <article aria-busy={pending} className={`${cardStyle} ${item.isRead ? '' : 'border-teal-300 ring-1 ring-teal-100'}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${category.tone}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="break-words text-sm font-extrabold leading-snug">{item.title}</h2>
            {!item.isRead && <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-700" />}
          </div>
          <p className="mt-1 break-words text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{item.message}</p>
          <p className="mt-2 break-words text-xs font-semibold text-slate-600">{category.label} · {item.isRead ? 'Read' : 'Unread'}</p>
          <time dateTime={validTime ? item.createdAt : undefined} title={validTime ? new Date(item.createdAt).toLocaleString() : undefined}
            className="mt-1 block text-xs leading-relaxed text-slate-600">{notificationTime(item.createdAt, now)}</time>
          {!item.isRead && (
            <button type="button" disabled={disabled} onClick={onRead} aria-label={`Mark notification as read: ${item.title}`}
              className="mt-2 min-h-11 rounded-lg px-2 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:cursor-wait disabled:opacity-60">
              {pending ? 'Marking as read…' : 'Mark as read'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
