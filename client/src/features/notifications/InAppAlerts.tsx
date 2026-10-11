import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthSession } from '@/config/api';
import { useNotificationPreferences } from '@/services/preferencesApi';
import { NotificationApiService } from '@/services/notificationApi';
/** Optional alerts only; authoritative queue polling is independent. */
export function InAppAlerts() {
  const session = useAuthSession();
  const preferences = useNotificationPreferences();
  const seen = useRef<Set<string> | null>(null);
  const notifications = useQuery({ queryKey: ['myNotifications', session], queryFn: () => NotificationApiService.getUserNotifications(), refetchInterval: 15000 });
  useEffect(() => { seen.current = null; }, [session]);
  useEffect(() => {
    if (!notifications.data || !preferences.data) return;
    if (!seen.current) { seen.current = new Set(notifications.data.map(item => item._id)); return; }
    for (const item of notifications.data) {
      if (seen.current.has(item._id)) continue;
      seen.current.add(item._id);
      const queue = ['QUEUE_CREATED', 'QUEUE_UPDATE', 'ALMOST_TURN', 'YOUR_TURN'].includes(item.category);
      if (!item.isRead && preferences.data.inAppAlerts && (!queue || preferences.data.queueAlerts)) toast(item.title, { description: item.message });
    }
  }, [notifications.data, preferences.data]);
  return null;
}
