"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegisterMutation } from "@/store/api/authApi";
import { useAppSelector } from "@/store";

export default function SignupPage() {
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!trimmedEmail) {
      setFormError("Please enter your email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }
    if (!agreed) {
      setFormError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      await registerUser({
        name: trimmedName,
        email: trimmedEmail,
        password,
        phone: trimmedPhone || undefined,
      }).unwrap();

      // Successful registration & auto-login handled via RTK Query onQueryStarted
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string | string[] }; message?: string };
      const rawMessage = apiErr?.data?.message || apiErr?.message;
      if (Array.isArray(rawMessage)) {
        setFormError(rawMessage.join(", "));
      } else if (typeof rawMessage === "string") {
        setFormError(rawMessage);
      } else {
        setFormError("Registration failed. Please check your information and try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[clamp(1.75rem,3vw,2.125rem)] font-extrabold leading-tight tracking-[-0.04em] text-foreground">
          Create your account
        </h1>
        <p className="mt-1.5 text-[15px] text-foreground-muted">
          Free forever. Track spending, khata and group bills in one place.
        </p>
      </div>

      {formError && (
        <div className="tk-pop rounded-[12px] border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] p-3 text-[14px] font-semibold text-[var(--bad)]">
          <div className="flex items-start gap-2.5">
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <span>{formError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-[14px] font-bold text-foreground-muted"
          >
            Full Name
          </label>
          <div className="relative mt-1.5">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground outline-none transition placeholder:text-foreground-muted focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="email"
            className="block text-[14px] font-bold text-foreground-muted"
          >
            Email Address
          </label>
          <div className="relative mt-1.5">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground outline-none transition placeholder:text-foreground-muted focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
            />
          </div>
        </div>

        {/* Phone (Optional) */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="phone"
              className="block text-[14px] font-bold text-foreground-muted"
            >
              Phone Number
            </label>
            <span className="text-[13px] text-foreground-muted">Optional</span>
          </div>
          <div className="relative mt-1.5">
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] text-[15px] font-medium text-foreground outline-none transition placeholder:text-foreground-muted focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-[14px] font-bold text-foreground-muted"
          >
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface px-[13px] pr-11 text-[15px] font-medium text-foreground outline-none transition placeholder:text-foreground-muted focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-1 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Terms agreement checkbox */}
        <div className="flex items-start gap-2 pt-1">
          <input
            id="terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
          />
          <label htmlFor="terms" className="text-[14px] leading-relaxed text-foreground-muted select-none">
            I agree to TrackKaro&apos;s{" "}
            <Link href="/terms" target="_blank" className="font-bold text-[var(--primary)] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-bold text-[var(--primary)] hover:underline">
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-[var(--primary)] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)] active:brightness-[0.93] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Creating your account...</span>
            </div>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center text-[15px] text-foreground-muted">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-bold text-[var(--primary)] transition hover:underline"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}
