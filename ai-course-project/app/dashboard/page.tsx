"use client";

import { useMemo } from "react";
import { db } from "@/lib/db";
import { getTodayString } from "@/lib/utils";
import { Category } from "@/lib/constants";
import CategorySection from "@/components/dashboard/CategorySection";
import WeatherStrip from "@/components/dashboard/WeatherStrip";

export default function DashboardPage() {
  const today = getTodayString();
  const { user } = db.useAuth();

  const { data, isLoading, error } = db.useQuery({
    tasks: {
      dailyCompletions: { $: { where: { dateString: today } } },
    },
  });

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
      sum + tasks.filter((t) => (t.isDaily ? t.dailyCompletions.length === 0 : !t.completed)).length,
    0
  );

  const dailyTotal = tasksByCategory.daily.length;
  const dailyDone = tasksByCategory.daily.filter((t) => t.dailyCompletions.length > 0).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getTodayGreeting()}</h1>
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
        <div className="px-2 pt-1">
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
    </div>
  );
}

function getTodayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
