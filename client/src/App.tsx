import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { PatientLiveQueue } from '@/features/queue/PatientLiveQueue';
import { NotificationsList } from '@/features/notifications/NotificationsList';
import { Splash } from '@/features/home/Splash';
import { Portal } from '@/features/home/Portal';
import { Login } from '@/features/auth/Login';
import { Register } from '@/features/auth/Register';
import { Home } from '@/features/home/Home';

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
      <BrowserRouter>
        <Routes>
          {/* Public / Entry screens */}
          <Route path="/" element={<Splash />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient App screens */}
          <Route path="/app/home" element={<Home />} />
          <Route path="/app/queue" element={<main className="min-h-screen bg-slate-50 p-6"><PatientLiveQueue /></main>} />
          <Route path="/app/notifications" element={<main className="min-h-screen bg-slate-50 p-6"><NotificationsList /></main>} />

          {/* Legacy route aliases to preserve existing working behavior */}
          <Route path="/queue" element={<main className="min-h-screen bg-slate-50 p-6"><PatientLiveQueue /></main>} />
          <Route path="/notifications" element={<main className="min-h-screen bg-slate-50 p-6"><NotificationsList /></main>} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
