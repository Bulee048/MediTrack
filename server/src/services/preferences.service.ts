import { User, type NotificationPreferences } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
export const defaultPreferences = { inAppAlerts: true, queueAlerts: true, promoEmailOptIn: false, reminders: true, reminderOffset: '1h' as const };
export class PreferencesService {
  static async get(userId: string): Promise<NotificationPreferences> {
    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) throw new AppError('Account not found', 404);
    const saved = user.notificationPreferences;
    return { inAppAlerts: saved?.inAppAlerts ?? defaultPreferences.inAppAlerts,
      queueAlerts: saved?.queueAlerts ?? defaultPreferences.queueAlerts,
      promoEmailOptIn: saved?.promoEmailOptIn ?? defaultPreferences.promoEmailOptIn,
      reminders: saved?.reminders ?? defaultPreferences.reminders,
      reminderOffset: saved?.reminderOffset ?? defaultPreferences.reminderOffset };
  }
  static async update(userId: string, patch: object) {
    const fields = Object.fromEntries(Object.entries(patch).map(([key,value]) => [`notificationPreferences.${key}`,value]));
    if (!await User.findByIdAndUpdate(userId, { $set: fields }, { runValidators: true })) throw new AppError('Account not found',404);
    return this.get(userId);
  }
}
