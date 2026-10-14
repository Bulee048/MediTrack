import PortalSelection from '@/features/auth/PortalSelection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import StaffDashboard from '@/features/staff/StaffDashboard';
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <BrowserRouter>
          <Routes>
              {/* Landing & Home */}
              <Route path="/" element={<PortalSelection />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/staff/login" element={<LoginScreen staff />} />
              <Route path="/staff/*" element={<StaffDashboard />} />
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
              <Route path="/app/account" element={<Navigate to="/app/profile" replace />} />
              <Route path="/app/doctor/:id/availability" element={<DoctorAvailabilityScreen />} />
              <Route path="/app/profile/edit" element={<EditProfile />} />
              <Route path="/app/settings/accessibility" element={<SettingsAccessibility />} />
              <Route path="/app/settings" element={<Navigate to="/app/settings/accessibility" replace />} />

          <Route path="/queue" element={<main data-feature-accessibility className="patient-page page-enter"><PatientLiveQueue /></main>} />
          <Route path="/notifications" element={<main data-feature-accessibility className="patient-page page-enter"><NotificationsList /></main>} />


          <Route path="/app/queue" element={<Navigate to="/queue" replace />} />
          <Route path="/app/notifications" element={<Navigate to="/notifications" replace />} />

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
