import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import LoginScreen from '@/features/auth/LoginScreen';
import RegisterScreen from '@/features/auth/RegisterScreen';
import HomeScreen from '@/features/booking/HomeScreen';
import DepartmentsScreen from '@/features/doctors/DepartmentsScreen';
import DoctorListScreen from '@/features/doctors/DoctorListScreen';
import DoctorProfileScreen from '@/features/doctors/DoctorProfileScreen';
import DoctorAvailabilityScreen from '@/features/doctors/DoctorAvailabilityScreen';
import SelectDateScreen from '@/features/booking/SelectDateScreen';
import SelectTimeScreen from '@/features/booking/SelectTimeScreen';
import ReviewAppointmentScreen from '@/features/booking/ReviewAppointmentScreen';
import BookingConfirmedScreen from '@/features/booking/BookingConfirmedScreen'; // NEW
import { PatientLiveQueue } from '@/features/queue/PatientLiveQueue';
import { NotificationsList } from '@/features/notifications/NotificationsList';
import {
  Activity,
  Hospital,
  UserCheck,
  Clock,
  CalendarDays,
  Users,
  User,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Feature Contexts
import { AccessibilityProvider } from '@/features/accessibility/context/AccessibilityContext';
import PatientShell from '@/components/layout/PatientShell';
import { ProfileProvider } from '@/features/profile/context/ProfileContext';

// Feature Pages (Nawodya Module)
import Appointments from '@/features/appointments/Appointments';
import AppointmentDetails from '@/features/appointments/AppointmentDetails';
import Reschedule from '@/features/appointments/Reschedule';
import CancelAppointment from '@/features/appointments/CancelAppointment';
import BookForFamily from '@/features/family/BookForFamily';
import Profile from '@/features/profile/Profile';
import EditProfile from '@/features/profile/EditProfile';
import SettingsAccessibility from '@/features/accessibility/SettingsAccessibility';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Home() {
  return (
    <main className="min-h-screen bg-canvas p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-600 text-white rounded-xl shadow-md">
              <Hospital className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">MediTrack</h1>
              <p className="text-ink-muted font-medium text-sm">
                OPD Appointment Booking &amp; Queue Management System
              </p>
            </div>
          </div>
          <Badge className="bg-brand-50 text-brand-700 border-brand-200 text-sm px-3 py-1">
            System Online
          </Badge>
        </header>

        {/* Patient Portal Services (Appointment Management, Family Booking, Profile, Accessibility) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-ink tracking-tight">
                Patient &amp; Appointment Portal
              </h2>
              <p className="text-sm text-ink-muted">
                Appointment Management, Family Booking, Profile and Accessibility
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/app/appointments"
              className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-md"
            >
              <div>
                <div className="mb-3 inline-flex p-2.5 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-ink group-hover:text-brand-700">My Appointments</h3>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  Upcoming, past, reschedule &amp; cancellation with live status
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-600">
                <span>View appointments</span>
                <ChevronRight size={14} />
              </div>
            </Link>

            {/* Book for Family Member - CLEARLY VISIBLE */}
            <Link
              to="/app/book/family"
              className="group flex flex-col justify-between rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-5 shadow-card transition hover:border-brand-500 hover:shadow-md"
            >
              <div>
                <div className="mb-3 inline-flex p-2.5 rounded-xl bg-brand-600 text-white shadow-soft">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-ink group-hover:text-brand-700">Book for Family</h3>
                  <span className="rounded-full bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5">
                    Family
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  Easily register and schedule OPD slots for loved ones
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-700">
                <span>Manage &amp; book family</span>
                <ChevronRight size={14} />
              </div>
            </Link>

            <Link
              to="/app/profile"
              className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-md"
            >
              <div>
                <div className="mb-3 inline-flex p-2.5 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-ink group-hover:text-brand-700">Patient Profile</h3>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  Personal details and patient account information
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-600">
                <span>View profile</span>
                <ChevronRight size={14} />
              </div>
            </Link>

            <Link
              to="/app/settings"
              className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-md"
            >
              <div>
                <div className="mb-3 inline-flex p-2.5 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition">
                  <Sliders className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-ink group-hover:text-brand-700">Accessibility</h3>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  Local text size, contrast and reduced-motion preferences
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-600">
                <span>Customize app</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          </div>
        </section>

        {/* System Core Architecture */}
        <section className="grid md:grid-cols-3 gap-6 pt-4 border-t border-line">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Digital Queue</CardTitle>
              <Activity className="h-4 w-4 text-brand-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">FR-02 &amp; FR-03</div>
              <CardDescription className="mt-1 text-slate-600">
                Digital Queue Ticket Generation &amp; Live Position Tracking
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wait Time Engine</CardTitle>
              <Clock className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">FR-04 &amp; FR-05</div>
              <CardDescription className="mt-1 text-slate-600">
                Estimated Delay Calculation &amp; Turn Approaching Alerts
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Controller</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">FR-10 to FR-12</div>
              <CardDescription className="mt-1 text-slate-600">
                Walk-in Registration, Queue Calling &amp; Consultation Workflow
              </CardDescription>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
          <BrowserRouter>
            <Routes>
              {/* Landing & Home */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route element={<ProfileProvider><PatientShell /></ProfileProvider>}>
              <Route path="/app" element={<Navigate to="/app/appointments" replace />} />


              {/* Appointment Management */}
              <Route path="/app/appointments" element={<Appointments />} />
              <Route path="/app/appointments/:id" element={<AppointmentDetails />} />
              <Route path="/app/appointments/:id/reschedule" element={<Reschedule />} />
              <Route path="/app/appointments/:id/cancel" element={<CancelAppointment />} />

              {/* Family Booking */}
              <Route path="/app/book/family" element={<BookForFamily />} />
              <Route path="/app/family" element={<BookForFamily />} />

              {/* Profile & Settings */}
              <Route path="/app/profile" element={<Profile />} />
              <Route path="/app/profile/edit" element={<EditProfile />} />
              <Route path="/app/settings/accessibility" element={<SettingsAccessibility />} />
              <Route path="/app/settings" element={<Navigate to="/app/settings/accessibility" replace />} />

          <Route path="/queue" element={<main className="min-h-screen bg-slate-50 p-6"><PatientLiveQueue /></main>} />
          <Route path="/notifications" element={<main className="min-h-screen bg-slate-50 p-6"><NotificationsList /></main>} />



          {/* Primary patient booking routes */}
          <Route path="/app/home" element={<HomeScreen />} />
          <Route path="/app/departments" element={<DepartmentsScreen />} />
          <Route path="/app/doctors" element={<DoctorListScreen />} />
          <Route path="/app/doctor/:id" element={<DoctorProfileScreen />} />
          <Route path="/app/book/date/:doctorId" element={<SelectDateScreen />} />
          <Route path="/app/book/time/:doctorId" element={<SelectTimeScreen />} />
          <Route path="/app/book/review" element={<ReviewAppointmentScreen />} />
          <Route path="/app/book/done/:id" element={<BookingConfirmedScreen />} />

          {/* Feature Route Aliases */}
          <Route path="/patient/home" element={<HomeScreen />} />
          <Route path="/patient/departments" element={<DepartmentsScreen />} />
          <Route path="/patient/doctors" element={<DoctorListScreen />} />
          <Route path="/patient/doctors/:id" element={<DoctorProfileScreen />} />
          <Route path="/patient/doctors/:id/availability" element={<DoctorAvailabilityScreen />} />
          <Route path="/patient/doctors/:id/date" element={<SelectDateScreen />} />
          <Route path="/patient/doctors/:id/time" element={<SelectTimeScreen />} />
          <Route path="/patient/doctors/:id/review" element={<ReviewAppointmentScreen />} />
          <Route path="/patient/doctors/:id/confirmed" element={<BookingConfirmedScreen />} />

              </Route>
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}
