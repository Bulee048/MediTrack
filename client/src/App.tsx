import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { Activity, Hospital, UserCheck, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
              <Hospital className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">MediTrack</h1>
              <p className="text-slate-600 font-medium text-sm">
                OPD Appointment Booking & Queue Management System
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-sm px-3 py-1">
            System Online
          </Badge>
        </header>

        <section className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Digital Queue</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">FR-02 & FR-03</div>
              <CardDescription className="mt-1 text-slate-600">
                Digital Queue Ticket Generation & Live Position Tracking
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wait Time Engine</CardTitle>
              <Clock className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">FR-04 & FR-05</div>
              <CardDescription className="mt-1 text-slate-600">
                Estimated Delay Calculation & Turn Approaching Alerts
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
                Walk-in Registration, Queue Calling & Consultation Workflow
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/patient/home" element={<HomeScreen />} />
          <Route path="/patient/departments" element={<DepartmentsScreen />} />
          <Route path="/patient/doctors" element={<DoctorListScreen />} />
          <Route path="/patient/doctors/:id" element={<DoctorProfileScreen />} />
          <Route path="/patient/doctors/:id/availability" element={<DoctorAvailabilityScreen />} />
          <Route path="/patient/doctors/:id/date" element={<SelectDateScreen />} />
          <Route path="/patient/doctors/:id/time" element={<SelectTimeScreen />} />
          <Route path="/patient/doctors/:id/review" element={<ReviewAppointmentScreen />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
