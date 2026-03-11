"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import LoginForm from "@/components/auth/LoginForm";

export default function HomePage() {
  const { isLoading, user } = db.useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </main>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <LoginForm />
      <p className="mt-6 text-xs text-muted-foreground">
        No password needed — we email you a magic code.
      </p>
    </main>
  );
}
