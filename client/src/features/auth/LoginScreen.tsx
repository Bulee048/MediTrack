import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuthToken, setAuthToken } from './auth.storage';
import { AuthShell } from './AuthShell';
import { loginFormSchema, type LoginFormValues } from './auth.schemas';
import { buildLoginInput, fetchCurrentUser, loginPatient } from './auth.service';
import { getAuthErrorMessage } from './auth.utils';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    enabled: Boolean(getAuthToken()),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onTouched',
  });

  const login = useMutation({
    mutationFn: loginPatient,
    onSuccess: (response) => {
      setAuthToken(response.token);
      window.location.assign('/');
    },
    onError: (error) => {
      setError('root', { message: getAuthErrorMessage(error, 'Unable to sign in') });
    },
  });

  useEffect(() => {
    if (currentUser) {
      // keep the current session visible while still allowing a fresh sign-in
    }
  }, [currentUser]);

  const submit = (values: LoginFormValues) => {
    login.mutate(buildLoginInput(values.identifier, values.password));
  };

  return (
    <AuthShell
      title="Welcome Back"
      description="Enter your email or phone number to continue securely."
      footer={
        <>
          New here? <a href="/register" className="font-semibold text-brand-600 hover:underline">Register</a>
        </>
      }
    >
      {currentUser ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Signed in as <span className="font-semibold">{currentUser.user.name}</span>.
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div className="space-y-2">
          <Label htmlFor="identifier">Email or Phone</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Mail className="h-4 w-4" />
            </span>
            <Input
              id="identifier"
              {...register('identifier')}
              placeholder="you@email.com or 0771234567"
              className="h-12 pl-10"
              autoComplete="username"
            />
          </div>
          {errors.identifier ? <p className="text-xs font-medium text-red-600">{errors.identifier.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Phone className="h-4 w-4 rotate-90" />
            </span>
            <Input
              id="password"
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="h-12 pl-10 pr-12"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-xs font-medium text-red-600">{errors.password.message}</p> : null}
        </div>

        {errors.root ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errors.root.message}</p> : null}

        <Button type="submit" className="h-12 w-full" disabled={isSubmitting || login.isPending}>
          {isSubmitting || login.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
      </form>

      <div className="flex items-center gap-4 pt-1">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Account access</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
        Use the same credentials you registered with. Email or phone are both supported.
      </div>
    </AuthShell>
  );
}