import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from './AuthShell';
import { registerFormSchema, type RegisterFormValues } from './auth.schemas';
import { registerPatientAccount } from './auth.service';
import { getAuthErrorMessage } from './auth.utils';

const STEP_ONE_FIELDS: (keyof RegisterFormValues)[] = ['name', 'email', 'phone'];

export default function RegisterScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const registerMutation = useMutation({
    mutationFn: registerPatientAccount,
    onSuccess: () => {
      setCompleted(true);
    },
    onError: (error) => {
      setError('root', { message: getAuthErrorMessage(error, 'Unable to create your account') });
    },
  });

  const stepTitle = useMemo(() => (step === 1 ? 'Patient Details' : 'Create Password'), [step]);

  const next = async () => {
    const ok = await trigger(STEP_ONE_FIELDS);
    if (ok) setStep(2);
  };

  const back = () => setStep(1);

  const submit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      name: values.name,
      email: values.email?.trim() || undefined,
      phone: values.phone,
      password: values.password,
    });
  };

  if (completed) {
    return (
      <AuthShell
        title="Registration Complete"
        description="Your patient account has been created. Sign in with the credentials you just set."
        footer={
          <>
            Already have an account?{' '}
            <a
              href="/login"
              className="font-semibold text-[#0E8B7C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-sm"
            >
              Login
            </a>
          </>
        }
      >
        <div role="status" className="rounded-2xl border border-[#2FBF71]/30 bg-[#E8F9F0] px-4 py-3 text-sm font-semibold text-[#2FBF71]">
          Account created successfully.
        </div>
        <Button
          type="button"
          className="h-12 min-h-[44px] w-full bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] focus-visible:ring-2 focus-visible:ring-[#16A794]"
          onClick={() => (window.location.href = '/login')}
        >
          Go to Login
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create Account"
      description="Register as a patient to book appointments and manage your visits."
      footer={
        <>
          Already have an account?{' '}
          <a
            href="/login"
            className="font-semibold text-[#0E8B7C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A794] rounded-sm"
          >
            Login
          </a>
        </>
      }
    >
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#101A2E]">{stepTitle}</p>
          <p className="text-xs font-semibold text-[#0E8B7C]" aria-live="polite">
            Step {step} of 2
          </p>
        </div>
        <div className="mt-2.5 flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} aria-label="Registration progress">
          <span className="h-1.5 flex-1 rounded-full bg-[#0E8B7C]" />
          <span className={`h-1.5 flex-1 rounded-full ${step === 2 ? 'bg-[#0E8B7C]' : 'bg-[#E6ECF3]'}`} />
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#101A2E]">Full Name</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
                  <User className="h-4 w-4" />
                </span>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g. Sarah Williams"
                  className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
              </div>
              {errors.name ? (
                <p id="name-error" role="alert" className="text-xs font-medium text-[#E8455F]">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#101A2E]">Email Address</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="email"
                  {...register('email')}
                  placeholder="you@email.com"
                  className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email ? (
                <p id="email-error" role="alert" className="text-xs font-medium text-[#E8455F]">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#101A2E]">Phone Number</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
                  <Phone className="h-4 w-4" />
                </span>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="0771234567"
                  className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
              </div>
              {errors.phone ? (
                <p id="phone-error" role="alert" className="text-xs font-medium text-[#E8455F]">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>

            {errors.root ? (
              <p role="alert" className="rounded-xl border border-[#E8455F]/30 bg-[#FDECEF] px-3 py-2 text-sm font-medium text-[#E8455F]">
                {errors.root.message}
              </p>
            ) : null}

            <Button
              type="button"
              className="h-12 min-h-[44px] w-full bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] focus-visible:ring-2 focus-visible:ring-[#16A794]"
              onClick={next}
            >
              Save &amp; Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
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
                  placeholder="Create a secure password"
                  className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 pr-12 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
                  autoComplete="new-password"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#101A2E]">Confirm Password</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#6C7A90]">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="confirmPassword"
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  className="h-12 min-h-[44px] border-[#E6ECF3] bg-white pl-10 text-[#101A2E] placeholder:text-[#6C7A90] focus-visible:ring-2 focus-visible:ring-[#16A794]"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                />
              </div>
              {errors.confirmPassword ? (
                <p id="confirm-password-error" role="alert" className="text-xs font-medium text-[#E8455F]">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            {errors.root ? (
              <p role="alert" className="rounded-xl border border-[#E8455F]/30 bg-[#FDECEF] px-3 py-2 text-sm font-medium text-[#E8455F]">
                {errors.root.message}
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-12 min-h-[44px] border-[#E6ECF3] bg-white text-[#3A465C] hover:bg-[#F4F7FA] focus-visible:ring-2 focus-visible:ring-[#16A794] font-semibold"
                onClick={back}
                aria-label="Back to step 1 patient details"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
                className="h-12 min-h-[44px] bg-[#0E8B7C] font-bold text-white hover:bg-[#0C6F64] focus-visible:ring-2 focus-visible:ring-[#16A794]"
                disabled={isSubmitting || registerMutation.isPending}
              >
                {isSubmitting || registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </div>

            <p className="text-center text-xs leading-5 text-[#6C7A90]">
              By creating an account, you agree to use the patient portal for appointment bookings and visit updates.
            </p>
          </>
        )}
      </form>
    </AuthShell>
  );
}