import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, useAuthSession } from '@/config/api';
export interface NotificationPreferences { inAppAlerts: boolean; queueAlerts: boolean; promoEmailOptIn: boolean; reminders: boolean; reminderOffset: '30m' | '1h' | '1d'; }
export function useNotificationPreferences() {
  const session = useAuthSession();
  const queryKey = ['notificationPreferences', session];
  const cache = useQueryClient();
  const query = useQuery({ queryKey, queryFn: async () => (await apiClient.get<{data:{preferences:NotificationPreferences}}>('/preferences')).data.data.preferences });
  const mutation = useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => (await apiClient.patch<{data:{preferences:NotificationPreferences}}>('/preferences', patch)).data.data.preferences,
    onSuccess: preferences => { cache.setQueryData(queryKey, preferences); },
  });
  return { ...query, save: mutation.mutateAsync, saving: mutation.isPending };
}
