import { useState } from 'react';
import { Monitor, Save, Volume2 } from 'lucide-react';
import { Button, Select, SwitchRow, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';

const ROUTES = [
  'Ward A → OPD Queue (Main Corridor)',
  'OPD Room 3 → Cardiology',
  'Reception → Pharmacy',
  'Parking → Registration Desk',
];

/** System Settings for the staff console. */
export default function StaffSettings() {
  const { push } = useToast();
  const [audio, setAudio] = useState(true);
  const [display, setDisplay] = useState(true);
  const [sms, setSms] = useState(true);
  const [autoCall, setAutoCall] = useState(false);
  const [skipAfter, setSkipAfter] = useState('3');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const announce = async () => {
    setBusy(true);
    try {
      const r = await api.staff.announce('dep-cardio', message);
      push({ tone: 'success', title: 'Announcement sent', body: `${r.notified} patients notified` });
      setMessage('');
    } catch (e) {
      push({ tone: 'error', title: 'Could not announce', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
        <h3 className="text-[15px] font-extrabold text-ink">Lobby &amp; Display System</h3>
        <div className="mt-4 divide-y divide-line">
          <SwitchRow
            checked={audio}
            onChange={setAudio}
            title="Audio PA System"
            description="Play the announcement when a token is called"
          />
          <SwitchRow
            checked={display}
            onChange={setDisplay}
            title="Lobby Display Board Sync"
            description="Mirror the queue board onto waiting-area screens"
          />
          <SwitchRow
            checked={autoCall}
            onChange={setAutoCall}
            title="Auto-call next patient"
            description="Automatically advance when a consultation is completed"
          />
          <div className="py-2">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Skip a patient after</label>
            <Select value={skipAfter} onChange={(e) => setSkipAfter(e.target.value)} className="max-w-[220px]">
              {['1', '2', '3', '4', '5'].map((n) => (
                <option key={n} value={n}>
                  {n} unanswered call{n === '1' ? '' : 's'}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
        <h3 className="text-[15px] font-extrabold text-ink">Notifications</h3>
        <div className="mt-4">
          <SwitchRow
            checked={sms}
            onChange={setSms}
            title="SMS notifications"
            description="Send queue and appointment alerts over SMS"
          />
        </div>

        <h3 className="mt-6 text-[15px] font-extrabold text-ink">Broadcast to Cardiology Queue</h3>
        <div className="mt-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. OPD Room 3 is temporarily relocated to Room 5…"
          />
        </div>
        <Button className="mt-3" loading={busy} disabled={!message.trim()} onClick={announce}>
          <Volume2 size={16} /> Send Announcement
        </Button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
        <h3 className="text-[15px] font-extrabold text-ink">Indoor Navigation Routes</h3>
        <div className="mt-4 space-y-2.5">
          {ROUTES.map((r) => (
            <div key={r} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
              <Monitor size={16} className="text-brand-600" />
              <span className="text-[13px] font-semibold text-ink">{r}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-7 shadow-card">
        <h3 className="text-[15px] font-extrabold text-ink">Security</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Terminal lock timeout</label>
            <Select defaultValue="15">
              {['5', '15', '30', '60'].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Require OTP for queue changes</label>
            <Select defaultValue="critical">
              <option value="all">Every action</option>
              <option value="critical">Hold / Skip / Cancel only</option>
              <option value="none">Never</option>
            </Select>
          </div>
          <Button variant="outline">
            <Save size={16} /> Save Settings
          </Button>
        </div>
      </section>
    </div>
  );
}