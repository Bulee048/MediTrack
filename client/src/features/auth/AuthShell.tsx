import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthShellProps {
  title: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, description, eyebrow = 'MediTrack', children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-5 space-y-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0E8B7C]">{eyebrow}</p>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#101A2E] sm:text-[32px]">{title}</h1>
          <p className="text-sm leading-6 text-[#6C7A90]">{description}</p>
        </div>

        <Card className="border-[#E6ECF3] bg-white shadow-xl shadow-[#101A2E]/5">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-lg text-[#101A2E]">Patient Account</CardTitle>
            <CardDescription className="text-[#6C7A90]">Secure access for appointments, bookings, and profile updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">{children}</CardContent>
        </Card>

        {footer ? <div className="mt-4 text-center text-sm text-[#6C7A90]">{footer}</div> : null}
      </div>
    </main>
  );
}