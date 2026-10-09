import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setAuthToken } from './auth.storage';
import { AuthShell } from './AuthShell';
import { loginFormSchema, type LoginFormValues } from './auth.schemas';
import { buildLoginInput, loginPatient } from './auth.service';
import { getAuthErrorMessage } from './auth.utils';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

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
      window.location.assign('/patient/home');
    },
    onError: (error) => {
      setError('root', { message: getAuthErrorMessage(error, 'Unable to sign in') });
    },
  });

  const submit = (values: LoginFormValues) => {
    login.mutate(buildLoginInput(values.identifier, values.password));
  };

  return (
    <AuthShell
      title="Welcome Back"
      description="Enter your email or phone number to continue securely."
      footer={
        <>
          New here?{' '}
          <a
            href="/register"
            className="font-semibold text-[#0E8B7C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-sm"
          >
            Register
          </a>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-[#101A2E]">Email or Phone</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
              <Mail className="h-4 w-4" />
            </span>
            <Input
              id="identifier"
              {...register('identifier')}
              placeholder="you@email.com or 0771234567"
              className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
              autoComplete="username"
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? 'identifier-error' : undefined}
            />
          </div>
          {errors.identifier ? (
            <p id="identifier-error" role="alert" className="text-xs font-medium text-[#E8455F]">
              {errors.identifier.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#101A2E]">Password</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
              <Lock className="h-4 w-4" />
            </span>
            <Input
              id="password"
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 pr-12 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6C7A90] hover:text-[#101A2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-r-xl"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" role="alert" className="text-xs font-medium text-[#E8455F]">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {errors.root ? (
          <p role="alert" className="rounded-xl border border-[#E8455F]/30 bg-[#FDECEF] px-3 py-2 text-sm font-medium text-[#E8455F]">
            {errors.root.message}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-12 min-h-[44px] w-full bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] focus-visible:ring-2 focus-visible:ring-[#16A794]"
          disabled={isSubmitting || login.isPending}
        >
          {isSubmitting || login.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
      </form>

      <div className="flex items-center gap-4 pt-1">
        <span className="h-px flex-1 bg-[#E6ECF3]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6C7A90]">Account access</span>
        <span className="h-px flex-1 bg-[#E6ECF3]" />
      </div>

      <div className="rounded-2xl border border-dashed border-[#A7EADD] bg-[#ECFDF9] px-4 py-3 text-sm text-[#0C6F64]">
        Use the same credentials you registered with. Email or phone are both supported.
      </div>
    </AuthShell>
  );
}