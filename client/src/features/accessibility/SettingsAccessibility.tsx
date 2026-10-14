import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { FeaturePageContent } from '@/components/FeaturePageContent';
import { SwitchRow } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { useAccessibility } from './context/AccessibilityContext';
import { useNotificationPreferences, type NotificationPreferences } from '@/services/preferencesApi';
import { cn } from '@/lib/utils';
import type { Settings } from './types';

const TEXT_SIZES: { key: Settings['textSize']; label: string }[] = [
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium (Default)' },
  { key: 'large', label: 'Large' },
];

const REMINDERS: { key: Settings['reminder']; label: string }[] = [
  { key: '30m', label: '30 Mins before' },
  { key: '1h', label: '1 Hour before' },
  { key: '1d', label: '1 Day before' },
];

const LANGUAGES = [
  'English (United States)',
  'English (United Kingdom)',
  'සිංහල (Sinhala)',
  'தமிழ் (Tamil)',
  'हिन्दी (Hindi)',
];

export default function SettingsAccessibility() {
  const navigate = useNavigate();
  const { settings, loading, error, updateSettings } = useAccessibility();

  const account = useNotificationPreferences();
  const saveAccount = (patch: Partial<NotificationPreferences>) => {
    setSaveError('');
    void account.save(patch).catch((e: Error) => { setSaveError(e.message); toast.error(e.message); });
  };
  const accountDisabled = account.isLoading || account.isError || account.saving;
  const [saveError, setSaveError] = useState('');
  const set = (patch: Partial<Settings>) => {
    setSaveError('');
    void updateSettings(patch).catch((e) => { setSaveError((e as Error).message); toast.error((e as Error).message); });
  };

  const textSize = settings?.textSize ?? 'medium';
  const sizeIndex = TEXT_SIZES.findIndex((t) => t.key === textSize);

  return (
    <FeaturePageContent title="Settings & Accessibility" back>
      <p role="status" className="mb-4 text-sm text-ink-muted">Accessibility preferences are saved in this browser. Notification and reminder preferences are saved to your account. Alerts are delivered in-app; browser push and email delivery are unavailable.</p>
      {account.isError && <p role="alert">Could not load account preferences. <button onClick={() => void account.refetch()}>Retry</button></p>}
      {loading && <p role="status">Loading accessibility preferences…</p>}
      {(error || saveError) && <p role="alert">{error || saveError}</p>}
      <p className="label">Notification Preferences</p>
      <div className="mt-2.5 surface p-4 shadow-card">
        <SwitchRow
          disabled={accountDisabled}
          checked={account.data?.inAppAlerts ?? false}
          onChange={(v) => saveAccount({ inAppAlerts: v })}
          title="In-app Alerts"
          description="Show new notification alerts while this portal is open. This is not browser push."
        />
        <SwitchRow
          disabled={accountDisabled}
          checked={account.data?.queueAlerts ?? false}
          onChange={(v) => saveAccount({ queueAlerts: v })}
          title="Real-time Queue Updates"
          description="Show queue alerts from 15-second polling. Your live queue continues updating when alerts are off."
        />
        <SwitchRow
          disabled={accountDisabled}
          checked={account.data?.promoEmailOptIn ?? false}
          onChange={(v) => saveAccount({ promoEmailOptIn: v })}
          title="Promotional Emails"
          description="Save your opt-in. Email delivery is not configured; no email is sent."
        />
      </div>

      <p className="mt-6 text-[0.84375rem] font-extrabold text-ink">Send Appointment Reminders</p>
      <SwitchRow disabled={accountDisabled} checked={account.data?.reminders ?? false} onChange={v => saveAccount({ reminders: v })} title="In-app Appointment Reminders" description="Scheduled by the server and saved in Notifications, including while you are signed out." />
      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        {REMINDERS.map((r) => (
          <button
            key={r.key}
            type="button"
            disabled={accountDisabled || !account.data?.reminders}
            aria-pressed={account.data?.reminderOffset === r.key}
            onClick={() => saveAccount({ reminderOffset: r.key })}
            className={cn(
              'rounded-xl border px-2 py-2.5 text-[0.71875rem] font-bold transition min-h-0',
              account.data?.reminderOffset === r.key
                ? 'border-brand-600 bg-brand-50 text-brand-700 font-extrabold'
                : 'border-line bg-white text-ink-soft hover:border-brand-300'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <p className="mt-7 label">Accessibility Features</p>
      <div className="mt-2.5 surface p-4 shadow-card">
        <div className="flex items-center justify-between gap-3 pb-2">
          <span className="text-sm font-semibold text-ink">Text Size</span>
          <span className="text-[0.8125rem] font-bold text-brand-600">
            {TEXT_SIZES[Math.max(0, sizeIndex)]?.label}
          </span>
        </div>
        <div className="py-2">
          <input
            disabled={loading}
            type="range"
            min={0}
            max={TEXT_SIZES.length - 1}
            step={1}
            value={Math.max(0, sizeIndex)}
            onChange={(e) => set({ textSize: TEXT_SIZES[Number(e.target.value)].key })}
            aria-label="Text size"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
          />
        </div>

        <div className="mt-2 border-t border-line pt-2">
          <SwitchRow
            checked={settings?.highContrast ?? false}
            onChange={(v) => set({ highContrast: v })}
            title="High Contrast Mode"
            description="Increases color contrast readability"
          />
          <SwitchRow checked={settings.reducedMotion} onChange={(v) => set({ reducedMotion: v })} title="Reduced Motion" description="Reduce animations on this device" />
          <SwitchRow
            checked={settings.screenReader}
            onChange={(v) => set({ screenReader: v })}
            title="Extra Screen Reader Announcements"
            description="Announce the page title when navigating. Basic labels, errors and keyboard access always remain enabled."
          />
        </div>
      </div>

      <p className="mt-7 text-[0.84375rem] font-extrabold text-ink">Preferred Application Language</p>
      <div className="mt-2.5">
        <Select
          aria-label="Preferred application language (translation unavailable)"
          disabled
          value={settings?.language ?? LANGUAGES[0]}
          onChange={(e) => set({ language: e.target.value })}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>

      <p className="mt-8 text-center text-[0.71875rem] text-ink-muted">
        Local accessibility preferences
      </p>

      <button
        type="button"
        onClick={() => navigate('/app/profile')}
        className="mt-4 w-full text-center text-[0.8125rem] font-bold text-brand-600 hover:text-brand-700 min-h-0"
      >
        Back to profile
      </button>

      <p className="mt-4 text-center text-[0.71875rem] text-ink-muted">
        Notification preferences sync to your account. Accessibility stays on this device. Language translation is unavailable.
      </p>
    </FeaturePageContent>
  );
}
