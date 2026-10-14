import {
  Users,
  Clock,
  CheckCircle2,
  PhoneCall,
  Stethoscope,
  TrendingUp,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import type { StaffQueueListTicket } from '@/services/staffQueueApi';

const mockTrendData = [
  { time: '8am', wait: 15, count: 4 },
  { time: '10am', wait: 28, count: 12 },
  { time: '12pm', wait: 35, count: 18 },
  { time: '2pm', wait: 22, count: 9 },
  { time: '4pm', wait: 18, count: 6 },
];

export function StaffOverviewScreen({
  queue,
}: {
  queue: StaffQueueListTicket[];
  doctors?: Map<string, string>;
  onCallNext?: () => void;
  actionPending?: boolean;
}) {
  const waitingCount = queue.filter((t) => ['WAITING', 'ALMOST_TURN'].includes(t.status)).length;
  const inServiceCount = queue.filter((t) => ['CALLING', 'IN_CONSULTATION'].includes(t.status)).length;
  const completedCount = queue.filter((t) => t.status === 'COMPLETED').length;
  const totalToday = queue.length;

  const currentServingTicket = queue.find((t) => t.status === 'IN_CONSULTATION') || queue.find((t) => t.status === 'CALLING');
  const upcomingQueue = queue
    .filter((t) => ['WAITING', 'ALMOST_TURN'].includes(t.status))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards matching Screen 08 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#64798B]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Patients</span>
            <Users size={18} className="text-[#146C94]" />
          </div>
          <p className="mt-3 text-3xl font-black text-[#183247]">{totalToday}</p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-[#20A779]">Today&apos;s registrations</p>
        </div>

        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#64798B]">
            <span className="text-xs font-bold uppercase tracking-wider">Waiting</span>
            <Clock size={18} className="text-[#E9A23B]" />
          </div>
          <p className="mt-3 text-3xl font-black text-[#E9A23B]">{waitingCount}</p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-[#64798B]">In OPD reception</p>
        </div>

        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#64798B]">
            <span className="text-xs font-bold uppercase tracking-wider">Now Serving</span>
            <Stethoscope size={18} className="text-[#146C94]" />
          </div>
          <p className="mt-3 text-3xl font-black text-[#146C94]">{inServiceCount}</p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-[#18A6A6]">Rooms occupied</p>
        </div>

        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#64798B]">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 size={18} className="text-[#20A779]" />
          </div>
          <p className="mt-3 text-3xl font-black text-[#20A779]">{completedCount}</p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-[#20A779]">Consultations done</p>
        </div>
      </div>

      {/* Middle Row: Average wait card + Trend Chart + Live Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Average Wait Time & Trend Chart */}
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#64798B]">
                Average Wait Time
              </p>
              <p className="mt-1 text-2xl font-black text-[#183247]">24 min</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-[#E8F8F2] px-3 py-1 text-xs font-bold text-[#20A779]">
              <TrendingUp size={14} />
              <span>Optimal Flow</span>
            </div>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData}>
                <XAxis dataKey="time" stroke="#8EA3B0" fontSize={11} tickLine={false} />
                <YAxis stroke="#8EA3B0" fontSize={11} tickLine={false} unit="m" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="wait"
                  stroke="#146C94"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#146C94' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Queue Summary Box */}
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64798B]">
            Live Queue Summary
          </h3>

          <div className="mt-4 divide-y divide-[#EBF2F6]">
            {currentServingTicket && (
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <span className="text-sm font-black text-[#146C94]">
                    {currentServingTicket.ticketNumber}
                  </span>
                  <p className="text-[0.6875rem] text-[#64798B]">
                    {currentServingTicket.doctor?.name || 'Dr. Amanda Silva'}
                  </p>
                </div>
                <span className="rounded-full bg-[#E8F8F2] px-2 py-0.5 text-[0.625rem] font-bold text-[#20A779]">
                  Now Serving
                </span>
              </div>
            )}

            {upcomingQueue.map((item) => (
              <div key={item._id} className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-[#183247]">{item.ticketNumber}</span>
                <span className="rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[0.625rem] font-bold text-[#EA580C]">
                  Waiting
                </span>
              </div>
            ))}

            {upcomingQueue.length === 0 && !currentServingTicket && (
              <p className="py-6 text-center text-xs text-[#64798B]">No patients in queue today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StaffFlowDeskScreen({
  queue,
  onAction,
  actionPending,
}: {
  queue: StaffQueueListTicket[];
  onAction: (operation: string, id?: string) => void;
  actionPending: boolean;
}) {
  const currentServing = queue.find((t) => ['CALLING', 'IN_CONSULTATION'].includes(t.status));
  const nextWaiting = queue.find((t) => ['WAITING', 'ALMOST_TURN'].includes(t.status));

  return (
    <div className="space-y-6">
      {/* 2 Big Action Displays matching Screen 10 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Serving Card */}
        <div className="rounded-3xl border-2 border-[#146C94] bg-white p-6 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64798B]">Current Serving</p>
          {currentServing ? (
            <div className="mt-4">
              <div className="inline-block rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] px-6 py-3 text-3xl font-black text-white shadow-md">
                {currentServing.ticketNumber}
              </div>
              <p className="mt-4 text-base font-black text-[#183247]">
                {currentServing.appointment?.familyMember?.name ?? currentServing.patient?.name}
              </p>
              <p className="text-xs text-[#64798B] mt-0.5">
                {currentServing.doctor?.name} · Room {currentServing.doctor?.roomNumber || '01'}
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {currentServing.status === 'CALLING' && (
                  <Button
                    size="lg"
                    disabled={actionPending}
                    onClick={() => onAction('start-consultation', currentServing._id)}
                    className="flex-1 rounded-2xl bg-[#146C94] text-white font-bold text-sm"
                  >
                    Start Consultation
                  </Button>
                )}
                {currentServing.status === 'IN_CONSULTATION' && (
                  <Button
                    size="lg"
                    disabled={actionPending}
                    onClick={() => onAction('complete', currentServing._id)}
                    className="flex-1 rounded-2xl bg-[#20A779] text-white font-bold text-sm hover:bg-[#188B63]"
                  >
                    ✓ Complete Consultation
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  disabled={actionPending}
                  onClick={() => onAction('hold', currentServing._id)}
                  className="rounded-2xl border-[#DCE8EE] text-[#E9A23B] font-bold text-sm"
                >
                  Hold
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={actionPending}
                  onClick={() => onAction('skip', currentServing._id)}
                  className="rounded-2xl border-[#DCE8EE] text-[#DE6470] font-bold text-sm"
                >
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 py-8 text-center text-sm text-[#64798B]">
              No consultation currently active.
            </div>
          )}
        </div>

        {/* Next Patient Card */}
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64798B]">Next Patient</p>
          {nextWaiting ? (
            <div className="mt-4">
              <div className="inline-block rounded-2xl bg-[#F6FAFD] border border-[#DCE8EE] px-6 py-3 text-3xl font-black text-[#183247]">
                {nextWaiting.ticketNumber}
              </div>
              <p className="mt-4 text-base font-black text-[#183247]">
                {nextWaiting.appointment?.familyMember?.name ?? nextWaiting.patient?.name}
              </p>
              <p className="text-xs text-[#64798B] mt-0.5">
                Position: 1 · Est. Wait: ~{nextWaiting.estimatedWaitMins} min
              </p>

              <div className="mt-6">
                <Button
                  size="lg"
                  disabled={actionPending || Boolean(currentServing)}
                  onClick={() => onAction('call-next')}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#146C94] to-[#18A6A6] text-white font-black text-sm shadow-md"
                >
                  <PhoneCall size={18} className="mr-2" />
                  Call Next Patient
                </Button>
                {Boolean(currentServing) && (
                  <p className="mt-2 text-center text-[0.6875rem] text-[#64798B]">
                    Complete or hold the current patient before calling next.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 py-8 text-center text-sm text-[#64798B]">
              No waiting patients in queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StaffMonitoringScreen({
  queue,
}: {
  queue: StaffQueueListTicket[];
}) {
  const waiting = queue.filter((t) => ['WAITING', 'ALMOST_TURN'].includes(t.status)).length;
  const called = queue.filter((t) => t.status === 'CALLING').length;
  const onHold = queue.filter((t) => t.status === 'HELD').length;
  const completed = queue.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards matching Screen 12 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 text-center shadow-sm">
          <p className="text-xs font-bold uppercase text-[#64798B]">Waiting</p>
          <p className="mt-2 text-3xl font-black text-[#146C94]">{waiting}</p>
        </div>
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 text-center shadow-sm">
          <p className="text-xs font-bold uppercase text-[#64798B]">Called</p>
          <p className="mt-2 text-3xl font-black text-[#18A6A6]">{called}</p>
        </div>
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 text-center shadow-sm">
          <p className="text-xs font-bold uppercase text-[#64798B]">On Hold</p>
          <p className="mt-2 text-3xl font-black text-[#E9A23B]">{onHold}</p>
        </div>
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-5 text-center shadow-sm">
          <p className="text-xs font-bold uppercase text-[#64798B]">Completed</p>
          <p className="mt-2 text-3xl font-black text-[#20A779]">{completed}</p>
        </div>
      </div>

      {/* Throughput & Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64798B]">
            Queue Throughput
          </h3>
          <div className="h-48 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTrendData}>
                <XAxis dataKey="time" stroke="#8EA3B0" fontSize={11} tickLine={false} />
                <YAxis stroke="#8EA3B0" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#18A6A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Alerts Card */}
        <div className="rounded-3xl border border-[#DCE8EE] bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64798B]">
            Operational Alerts
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-[#FFF7ED] p-3 text-xs">
              <AlertTriangle size={18} className="text-[#EA580C] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#9A3412]">Waiting time above 30 min</p>
                <p className="text-[#C2410C]">OPD General Medicine queue moving slower than average.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[#EBF5FB] p-3 text-xs">
              <Activity size={18} className="text-[#146C94] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#146C94]">Optimal Roster Coverage</p>
                <p className="text-[#64798B]">All active consultant rooms are functioning normally.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
