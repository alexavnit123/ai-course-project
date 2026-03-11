"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginForm() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email, code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card rounded-2xl border-2 border-border shadow-[8px_8px_0px_0px_rgba(108,92,231,0.12)] p-8">
        {/* Logo / Brand */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.3)]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            TaskFlow
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "email"
              ? "Sign in to manage your tasks"
              : `We sent a code to ${email}`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              autoComplete="email"
            />
            {error && <p className="text-xs text-overdue">{error}</p>}
            <Button type="submit" disabled={isLoading} className="w-full mt-1">
              {isLoading ? "Sending…" : "Send Magic Code →"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
            <Input
              label="Magic code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              required
              autoFocus
              maxLength={8}
            />
            {error && <p className="text-xs text-overdue">{error}</p>}
            <Button type="submit" disabled={isLoading} className="w-full mt-1">
              {isLoading ? "Verifying…" : "Verify Code →"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
