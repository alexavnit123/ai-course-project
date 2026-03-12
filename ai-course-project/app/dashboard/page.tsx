"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { getTodayString } from "@/lib/utils";
import { Category } from "@/lib/constants";
import CategorySection from "@/components/dashboard/CategorySection";
import WeatherStrip from "@/components/dashboard/WeatherStrip";
import CleanupBanner from "@/components/dashboard/CleanupBanner";
import CleanupModal from "@/components/dashboard/CleanupModal";

function getMostRecentSundayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DashboardPage() {
  const today = getTodayString();
  const { user } = db.useAuth();

  const { data, isLoading, error } = db.useQuery({
    tasks: {
      $: { where: { archived: { $ne: true } } },
      dailyCompletions: { $: { where: { dateString: today } } },
    },
  });

  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [dismissedDate, setDismissedDate] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("cleanup_dismissed_date")
      : null
  );

  const tasksByCategory = useMemo(() => {
    type TaskArr = NonNullable<typeof data>["tasks"];
    const result: Record<Category, TaskArr> = {
      daily: [],
      personal: [],
      business: [],
    };
    if (!data?.tasks) return result;
    for (const task of data.tasks) {
      const cat = task.category as Category;
      if (result[cat]) result[cat].push(task);
    }
    return result;
  }, [data?.tasks]);

  const allTasks = data?.tasks ?? [];
  const completedTasks = allTasks.filter((t) => !t.isDaily && t.completed);

  const dayOfWeek = new Date().getDay();
  const lastSunday = getMostRecentSundayString();
  const showNotification =
    (dayOfWeek === 0 || dayOfWeek === 1) &&
    (!dismissedDate || dismissedDate < lastSunday);

  function handleDismiss() {
    localStorage.setItem("cleanup_dismissed_date", today);
    setDismissedDate(today);
  }

  function handleCleanup() {
    if (completedTasks.length > 0) {
      db.transact(
        completedTasks.map((t) => db.tx.tasks[t.id].update({ archived: true }))
      );
    }
    localStorage.setItem("cleanup_dismissed_date", today);
    setDismissedDate(today);
    setShowCleanupModal(false);
  }

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div role="status" aria-label="Loading">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-overdue text-sm">Error loading tasks: {error.message}</p>
      </div>
    );
  }

  const totalActive = Object.values(tasksByCategory).reduce(
    (sum, tasks) =>
      sum +
      tasks.filter((t) =>
        t.isDaily ? t.dailyCompletions.length === 0 : !t.completed
      ).length,
    0
  );

  const dailyTotal = tasksByCategory.daily.length;
  const dailyDone = tasksByCategory.daily.filter(
    (t) => t.dailyCompletions.length > 0
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Page header — same grid as daily+weather so banner aligns with Daily Habits card */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_1.4fr] gap-5">
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <h1 className="text-2xl font-bold text-foreground">
              {getTodayGreeting()}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {totalActive > 0 && (
                <span>
                  {" "}
                  ·{" "}
                  <span className="text-accent font-medium">{totalActive}</span>{" "}
                  task{totalActive !== 1 ? "s" : ""} remaining
                </span>
              )}
            </p>
          </div>
          <div className="flex-1">
            <CleanupBanner
              completedCount={completedTasks.length}
              showNotification={showNotification}
              onCleanup={() => setShowCleanupModal(true)}
              onDismiss={handleDismiss}
            />
          </div>
        </div>
        {/* Right column intentionally empty — aligns with weather column */}
      </div>

      {/* ── DAILY + WEATHER — two-column row ── */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_1.4fr] gap-5 items-stretch">
        {/* Left: Daily Habits */}
        <div className="rounded-2xl border-2 border-accent/25 bg-accent-light p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.12)] h-full">
          <CategorySection
            category="daily"
            variant="daily"
            tasks={tasksByCategory.daily}
            today={today}
            userId={user.id}
            progressLabel={dailyTotal > 0 ? `${dailyDone}/${dailyTotal}` : undefined}
          />
        </div>
        {/* Right: Weather — borderless, floats on page background */}
        <div className="px-2 pt-1 h-full">
          <WeatherStrip />
        </div>
      </div>

      {/* ── PERSONAL — full-width card ── */}
      <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)]">
        <CategorySection
          category="personal"
          variant="standard"
          tasks={tasksByCategory.personal}
          today={today}
          userId={user.id}
        />
      </div>

      {/* ── BUSINESS — full-width card ── */}
      <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(108,92,231,0.06)]">
        <CategorySection
          category="business"
          variant="standard"
          tasks={tasksByCategory.business}
          today={today}
          userId={user.id}
        />
      </div>

      <CleanupModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        completedCount={completedTasks.length}
        onConfirm={handleCleanup}
      />
    </div>
  );
}

function getTodayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
