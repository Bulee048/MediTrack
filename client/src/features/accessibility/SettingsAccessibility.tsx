import { useNavigate } from 'react-router-dom';
import { PhoneShell } from '@/components/PhoneShell';
import { SwitchRow } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { useAccessibility } from './context/AccessibilityContext';
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
  const { settings, updateSettings } = useAccessibility();

  const set = (patch: Partial<Settings>) => {
    updateSettings(patch);
  };

  const textSize = settings?.textSize ?? 'medium';
  const sizeIndex = TEXT_SIZES.findIndex((t) => t.key === textSize);

  return (
    <PhoneShell title="Settings & Accessibility" back>
      <p className="label">Notification Preferences</p>
      <div className="mt-2.5 rounded-2xl border border-line bg-white p-4 shadow-card">
        <SwitchRow
          checked={settings?.push ?? true}
          onChange={(v) => set({ push: v })}
          title="Push Notifications"
          description="Enable instant alerts"
        />
        <SwitchRow
          checked={settings?.realtimeQueue ?? true}
          onChange={(v) => set({ realtimeQueue: v })}
          title="Real-time Queue Updates"
          description="Get live queue progression alerts"
        />
        <SwitchRow
          checked={settings?.promo ?? false}
          onChange={(v) => set({ promo: v })}
          title="Promotional Emails"
          description="Health checkups & hospital newsletters"
        />
      </div>

      <p className="mt-6 text-[13.5px] font-extrabold text-ink">Send Appointment Reminders</p>
      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        {REMINDERS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => set({ reminder: r.key })}
            className={cn(
              'rounded-xl border px-2 py-2.5 text-[11.5px] font-bold transition min-h-0',
              (settings?.reminder ?? '1h') === r.key
                ? 'border-brand-600 bg-brand-50 text-brand-700 font-extrabold'
                : 'border-line bg-white text-ink-soft hover:border-brand-300'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <p className="mt-7 label">Accessibility Features</p>
      <div className="mt-2.5 rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3 pb-2">
          <span className="text-sm font-semibold text-ink">Text Size</span>
          <span className="text-[13px] font-bold text-brand-600">
            {TEXT_SIZES[Math.max(0, sizeIndex)]?.label}
          </span>
        </div>
        <div className="py-2">
          <input
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
          <SwitchRow
            checked={settings?.screenReader ?? true}
            onChange={(v) => set({ screenReader: v })}
            title="Screen Reader Optimal"
            description="Optimizes layout hierarchies for voice readers"
          />
        </div>
      </div>

      <p className="mt-7 text-[13.5px] font-extrabold text-ink">Preferred Application Language</p>
      <div className="mt-2.5">
        <Select
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

      <p className="mt-8 text-center text-[11.5px] text-ink-muted">
        MediTrack Mobile v2.4.0 (Build 20261009)
      </p>

      <button
        type="button"
        onClick={() => navigate('/app/profile')}
        className="mt-4 w-full text-center text-[13px] font-bold text-brand-600 hover:text-brand-700 min-h-0"
      >
        Back to profile
      </button>

      <p className="mt-4 text-center text-[11.5px] text-ink-muted">
        Signed in as patient user
      </p>
    </PhoneShell>
  );
}
