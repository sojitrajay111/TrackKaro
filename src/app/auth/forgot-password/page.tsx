"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/store/api/authApi";

const MIN_PASSWORD_LENGTH = 8;

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-foreground-sub";

function apiErrorMessage(err: unknown, fallback: string) {
  const apiErr = err as { data?: { message?: string | string[] }; message?: string };
  const raw = apiErr?.data?.message || apiErr?.message;
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "string") return raw;
  return fallback;
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [forgotPassword, { isLoading: isSending }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  const sendCode = async () => {
    setError(null);
    setNotice(null);
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return false;
    }
    try {
      await forgotPassword({ email: normalizedEmail }).unwrap();
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't send the code. Please try again."));
      return false;
    }
  };

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (await sendCode()) {
      setStep("reset");
      setNotice(`If an account exists for ${normalizedEmail}, a 6-digit code is on its way.`);
    }
  };

  const handleResend = async () => {
    if (await sendCode()) setNotice("A new code has been sent.");
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await resetPassword({ email: normalizedEmail, otp, newPassword }).unwrap();
      router.push("/auth/login");
    } catch (err) {
      setError(apiErrorMessage(err, "That code didn't work. Check it or request a new one."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {step === "request" ? "Reset your password" : "Check your email"}
        </h1>
        <p className="mt-1.5 text-xs text-foreground-sub">
          {step === "request"
            ? "Enter your account email and we'll send you a 6-digit code."
            : "Enter the code and choose a new password."}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {notice && !error && (
        <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-medium text-[#047857] dark:text-emerald-400">
          {notice}
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelCls}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <button
            type="submit"
            disabled={isSending}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? <Spinner label="Sending code..." /> : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="otp" className={labelCls}>
              6-Digit Code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className={`mt-1.5 tracking-[0.4em] font-mono ${inputCls}`}
            />
          </div>
          <div>
            <label htmlFor="new-password" className={labelCls}>
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelCls}>
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <button
            type="submit"
            disabled={isResetting}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResetting ? <Spinner label="Resetting..." /> : "Reset password"}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setError(null);
                setNotice(null);
              }}
              className="font-medium text-foreground-sub hover:text-foreground"
            >
              Use a different email
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isSending}
              className="font-semibold text-primary hover:underline disabled:opacity-60"
            >
              {isSending ? "Sending..." : "Resend code"}
            </button>
          </div>
        </form>
      )}

      <div className="text-center text-xs text-foreground-sub">
        Remembered it?{" "}
        <Link href="/auth/login" className="font-semibold text-primary transition hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
