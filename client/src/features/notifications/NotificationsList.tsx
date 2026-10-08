import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, Clock3, AlertCircle, Info, CheckCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationApiService, type NotificationData } from '@/services/notificationApi';

type FilterCategory = 'all' | 'queue' | 'appointment' | 'system';

export function NotificationsList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterCategory>('all');

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<NotificationData[]>({
    queryKey: ['myNotifications'],
    queryFn: () => NotificationApiService.getUserNotifications(),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: NotificationApiService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNotifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: NotificationApiService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNotifications'] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading notifications...
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50 text-center p-6">
        <CardContent className="space-y-3">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-900">Failed to load notifications</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'queue') return n.category.startsWith('QUEUE') || n.category === 'ALMOST_TURN' || n.category === 'YOUR_TURN';
    if (filter === 'appointment') return n.category.startsWith('APPOINTMENT');
    if (filter === 'system') return n.category === 'SYSTEM';
    return true;
  });

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header controls */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white text-xs">{unreadCount} new</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs matching reference UI */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(['all', 'queue', 'appointment', 'system'] as FilterCategory[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <Card className="border-slate-200 shadow-sm text-center p-8">
          <CardContent className="space-y-2">
            <Bell className="h-8 w-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-700">Nothing new</h3>
            <p className="text-xs text-slate-500">
              Queue and appointment updates will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <Card
              key={n._id}
              onClick={() => !n.isRead && markReadMutation.mutate(n._id)}
              className={`transition cursor-pointer border ${
                n.isRead ? 'border-slate-200 bg-white' : 'border-blue-300 bg-blue-50/40 shadow-sm'
              }`}
            >
              <CardContent className="p-4 flex gap-3 items-start">
                <div className="p-2 rounded-xl shrink-0 mt-0.5 bg-slate-100 text-slate-700">
                  <NotificationIcon category={n.category} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{n.title}</h4>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationIcon({ category }: { category: NotificationData['category'] }) {
  if (category === 'YOUR_TURN') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (category === 'ALMOST_TURN') return <AlertCircle className="h-4 w-4 text-amber-600" />;
  if (category.startsWith('QUEUE')) return <Clock3 className="h-4 w-4 text-blue-600" />;
  return <Info className="h-4 w-4 text-slate-600" />;
}
